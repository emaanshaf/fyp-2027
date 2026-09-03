# Qitab-e-Noor

Islamic companion app built with Expo / React Native. Runs on Android, iOS and
the web from one codebase, and keeps working with no connection.

## Features

**Scripture & study**
- Quran — 114 surahs, 5 translations, 12 reciters, verse audio
- Tafsir — Ibn Kathir, Ma'arif al-Qur'an, Tazkirul Quran, plus Urdu and Arabic commentaries
- Hadith — the six authentic collections, fully searchable offline
- Hadith verification — search every collection at once by text or number
- Ayah of the Day, Quran Journey, Khatm planner, Hifz tracker

**Worship**
- Prayer times, prayer tracker and adhan reminders
- Qibla compass
- Tasbih counter
- Zakat & Ushr calculator
- Ramadan mode, Hijri calendar

**Learning** *(see [The learning model](#the-learning-model))*
- Adaptive spaced-repetition review across everything you're memorising
- A guided curriculum that unlocks by prerequisite
- Islamic quiz, Seerah, the 25 prophets, the 99 Names

**Other**
- Duas & adhkar with text-to-speech and a personal dua library
- Reflection journal, good deeds tracker
- Bookmarks and notes
- Islamic AI assistant (offline knowledge base, optional Claude API)

## Running the app

```
npm install
npm run dev
```

`npm run dev` runs both tiers together — the API on **http://localhost:3001**
and the app on **http://localhost:8081**.

To run them separately:

```
npm run server   # API only, port 3001
npm start        # app only  (a = Android, i = iOS, w = web)
```

Useful checks:

```
npm run verify   # lint + tests + Expo health, all in one
npm test         # unit tests
npm run lint     # ESLint
npm run doctor   # Expo dependency/config health
npm run assets   # regenerate app icons and splash from code
```

## Routing

`src/config/routes.js` is the single source of truth. Route paths, drawer
entries, screen titles, role permissions and the React Navigation `linking`
config are all derived from one `MODULES` table — these were previously four
hand-maintained copies that had already drifted apart.

Every module has a URL:

```
/dashboard/home        /tafsir              /learning
/quran                 /hifz                /learning/review
/prayer                /hadith              /quiz
/duas                  /hadith/verify       /zakat
/qibla                 /names-of-allah      /settings
```

Nested and parameterised routes resolve to the right screen with their params
parsed and cast:

```
/quran/2               ->  Quran      { surah: 2 }
/quran/2/ayah/255      ->  Quran      { surah: 2, ayah: 255 }
/tafsir/2/255          ->  Tafsir     { surah: 2, ayah: 255 }
/hadith/bukhari/1      ->  Hadith     { collection: 'bukhari', number: 1 }
```

Literal paths win over parameterised ones, so `/hadith/verify` reaches the
verification screen rather than being swallowed by `/hadith/:collection`.
Anything unmatched renders the 404 screen instead of failing silently.

Deep links work from `qitabe-noor://`, `https://qitabe-noor.app` and localhost,
and browser back/forward plus refresh-in-place are handled by React
Navigation's linking integration.

Access is role-gated (`user` / `moderator` / `admin`) from the same table, and
the API enforces the same permissions server-side — a route hidden in the
drawer is also refused by the backend, not just hidden in the UI.

## Offline-first

Every remote read goes through `src/services/cache.js`, which uses a
stale-while-revalidate strategy: cached content renders immediately, refreshes
in the background, and falls back to the last saved copy when the network is
gone. Anything opened once stays available.

Large payloads (hadith collections run to several megabytes) are written to the
filesystem rather than AsyncStorage, which is not built for values that size.

**Settings → Offline & Storage** shows connection state and how much has been
downloaded, and lets you clear it. Clearing never touches your bookmarks,
notes, favourites or learning progress.

## The learning model

Anything you're trying to retain — a memorised ayah, a dua, one of the 99
Names, a quiz fact — becomes a *card* scheduled by the engine in
`src/services/learningEngine.js`.

**Scheduling** is SM-2 with three deliberate departures:

| Change | Why |
|---|---|
| A lapse halves the interval instead of resetting it | Dropping a long-held ayah back to day one after one slip is punishing enough that people abandon the habit |
| Intervals carry ±15% jitter | Stops a freshly seeded deck from falling due all on the same morning |
| "Hard" lowers ease without counting as a lapse | Separates *slow* recall from *failed* recall |

**Mastery** per card is driven by interval length, tempered by lapse count, so
a card that keeps breaking never reads as mastered.

**Guidance** — the hub suggests what will help most, in order: clear the review
backlog, shore up the weakest topic, then introduce new material.

**The curriculum** (`src/data/curriculum.js`) is a prerequisite graph, not a
checklist: Salah unlocks after Wudu, Hifz after Juz Amma and Tafsir basics.
Progress is persisted. Tests assert the graph is acyclic, never gates a lesson
behind a later level, and can always be walked to completion.

Decks are built from content the app already ships (`src/services/decks.js`),
with stable namespaced card ids, so re-seeding a deck after a content update
never duplicates a card or resets its history.

## Islamic AI Assistant

The assistant works out of the box using a built-in offline knowledge base
(`src/ai/islamicKnowledge.js`) — no setup required.

For live, more detailed answers via the Claude API:

1. Copy `.env.example` to `.env`
2. Add `EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...`
3. Restart `npx expo start`

If the key is missing, offline, or a request fails, the app falls back to the
offline knowledge base — the assistant never breaks.

> `EXPO_PUBLIC_` variables are compiled into the JS bundle and are visible to
> anyone who inspects the shipped app. For a public release, proxy this call
> through your own backend instead of shipping a key.

## Accounts & data sync

By default the app runs in **guest mode** — no login, everything on-device.

**Firebase** (email/password accounts and cross-device sync):

1. Create a project at https://console.firebase.google.com (the free Spark plan is enough)
2. Add a "Web app" to get the config values
3. Authentication → Sign-in method → enable **Email/Password**
4. Firestore Database → create it, then paste `firestore.rules` into the Rules tab
5. Fill in the six `EXPO_PUBLIC_FIREBASE_*` values in `.env`
6. Restart `npx expo start`

**The API server** (`server/`) is an alternative backend with JWT auth, bcrypt,
rate limiting and role-based access.

Security notes:

- `JWT_SECRET` has **no insecure default**. Production refuses to boot without
  a real one; development generates an ephemeral secret per process.
- `CORS_ORIGIN` must list real origins in production — `*` is rejected there,
  and it cannot be combined with credentialed requests anyway.
- The credential limiter (10 per 15 min) covers login, register, password
  reset and password change. Ordinary reads such as `/auth/me` are not
  throttled, since opening the app ten times in fifteen minutes is normal use.
- User responses are projected through a whitelist, so a password hash cannot
  reach a client regardless of which storage backend answered.
- Input sanitisation skips password fields — rewriting a credential silently
  locks the user out.
- Firestore rules scope each user to their own subtree, subcollections
  included, with an explicit catch-all deny for everything else.

It prefers PostgreSQL — set `DB_*` / `DATABASE_URL` in `.env` and run
`node server/migrations/run.js`. Any of local Postgres,
[Supabase](https://supabase.com) or [Neon](https://neon.tech) works.

Without it, the server falls back to a file-backed local store in
`server/.data/`. That fallback survives restarts and is fine for development,
but it is not a production database — use PostgreSQL for anything real.

Without any of this the app works fully in guest mode; no functionality is lost.

## Building

Build profiles live in `eas.json`.

```
npm run build:preview   # internal APK
npm run build:prod      # Play Store app bundle
```

`app.config.js` layers profile-specific settings over `app.json`. Notably,
cleartext HTTP is enabled for development (the dev client talks to a local API
over `http://`) and disabled for production builds, which Play Store review
requires.

App icons and the splash screen are generated from code by
`scripts/generate-assets.js` — edit the palette or geometry there and run
`npm run assets` rather than hand-editing the PNGs.

## Project layout

```
src/
  ai/            offline knowledge base + Claude client
  components/    shared UI primitives, error boundary, offline banner
  config/        app config, theme definitions
  data/          content datasets (duas, names, prophets, quiz, curriculum)
  hooks/         theme and navigation hooks
  navigation/    navigator, route table, role gating
  screens/       33 feature screens
  services/      cache, API clients, learning engine, storage, sync
  theme/         theme entry point
server/          optional Express API (JWT, RBAC, PostgreSQL)
scripts/         asset generation
```
