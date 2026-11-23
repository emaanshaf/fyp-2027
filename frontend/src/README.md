# frontend/src/ — Frontend (Mobile App)

This is the **React Native / Expo mobile app** source code for Qitab-e-Noor.
Built with Expo SDK 57 and React Native 0.86, targeting Android and iOS.

---

## Folder Overview

| Folder | Role |
|--------|------|
| `ai/` | Islamic AI assistant pipeline, Claude client, 161-topic knowledge base |
| `components/` | Shared, reusable UI components used across multiple screens |
| `config/` | App-wide configuration, route definitions, theme config, theme variants |
| `context/` | React Context providers: Theme, Language, AppLock, PrayerLock, Share, Role |
| `data/` | Static Islamic content data: Duas, Quran reminders, Hajj, Names of Allah, etc. |
| `firebase/` | Firebase app configuration and synced storage wrapper |
| `hooks/` | Custom React hooks: device heading, navigation URL, preferences, theme, location |
| `i18n/` | Internationalization: English/Urdu translation strings |
| `navigation/` | React Navigation setup: screen registry and root navigator |
| `screens/` | One screen component per module (47 screens total) |
| `services/` | Business logic layer: API calls, caching, notifications, Quran, Hadith, etc. |
| `theme/` | ThemeProvider, global styles, and font asset map |
| `utils/` | Small utility helpers (e.g., web-compat Alert fallback) |

---

## Key Files

| File | Purpose |
|------|---------|
| `../App.js` | Root component — wires all providers, loads fonts, starts notifications |
| `navigation/AppNavigator.jsx` | Root stack + drawer + bottom-tab navigator |
| `navigation/screenRegistry.js` | Maps screen name strings to screen components |
| `theme/index.js` | Exports `ThemeProvider`, `useColors`, `useThemedStyles`, `useGlobalStyles` |
| `theme/globalStyles.js` | Shared StyleSheet used across all screens |
| `theme/fonts.js` | Font asset map passed to `useFonts()` |
| `config/appConfig.js` | Feature flags, API base URL, app-level constants |
| `config/routes.js` | Full route/module map (name, icon, screen component) |
| `config/theme.config.js` | Theme registry (light, dark, etc.) |

---

## Screens (47 total)

Each file in `screens/` is a self-contained module screen:

| Screen | Module |
|--------|--------|
| `HomeScreen.jsx` | Main dashboard |
| `QuranScreen.jsx` | Quran reader with offline support |
| `TafsirScreen.jsx` | Quran commentary/tafsir |
| `PrayerTimesScreen.jsx` | Live prayer time calculation |
| `PrayerTrackerScreen.jsx` | Personal salah tracker |
| `QiblaFinderScreen.jsx` | Compass-based Qibla direction |
| `DuasScreen.jsx` + `DuaLibraryScreen.jsx` | Duas collection and library |
| `HadithScreen.jsx` + `HadithVerificationScreen.jsx` | Hadith browser + authenticity tool |
| `ZakatScreen.jsx` | Zakat calculator |
| `HajjGuideScreen.jsx` | Hajj step-by-step guide |
| `IslamicCalendarScreen.jsx` | Hijri calendar |
| `RemindersScreen.jsx` | Prayer and custom reminders |
| `TasbihScreen.jsx` | Digital tasbih counter |
| `NamesOfAllahScreen.jsx` | 99 Names of Allah |
| `HifzScreen.jsx` + `ReviewSessionScreen.jsx` | Quran memorization tracker |
| `KhatmPlannerScreen.jsx` | Quran completion planner |
| `IslamicNewsScreen.jsx` | Islamic news feed |
| `ELearningScreen.jsx` | Islamic e-learning courses |
| `CommunitiesScreen.jsx` | Local Islamic communities |
| `AIChatScreen.jsx` | AI Islamic assistant chat |
| `AIQuranAssistantScreen.jsx` | AI + Quran search integration |
| `IslamicQuizScreen.jsx` | Islamic knowledge quiz |
| `IstikharaScreen.jsx` | Istikhara guide |
| `GoodDeedsScreen.jsx` | Good deeds tracker |
| `RamadanModeScreen.jsx` | Ramadan-specific features |
| `PillarsScreen.jsx` | Five Pillars of Islam |
| `ProphetsStoriesScreen.jsx` + `SeerahScreen.jsx` | The 25 prophets named in the Quran with references, full stories read from the Quran in five languages, and the Seerah timeline |
| `AyahOfDayScreen.jsx` | Daily Ayah feature |
| `GeneratorScreen.jsx` | Islamic content generator |
| `SearchScreen.jsx` | Global search across all modules |
| `BookmarksScreen.jsx` | Saved bookmarks |
| `SettingsScreen.jsx` | Full app settings |
| `LandingScreen.jsx` | Onboarding/landing screen |
| `LoginScreen.jsx` | Authentication screen |
| `LearnWorshipScreen.jsx` + `LearningPathScreen.jsx` | Structured learning |
| `ReflectionJournalScreen.jsx` | Personal journal |
| `AdminPanelScreen.jsx` | Developer/admin controls |
| `ApiConsoleScreen.jsx` | API testing console |
| `DiagnosticsScreen.jsx` | App diagnostics |
| `NotFoundScreen.jsx` | 404 fallback screen |
| `LegalScreen.jsx` | Privacy policy / Terms |
| `QuranJourneyScreen.jsx` | Quran reading journey tracker |

---

## Important Rules

- Use `useColors()`, `useThemedStyles()`, `useGlobalStyles()` — never hardcode colour constants.
- Screens must call `frontend/src/ai/claudeClient.js` through the backend — never call Anthropic directly.
- Every new feature must degrade gracefully when offline.
- Core worship features (Quran, prayer times, Qibla, Duas) must remain free.
