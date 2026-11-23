# Qitab-e-Noor: purpose of every file

> Last updated: 2026-11-21. 308 tracked files: 245 in `frontend/` (the mobile app), 43 in `backend/` (the API), 20 at the root.
> Generated from the repository so that every file is listed. Regenerate it whenever files are added or removed.

## 1. Layout

```text
Qitabe Noor/
├── frontend/   Expo + React Native mobile app (Android, iOS, web preview)
├── backend/    Express API (Node, PostgreSQL)
├── docs/       product, AI, CI/CD and this file map
├── .github/    GitHub Actions workflows and the PR template
├── scripts/    Windows firewall helpers for testing on a phone
└── (root)      shared tooling, Docker and Render deployment, README, AGENTS
```

Each half is a self-contained npm project with its own `package.json` and `node_modules`. The root `package.json` only holds tooling that spans both halves and delegates the rest with `npm --prefix`.

## 2. Mobile-app scope

The product is a mobile app. Android and iOS are the real targets, and the React Native web preview is secondary but kept working. Everything else exists to support the mobile app:

| Item | Why it is in the repo |
| --- | --- |
| `frontend/src/**` | The app: screens, components, services, offline data and the AI pipeline. |
| `backend/` | The API the app calls for accounts, sync, AI, news and the API console. The app is designed to work without it for core worship, which runs offline. |
| `frontend/Dockerfile.web`, `frontend/public/`, `docker-compose.yml` web service | The react-native-web preview and the legal pages that store listings link to. Secondary, not mobile. |
| `frontend/firestore.rules`, `frontend/src/firebase/` | Firebase: anonymous sign-in at startup and Firestore sync. |
| `render.yaml`, `backend/Dockerfile`, `.github/workflows/cd.yml` | Deploys the API. Not part of the mobile binary. |
| `scripts/*.bat` | Windows-only dev helpers for reaching the dev servers from a phone. |

## 3. Folder-by-folder reference

Paths are relative to the repository root. `node_modules/`, `.expo/`, `dist*/` and the local `.env` files are not tracked, and are created by installs or the developer.


### `(repository root)`

| File | Purpose |
| --- | --- |
| `.gitignore` | Files Git must never track: dependencies, build output, secrets (.env files), local data (backend/.data), editor junk and per-user Claude settings. |
| `AGENTS.md` | Binding operating rules for contributors and coding agents: hard rules, AI rules, layout and the pre-finish checklist. |
| `docker-compose.yml` | Local stack in containers: PostgreSQL, the API (backend/) and the web preview (frontend/Dockerfile.web). |
| `eslint.config.js` | Flat ESLint config for the whole repo: frontend/ is linted as React Native code, backend/ as Node CommonJS. |
| `package-lock.json` | Locked dependency tree for the root manifest, so installs are reproducible. |
| `package.json` | Root manifest. Holds only the cross-cutting tooling (concurrently, eslint and its plugins) and scripts that delegate to frontend/ and backend/. |
| `README.md` | Project introduction, quick start, environment table, scripts and layout. |
| `render.yaml` | Render.com blueprint that deploys the API from backend/Dockerfile with a managed database. |

### `frontend (root)`

| File | Purpose |
| --- | --- |
| `frontend/.dockerignore` | Files left out of the web image build context (node_modules, native folders, secrets, docs). |
| `frontend/.env.example` | Template for frontend/.env: the EXPO_PUBLIC_* values (API URL and Firebase web config). These are public by design and are compiled into the bundle. |
| `frontend/app.config.js` | Dynamic Expo config layered over app.json. Varies cleartext HTTP, notification icon and secure-store options by build profile. |
| `frontend/App.js` | App entry point. Loads fonts, wires the provider tree (theme, language, app lock, prayer lock, share), starts notifications and mounts the navigator. |
| `frontend/app.json` | Static Expo configuration: name, slug, icons, Android and iOS identifiers, permissions and plugins. |
| `frontend/babel.config.js` | Babel config: babel-preset-expo plus the react-native-worklets plugin that Reanimated 4 needs. |
| `frontend/Dockerfile.web` | Container image for the react-native-web preview: exports the web bundle and serves it with a static server. |
| `frontend/eas.json` | EAS Build profiles (development, preview, production), the API URL per profile and the store submit track. |
| `frontend/firestore.rules` | Firebase Firestore security rules: a signed-in user may read and write only their own /users/{uid} subtree. |
| `frontend/jest.setup.js` | Global Jest setup for the app. Replaces AsyncStorage, NetInfo, the file system and secure storage with in-memory versions. |
| `frontend/package-lock.json` | Locked dependency tree for the Expo app. |
| `frontend/package.json` | Frontend manifest: Expo SDK 57 and React Native dependencies, app scripts, EAS helpers and the Jest configuration for the app. |

### `backend (root)`

| File | Purpose |
| --- | --- |
| `backend/.dockerignore` | Files left out of the API image build context (node_modules, .data, secrets). |
| `backend/.env.example` | Template for backend/.env: database, JWT, CORS, port and the optional Anthropic key. |
| `backend/Dockerfile` | Production image for the API. Runs as an unprivileged user with a health check. |
| `backend/jest.setup.js` | Jest setup for the API test suites. |
| `backend/package-lock.json` | Locked dependency tree for the API. |
| `backend/package.json` | Backend manifest: Express, the PostgreSQL driver, the Anthropic SDK, security middleware and the Jest config for the API. |
| `backend/README.md` | Guide to the API: folder roles, endpoints and how to run it. |
| `backend/server.js` | API entry point. Applies security middleware, mounts every route under /api, and starts listening once the database is ready. |

### `.github`

| File | Purpose |
| --- | --- |
| `.github/PULL_REQUEST_TEMPLATE.md` | Checklist shown on every pull request: guardrails, tests, lint and documentation. |

### `.github/workflows`

| File | Purpose |
| --- | --- |
| `.github/workflows/cd.yml` | Continuous delivery on push to main or a v* tag: publishes the API Docker image and starts EAS builds. |
| `.github/workflows/ci.yml` | Continuous integration on every push and pull request: lint, tests, Expo bundle export for Android and iOS, and API and Docker smoke tests. Needs no secrets. |
| `.github/workflows/eas-submit.yml` | Manual-only release workflow: preflight checks, EAS production build and optional store submission. |

### `backend/__tests__`

| File | Purpose |
| --- | --- |
| `backend/__tests__/aiRoute.test.js` | Automated tests for the `aiRoute` module. |
| `backend/__tests__/apiCatalog.test.js` | Automated tests for the `apiCatalog` module. |
| `backend/__tests__/authDeletion.test.js` | Automated tests for the `authDeletion` module. |
| `backend/__tests__/newsRoute.test.js` | Automated tests for the `newsRoute` module. |
| `backend/__tests__/newsTextMining.test.js` | Automated tests for the `newsTextMining` module. |

### `backend/config`

| File | Purpose |
| --- | --- |
| `backend/config/apiCatalog.js` | Machine-readable map of the API surface, served by the catalogue route. |
| `backend/config/database.js` | PostgreSQL connection with TLS handling. Falls back to a file-backed local store in development. |
| `backend/config/email.js` | Nodemailer transport for password-reset email. |
| `backend/config/env.js` | Loads backend/.env and validates settings. Refuses weak secrets and wildcard CORS in production. |

### `backend/middleware`

| File | Purpose |
| --- | --- |
| `backend/middleware/auth.js` | JWT authentication, role checks and ownership checks. |
| `backend/middleware/errorHandler.js` | Central error handler: maps failures to machine-readable reasons without leaking internals. |
| `backend/middleware/security.js` | Security headers, request IDs, input sanitising and the per-route rate limits (including aiLimiter). |
| `backend/middleware/validate.js` | Input validation using express-validator. |

### `backend/migrations`

| File | Purpose |
| --- | --- |
| `backend/migrations/001_create_schema.sql` | Base PostgreSQL schema: users and the core content tables. |
| `backend/migrations/002_personal_tracking.sql` | Tables for good deeds, the reflection journal and the khatm planner. |
| `backend/migrations/run.js` | Applies the SQL migrations in order. Exits non-zero if the database is unreachable. |

### `backend/routes`

| File | Purpose |
| --- | --- |
| `backend/routes/ai.js` | Live Claude endpoints /ai/status and /ai/chat. Holds the system prompt and maps upstream errors to safe reasons. |
| `backend/routes/auth.js` | Register, login, password reset and account deletion. |
| `backend/routes/bookmarks.js` | Bookmarks CRUD. |
| `backend/routes/catalog.js` | Serves the API catalogue. |
| `backend/routes/deeds.js` | Good deeds endpoints. |
| `backend/routes/favorites.js` | Favourites CRUD. |
| `backend/routes/journal.js` | Reflection journal endpoints. |
| `backend/routes/khatm.js` | Khatm planner endpoints. |
| `backend/routes/modules.js` | Module content endpoints, such as the Hifz content. |
| `backend/routes/news.js` | Public headline feed for the Islamic News screen. |
| `backend/routes/notes.js` | Notes CRUD. |
| `backend/routes/prayerToggles.js` | Prayer completion toggles for the prayer tracker. |
| `backend/routes/reminders.js` | Reminder endpoints. |
| `backend/routes/settings.js` | User settings endpoints. |
| `backend/routes/tasbih.js` | Tasbih count history endpoints. |

### `backend/scripts`

| File | Purpose |
| --- | --- |
| `backend/scripts/configure-ai.js` | Writes the Anthropic key to backend/.env through a hidden prompt, and checks status (npm run ai:configure and ai:status). |
| `backend/scripts/verify-deployment.js` | Post-deploy smoke test for the API. Exits non-zero when a load-bearing check fails (npm run verify:deploy). |

### `backend/services`

| File | Purpose |
| --- | --- |
| `backend/services/islamicNews.js` | Aggregates headlines from trusted publishers, with a fallback source. |
| `backend/services/newsTextMining.js` | Deterministic keyword and topic mining for headlines. Not a model. |

### `docs`

| File | Purpose |
| --- | --- |
| `docs/AI_USAGE.md` | Complete inventory of how AI is used and not used: the answer pipeline, source labels, endpoints, prompts and tests. |
| `docs/ci-cd.md` | The GitHub Actions workflows: what each runs, which secrets it needs and when it spends build minutes. |
| `docs/CUSTOM_AI_TRAINING_GUIDE.md` | Options for training a custom Islamic AI model, and how one would plug into the existing retrieval step. |
| `docs/FILE_MAP.md` | This document: the purpose of every file in the repository. |
| `docs/LIVE_AI_SETUP.md` | How to enable the optional live Claude assistant: key setup, server configuration and status checks. |
| `docs/PRODUCT_PRINCIPLES.md` | Product guardrails: no new top-level modules, no AI labels on static content, moderation before social features, the scholar boundary, free core worship. |

### `frontend/assets`

| File | Purpose |
| --- | --- |
| `frontend/assets/adaptive-icon.png` | Android adaptive icon foreground. |
| `frontend/assets/favicon.png` | Browser favicon for the web preview. |
| `frontend/assets/fonts/AmiriQuran-Regular.ttf` | Arabic Quran typeface, bundled so Arabic text renders offline. |
| `frontend/assets/fonts/NotoNastaliqUrdu.ttf` | Urdu Nastaliq typeface for Urdu interface and religious content. |
| `frontend/assets/icon.png` | App icon for the store and the home screen. |
| `frontend/assets/notification-icon.png` | Status-bar icon for notifications. |
| `frontend/assets/sounds/quran-chime.wav` | Reminder chime option. |
| `frontend/assets/sounds/reminder-bright-bells.wav` | Reminder chime option (bright bells). |
| `frontend/assets/sounds/reminder-soft-kalimba.wav` | Reminder chime option (soft kalimba). |
| `frontend/assets/sounds/reminder-warm-bell.wav` | Reminder chime option (warm bell). |
| `frontend/assets/splash.png` | Splash screen image shown while the app loads. |

### `frontend/public`

| File | Purpose |
| --- | --- |
| `frontend/public/privacy/index.html` | Generated static privacy policy page for the store listing. Produced by scripts/export-legal.mjs. |
| `frontend/public/terms/index.html` | Generated static terms of use page for the store listing. Produced by scripts/export-legal.mjs. |

### `frontend/scripts`

| File | Purpose |
| --- | --- |
| `frontend/scripts/export-legal.mjs` | Writes public/privacy and public/terms from src/data/legal.js, so the hosted and in-app copies match. |
| `frontend/scripts/generate-assets.js` | Regenerates the brand images in assets/ (icon, adaptive icon, splash, favicon) from code, with no image dependencies. |
| `frontend/scripts/generate-reminder-sounds.js` | Generates the alternate reminder chimes in assets/sounds/. |

### `frontend/src (root)`

| File | Purpose |
| --- | --- |
| `frontend/src/README.md` | Guide to the app source: the role of each folder. |

### `frontend/src/ai`

| File | Purpose |
| --- | --- |
| `frontend/src/ai/__tests__/assistant.test.js` | Automated tests for the `assistant` module. |
| `frontend/src/ai/__tests__/claudeClient.test.js` | Automated tests for the `claudeClient` module. |
| `frontend/src/ai/__tests__/islamicKnowledge.test.js` | Automated tests for the `islamicKnowledge` module. |
| `frontend/src/ai/assistant.js` | Answer pipeline getAIAnswer(): small talk, then retrieval, then the optional live call, then the offline answer, Quran search and finally "unavailable". |
| `frontend/src/ai/claudeClient.js` | Client for the backend AI endpoints (/ai/status and /ai/chat). Maps server reasons to readable status text. Screens never call Anthropic directly. |
| `frontend/src/ai/islamicKnowledge.js` | Offline knowledge base of 161 topics, with the retrieval engine (synonyms, stemming, categories) the assistant uses without a connection. |

### `frontend/src/components`

| File | Purpose |
| --- | --- |
| `frontend/src/components/__tests__/homeWeather.test.jsx` | Automated tests for the `homeWeather` module. |
| `frontend/src/components/__tests__/pinModal.test.jsx` | Automated tests for the `pinModal` module. |
| `frontend/src/components/__tests__/prayerCountdownRing.test.jsx` | Automated tests for the `prayerCountdownRing` module. |
| `frontend/src/components/__tests__/skyBackdrop.test.jsx` | Automated tests for the `skyBackdrop` module. |
| `frontend/src/components/__tests__/todaysRemindersPopup.test.jsx` | Automated tests for the `todaysRemindersPopup` module. |
| `frontend/src/components/__tests__/todaysRemindersStrip.test.jsx` | Automated tests for the `todaysRemindersStrip` module. |
| `frontend/src/components/__tests__/topicBrowser.test.jsx` | Automated tests for the `topicBrowser` module. |
| `frontend/src/components/AppLockGate.jsx` | Gate that shows the PIN or biometric lock before app content is visible. |
| `frontend/src/components/ErrorBoundary.jsx` | Catches render errors so one broken screen shows a message instead of a blank app. |
| `frontend/src/components/FormattedText.jsx` | Renders plain text with **bold** spans, used for AI and knowledge-base answers. |
| `frontend/src/components/HomeWeather.jsx` | Current conditions and the day's high and low on the Home hero. |
| `frontend/src/components/MoonPhase.jsx` | Drawn moon showing the real lunar phase for a Hijri day. |
| `frontend/src/components/OfflineBanner.jsx` | Banner shown while the device is offline, so users know cached content is in use. |
| `frontend/src/components/PinModal.jsx` | PIN entry and setup modal used by the app lock. |
| `frontend/src/components/PrayerCountdownRing.jsx` | Ring that fills between prayers and counts down to the next one, to the second. |
| `frontend/src/components/PrayerLockOverlay.jsx` | Full-screen cover shown while the prayer lock is active. |
| `frontend/src/components/QuranReminderBanner.jsx` | In-app popup shown when a Quran reminder is due. |
| `frontend/src/components/ShareSheet.jsx` | Share sheet with WhatsApp, Instagram, Copy Link and the system share sheet (guardrail 5). |
| `frontend/src/components/SkyBackdrop.jsx` | Sun or moon backdrop behind the Home hero, following the current hour. |
| `frontend/src/components/TodaysRemindersPopup.jsx` | Card that appears while the app is open when a reminder is due. Offers done, snooze and close. |
| `frontend/src/components/TodaysRemindersStrip.jsx` | Home card that always shows what is due, what is next, or how to add the first reminder. |
| `frontend/src/components/TopicBrowserModal.jsx` | Searchable, category-filtered browser for the 161 offline assistant topics. |
| `frontend/src/components/ZakatBreakdown.jsx` | Shows where the zakat figure came from, line by line. |

### `frontend/src/config`

| File | Purpose |
| --- | --- |
| `frontend/src/config/__tests__/appConfig.test.js` | Automated tests for the `appConfig` module. |
| `frontend/src/config/__tests__/designSystem.test.js` | Automated tests for the `designSystem` module. |
| `frontend/src/config/__tests__/icons.test.js` | Automated tests for the `icons` module. |
| `frontend/src/config/__tests__/linkingValidation.test.js` | Automated tests for the `linkingValidation` module. |
| `frontend/src/config/__tests__/routes.test.js` | Automated tests for the `routes` module. |
| `frontend/src/config/__tests__/theme.test.js` | Automated tests for the `theme` module. |
| `frontend/src/config/appConfig.js` | Central app configuration: the API base URL (EXPO_PUBLIC_API_URL) and external base URLs. |
| `frontend/src/config/routes.js` | Route table: the single source of truth for module labels, icons, screens and role gating, used by Home and navigation. |
| `frontend/src/config/theme.config.js` | Shared theme tokens that every theme builds on. |
| `frontend/src/config/themes/default.js` | Default dark Islamic theme. |
| `frontend/src/config/themes/highContrast.js` | High-contrast theme for accessibility. |
| `frontend/src/config/themes/index.js` | Registry of the available themes. |
| `frontend/src/config/themes/light.js` | Light theme variant. |
| `frontend/src/config/themes/palettes.js` | Additional colour palettes built on the dark base. |

### `frontend/src/context`

| File | Purpose |
| --- | --- |
| `frontend/src/context/__tests__/appLock.test.jsx` | Automated tests for the `appLock` module. |
| `frontend/src/context/__tests__/prayerLock.test.js` | Automated tests for the `prayerLock` module. |
| `frontend/src/context/AppLockContext.jsx` | Shares the app-lock state (PIN set, locked or unlocked) across the tree. |
| `frontend/src/context/LanguageContext.jsx` | English and Urdu language state. Module names stay English. |
| `frontend/src/context/PrayerLockContext.jsx` | Shares the prayer-lock state that drives PrayerLockOverlay. |
| `frontend/src/context/RoleContext.jsx` | Signed-in user's role, used to show or hide role-gated screens. |
| `frontend/src/context/ShareContext.jsx` | Shares the open share sheet across screens. |
| `frontend/src/context/ThemeContext.jsx` | Runtime theme switching: provides the active theme and its setter. |

### `frontend/src/data`

| File | Purpose |
| --- | --- |
| `frontend/src/data/__tests__/curriculum.test.js` | Automated tests for the `curriculum` module. |
| `frontend/src/data/__tests__/isnad.test.js` | Automated tests for the `isnad` module. |
| `frontend/src/data/__tests__/legal.test.js` | Automated tests for the `legal` module. |
| `frontend/src/data/__tests__/legalPages.test.js` | Automated tests for the `legalPages` module. |
| `frontend/src/data/__tests__/quranReminder.test.js` | Automated tests for the `quranReminder` module. |
| `frontend/src/data/__tests__/worship.test.js` | Automated tests for the `worship` module. |
| `frontend/src/data/communities.js` | Starter circles shown on the Communities screen. |
| `frontend/src/data/courses.js` | Structured self-study course content for E-Learning. |
| `frontend/src/data/curriculum.js` | Learning path as a prerequisite graph rather than a flat checklist. |
| `frontend/src/data/daily.js` | Curated pools for the daily cards on the landing page. |
| `frontend/src/data/duas.js` | Shared Duas dataset and the contextual recommendation rules. |
| `frontend/src/data/fiqh.js` | How to perform wudhu and salah, per school of fiqh. |
| `frontend/src/data/hajj.js` | Hajj and Umrah guide content. |
| `frontend/src/data/hijriMonths.js` | Significance of each Hijri month. |
| `frontend/src/data/isnad.js` | Chains of transmission (isnad) and the narrators in them, for hadith. |
| `frontend/src/data/istikhara.js` | Istikhara prayer guidance content. |
| `frontend/src/data/kalimas.js` | The six Kalimas. |
| `frontend/src/data/legal.js` | Privacy policy and terms of use text. Read in the app and exported to public/ by the legal script. |
| `frontend/src/data/librarySamples.js` | Starter content for My Library. |
| `frontend/src/data/names.js` | The 99 Names of Allah. |
| `frontend/src/data/pillars.js` | The five pillars of Islam and the six articles of faith. |
| `frontend/src/data/prayerMethods.js` | Prayer-time calculation methods by school of fiqh. |
| `frontend/src/data/prophets.js` | The twenty-five prophets named in the Quran, in canonical order, with the surah/ayah ranges each one appears in. |
| `frontend/src/data/prophetsI18n.js` | Prophet names, summaries and lessons in Urdu, Malay, French and Indonesian, plus the story reader's UI labels in all five reading languages. |
| `frontend/src/data/quiz.js` | Question bank shared by the Islamic Quiz and the learning engine. |
| `frontend/src/data/quranReminder.js` | Quran reminder slots and their default times. |
| `frontend/src/data/seerah.js` | The Seerah as a dated timeline. |

### `frontend/src/firebase`

| File | Purpose |
| --- | --- |
| `frontend/src/firebase/config.js` | Firebase initialisation from the EXPO_PUBLIC_FIREBASE_* values. Starts the anonymous sign-in and the Firestore connection used for sync. |
| `frontend/src/firebase/syncedStorage.js` | Drop-in replacement for AsyncStorage get and set that also mirrors data to Firestore for signed-in users. |

### `frontend/src/hooks`

| File | Purpose |
| --- | --- |
| `frontend/src/hooks/useDeviceHeading.js` | Compass heading from the device sensors, used by the Qibla finder. |
| `frontend/src/hooks/useNavigationUrl.js` | Builds the shareable URL for the current route. |
| `frontend/src/hooks/usePreferences.js` | Reads and writes user preferences, with live updates. |
| `frontend/src/hooks/useTheme.js` | Hook returning the active theme values. |
| `frontend/src/hooks/useUserLocation.js` | One-shot GPS fix for prayer times and Qibla. The fix stays on the device. |

### `frontend/src/i18n`

| File | Purpose |
| --- | --- |
| `frontend/src/i18n/__tests__/translations.test.js` | Automated tests for the `translations` module. |
| `frontend/src/i18n/translations.js` | App-shell translations (English and Urdu) for labels that are not module names. |

### `frontend/src/navigation`

| File | Purpose |
| --- | --- |
| `frontend/src/navigation/__tests__/appNavigatorBoot.test.jsx` | Automated tests for the `appNavigatorBoot` module. |
| `frontend/src/navigation/AppNavigator.jsx` | Root navigator: tabs, drawer and stacks. Filters modules by role and guards the splash and loading state. |
| `frontend/src/navigation/screenRegistry.js` | Maps route names to screen components. |

### `frontend/src/screens`

| File | Purpose |
| --- | --- |
| `frontend/src/screens/__tests__/apiConsole.test.jsx` | Automated tests for the `apiConsole` module. |
| `frontend/src/screens/__tests__/homeRoleGating.test.js` | Automated tests for the `homeRoleGating` module. |
| `frontend/src/screens/__tests__/islamicNewsScreen.test.jsx` | Automated tests for the `islamicNewsScreen` module. |
| `frontend/src/screens/__tests__/landing.test.js` | Automated tests for the `landing` module. |
| `frontend/src/screens/__tests__/qiblaScreen.test.js` | Automated tests for the `qiblaScreen` module. |
| `frontend/src/screens/__tests__/quranLanguages.test.js` | Automated tests for the `quranLanguages` module. |
| `frontend/src/screens/__tests__/remindersScheduling.test.js` | Automated tests for the `remindersScheduling` module. |
| `frontend/src/screens/__tests__/remindersSoundPicker.test.jsx` | Automated tests for the `remindersSoundPicker` module. |
| `frontend/src/screens/__tests__/screens.smoke.test.js` | Automated tests for the `screens.smoke` module. |
| `frontend/src/screens/AdminPanelScreen.jsx` | Admin tools, visible only to admin roles. |
| `frontend/src/screens/AIChatScreen.jsx` | Islamic AI Assistant chat: source labels, history, suggestions and the topic browser. |
| `frontend/src/screens/AIQuranAssistantScreen.jsx` | Quran Study: searches Quran translations and shows the matched verses. Uses no LLM. |
| `frontend/src/screens/ApiConsoleScreen.jsx` | Developer console that lists the backend API catalogue and can test the status endpoints. |
| `frontend/src/screens/AyahOfDayScreen.jsx` | Ayah of the day with its translation. |
| `frontend/src/screens/BookmarksScreen.jsx` | Bookmarks and favourites, in tabs. |
| `frontend/src/screens/CommunitiesScreen.jsx` | Local-first community circles. Nothing is shared with other users yet. |
| `frontend/src/screens/DiagnosticsScreen.jsx` | System health report: network, backend, AI status and storage. |
| `frontend/src/screens/DuaLibraryScreen.jsx` | Full dua library with search and sharing. |
| `frontend/src/screens/DuasScreen.jsx` | Duas for the time of day, live location, weather, moon phase, landscape and manual context chips. |
| `frontend/src/screens/ELearningScreen.jsx` | E-Learning course library: lessons, review questions and progress. |
| `frontend/src/screens/GeneratorScreen.jsx` | Manual content-card creator with sharing. No generation. |
| `frontend/src/screens/GoodDeedsScreen.jsx` | Good deeds tracker. |
| `frontend/src/screens/HadithScreen.jsx` | Browser for the six authentic hadith collections. |
| `frontend/src/screens/HadithVerificationScreen.jsx` | Hadith lookup against the published collections. It states that AI cannot verify authenticity. |
| `frontend/src/screens/HajjGuideScreen.jsx` | Hajj and Umrah companion: types, day-by-day rites, duas and ihram. |
| `frontend/src/screens/HifzScreen.jsx` | Hifz (memorisation) tracker. |
| `frontend/src/screens/HomeScreen.jsx` | Home dashboard: hero with weather and sky, next prayer, reminders, the AI card and the module grid. |
| `frontend/src/screens/IslamicCalendarScreen.jsx` | Hijri calendar with significant days. |
| `frontend/src/screens/IslamicNewsScreen.jsx` | Islamic news reader for headlines from trusted publishers, with trend lines. |
| `frontend/src/screens/IslamicQuizScreen.jsx` | Islamic knowledge quiz. |
| `frontend/src/screens/IstikharaScreen.jsx` | Istikhara guide and a private decision journal. |
| `frontend/src/screens/KhatmPlannerScreen.jsx` | Quran completion (khatm) planner. |
| `frontend/src/screens/LandingScreen.jsx` | First screen a new user sees: the brand, the tagline and Explore Modules. |
| `frontend/src/screens/LearningPathScreen.jsx` | Guided learning path that follows the curriculum graph. |
| `frontend/src/screens/LearnWorshipScreen.jsx` | Kalimas, wudhu and salah, with the Hanafi and Ja'fari methods side by side. |
| `frontend/src/screens/LegalScreen.jsx` | Shows the privacy policy and terms inside the app. |
| `frontend/src/screens/LoginScreen.jsx` | Sign-in and account screen. |
| `frontend/src/screens/NamesOfAllahScreen.jsx` | The 99 Names with meanings and recitation audio, one file per name. |
| `frontend/src/screens/NotFoundScreen.jsx` | Fallback for an unknown route. |
| `frontend/src/screens/PillarsScreen.jsx` | Five pillars and six articles of faith. |
| `frontend/src/screens/PrayerTimesScreen.jsx` | Prayer times for the saved city and calculation method, with the next-prayer countdown. |
| `frontend/src/screens/PrayerTrackerScreen.jsx` | Daily prayer tracker. |
| `frontend/src/screens/ProphetsStoriesScreen.jsx` | The twenty-five prophets named in the Quran, each marked as such with its references, a full story reader that loads those verses in the chosen language, and a jump into the Quran reader. |
| `frontend/src/screens/QiblaFinderScreen.jsx` | Qibla direction and distance to the Kaaba, using the compass and location. |
| `frontend/src/screens/QuranJourneyScreen.jsx` | Quran reading journey and progress. |
| `frontend/src/screens/QuranScreen.jsx` | Quran reader with translations, recitation audio and offline download. |
| `frontend/src/screens/RamadanModeScreen.jsx` | Ramadan mode with daily worship prompts. |
| `frontend/src/screens/ReflectionJournalScreen.jsx` | Private reflection journal. |
| `frontend/src/screens/RemindersScreen.jsx` | Reminders settings: Quran and custom reminders, chimes and schedules. |
| `frontend/src/screens/ReviewSessionScreen.jsx` | Review session that drills learning-engine cards. |
| `frontend/src/screens/SearchScreen.jsx` | Universal search across the app content, grouped by module. |
| `frontend/src/screens/SeerahScreen.jsx` | Seerah timeline. |
| `frontend/src/screens/SettingsScreen.jsx` | Settings: theme, language, app lock, reminders, AI status and the local AI usage summary. |
| `frontend/src/screens/TafsirScreen.jsx` | Tafsir (commentary) for a verse, fetched from the quran.com API. |
| `frontend/src/screens/TasbihScreen.jsx` | Digital tasbih counter with history. |
| `frontend/src/screens/ZakatScreen.jsx` | Zakat and Ushr calculator, with a Zakat AI tab that reuses the same answer pipeline. |

### `frontend/src/services`

| File | Purpose |
| --- | --- |
| `frontend/src/services/__tests__/aiUsage.test.js` | Automated tests for the `aiUsage` module. |
| `frontend/src/services/__tests__/apiCatalog.test.js` | Automated tests for the `apiCatalog` module. |
| `frontend/src/services/__tests__/appLock.test.js` | Automated tests for the `appLock` module. |
| `frontend/src/services/__tests__/authToken.test.js` | Automated tests for the `authToken` module. |
| `frontend/src/services/__tests__/backend.test.js` | Automated tests for the `backend` module. |
| `frontend/src/services/__tests__/backupFormat.test.js` | Automated tests for the `backupFormat` module. |
| `frontend/src/services/__tests__/backupRestore.test.js` | Automated tests for the `backupRestore` module. |
| `frontend/src/services/__tests__/cache.test.js` | Automated tests for the `cache` module. |
| `frontend/src/services/__tests__/contextDuas.test.js` | Automated tests for the `contextDuas` module, including weather, moon and landscape priority. |
| `frontend/src/services/__tests__/contextEnvironment.test.js` | Automated tests for the environment sensing service (rain history, weather normalisation, Overpass parsing and cache). |
| `frontend/src/services/__tests__/diagnosticsFormat.test.js` | Automated tests for the `diagnosticsFormat` module. |
| `frontend/src/services/__tests__/geocode.test.js` | Automated tests for the `geocode` module. |
| `frontend/src/services/__tests__/globalSearch.test.js` | Automated tests for the `globalSearch` module. |
| `frontend/src/services/__tests__/hadithApi.test.js` | Automated tests for the `hadithApi` module. |
| `frontend/src/services/__tests__/islamicNews.test.js` | Automated tests for the `islamicNews` module. |
| `frontend/src/services/__tests__/learningEngine.test.js` | Automated tests for the `learningEngine` module. |
| `frontend/src/services/__tests__/notifications.test.js` | Automated tests for the `notifications` module. |
| `frontend/src/services/__tests__/offlineLibrary.test.js` | Automated tests for the `offlineLibrary` module. |
| `frontend/src/services/__tests__/placeLookup.test.js` | Automated tests for the `placeLookup` module. |
| `frontend/src/services/__tests__/preferences.test.js` | Automated tests for the `preferences` module. |
| `frontend/src/services/__tests__/quranApi.test.js` | Automated tests for the `quranApi` module. |
| `frontend/src/services/__tests__/reciters.test.js` | Automated tests for the `reciters` module. |
| `frontend/src/services/__tests__/reminderSound.test.js` | Automated tests for the `reminderSound` module. |
| `frontend/src/services/__tests__/todaysReminders.test.js` | Automated tests for the `todaysReminders` module. |
| `frontend/src/services/__tests__/weather.test.js` | Automated tests for the `weather` module. |
| `frontend/src/services/aiUsage.js` | Device-only counters of AI answers by source and day. No question text is stored. |
| `frontend/src/services/apiCatalog.js` | Reads the backend API catalogue for the developer console. |
| `frontend/src/services/appLock.js` | PIN and biometric app lock: setup, verification and lock state. |
| `frontend/src/services/authToken.js` | Keeps the session token in secure storage and removes any older plaintext copy. |
| `frontend/src/services/backend.js` | Authenticated HTTP client for the backend, with timeouts and reason preservation. |
| `frontend/src/services/backup.js` | Backup and restore: file input and output. |
| `frontend/src/services/backupFormat.js` | Backup envelope format and validation. |
| `frontend/src/services/cache.js` | Offline-first data layer. Serves cached data when the network fails and refreshes it when the connection returns. |
| `frontend/src/services/contextDuas.js` | Picks duas from the time of day, place, weather, moon phase, landscape and the manual context chips. |
| `frontend/src/services/decks.js` | Turns shipped content (Names, duas, quiz bank, Hifz) into review cards for the learning engine. |
| `frontend/src/services/diagnostics.js` | Collects the system health data shown on the Diagnostics screen. |
| `frontend/src/services/diagnosticsFormat.js` | Pure formatting and analysis of the diagnostics report. |
| `frontend/src/services/geocode.js` | City geocoding for the Qibla and prayer fallback, using the phone's own geocoder. |
| `frontend/src/services/globalSearch.js` | Search across the app's own content, ranked on the device. |
| `frontend/src/services/hadithApi.js` | Hadith service for the six collections, served from a CDN. |
| `frontend/src/services/islamicNews.js` | News feed client and the on-device cache of headlines. |
| `frontend/src/services/learningEngine.js` | Adaptive review engine that schedules learning items with spaced intervals. |
| `frontend/src/services/notifications.js` | Notifications for prayer times, reminders and Quran recitation, plus the in-app reminder subscriber. |
| `frontend/src/services/offlineLibrary.js` | Downloaded Quran library for reading without a connection. |
| `frontend/src/services/placeLookup.js` | Turns a GPS fix into a place label through the phone's own geocoder and follows the device while live context is on (never the server). |
| `frontend/src/services/preferences.js` | User preferences storage. |
| `frontend/src/services/quranApi.js` | Quran service backed by the quran.com v4 API, including translations and recitation audio. |
| `frontend/src/services/reminderSound.js` | Plays the chosen reminder chime and primes audio on the first tap. |
| `frontend/src/services/storage.js` | Typed local storage wrapper over AsyncStorage. |
| `frontend/src/services/sync.js` | Syncs signed-in user bookmarks, notes, favourites, prayer toggles and reminders with the backend API. |
| `frontend/src/services/tafsirApi.js` | Tafsir service backed by the quran.com v4 API. |
| `frontend/src/services/todaysReminders.js` | Works out which reminders are due today and keeps them due until they are marked done. |
| `frontend/src/services/weather.js` | Keyless Open-Meteo weather for the saved city, cached for thirty minutes with an offline fallback. |
| `frontend/src/services/contextEnvironment.js` | Keyless Open-Meteo weather, 92-day rain history and elevation plus OpenStreetMap Overpass landscape names for the Duas card; every call degrades to null offline. |

### `frontend/src/theme`

| File | Purpose |
| --- | --- |
| `frontend/src/theme/__tests__/themeSwitching.test.jsx` | Automated tests for the `themeSwitching` module. |
| `frontend/src/theme/fonts.js` | Font asset registry (Amiri Quran and Noto Nastaliq Urdu). |
| `frontend/src/theme/globalStyles.js` | Global styles as a factory over the active theme. |
| `frontend/src/theme/index.js` | Theme exports: ThemeProvider, useColors, useThemedStyles and useGlobalStyles. |

### `frontend/src/utils`

| File | Purpose |
| --- | --- |
| `frontend/src/utils/__tests__/citationLinks.test.js` | Automated tests for the `citationLinks` module. |
| `frontend/src/utils/__tests__/hijri.test.js` | Automated tests for the `hijri` module. |
| `frontend/src/utils/__tests__/nextPrayer.test.js` | Automated tests for the `nextPrayer` module. |
| `frontend/src/utils/__tests__/qibla.test.js` | Automated tests for the `qibla` module. |
| `frontend/src/utils/__tests__/sky.test.js` | Automated tests for the `sky` module. |
| `frontend/src/utils/__tests__/webAlerts.test.js` | Automated tests for the `webAlerts` module. |
| `frontend/src/utils/citationLinks.js` | Turns reference strings in an assistant answer into Quran links. |
| `frontend/src/utils/externalLink.js` | Opens an external address in the browser. |
| `frontend/src/utils/hijri.js` | Hijri date calculation shared by the calendar, Home and the landing page. |
| `frontend/src/utils/nextPrayer.js` | Finds the next prayer from the cached timings. |
| `frontend/src/utils/qibla.js` | Qibla bearing and distance to the Kaaba. |
| `frontend/src/utils/share.js` | Sharing helpers used by every screen. |
| `frontend/src/utils/sky.js` | Sun and moon window calculation for the Home hero. |
| `frontend/src/utils/themeUtils.js` | Theme helper functions. |
| `frontend/src/utils/webAlerts.js` | Browser dialog fallback so confirmations work on the web preview. |

### `scripts`

| File | Purpose |
| --- | --- |
| `scripts/allow-dev-ports.bat` | Windows helper, run as administrator. Opens ports 8081 and 3001 so a phone on the same private network can reach the dev servers. |
| `scripts/remove-dev-ports.bat` | Windows helper, run as administrator. Removes the firewall rules added by allow-dev-ports.bat. |

## 4. Not tracked by Git (created locally)

| Path | Purpose |
| --- | --- |
| `frontend/.env`, `backend/.env` | Real secrets and configuration. Never committed. Templates are the `.env.example` files. |
| `frontend/node_modules/`, `backend/node_modules/`, `node_modules/` | Installed dependencies. Created by `npm run setup`. |
| `frontend/.expo/` | Expo's local cache. |
| `backend/.data/` | The development file-backed store, which holds local accounts. Never committed. |
| `frontend/android/`, `frontend/ios/` | Native projects generated by Expo prebuild when needed. |

