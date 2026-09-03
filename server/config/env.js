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

  // Expo web, Metro, and the Android emulator's host alias.
  return [
    'http://localhost:8081',
    'http://localhost:8099',
    'http://localhost:19006',
    'http://127.0.0.1:8081',
    'http://10.0.2.2:8081',
  ];
}

module.exports = {
  isProduction,
  port: parseInt(process.env.PORT || '3001'),
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  corsOrigin: resolveCorsOrigin(),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'qitabe_noor',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
};
