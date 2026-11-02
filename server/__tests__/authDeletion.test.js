const express = require('express');
const request = require('supertest');

/**
 * Builds the auth router with a fake database and a controllable password
 * check. The route's own logic is what matters here: authentication is
 * asserted at the wiring level, while real token handling belongs to the
 * middleware's own tests.
 */
function buildApp({ passwordMatches = true, userExists = true } = {}) {
  jest.resetModules();

  const query = jest.fn((sql, params) => {
    if (/SELECT id, password_hash/i.test(sql)) {
      return Promise.resolve({
        rows: userExists ? [{ id: params[0], password_hash: 'hashed' }] : [],
      });
    }
    if (/DELETE FROM users/i.test(sql)) {
      return Promise.resolve({ rows: [{ id: params[0] }] });
    }
    return Promise.resolve({ rows: [] });
  });

  jest.doMock('../config/database', () => ({ query }));
  jest.doMock('../config/env', () => ({ jwtSecret: 'test-secret', jwtExpiresIn: '1h' }));
  jest.doMock('../config/email', () => ({ sendPasswordResetEmail: jest.fn() }));
  jest.doMock('../middleware/auth', () => ({
    authenticate: (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).json({ error: 'No token provided' });
      }
      req.userId = 'user-1';
      req.user = { id: 'user-1' };
      next();
    },
    requireAdmin: (req, res, next) => next(),
  }));
  jest.doMock('../middleware/security', () => ({
    authLimiter: (req, res, next) => next(),
  }));
  jest.doMock('bcryptjs', () => ({
    compare: jest.fn(() => Promise.resolve(passwordMatches)),
    hash: jest.fn(() => Promise.resolve('hashed')),
  }));

  const router = require('../routes/auth');
  const app = express();
  app.use(express.json());
  app.use('/api/auth', router);
  return { app, query };
}

describe('DELETE /api/auth/me', () => {
  it('requires authentication', async () => {
    const { app } = buildApp();
    const res = await request(app).delete('/api/auth/me').send({ password: 'secret' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token/i);
  });

  it('requires a password in the body', async () => {
    const { app } = buildApp();
    const res = await request(app)
      .delete('/api/auth/me')
      .set('Authorization', 'Bearer test')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.errors?.length).toBeGreaterThan(0);
  });

  it('refuses to delete when the password is wrong', async () => {
    const { app, query } = buildApp({ passwordMatches: false });
    const res = await request(app)
      .delete('/api/auth/me')
      .set('Authorization', 'Bearer test')
      .send({ password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.reason).toBe('bad_password');
    expect(query.mock.calls.some(([sql]) => /DELETE FROM users/i.test(sql))).toBe(false);
  });

  it('deletes the signed-in user when the password matches', async () => {
    const { app, query } = buildApp({ passwordMatches: true });
    const res = await request(app)
      .delete('/api/auth/me')
      .set('Authorization', 'Bearer test')
      .send({ password: 'correct' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: true });
    expect(query).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1', ['user-1']);
  });

  it('returns 404 when the account no longer exists', async () => {
    const { app, query } = buildApp({ userExists: false });
    const res = await request(app)
      .delete('/api/auth/me')
      .set('Authorization', 'Bearer test')
      .send({ password: 'correct' });

    expect(res.status).toBe(404);
    expect(query.mock.calls.some(([sql]) => /DELETE FROM users/i.test(sql))).toBe(false);
  });
});
