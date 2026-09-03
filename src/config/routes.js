// The route table — single source of truth for navigation.
//
// Path strings, drawer labels, role permissions and the React Navigation
// linking config were previously maintained as four separate hand-written
// copies (AppNavigator, useNavigationUrl, its internal pathToRoute map, and
// HomeScreen). They had already drifted apart. Everything now derives from
// MODULES below, so adding a screen is one entry.
//
// `path` is an Expo Router / React Navigation linking pattern: a `:param`
// segment is captured and passed through to the screen as a route param.

import { getStateFromPath as defaultGetStateFromPath } from '@react-navigation/native';

export const ROLES = ['user', 'moderator', 'admin'];
const ALL = ROLES;

/**
 * @typedef {object} ModuleRoute
 * @property {string}   name     React Navigation route name
 * @property {string}   path     URL path, without a leading slash
 * @property {string}   title    Human-readable label (drawer, header)
 * @property {string}   [icon]   Ionicons name (outline variant)
 * @property {string}   [accent] Theme colour token used to tint the icon
 * @property {string[]} roles    Roles permitted to open it
 * @property {boolean}  [tab]    Rendered in the bottom tab bar
 * @property {boolean}  [drawer] Listed in the drawer (default: true)
 * @property {object}   [params] Linking `parse` rules for :params
 */

/** @type {ModuleRoute[]} */
export const MODULES = [
  // ── Tabs ────────────────────────────────────────────────────────────────
  { name: 'Home', path: 'dashboard/home', title: 'Home', icon: 'home-outline', accent: 'gold', roles: ALL, tab: true, drawer: false },
  { name: 'Quran', path: 'quran', title: 'Quran', icon: 'book-outline', accent: 'gold', roles: ALL, tab: true, drawer: false },
  { name: 'Prayer', path: 'prayer', title: 'Prayer Times', icon: 'time-outline', accent: 'cyan', roles: ALL, tab: true, drawer: false },
  { name: 'Duas', path: 'duas', title: 'Duas', icon: 'rose-outline', accent: 'pink', roles: ALL, tab: true, drawer: false },

  // ── Scripture & study ───────────────────────────────────────────────────
  { name: 'Tafsir', path: 'tafsir', title: 'Tafsir', icon: 'reader-outline', accent: 'amber', roles: ALL },
  { name: 'Hifz', path: 'hifz', title: 'Hifz / Memorisation', icon: 'mic-outline', accent: 'purple', roles: ALL },
  { name: 'AIQuran', path: 'ai-quran', title: 'AI Quran Assistant', icon: 'sparkles-outline', accent: 'cyan', roles: ALL },
  { name: 'AyahOfDay', path: 'ayah-of-day', title: 'Ayah of the Day', icon: 'sunny-outline', accent: 'gold', roles: ALL },
  { name: 'Hadith', path: 'hadith', title: 'Authentic Hadith', icon: 'shield-checkmark-outline', accent: 'emerald', roles: ALL },
  { name: 'HadithVerify', path: 'hadith/verify', title: 'Hadith Verification', icon: 'search-outline', accent: 'emerald', roles: ALL },
  { name: 'NamesOfAllah', path: 'names-of-allah', title: '99 Names of Allah', icon: 'sparkles-outline', accent: 'gold', roles: ALL },

  // ── Worship ─────────────────────────────────────────────────────────────
  { name: 'Calendar', path: 'calendar', title: 'Hijri Calendar', icon: 'calendar-outline', accent: 'blue', roles: ALL },
  { name: 'PrayerTracker', path: 'prayer-tracker', title: 'Prayer Tracker', icon: 'checkbox-outline', accent: 'emerald', roles: ALL },
  { name: 'DuaLibrary', path: 'dua-library', title: 'Dua & Azkar', icon: 'bookmarks-outline', accent: 'pink', roles: ALL },
  { name: 'Qibla', path: 'qibla', title: 'Qibla Finder', icon: 'compass-outline', accent: 'cyan', roles: ALL },
  { name: 'Ramadan', path: 'ramadan', title: 'Ramadan Mode', icon: 'moon-outline', accent: 'purple', roles: ALL },
  { name: 'Zakat', path: 'zakat', title: 'Zakat & Ushr', icon: 'wallet-outline', accent: 'emerald', roles: ALL },
  { name: 'Tasbih', path: 'tasbih', title: 'Tasbih Counter', icon: 'ellipse-outline', accent: 'amber', roles: ALL },

  // ── Learning ────────────────────────────────────────────────────────────
  { name: 'Learning', path: 'learning', title: 'Learning Path', icon: 'school-outline', accent: 'blue', roles: ALL },
  { name: 'ReviewSession', path: 'learning/review', title: 'Review Session', icon: 'refresh-outline', accent: 'blue', roles: ALL, drawer: false },
  { name: 'QuranJourney', path: 'quran-journey', title: 'Quran Journey', icon: 'trophy-outline', accent: 'gold', roles: ALL },
  { name: 'KhatmPlanner', path: 'khatm-planner', title: 'Khatm Planner', icon: 'map-outline', accent: 'purple', roles: ALL },
  { name: 'Quiz', path: 'quiz', title: 'Islamic Quiz', icon: 'help-circle-outline', accent: 'amber', roles: ALL },
  { name: 'Seerah', path: 'seerah', title: 'Seerah of the Prophet ﷺ', icon: 'footsteps-outline', accent: 'blue', roles: ALL },
  { name: 'Prophets', path: 'prophets', title: 'Stories of the Prophets', icon: 'people-outline', accent: 'purple', roles: ALL },
  { name: 'LearnWorship', path: 'learn-worship', title: 'Kalimas, Wudhu & Salah', icon: 'water-outline', accent: 'emerald', roles: ALL },

  // ── Personal ────────────────────────────────────────────────────────────
  { name: 'GoodDeeds', path: 'good-deeds', title: 'Good Deeds', icon: 'ribbon-outline', accent: 'emerald', roles: ALL },
  { name: 'Journal', path: 'journal', title: 'Reflection Journal', icon: 'create-outline', accent: 'pink', roles: ALL },
  { name: 'Reminders', path: 'reminders', title: 'Reminders', icon: 'notifications-outline', accent: 'amber', roles: ALL },
  { name: 'Bookmarks', path: 'bookmarks', title: 'My Library', icon: 'bookmark-outline', accent: 'gold', roles: ALL },
  { name: 'AIChat', path: 'ai-chat', title: 'Islamic AI Assistant', icon: 'chatbubbles-outline', accent: 'cyan', roles: ALL },
  { name: 'Settings', path: 'settings', title: 'Settings', icon: 'settings-outline', accent: 'blue', roles: ALL },

  // ── Restricted ──────────────────────────────────────────────────────────
  // Content authoring is a moderator capability, not a user one.
  { name: 'Generator', path: 'generator', title: 'Content Creator', icon: 'color-wand-outline', accent: 'purple', roles: ['moderator', 'admin'] },
];

/**
 * Deep-link targets that carry parameters.
 *
 * These are separate from MODULES because they resolve to a screen that is
 * already registered — `/quran/2/ayah/255` opens the Quran screen scrolled to
 * Al-Baqarah 255 rather than being a distinct module.
 */
export const DEEP_LINKS = [
  { name: 'Quran', path: 'quran/:surah', parse: { surah: Number } },
  { name: 'Quran', path: 'quran/:surah/ayah/:ayah', parse: { surah: Number, ayah: Number } },
  { name: 'Tafsir', path: 'tafsir/:surah/:ayah', parse: { surah: Number, ayah: Number } },
  { name: 'Hadith', path: 'hadith/:collection', parse: {} },
  { name: 'Hadith', path: 'hadith/:collection/:number', parse: { number: Number } },
  { name: 'Duas', path: 'duas/:id', parse: { id: Number } },
  { name: 'Learning', path: 'learning/:level', parse: {} },
];

/**
 * React Navigation linking patterns.
 *
 * React Navigation accepts exactly one `path` per screen (plus `parse`,
 * `stringify`, `exact`, `screens`, `initialRouteName`) — there is no `alias`.
 * Several URLs therefore have to collapse into a single pattern using
 * optional `:param?` segments.
 *
 * `/quran/2/ayah/255` keeps its readable middle segment: `normalisePath`
 * below rewrites it to `/quran/2/255` before React Navigation parses it.
 */
export const LINK_PATTERNS = {
  Quran: { path: 'quran/:surah?/:ayah?', parse: { surah: Number, ayah: Number } },
  Tafsir: { path: 'tafsir/:surah?/:ayah?', parse: { surah: Number, ayah: Number } },
  Hadith: { path: 'hadith/:collection?/:number?', parse: { number: Number } },
  Duas: { path: 'duas/:id?', parse: { id: Number } },
  Learning: { path: 'learning/:level?' },
};

/**
 * Rewrites the human-friendly deep-link forms into what LINK_PATTERNS expects.
 * Currently just the Quran ayah form, whose literal `/ayah/` segment cannot be
 * expressed as an optional param.
 */
export function normalisePath(path) {
  return String(path || '').replace(/^(\/?quran\/\d+)\/ayah\/(\d+)/i, '$1/$2');
}

// ---------------------------------------------------------------------------
// Derived lookups
// ---------------------------------------------------------------------------

export const moduleByName = name => MODULES.find(m => m.name === name);

/** `{ Quran: '/quran', ... }` — leading slash, for URL building. */
export const ROUTE_PATHS = Object.fromEntries(
  MODULES.map(m => [m.name, `/${m.path}`])
);

/** `{ Quran: ['user','moderator','admin'], ... }` */
export const MODULE_ROLES = Object.fromEntries(
  MODULES.map(m => [m.name, m.roles])
);

export const SCREEN_TITLES = Object.fromEntries(
  MODULES.map(m => [m.name, m.title])
);

/**
 * Resolves a module's accent to a real colour from the active theme.
 * Modules store a *token name* rather than a hex so icons follow the theme
 * instead of being hardcoded (every tile used to be flat white).
 */
export function accentFor(colors, name) {
  const token = moduleByName(name)?.accent || 'gold';
  return colors[token] || colors.gold;
}

/** Ionicons name, filled variant when active. */
export const iconFor = (name, active = false) => {
  const icon = moduleByName(name)?.icon || 'ellipse-outline';
  return active ? icon.replace(/-outline$/, '') : icon;
};

export const TAB_MODULES = MODULES.filter(m => m.tab);
export const DRAWER_MODULES = MODULES.filter(m => m.drawer !== false && !m.tab);

/** Whether `role` may open `moduleName`. Unknown routes are denied. */
export function hasAccess(role, moduleName) {
  const allowed = MODULE_ROLES[moduleName];
  if (!allowed) return false;
  return allowed.includes(role || 'user');
}

/** Route name for a URL path, or null when nothing matches (renders 404). */
export function pathToRoute(path) {
  const clean = `/${String(path || '').split('?')[0].replace(/^\/+|\/+$/g, '')}`;
  if (clean === '/' || clean === '/dashboard') return 'Home';

  const exact = MODULES.find(m => `/${m.path}` === clean);
  if (exact) return exact.name;

  // Fall back to parameterised patterns, longest first so
  // `/hadith/verify` is not swallowed by `/hadith/:collection`.
  const segments = clean.slice(1).split('/');
  const candidates = [...DEEP_LINKS].sort(
    (a, b) => b.path.split('/').length - a.path.split('/').length
  );

  for (const link of candidates) {
    const pattern = link.path.split('/');
    if (pattern.length !== segments.length) continue;
    const matches = pattern.every(
      (part, i) => part.startsWith(':') || part === segments[i]
    );
    if (matches) return link.name;
  }
  return null;
}

/** Params captured from a deep-link path, e.g. `{ surah: 2, ayah: 255 }`. */
export function paramsFromPath(path) {
  const clean = String(path || '').split('?')[0].replace(/^\/+|\/+$/g, '');
  const segments = clean.split('/');

  const candidates = [...DEEP_LINKS].sort(
    (a, b) => b.path.split('/').length - a.path.split('/').length
  );

  for (const link of candidates) {
    const pattern = link.path.split('/');
    if (pattern.length !== segments.length) continue;

    const params = {};
    let ok = true;
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i].startsWith(':')) {
        const key = pattern[i].slice(1);
        const cast = link.parse?.[key];
        const value = cast ? cast(segments[i]) : segments[i];
        if (cast === Number && Number.isNaN(value)) { ok = false; break; }
        params[key] = value;
      } else if (pattern[i] !== segments[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return params;
  }
  return {};
}

/**
 * React Navigation `linking` config, generated from the tables above.
 * Parameterised paths are listed as alternatives so both `/quran` and
 * `/quran/2/ayah/255` resolve to the Quran screen.
 */
export function buildLinkingConfig() {
  const patternFor = m =>
    LINK_PATTERNS[m.name] ? { ...LINK_PATTERNS[m.name] } : m.path;

  const screens = {};
  for (const m of MODULES) {
    if (m.tab) continue;
    screens[m.name] = patternFor(m);
  }

  return {
    prefixes: [
      'qitabe-noor://',
      'http://localhost:8081',
      'http://localhost:8099',
      'https://qitabe-noor.app',
    ],
    config: {
      screens: {
        Login: 'login',
        Main: {
          screens: {
            MainTabs: {
              screens: Object.fromEntries(TAB_MODULES.map(m => [m.name, patternFor(m)])),
            },
            ...screens,
            // Anything unmatched lands here rather than silently doing nothing.
            NotFound: '*',
          },
        },
      },
    },
    // React Navigation does the parsing; this only rewrites the readable
    // `/quran/:surah/ayah/:ayah` form into the pattern above first.
    getStateFromPath: (path, options) =>
      defaultGetStateFromPath(normalisePath(path), options),
  };
}

export default MODULES;
