#!/usr/bin/env node
//
// Post-deploy smoke test for the Qitab-e-Noor API.
//
//   node scripts/verify-deployment.js https://api.qitabe-noor.app/api
//   node scripts/verify-deployment.js            # defaults to localhost:3001
//
// A deploy that returns 200 on the home page can still be broken in ways that
// only show up in the app: the AI route unauthenticated, CORS left wide open,
// the database silently absent. This checks the things that are actually load
// bearing and exits non-zero if any of them fail, so it can gate a release.

const { URL } = require('url');
const dns = require('dns').promises;

const base = (process.argv[2] || 'http://localhost:3001/api').replace(/\/+$/, '');
const TIMEOUT_MS = 15000;

const results = [];
const record = (name, ok, detail, { fatal = true } = {}) => {
  results.push({ name, ok, detail, fatal });
  const mark = ok ? 'PASS' : (fatal ? 'FAIL' : 'WARN');
  console.log(`  ${mark.padEnd(4)}  ${name}${detail ? ` — ${detail}` : ''}`);
  return ok;
};

async function req(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}${path}`, {
      ...options,
      signal: controller.signal,
      // Without this the keep-alive socket stays open, and exiting on top of
      // it aborts the process with a libuv assertion instead of a clean code.
      headers: { connection: 'close', ...(options.headers || {}) },
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json; body kept as text */ }
    return { res, json, text };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log(`\nVerifying ${base}\n`);
  const url = new URL(base);

  // 1. The host exists at all. This is the failure that shipped a production
  //    build pointing at an unregistered domain, so it is checked first.
  if (url.hostname !== 'localhost' && !/^[\d.]+$/.test(url.hostname)) {
    try {
      const addrs = await dns.lookup(url.hostname, { all: true });
      record('DNS resolves', true, addrs.map(a => a.address).join(', '));
    } catch {
      record('DNS resolves', false, `${url.hostname} does not exist`);
      return report();
    }
  }

  // 2. HTTPS, because the app sends a bearer token on every request.
  record('Served over HTTPS', url.protocol === 'https:',
    url.protocol === 'https:' ? '' : `${url.protocol}// — tokens would travel in clear`,
    { fatal: url.hostname !== 'localhost' });

  // 3. Health. The server does not listen until it has a database, so a 200
  //    here also means Postgres is connected.
  let health;
  try {
    health = await req('/health');
  } catch (e) {
    record('Health endpoint', false, e.name === 'AbortError' ? 'timed out' : e.message);
    return report();
  }
  record('Health endpoint returns 200', health.res.status === 200, `HTTP ${health.res.status}`);
  record('Health payload is the expected service', health.json?.service === 'qitabe-noor-api',
    health.json?.service ? `service=${health.json.service}` : `body=${health.text.slice(0, 60)}`);

  // 4. Security headers. helmet is mounted, but a proxy in front can strip or
  //    override them, and that is invisible without checking the live response.
  const headers = health.res.headers;
  record('Sets X-Content-Type-Options', headers.get('x-content-type-options') === 'nosniff',
    headers.get('x-content-type-options') || 'missing', { fatal: false });
  record('Hides framework fingerprint', !headers.get('x-powered-by'),
    headers.get('x-powered-by') || '', { fatal: false });

  // 5. CORS must not be a wildcard. The server refuses to boot on '*' in
  //    production, but a reverse proxy can reintroduce one.
  const cors = headers.get('access-control-allow-origin');
  record('CORS is not wildcard', cors !== '*', cors ? `allow-origin: ${cors}` : 'not sent');

  // 6. The AI route: reachable, and closed to anonymous callers. An open proxy
  //    here is someone else spending the Anthropic budget.
  const status = await req('/ai/status');
  record('AI status endpoint responds', status.res.status === 200, `HTTP ${status.res.status}`);
  if (status.json) {
    record('Live AI is configured', status.json.configured === true,
      status.json.configured ? `model=${status.json.model}` : 'no ANTHROPIC_API_KEY set — app is offline-only',
      { fatal: false });
  }

  const anon = await req('/ai/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question: 'What is zakat?' }),
  });
  record('AI chat rejects anonymous requests', anon.res.status === 401,
    `HTTP ${anon.res.status}${anon.res.status === 200 ? ' — ANYONE CAN SPEND YOUR API BUDGET' : ''}`);

  // 7. Unknown paths must 404 as JSON, not leak a stack trace or an HTML page
  //    from whatever is proxying.
  const missing = await req('/definitely-not-a-route');
  record('Unknown route returns a JSON 404', missing.res.status === 404 && Boolean(missing.json),
    `HTTP ${missing.res.status}`, { fatal: false });

  report();
}

function report() {
  const failed = results.filter(r => !r.ok && r.fatal);
  const warned = results.filter(r => !r.ok && !r.fatal);

  console.log(`\n${results.filter(r => r.ok).length} passed, ${failed.length} failed, ${warned.length} warnings\n`);

  if (failed.length) {
    console.log('Deployment is NOT usable by the app:');
    failed.forEach(f => console.log(`  - ${f.name}${f.detail ? `: ${f.detail}` : ''}`));
    console.log('');
    process.exitCode = 1;
    return;
  }

  console.log(warned.length ? 'Deployment works, with warnings above.\n' : 'Deployment verified.\n');
  process.exitCode = 0;
}

// process.exitCode rather than process.exit(): exiting on top of fetch's still
// open sockets aborts the process with a libuv assertion on Windows, which
// turns a clean pass into exit code 127 and would fail any CI gate using it.
main().catch(err => {
  console.error(`\nVerification aborted: ${err.message}\n`);
  process.exitCode = 1;
});
