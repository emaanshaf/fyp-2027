// A machine-readable map of the API surface.
//
// The app's Developer Console reads this instead of carrying its own copy, so
// an endpoint added or removed here is reflected in the app without a release.
// Keep it beside the routers it documents: this is the one place a maintainer
// is expected to update when a route changes, and the catalogue test fails if
// the shape drifts.
//
// `path` is relative to the /api mount point. `auth` is one of:
//   public  — no session required
//   session — any signed-in user
//   admin   — administrator only

const GROUPS = [
  {
    id: 'system',
    title: 'System',
    description: 'Liveness and self-documentation. No account needed.',
    endpoints: [
      { method: 'GET', path: '/health', auth: 'public', summary: 'Liveness probe for uptime monitors and the app.' },
      { method: 'GET', path: '/', auth: 'public', summary: 'This catalogue: every group, route and auth requirement.' },
    ],
  },
  {
    id: 'auth',
    title: 'Authentication & account',
    description: 'Account creation, sign-in, profile, password and role management.',
    endpoints: [
      { method: 'POST', path: '/auth/register', auth: 'public', summary: 'Create an account and receive a JWT.' },
      { method: 'POST', path: '/auth/login', auth: 'public', summary: 'Exchange email and password for a JWT.' },
      { method: 'POST', path: '/auth/forgot-password', auth: 'public', summary: 'Start password recovery by email.' },
      { method: 'GET', path: '/auth/me', auth: 'session', summary: 'Current user profile and role.' },
      { method: 'PUT', path: '/auth/me', auth: 'session', summary: 'Update your own profile.' },
      { method: 'DELETE', path: '/auth/me', auth: 'session', summary: 'Delete your own account after confirming your password.' },
      { method: 'PUT', path: '/auth/change-password', auth: 'session', summary: 'Change your password after proving the current one.' },
      { method: 'POST', path: '/auth/push-token', auth: 'session', summary: 'Store an Expo push token for this device.' },
      { method: 'GET', path: '/auth/access/:module', auth: 'session', summary: 'Check whether your role may open a module.' },
      { method: 'GET', path: '/auth/users', auth: 'admin', summary: 'List user accounts.' },
      { method: 'PUT', path: '/auth/users/:userId/role', auth: 'admin', summary: 'Promote or demote a user.' },
      { method: 'DELETE', path: '/auth/users/:userId', auth: 'admin', summary: 'Delete a user account.' },
      { method: 'GET', path: '/auth/stats', auth: 'admin', summary: 'Account and activity statistics.' },
    ],
  },
  {
    id: 'bookmarks',
    title: 'Bookmarks',
    description: 'Ayah bookmarks and their notes for the signed-in user.',
    endpoints: [
      { method: 'GET', path: '/bookmarks', auth: 'session', summary: 'List your bookmarks, newest first.' },
      { method: 'POST', path: '/bookmarks', auth: 'session', summary: 'Save a bookmark.' },
      { method: 'PUT', path: '/bookmarks/:id', auth: 'session', summary: 'Update a bookmark note.' },
      { method: 'DELETE', path: '/bookmarks/:id', auth: 'session', summary: 'Remove a bookmark.' },
    ],
  },
  {
    id: 'notes',
    title: 'Notes',
    description: 'Free-form study notes attached to the signed-in user.',
    endpoints: [
      { method: 'GET', path: '/notes', auth: 'session', summary: 'List your notes.' },
      { method: 'POST', path: '/notes', auth: 'session', summary: 'Create a note.' },
      { method: 'PUT', path: '/notes/:id', auth: 'session', summary: 'Edit a note.' },
      { method: 'DELETE', path: '/notes/:id', auth: 'session', summary: 'Delete a note.' },
    ],
  },
  {
    id: 'favorites',
    title: 'Favourite duas',
    description: 'The user’s saved supplications.',
    endpoints: [
      { method: 'GET', path: '/favorites', auth: 'session', summary: 'List your favourite duas.' },
      { method: 'POST', path: '/favorites', auth: 'session', summary: 'Save a dua to favourites.' },
      { method: 'DELETE', path: '/favorites/:id', auth: 'session', summary: 'Remove a favourite by record id.' },
      { method: 'DELETE', path: '/favorites/by-dua/:duaId', auth: 'session', summary: 'Remove a favourite by dua id.' },
    ],
  },
  {
    id: 'prayer-toggles',
    title: 'Prayer toggles',
    description: 'Per-prayer completion switches used by the prayer tracker.',
    endpoints: [
      { method: 'GET', path: '/prayer-toggles', auth: 'session', summary: 'Read the current prayer toggles.' },
      { method: 'PUT', path: '/prayer-toggles', auth: 'session', summary: 'Replace the prayer toggles.' },
    ],
  },
  {
    id: 'reminders',
    title: 'Reminders',
    description: 'Custom and Quran recitation reminders.',
    endpoints: [
      { method: 'GET', path: '/reminders', auth: 'session', summary: 'List your reminders.' },
      { method: 'POST', path: '/reminders', auth: 'session', summary: 'Create a reminder.' },
      { method: 'PUT', path: '/reminders/:id', auth: 'session', summary: 'Edit or enable/disable a reminder.' },
      { method: 'DELETE', path: '/reminders/:id', auth: 'session', summary: 'Delete a reminder.' },
    ],
  },
  {
    id: 'tasbih',
    title: 'Tasbih',
    description: 'Dhikr sessions and aggregate counts.',
    endpoints: [
      { method: 'GET', path: '/tasbih', auth: 'session', summary: 'List your tasbih sessions.' },
      { method: 'POST', path: '/tasbih', auth: 'session', summary: 'Record a completed tasbih session.' },
      { method: 'GET', path: '/tasbih/stats', auth: 'session', summary: 'Totals and streaks across sessions.' },
      { method: 'DELETE', path: '/tasbih/:id', auth: 'session', summary: 'Delete a session.' },
    ],
  },
  {
    id: 'settings',
    title: 'User settings',
    description: 'Theme, language, calculation method and notification preferences.',
    endpoints: [
      { method: 'GET', path: '/settings', auth: 'session', summary: 'Read your settings.' },
      { method: 'PUT', path: '/settings', auth: 'session', summary: 'Update one or more settings fields.' },
    ],
  },
  {
    id: 'modules',
    title: 'Study modules',
    description: 'Hifz plans, personal duas, module journal, deeds and study topics.',
    endpoints: [
      { method: 'GET', path: '/modules/hifz/plans', auth: 'session', summary: 'List memorisation plans.' },
      { method: 'POST', path: '/modules/hifz/plans', auth: 'session', summary: 'Create a memorisation plan.' },
      { method: 'PUT', path: '/modules/hifz/plans/:id/progress', auth: 'session', summary: 'Record memorisation progress.' },
      { method: 'DELETE', path: '/modules/hifz/plans/:id', auth: 'session', summary: 'Delete a memorisation plan.' },
      { method: 'GET', path: '/modules/duas/personal', auth: 'session', summary: 'List personal duas.' },
      { method: 'POST', path: '/modules/duas/personal', auth: 'session', summary: 'Create a personal dua.' },
      { method: 'DELETE', path: '/modules/duas/personal/:id', auth: 'session', summary: 'Delete a personal dua.' },
      { method: 'GET', path: '/modules/journal', auth: 'session', summary: 'List module journal entries.' },
      { method: 'POST', path: '/modules/journal', auth: 'session', summary: 'Create a module journal entry.' },
      { method: 'DELETE', path: '/modules/journal/:id', auth: 'session', summary: 'Delete a journal entry.' },
      { method: 'GET', path: '/modules/deeds', auth: 'session', summary: 'List recorded good deeds.' },
      { method: 'POST', path: '/modules/deeds', auth: 'session', summary: 'Record a good deed.' },
      { method: 'GET', path: '/modules/deeds/stats', auth: 'session', summary: 'Good-deed totals.' },
      { method: 'GET', path: '/modules/topics', auth: 'session', summary: 'List study topics.' },
      { method: 'POST', path: '/modules/topics', auth: 'session', summary: 'Create a study topic.' },
    ],
  },
  {
    id: 'ai',
    title: 'Islamic AI assistant',
    description: 'Grounding status and the live Claude-backed answer endpoint.',
    endpoints: [
      { method: 'GET', path: '/ai/status', auth: 'public', summary: 'Whether a live AI key is configured, and which model.' },
      { method: 'POST', path: '/ai/chat', auth: 'session', summary: 'Ask the assistant, optionally with retrieved context.' },
    ],
  },
  {
    id: 'deeds',
    title: 'Good deeds',
    description: 'Daily good deeds and their statistics.',
    endpoints: [
      { method: 'GET', path: '/deeds', auth: 'session', summary: 'List recorded deeds.' },
      { method: 'POST', path: '/deeds', auth: 'session', summary: 'Record a deed.' },
      { method: 'GET', path: '/deeds/stats', auth: 'session', summary: 'Deed totals and streaks.' },
      { method: 'DELETE', path: '/deeds/:id', auth: 'session', summary: 'Delete a deed entry.' },
    ],
  },
  {
    id: 'journal',
    title: 'Reflection journal',
    description: 'Private reflection entries.',
    endpoints: [
      { method: 'GET', path: '/journal', auth: 'session', summary: 'List your journal entries.' },
      { method: 'POST', path: '/journal', auth: 'session', summary: 'Write a journal entry.' },
      { method: 'PUT', path: '/journal/:id', auth: 'session', summary: 'Edit a journal entry.' },
      { method: 'DELETE', path: '/journal/:id', auth: 'session', summary: 'Delete a journal entry.' },
    ],
  },
  {
    id: 'khatm',
    title: 'Khatm planner',
    description: 'A shared Quran-completion plan for the signed-in user.',
    endpoints: [
      { method: 'GET', path: '/khatm', auth: 'session', summary: 'Read the current khatm plan.' },
      { method: 'PUT', path: '/khatm', auth: 'session', summary: 'Create or update the khatm plan.' },
      { method: 'DELETE', path: '/khatm', auth: 'session', summary: 'Delete the khatm plan.' },
    ],
  },
  {
    id: 'news',
    title: 'Islamic news',
    description: 'Headlines aggregated from trusted Muslim-world publishers and cached for ten minutes.',
    endpoints: [
      { method: 'GET', path: '/news', auth: 'public', summary: 'Latest headlines with source, image and publish time.' },
    ],
  },
];

const AUTH_LEVELS = new Set(['public', 'session', 'admin']);
const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Build the payload served at GET /api.
 *
 * `testable` marks the handful of GET routes the in-app console may invoke
 * without a session. Leaving write routes untestable is deliberate: a docs
 * panel must never be able to modify a user's data because a row was tapped.
 */
function buildCatalog() {
  const groups = GROUPS.map(group => ({
    ...group,
    endpoints: group.endpoints.map(endpoint => ({
      ...endpoint,
      group: group.id,
      fullPath: `/api${endpoint.path}`,
      testable:
        endpoint.method === 'GET'
        && endpoint.auth === 'public'
        && !endpoint.path.includes(':')
        && endpoint.path !== '/',
    })),
  }));

  const endpoints = groups.flatMap(group => group.endpoints);
  const byMethod = {};
  for (const endpoint of endpoints) {
    byMethod[endpoint.method] = (byMethod[endpoint.method] || 0) + 1;
  }

  return {
    groups,
    counts: {
      groups: groups.length,
      endpoints: endpoints.length,
      public: endpoints.filter(e => e.auth === 'public').length,
      session: endpoints.filter(e => e.auth === 'session').length,
      admin: endpoints.filter(e => e.auth === 'admin').length,
      testable: endpoints.filter(e => e.testable).length,
      byMethod,
    },
  };
}

/** Fail fast in tests if a catalogue entry is malformed. */
function validateCatalog() {
  const problems = [];
  for (const group of GROUPS) {
    if (!group.id || !group.title) problems.push(`Group ${group.id || '(unnamed)'} is missing an id or title.`);
    for (const endpoint of group.endpoints) {
      if (!METHODS.has(endpoint.method)) {
        problems.push(`${endpoint.method} ${endpoint.path}: unsupported method.`);
      }
      if (!AUTH_LEVELS.has(endpoint.auth)) {
        problems.push(`${endpoint.method} ${endpoint.path}: auth must be public, session or admin.`);
      }
      if (typeof endpoint.path !== 'string' || !endpoint.path.startsWith('/')) {
        problems.push(`${endpoint.method} ${endpoint.path}: path must start with "/".`);
      }
      if (!endpoint.summary) {
        problems.push(`${endpoint.method} ${endpoint.path}: missing summary.`);
      }
    }
  }
  return problems;
}

module.exports = { GROUPS, buildCatalog, validateCatalog };
