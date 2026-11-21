const express = require('express');
const request = require('supertest');
const { requestContext } = require('../middleware/security');
const catalogRouter = require('../routes/catalog');
const { buildCatalog, validateCatalog } = require('../config/apiCatalog');

function buildApp() {
  const app = express();
  app.use(requestContext);
  app.use('/api', catalogRouter);
  return app;
}

describe('API catalogue', () => {
  it('is internally consistent', () => {
    expect(validateCatalog()).toEqual([]);
  });

  it('is served publicly at GET /api', async () => {
    const res = await request(buildApp()).get('/api').expect(200);

    expect(res.body.service).toBe('qitabe-noor-api');
    expect(res.body.basePath).toBe('/api');
    expect(res.body.groups.length).toBeGreaterThan(0);
    expect(res.body.counts.endpoints).toBeGreaterThan(50);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('counts every endpoint exactly once', async () => {
    const res = await request(buildApp()).get('/api').expect(200);
    const { groups, counts } = res.body;
    const endpoints = groups.flatMap(group => group.endpoints);

    expect(counts.endpoints).toBe(endpoints.length);
    expect(counts.public + counts.session + counts.admin).toBe(counts.endpoints);
    expect(counts.testable).toBe(
      endpoints.filter(e => e.testable).length
    );
    expect(new Set(endpoints.map(e => `${e.method} ${e.path}`)).size)
      .toBe(endpoints.length);
  });

  it('documents the routes the app actually depends on', () => {
    const { groups } = buildCatalog();
    const routes = new Set(
      groups.flatMap(group => group.endpoints.map(e => `${e.method} ${e.path}`))
    );

    for (const expected of [
      'GET /health',
      'GET /ai/status',
      'POST /ai/chat',
      'POST /auth/login',
      'GET /auth/me',
      'GET /bookmarks',
      'GET /settings',
      'PUT /prayer-toggles',
      'GET /news',
    ]) {
      expect(routes.has(expected)).toBe(true);
    }
  });

  it('only exposes parameter-free public GETs as testable', () => {
    const { groups } = buildCatalog();
    const endpoints = groups.flatMap(group => group.endpoints);
    const testable = endpoints.filter(e => e.testable);

    expect(testable.length).toBeGreaterThan(0);
    for (const endpoint of testable) {
      expect(endpoint.method).toBe('GET');
      expect(endpoint.auth).toBe('public');
      expect(endpoint.path).not.toContain(':');
      // Write routes are never testable: a docs screen must not be able to
      // create or delete anything by tapping a row.
      expect(endpoint.path).not.toMatch(/\/(bookmarks|notes|favorites|reminders)$/);
    }
  });

  it('labels every endpoint with its group and full path', () => {
    for (const group of buildCatalog().groups) {
      for (const endpoint of group.endpoints) {
        expect(endpoint.group).toBe(group.id);
        expect(endpoint.fullPath).toBe(`/api${endpoint.path}`);
      }
    }
  });
});

describe('request identity', () => {
  it('adds an X-Request-Id header to responses', async () => {
    const res = await request(buildApp()).get('/api').expect(200);

    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.body.requestId).toBe(res.headers['x-request-id']);
  });

  it('accepts a safe caller-supplied id for cross-system tracing', async () => {
    const res = await request(buildApp())
      .get('/api')
      .set('X-Request-Id', 'mobile-test-1234')
      .expect(200);

    expect(res.headers['x-request-id']).toBe('mobile-test-1234');
  });

  it('replaces an unsafe caller-supplied id instead of echoing it', async () => {
    const res = await request(buildApp())
      .get('/api')
      .set('X-Request-Id', '<script>alert(1)</script>')
      .expect(200);

    expect(res.headers['x-request-id']).not.toContain('<');
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});
