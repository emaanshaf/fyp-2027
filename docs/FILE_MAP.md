# Qitab-e-Noor — Complete File Map

> **Purpose**: This document describes the purpose of every file in the project.
> It is kept up to date as the codebase evolves.
> Last updated: November 2026

---

## Project Architecture at a Glance

```
Qitabe Noor/
├── App.js                   ← Mobile app entry point
├── app.config.js            ← Expo configuration (dynamic)
├── app.json                 ← Expo configuration (static)
├── babel.config.js          ← Babel transpiler config
├── eas.json                 ← EAS Build profiles (Android/iOS)
├── eslint.config.js         ← ESLint rules
├── jest.setup.js            ← Global Jest test setup
├── package.json             ← All npm dependencies and scripts
├── package-lock.json        ← Locked dependency tree
├── render.yaml              ← Render.com deployment config
├── docker-compose.yml       ← Docker orchestration (web + server)
├── Dockerfile.web           ← Docker image for web preview
├── firestore.rules          ← Firebase Firestore security rules
├── README.md                ← Project introduction and quick-start
├── AGENTS.md                ← Binding rules for all contributors & AI agents
├── stop.bat                 ← Windows: gracefully stops the dev server
│
├── assets/                  ← Static app assets
├── docs/                    ← All project documentation
├── public/                  ← Static web files (legal pages)
├── scripts/                 ← Developer utility scripts
├── server/                  ← Express API backend
└── src/                     ← React Native mobile app source
```

---

## Root Files

| File | Purpose |
|------|---------|
| `App.js` | Root React Native component. Loads fonts, wires all Context providers (Theme, Language, AppLock, PrayerLock, Share), initialises notification service, Quran reminder system, and mounts `AppNavigator`. |
| `app.config.js` | Dynamic Expo config — sets app name, slug, icons, permissions, Android package ID, iOS bundle ID, and plugin list. Reads from `.env` via `dotenv`. |
| `app.json` | Static Expo config fallback. Used when `app.config.js` is not present. |
| `babel.config.js` | Babel preset for Expo (`babel-preset-expo`) plus any transforms needed for React Native Reanimated. |
| `eas.json` | EAS Build profiles: `development` (simulator), `preview` (APK), `production` (store-ready). |
| `eslint.config.js` | ESLint flat-config with `eslint-config-expo` rules, plus project-specific overrides. |
| `jest.setup.js` | Jest global setup: mocks for `expo-modules-core`, `AsyncStorage`, `expo-notifications`, `react-native-reanimated`, `expo-location`, `expo-sensors`, Firebase, and all native modules. |
| `package.json` | All npm dependencies, dev dependencies, npm scripts (`npm start`, `npm run server`, `npm test`, `npm run lint`, etc.), Jest project config, and Expo doctor exclusions. |
| `package-lock.json` | Auto-generated lockfile — exact resolved versions of every transitive dependency. Do not edit manually. |
| `README.md` | Project introduction, feature list, quick-start instructions, architecture diagram, and contribution guide. |
| `AGENTS.md` | **Binding operating rules** for all contributors and AI coding agents. Defines hard rules, guardrails, AI rules, folder layout, and verification requirements. |
| `render.yaml` | Render.com infrastructure-as-code: defines the web service (Expo web) and the API service (Express), environment variables, and health check path. |
| `docker-compose.yml` | Docker Compose file: `web` service (Expo web preview) and `api` service (Express server) with shared network and volumes. |
| `Dockerfile.web` | Multi-stage Docker build for the Expo web preview. Stage 1: build; Stage 2: serve static files with `serve`. |
| `firestore.rules` | Firebase Firestore security rules — controls read/write access to Firestore collections per authenticated user. |
| `stop.bat` | Windows batch script: kills the Node server process on port 3001 (safe alternative to `start.bat` which is banned). |
| `.env` | **Secret** — API keys, DB URL, JWT secret. Never committed to git. See `.env.example`. |
| `.env.example` | Template showing all supported environment variables with example values and documentation. |
| `.gitignore` | Patterns for files/folders excluded from git: `node_modules`, `.env`, `dist`, logs, etc. |
| `.dockerignore` | Patterns excluded from Docker build context (same idea as `.gitignore` but for Docker). |

---

## `assets/` — Static App Assets

| File | Purpose |
|------|---------|
| `assets/icon.png` | App icon (1024×1024) used by Expo for all platforms. |
| `assets/adaptive-icon.png` | Android adaptive icon foreground layer. |
| `assets/splash.png` | Splash screen image shown at app launch. |
| `assets/favicon.png` | Favicon for the Expo web preview. |
| `assets/notification-icon.png` | Small icon shown in Android system notification bar. |
| `assets/fonts/` | Bundled font files (e.g., Amiri for Arabic text, Inter for UI). Loaded at startup via `useFonts()`. |
| `assets/sounds/` | Reminder chime audio files played by `reminderSound.js`. |

---

## `docs/` — Project Documentation

| File | Purpose |
|------|---------|
| `docs/PRODUCT_PRINCIPLES.md` | Detailed product guardrails, monetisation rules, scholar boundary definition, and design philosophy. |
| `docs/AI_USAGE.md` | Complete inventory of every AI touchpoint: what calls the AI, what data is sent, how offline fallback works, source label meanings. |
| `docs/LIVE_AI_SETUP.md` | Step-by-step guide to configure the Anthropic API key and enable live Claude responses. |
| `docs/CUSTOM_AI_TRAINING_GUIDE.md` | Guide for adding topics to the 161-topic knowledge base used by the offline AI. |
| `docs/ci-cd.md` | CI/CD pipeline documentation: GitHub Actions workflows, EAS build triggers, deployment flow. |
| `docs/FILE_MAP.md` | **This file** — complete purpose-of-every-file reference. |

---

## `public/` — Static Web Files

| Path | Purpose |
|------|---------|
| `public/privacy/` | Privacy policy static HTML served at `/privacy` on the web preview. |
| `public/terms/` | Terms of service static HTML served at `/terms`. |

---

## `scripts/` — Developer Utility Scripts

| File | Purpose |
|------|---------|
| `scripts/configure-ai.js` | Interactive CLI to write the Anthropic API key to `.env`. Run with `npm run ai:configure`. Use `--check` flag (`npm run ai:status`) to verify status. |
| `scripts/generate-assets.js` | Generates app icon, splash, and adaptive icon from source SVG/template. Run with `npm run assets`. |
| `scripts/generate-reminder-sounds.js` | Generates reminder chime audio files using `expo-av` synthesis. Run with `npm run sounds`. |
| `scripts/export-legal.mjs` | Exports legal content (privacy policy, terms) from `src/data/legal.js` to static HTML in `public/`. Run with `npm run legal:export`. |
| `scripts/fix-theme.js` | One-off migration script: updates old hardcoded colour constants across all files to use the ThemeProvider pattern. |
| `scripts/verify-deployment.js` | Pre-deployment checklist: checks env vars, server health, build output. Run with `npm run verify:deploy`. |
| `scripts/allow-dev-ports.bat` | Windows: opens firewall rules for ports 3001 and 8081 (dev ports). |
| `scripts/remove-dev-ports.bat` | Windows: removes the firewall rules opened by `allow-dev-ports.bat`. |

---

## `server/` — Express API Backend

### Entry Point

| File | Purpose |
|------|---------|
| `server/server.js` | Express application entry point. Creates the app, applies security middleware, mounts all route handlers under `/api`, starts HTTP server on `PORT` (default 3001). |

### `server/config/`

| File | Purpose |
|------|---------|
| `server/config/env.js` | Loads `.env` via `dotenv`, validates required variables, exports a typed config object used throughout the server. |
| `server/config/database.js` | Creates a PostgreSQL connection pool using `pg`. Exports a `query()` helper. Gracefully degrades if `DATABASE_URL` is not set (server still starts; DB-dependent routes return 503). |
| `server/config/email.js` | Creates a Nodemailer transporter for sending account emails (password reset, welcome). Falls back to logging emails if SMTP credentials are missing. |
| `server/config/apiCatalog.js` | Registry of all external APIs the server integrates with: names, base URLs, auth methods, and usage limits. Used by the catalog route. |

### `server/middleware/`

| File | Purpose |
|------|---------|
| `server/middleware/auth.js` | Verifies JWT Bearer tokens on protected routes. Attaches `req.user` with user ID and role. Returns `401` on missing/invalid/expired tokens. |
| `server/middleware/security.js` | Applies `helmet` security headers, CORS configuration (restricts origins), and `express-rate-limit` to prevent abuse. |
| `server/middleware/validate.js` | Thin wrapper around request body validation — returns `400` with field errors if required fields are missing or invalid. |
| `server/middleware/errorHandler.js` | Global Express error handler. Formats all unhandled errors into a consistent `{ error, reason }` JSON response. Never leaks stack traces in production. |

### `server/routes/`

| File | Endpoints | Purpose |
|------|-----------|---------|
| `server/routes/auth.js` | `POST /api/auth/register` `POST /api/auth/login` `POST /api/auth/logout` `POST /api/auth/refresh` `POST /api/auth/reset-password` | User authentication — register, login, JWT refresh, password reset. Issues JWT access tokens. |
| `server/routes/ai.js` | `POST /api/ai/chat` `GET /api/ai/status` | Proxies questions to Anthropic Claude. Applies scholar boundary, injects up to 3 RAG entries, enforces context limits, and labels source (`claude+rag`, `claude`). `/status` reports whether a key is configured. |
| `server/routes/bookmarks.js` | `GET/POST/DELETE /api/bookmarks` | Stores and retrieves user bookmarks (Quran ayahs, Hadith, Duas, etc.). Requires auth. |
| `server/routes/notes.js` | `GET/POST/PUT/DELETE /api/notes` | Personal notes tied to Islamic content. Requires auth. |
| `server/routes/modules.js` | `GET/POST /api/modules` `GET/PUT /api/modules/:id/progress` | Tracks which modules a user has visited, time spent, and feature-specific progress. Requires auth. |
| `server/routes/news.js` | `GET /api/news` | Fetches and caches Islamic news from the news service. No auth required. |
| `server/routes/catalog.js` | `GET /api/catalog` | Returns the full API catalog from `server/config/apiCatalog.js`. |
| `server/routes/deeds.js` | CRUD `/api/deeds` | Good deeds tracker — log and retrieve acts of worship. Requires auth. |
| `server/routes/favorites.js` | CRUD `/api/favorites` | Save favourite content items. Requires auth. |
| `server/routes/journal.js` | CRUD `/api/journal` | Reflection journal entries. Requires auth. |
| `server/routes/khatm.js` | CRUD `/api/khatm` | Quran completion (Khatm) plans — start date, target date, daily page count. Requires auth. |
| `server/routes/reminders.js` | CRUD `/api/reminders` | Server-side reminder sync for logged-in users. Local reminders on device are primary; this is the cloud sync layer. Requires auth. |
| `server/routes/settings.js` | `GET/PUT /api/settings` | User preferences sync (theme, language, notification prefs) for logged-in users. Requires auth. |
| `server/routes/tasbih.js` | CRUD `/api/tasbih` | Tasbih session history. Requires auth. |
| `server/routes/prayerToggles.js` | `GET/PUT /api/prayer-toggles` | Records which prayers a user has marked as completed per day. Requires auth. |

### `server/services/`

| File | Purpose |
|------|---------|
| `server/services/islamicNews.js` | Fetches Islamic news from multiple RSS feeds and news APIs. Parses, deduplicates, filters for Islamic relevance, and caches results for 30 minutes. |
| `server/services/newsTextMining.js` | Text mining helpers used by the news service: keyword extraction, sentiment scoring, Islamic topic relevance scoring. |

### `server/migrations/`

| File | Purpose |
|------|---------|
| `server/migrations/001_create_schema.sql` | Core PostgreSQL schema: `users`, `bookmarks`, `notes`, `module_progress` tables with indexes. |
| `server/migrations/002_personal_tracking.sql` | Adds personal tracking tables: `deeds`, `journal`, `khatm_plans`, `reminders`, `settings`, `tasbih_sessions`, `prayer_toggles`. |
| `server/migrations/run.js` | Migration runner: reads SQL files in numeric order and executes them against the configured database. |

---

## `src/` — React Native Mobile App

### `src/ai/` — AI Assistant Pipeline

| File | Purpose |
|------|---------|
| `src/ai/assistant.js` | Main AI pipeline: `getAIAnswer(question)`. Pipeline order: small-talk check → 161-topic knowledge retrieval → live Claude call (if key present) → offline answer → Quran search → "unavailable" fallback. Labels source on every response. |
| `src/ai/claudeClient.js` | HTTP client for `POST /api/ai/chat`. Sends only the current question + up to 3 RAG entries. Never sends chat history. Handles timeouts and network errors gracefully. |
| `src/ai/islamicKnowledge.js` | 161-topic offline Islamic knowledge base (~200 KB). Structured entries covering aqeedah, fiqh, seerah, Quran sciences, duas, Islamic ethics, and more. Used for RAG retrieval without a network connection. |

### `src/components/` — Shared UI Components

| File | Purpose |
|------|---------|
| `src/components/AppLockGate.jsx` | Wraps the entire app. If app lock (PIN/biometric) is enabled, shows the lock screen and waits for authentication before mounting children. |
| `src/components/ErrorBoundary.jsx` | React error boundary — catches JS errors anywhere in the tree and renders a user-friendly "something went wrong" fallback with a retry button. |
| `src/components/FormattedText.jsx` | Text component that handles mixed Arabic (RTL) and Latin (LTR) content, applying correct font and direction. |
| `src/components/HomeWeather.jsx` | Small weather widget on the Home screen — shows current temperature and condition. Uses device location via `useUserLocation`. |
| `src/components/MoonPhase.jsx` | Displays the current Hijri moon phase icon on the Home screen. Calculates phase from the Hijri date. |
| `src/components/OfflineBanner.jsx` | Persistent top banner shown when the device has no internet connection. Subscribes to `NetInfo`. |
| `src/components/PinModal.jsx` | Full-screen PIN entry modal used by AppLock. Supports 4–6 digit PINs, biometric fallback, and wrong-PIN shake animation. |
| `src/components/PrayerCountdownRing.jsx` | Circular countdown ring on the Home screen showing time remaining to the next prayer. Uses `Animated` for smooth ring fill. |
| `src/components/PrayerLockOverlay.jsx` | Optional overlay shown at prayer time to remind the user to pray. Rendered by `PrayerLockContext`. |
| `src/components/QuranReminderBanner.jsx` | Animated slide-in banner shown when a Quran recitation reminder fires (native notification while foregrounded, or web timer). Has Open, Snooze, and Dismiss actions. |
| `src/components/ShareSheet.jsx` | Reusable share bottom-sheet used across all modules. Provides WhatsApp, Instagram, Copy Link, and system share options. |
| `src/components/SkyBackdrop.jsx` | Animated sky gradient background used on the Prayer Times screen and Home screen. Changes colour based on time of day. |
| `src/components/TodaysRemindersPopup.jsx` | Modal popup listing all reminders due today. Shown on Home screen. |
| `src/components/TodaysRemindersStrip.jsx` | Horizontal scrollable strip of today's reminders shown on the Home screen. |
| `src/components/TopicBrowserModal.jsx` | Bottom-sheet modal for browsing the 161-topic knowledge base. Used in the AI chat screen. |
| `src/components/ZakatBreakdown.jsx` | Renders an itemised Zakat calculation breakdown with nisab thresholds and categories. Used in `ZakatScreen`. |

### `src/config/`

| File | Purpose |
|------|---------|
| `src/config/appConfig.js` | App-wide constants: API base URL, feature flags, default values, platform checks, version info. |
| `src/config/routes.js` | Complete route/module map — every screen's name, icon, component reference, tab visibility, drawer order, and access control. |
| `src/config/theme.config.js` | Defines all available themes (light, dark, forest, ocean, etc.) with their base settings. The `ThemeProvider` reads this to build colour palettes. |
| `src/config/themes/` | Individual theme files — each exports a colour palette object. |

### `src/context/` — React Context Providers

| File | Purpose |
|------|---------|
| `src/context/ThemeContext.jsx` | Provides current theme colours and `setTheme()` to the whole app. Persists theme choice to `AsyncStorage`. |
| `src/context/LanguageContext.jsx` | Provides current language (`en`/`ur`) and `setLanguage()`. Persists to `AsyncStorage`. Used by `i18n/translations.js`. |
| `src/context/AppLockContext.jsx` | Manages app lock state: PIN storage in `expo-secure-store`, biometric auth via `expo-local-authentication`, lock/unlock events. |
| `src/context/PrayerLockContext.jsx` | Manages the optional prayer-time reminder overlay: schedule, dismiss, and snooze logic. Integrates with `notifications.js`. |
| `src/context/ShareContext.jsx` | Provides a global `share(content)` function accessible to all screens. Wraps `expo-sharing` and system share sheet. |
| `src/context/RoleContext.jsx` | Provides the current user role (`guest`, `user`, `admin`). Used by admin-only screens. |

### `src/data/` — Static Islamic Content

| File | Purpose |
|------|---------|
| `src/data/communities.js` | Local Islamic community data: mosques, Islamic centres. Used by `CommunitiesScreen`. |
| `src/data/courses.js` | E-learning course catalogue with lessons, quizzes, and progress tracking structure. Used by `ELearningScreen`. |
| `src/data/curriculum.js` | Structured learning curriculum: topic order, prerequisites, and learning objectives. Used by `LearningPathScreen`. |
| `src/data/daily.js` | Daily Islamic content: rotating Ayah of the Day selections, Hadith of the Day, and Dua of the Day. |
| `src/data/duas.js` | Comprehensive Dua library: 100+ duas with Arabic text, transliteration, translation, and occasion. |
| `src/data/fiqh.js` | Islamic jurisprudence (Fiqh) reference data: rulings, categories, school differences. |
| `src/data/hajj.js` | Detailed Hajj and Umrah step-by-step guide data with rites, duas, and maps. Used by `HajjGuideScreen`. |
| `src/data/hijriMonths.js` | Hijri calendar data: month names (Arabic and English), significant events per month, day calculation helpers. |
| `src/data/isnad.js` | Hadith chain of narration (isnad) data used by `HadithVerificationScreen` for authenticity checking. |
| `src/data/istikhara.js` | Istikhara guide content: steps, dua text, explanation, and scholarly guidance. Used by `IstikharaScreen`. |
| `src/data/kalimas.js` | The six Kalimas with Arabic text, transliteration, and meaning. |
| `src/data/legal.js` | Privacy policy and terms of service content (source of truth). Exported to `public/` by `scripts/export-legal.mjs`. |
| `src/data/librarySamples.js` | Sample content for the offline library feature: preview ayahs, hadith, and duas shown before full download. |
| `src/data/names.js` | 99 Names of Allah (Asma-ul-Husna) with Arabic, transliteration, meaning, and benefits. Used by `NamesOfAllahScreen`. |
| `src/data/pillars.js` | Five Pillars of Islam content: detailed explanation, virtues, and scholarly references. Used by `PillarsScreen`. |
| `src/data/prayerMethods.js` | Prayer calculation method definitions (ISNA, MWL, Karachi, etc.) with Fajr/Isha angle parameters. |
| `src/data/prophets.js` | Stories of the Prophets content. Used by `ProphetsStoriesScreen`. |
| `src/data/quiz.js` | Islamic knowledge quiz questions bank: 200+ questions across categories with difficulty levels. Used by `IslamicQuizScreen`. |
| `src/data/quranReminder.js` | Quran recitation reminder templates: motivational messages used as notification body text. |
| `src/data/seerah.js` | Seerah (Life of the Prophet ﷺ) content: chronological events, battles, key dates. Used by `SeerahScreen`. |

### `src/firebase/`

| File | Purpose |
|------|---------|
| `src/firebase/config.js` | Firebase app initialisation. Reads config from `app.config.js` extra fields. Used for Firestore cloud sync (optional). |
| `src/firebase/syncedStorage.js` | Storage wrapper that writes to both `AsyncStorage` (local) and Firestore (cloud) when a user is signed in. Falls back to local-only when offline or not signed in. |

### `src/hooks/` — Custom React Hooks

| File | Purpose |
|------|---------|
| `src/hooks/useDeviceHeading.js` | Returns live compass heading in degrees using `expo-sensors`. Used by `QiblaFinderScreen`. Updates via subscription with throttling. |
| `src/hooks/useNavigationUrl.js` | Parses deep-link URLs and returns the target screen name + params. Used by `AppNavigator` for linking. |
| `src/hooks/usePreferences.js` | Reads user preferences from `src/services/preferences.js` and returns them synchronously from cache. |
| `src/hooks/useTheme.js` | Convenience hook combining `useColors()`, `useThemedStyles()`, and `useGlobalStyles()` into one import. |
| `src/hooks/useUserLocation.js` | Returns current GPS coordinates using `expo-location`. Requests permission on first use, caches result, falls back to last-known location. |

### `src/i18n/`

| File | Purpose |
|------|---------|
| `src/i18n/translations.js` | English and Urdu translation strings for all UI text. Exports a `t(key, lang)` function. Used by screens that respect the current language setting. |

### `src/navigation/`

| File | Purpose |
|------|---------|
| `src/navigation/AppNavigator.jsx` | Root navigation structure: `Stack.Navigator` (root) → Drawer navigator (`Main`) → Bottom Tab navigator (`MainTabs`). Defines the full navigation hierarchy, linking config, and deep-link patterns. |
| `src/navigation/screenRegistry.js` | Maps string screen names to their component imports. Loaded by `AppNavigator` to avoid circular imports. |

### `src/screens/` — Screen Components (47 Screens)

| File | Purpose |
|------|---------|
| `HomeScreen.jsx` | Main dashboard. Shows prayer countdown ring, today's reminders strip, Ayah of the Day, weather widget, moon phase, and module shortcuts. |
| `QuranScreen.jsx` | Full Quran reader. Surah list, verse navigation, Arabic text with transliteration and translation, audio playback via `expo-av`, offline mode via `offlineLibrary.js`, bookmarking, sharing. |
| `TafsirScreen.jsx` | Quran commentary. Shows tafsir (exegesis) for selected ayah from multiple scholars. Data via `tafsirApi.js`. |
| `PrayerTimesScreen.jsx` | Live prayer time calculation using device location and selected calculation method. Shows countdown to next prayer, sky backdrop that changes with time of day, weekly view. |
| `PrayerTrackerScreen.jsx` | Personal salah (prayer) tracker. Mark each of the 5 daily prayers as completed. Shows weekly/monthly completion statistics. |
| `QiblaFinderScreen.jsx` | Compass-based Qibla direction finder. Uses `useDeviceHeading` + `useUserLocation` to calculate direction to Mecca with an animated compass needle. |
| `DuasScreen.jsx` | Duas browser by category and occasion. Shows Arabic text, transliteration, and translation. Integrates `contextDuas.js` for situation-based suggestions. |
| `DuaLibraryScreen.jsx` | Full Dua library with search, filters, and favourites. |
| `HadithScreen.jsx` | Hadith browser — searches and displays hadith from Bukhari, Muslim, etc. via `hadithApi.js`. |
| `HadithVerificationScreen.jsx` | Checks hadith authenticity using `isnad.js` chain-of-narration data and AI assistance. |
| `ZakatScreen.jsx` | Zakat calculator. Accepts gold, silver, cash, and livestock values. Calculates nisab threshold and payable Zakat. Shows `ZakatBreakdown` component. |
| `HajjGuideScreen.jsx` | Step-by-step Hajj and Umrah guide with rites, duas, and interactive timeline. Data from `src/data/hajj.js`. |
| `IslamicCalendarScreen.jsx` | Hijri calendar view. Shows current Hijri month with significant dates highlighted. Data from `src/data/hijriMonths.js`. |
| `RemindersScreen.jsx` | Full-featured reminder manager. Create prayer reminders, Quran reminders, custom reminders. Integrates `expo-notifications` and `reminderSound.js`. Largest screen in the project (~52 KB). |
| `TasbihScreen.jsx` | Digital tasbih (dhikr counter). Select dhikr text, tap to count, vibration feedback via `expo-haptics`, session history. |
| `NamesOfAllahScreen.jsx` | 99 Names of Allah browser with Arabic calligraphy, transliteration, meaning, and audio pronunciation. |
| `HifzScreen.jsx` | Quran memorisation (Hifz) tracker. Mark surahs/juz as memorised. Track overall progress. |
| `ReviewSessionScreen.jsx` | Spaced-repetition review session for Hifz — shows verses to review based on the learning engine. |
| `KhatmPlannerScreen.jsx` | Plan a Quran Khatm (complete reading). Set target date, calculates daily pages needed. |
| `IslamicNewsScreen.jsx` | Islamic news feed. Fetches from `src/services/islamicNews.js` → `server/routes/news.js`. Shows articles with image, title, source. |
| `ELearningScreen.jsx` | E-learning platform. Course catalogue, lesson player, progress tracking, quizzes. Data from `src/data/courses.js`. |
| `CommunitiesScreen.jsx` | Local Islamic communities directory. Browse mosques and Islamic centres. Device-local data. |
| `AIChatScreen.jsx` | AI Islamic assistant chat. Calls `getAIAnswer()` from `assistant.js`. Shows source label, scholar boundary notice, and topic browser. |
| `AIQuranAssistantScreen.jsx` | AI + Quran search integration. Ask questions and get ayah references alongside AI answers. |
| `IslamicQuizScreen.jsx` | Multiple-choice Islamic knowledge quiz. Questions from `src/data/quiz.js`. Shows score and explanations. |
| `IstikharaScreen.jsx` | Istikhara (guidance prayer) guide. Steps, dua, and scholarly explanation from `src/data/istikhara.js`. |
| `GoodDeedsScreen.jsx` | Good deeds tracker. Log acts of worship and charity. Shows streak and history. |
| `RamadanModeScreen.jsx` | Ramadan-specific features: Suhoor/Iftar countdown, Tarawih tracker, Nightly Quran goal. |
| `PillarsScreen.jsx` | Interactive guide to the Five Pillars of Islam. Data from `src/data/pillars.js`. |
| `ProphetsStoriesScreen.jsx` | Stories of the Prophets. Data from `src/data/prophets.js`. |
| `SeerahScreen.jsx` | Seerah (Prophetic biography) timeline. Data from `src/data/seerah.js`. |
| `AyahOfDayScreen.jsx` | Full-screen Ayah of the Day with sharing options. |
| `GeneratorScreen.jsx` | Islamic content generator — produces du'a suggestions, reflection prompts, and content based on occasion/mood. |
| `SearchScreen.jsx` | Global search across all modules. Uses `globalSearch.js` to query Quran, Hadith, Duas, Names, and more. |
| `BookmarksScreen.jsx` | Shows all bookmarked ayahs, hadiths, duas, and other content. |
| `SettingsScreen.jsx` | Comprehensive settings: theme, language, prayer method, notifications, app lock, account, backup/restore, diagnostics. Largest file (~70 KB). |
| `LandingScreen.jsx` | Animated onboarding / landing screen for first-time users. Shows app features and Get Started button. |
| `LoginScreen.jsx` | User authentication screen (sign in / sign up). Calls `src/services/backend.js` auth endpoints. |
| `LearnWorshipScreen.jsx` | Learn how to perform acts of worship (wudu, salah, etc.) with step-by-step guides. |
| `LearningPathScreen.jsx` | Structured Islamic learning path. Uses `src/data/curriculum.js` and `learningEngine.js`. |
| `ReflectionJournalScreen.jsx` | Personal Islamic reflection journal. Write and review entries. |
| `AdminPanelScreen.jsx` | Admin-only panel: manage users, content moderation flags, feature toggles. |
| `ApiConsoleScreen.jsx` | Developer API testing console — shows all API calls the app makes and lets you re-run them. |
| `DiagnosticsScreen.jsx` | App diagnostics: storage usage, cached data size, server connectivity, notification status. Uses `diagnostics.js`. |
| `NotFoundScreen.jsx` | Fallback 404 screen shown when navigation hits an unknown route. |
| `LegalScreen.jsx` | Displays privacy policy and terms of service from `src/data/legal.js`. |
| `QuranJourneyScreen.jsx` | Tracks overall Quran reading journey: pages read per day, cumulative progress. |

### `src/services/` — Business Logic Layer

| File | Purpose |
|------|---------|
| `src/services/backend.js` | Central HTTP client for all calls to the Express backend (`/api/*`). Wraps `axios`, attaches JWT auth header, handles 401 token refresh, and maps error `reason` codes to user-facing messages. |
| `src/services/quranApi.js` | Fetches Quran text, translation, and audio from the Al-Quran Cloud API. Implements caching via `cache.js`. Handles offline via `offlineLibrary.js`. |
| `src/services/hadithApi.js` | Fetches Hadith data from the Hadith API. Caches results. |
| `src/services/tafsirApi.js` | Fetches Tafsir from multiple scholars. Caches results. |
| `src/services/islamicNews.js` | Client-side news service — calls `GET /api/news` on the backend and caches the response. |
| `src/services/notifications.js` | Full notification service: schedule prayer reminders, Quran reminders, custom reminders using `expo-notifications`. Handles foreground callbacks, web timer fallback, and snooze logic. |
| `src/services/reminderSound.js` | Manages reminder chime audio using `expo-av`. Primes audio on first user tap (required for web browsers). Loads and unloads sound files. |
| `src/services/cache.js` | Generic async cache using `AsyncStorage`. Supports TTL (time-to-live), namespacing, and invalidation. Used by API services. |
| `src/services/storage.js` | Low-level storage helper wrapping `AsyncStorage` with serialisation/deserialisation and error handling. |
| `src/services/preferences.js` | Reads and writes user preferences (theme, language, prayer method, etc.) to `AsyncStorage`. Provides synchronous in-memory cache. |
| `src/services/appLock.js` | App lock service: PIN storage in `expo-secure-store`, biometric authentication, lock state management, timeout logic. |
| `src/services/authToken.js` | JWT token storage and retrieval using `expo-secure-store`. Handles token refresh scheduling. |
| `src/services/offlineLibrary.js` | Manages the offline Quran download: download progress, file storage in `expo-file-system`, and serving cached content when offline. |
| `src/services/learningEngine.js` | Spaced repetition engine for Hifz review: calculates review intervals using SM-2 algorithm, tracks memorisation strength. |
| `src/services/globalSearch.js` | Searches across Quran text, Hadith, Duas, Names of Allah, and other content. Scores and ranks results by relevance. |
| `src/services/contextDuas.js` | Returns appropriate duas for a given context (waking up, eating, travelling, etc.). Used by `DuasScreen`. |
| `src/services/geocode.js` | Reverse geocodes GPS coordinates to city/country name. Used to show prayer location name. |
| `src/services/placeLookup.js` | Searches for a city by name and returns coordinates. Used in Settings for manual location entry. |
| `src/services/weather.js` | Fetches current weather for device location. Caches result. Used by `HomeWeather` component. |
| `src/services/diagnostics.js` | Collects diagnostic information: storage usage, cache sizes, server reachability, notification permissions. |
| `src/services/diagnosticsFormat.js` | Formats raw diagnostics data into a human-readable report. Used by `DiagnosticsScreen`. |
| `src/services/aiUsage.js` | Tracks and reports AI feature usage: question count, response latency, source label distribution. |
| `src/services/apiCatalog.js` | Client-side mirror of the API catalog — used by `ApiConsoleScreen` to list and test available endpoints. |
| `src/services/backup.js` | App data backup: exports all user data (bookmarks, notes, settings, etc.) to a JSON file via `expo-document-picker`. |
| `src/services/backupFormat.js` | Defines the backup file format schema and validators for import/export. |
| `src/services/decks.js` | Manages flashcard decks for Quran memorisation. CRUD operations on `AsyncStorage`. |
| `src/services/sync.js` | Syncs local data with the backend for logged-in users. Handles conflict resolution (last-write-wins). |
| `src/services/todaysReminders.js` | Calculates which reminders are due today. Used by `TodaysRemindersStrip` and `TodaysRemindersPopup`. |

### `src/theme/` — Theme System

| File | Purpose |
|------|---------|
| `src/theme/index.js` | Main theme export: `ThemeProvider` component, `useColors()`, `useThemedStyles()`, `useGlobalStyles()` hooks. |
| `src/theme/globalStyles.js` | Shared `StyleSheet` with commonly used styles (containers, typography, cards, buttons). Used via `useGlobalStyles()`. |
| `src/theme/fonts.js` | `FONT_ASSETS` map passed to `useFonts()` in `App.js`. Maps font family names to bundled font files in `assets/fonts/`. |

### `src/utils/`

| File | Purpose |
|------|---------|
| `src/utils/webAlerts.js` | Installs browser `confirm()`/`alert()` as fallbacks for `React Native`'s `Alert` API on web (where `Alert` is a no-op). Called once at app startup in `App.js`. |

---

## `src/firebase/`

| File | Purpose |
|------|---------|
| `src/firebase/config.js` | Firebase SDK initialisation. Only runs if Firebase config is present in `app.config.js`. |
| `src/firebase/syncedStorage.js` | Dual-write storage: writes to both `AsyncStorage` and Firestore. Reads from local first (offline-first). |

---

## Test Files (`__tests__/` folders)

Each major folder contains a `__tests__/` directory with Jest tests:

| Path | Tests |
|------|-------|
| `src/ai/__tests__/` | Tests for `assistant.js` pipeline and `claudeClient.js` |
| `src/components/__tests__/` | Render tests for all shared components |
| `src/context/__tests__/` | Context provider tests |
| `src/data/__tests__/` | Data integrity tests (completeness, field validation) |
| `src/i18n/__tests__/` | Translation key coverage tests |
| `src/navigation/__tests__/` | Navigator rendering and routing tests |
| `src/services/__tests__/` | Unit tests for all service modules |
| `src/theme/__tests__/` | Theme provider and colour palette tests |
| `server/__tests__/` | Integration tests for all API routes using `supertest` |

Run all tests: `npm test`

---

## Mobile-App Verification Checklist

This project is **100% mobile-first**. Here is a confirmation of every module's mobile readiness:

| Module | Mobile API | Offline | Sharing |
|--------|-----------|---------|---------|
| Quran | ✅ expo-av, expo-file-system | ✅ offlineLibrary.js | ✅ ShareSheet |
| Prayer Times | ✅ expo-location | ✅ Calculated locally | ✅ ShareSheet |
| Qibla | ✅ expo-sensors | ✅ Compass is local | ✅ ShareSheet |
| Duas | ✅ Local data | ✅ src/data/duas.js | ✅ ShareSheet |
| Hadith | ✅ hadithApi + cache | ✅ Cached offline | ✅ ShareSheet |
| Zakat | ✅ Local calculation | ✅ No network needed | ✅ ShareSheet |
| Hajj Guide | ✅ Local data | ✅ src/data/hajj.js | ✅ ShareSheet |
| Notifications | ✅ expo-notifications | ✅ Local triggers | N/A |
| App Lock | ✅ expo-local-auth, expo-secure-store | ✅ Fully local | N/A |
| AI Assistant | ✅ via backend proxy | ✅ Offline fallback | ✅ ShareSheet |
| E-Learning | ✅ Local data | ✅ src/data/courses.js | ✅ ShareSheet |
| Communities | ✅ Local data | ✅ Local only | ✅ ShareSheet |
| News | ✅ via backend | ⚠️ Cached (30 min) | ✅ ShareSheet |
| Tasbih | ✅ expo-haptics | ✅ Fully local | ✅ ShareSheet |
| Hifz/Review | ✅ Local engine | ✅ Fully local | ✅ ShareSheet |
| Reminders | ✅ expo-notifications | ✅ Local triggers | N/A |
| Calendar | ✅ Local calculation | ✅ Fully local | ✅ ShareSheet |

---

## Quick Reference — Where Things Live

| "Where is the code for..." | File(s) |
|---------------------------|---------|
| App startup / font loading | `App.js` |
| Navigation & screens list | `src/navigation/AppNavigator.jsx`, `src/navigation/screenRegistry.js` |
| AI pipeline | `src/ai/assistant.js` |
| AI backend route | `server/routes/ai.js` |
| Offline Islamic knowledge | `src/ai/islamicKnowledge.js` |
| Theme colours | `src/theme/index.js`, `src/config/theme.config.js` |
| Arabic/Urdu translations | `src/i18n/translations.js` |
| Prayer time calculation | `src/screens/PrayerTimesScreen.jsx` + `src/data/prayerMethods.js` |
| Quran offline download | `src/services/offlineLibrary.js` |
| Push notifications | `src/services/notifications.js` |
| App PIN lock | `src/services/appLock.js` + `src/context/AppLockContext.jsx` |
| User authentication | `server/routes/auth.js` + `src/services/backend.js` |
| Database schema | `server/migrations/` |
| Environment variables | `.env` / `.env.example` / `server/config/env.js` |
| Build configuration | `app.config.js` + `eas.json` |
