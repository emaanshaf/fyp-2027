require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const isProduction = process.env.NODE_ENV === 'production';

// A signing secret with a public default is the same as no signing secret:
// anyone reading this repo could mint an admin token. Development gets a
// generated ephemeral secret (tokens die with the process, which is correct
// for dev); production refuses to boot without a real one.
function resolveJwtSecret() {
  const fromEnv = process.env.JWT_SECRET;

  if (fromEnv && fromEnv.length >= 32 && !fromEnv.startsWith('change-this')) {
    return fromEnv;
  }

  if (isProduction) {
    console.error(
      '\nFATAL: JWT_SECRET is missing, too short, or still the placeholder.\n' +
      'Set a random value of at least 32 characters before starting in production:\n' +
      '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"\n'
    );
    process.exit(1);
  }

  console.warn(
    '[WARN] JWT_SECRET not set — using a random development secret. ' +
    'All sessions will be invalidated when this process restarts.'
  );
  return require('crypto').randomBytes(48).toString('base64url');
}

// Wildcard CORS cannot be combined with credentialed requests (browsers reject
// it), and it is the wrong default for an authenticated API regardless. Local
// development origins are allowed explicitly.
function resolveCorsOrigin() {
  const raw = process.env.CORS_ORIGIN;

  if (raw && raw !== '*') {
    return raw.split(',').map(o => o.trim()).filter(Boolean);
  }

  if (isProduction) {
    console.error(
      '\nFATAL: CORS_ORIGIN must list your real origins in production ' +
      '(comma-separated), not "*".\n'
    );
    process.exit(1);
  }

  // Development: allow any loopback origin, whatever port it is on.
  //
  // A fixed list was wrong in practice. Expo's web dev server binds whichever
  // port happens to be free — 8081 usually, but 8095, 19006 or anything else
  // once one is taken — so the app loaded, every API call failed preflight,
  // and the browser blamed CORS while the allowlist looked perfectly sensible.
  //
  // Development only: production still requires CORS_ORIGIN to name real
  // origins and refuses to boot without it.
  const LOOPBACK = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|10\.0\.2\.2)(:\d+)?$/;
  const devOrigin = (origin, callback) => {
    // No Origin header at all: curl, a health check, a same-origin request.
    if (!origin) return callback(null, true);
    return callback(null, LOOPBACK.test(origin));
  };
  devOrigin.description = 'any localhost / 127.0.0.1 / 10.0.2.2 port (development)';
  return devOrigin;
}

// The Anthropic key lives here and only here. It must never be exposed to the
// app bundle: anything named EXPO_PUBLIC_* is compiled into the shipped
// JavaScript, so a key set there is readable by anyone who installs the app.
// The server is optional-by-design — without a key the app still answers from
// its bundled offline knowledge base, so a missing key is not fatal.
function resolveAnthropic() {
  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();

  if (!apiKey) {
    console.warn(
      '[WARN] ANTHROPIC_API_KEY not set — /api/ai/chat will report the live ' +
      'assistant as unconfigured and clients will fall back to offline answers.'
    );
  } else if (!apiKey.startsWith('sk-ant-')) {
    console.warn(
      '[WARN] ANTHROPIC_API_KEY does not look like an Anthropic key ' +
      '(expected it to start with "sk-ant-").'
    );
  }

  return {
    apiKey,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '700'),
  };
}

module.exports = {
  isProduction,
  port: parseInt(process.env.PORT || '3001'),
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  corsOrigin: resolveCorsOrigin(),
  anthropic: resolveAnthropic(),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'qitabe_noor',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
};
