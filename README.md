# Qitab-e-Noor

**Your Spiritual Companion** — a mobile-first Islamic companion app built with Expo SDK 57 / React Native, backed by a small Express API.

It combines Quran reading (with offline download), Hadith, Duas, prayer times, Qibla, Zakat, Hajj, Islamic news, communities, E-Learning, and an Islamic knowledge assistant. Android and iOS are the real targets; the react-native-web preview is secondary.

## Principles

The product rules are binding and live in [`docs/PRODUCT_PRINCIPLES.md`](docs/PRODUCT_PRINCIPLES.md):

1. No new top-level modules by default — improve what exists.
2. Do not label templates, search or static content as "AI".
3. No social network without moderation, reporting and blocking.
4. The AI must not issue personal fatwas.
5. Core worship stays free: Quran, prayer times, Qibla, Duas, reminders, offline Quran.

Offline-first is a product requirement, not a bonus: downloaded Quran, the 161-topic knowledge base and local user data must keep working without a connection.

Two behaviours are worth knowing when testing:

- **Duas for where you are.** The Duas screen suggests a dua from the clock, an optional one-shot GPS fix whose label comes from the phone's own geocoder (Apple/Google — never our server), and manual chips for things GPS cannot know (rain, feeling unwell, study). See `src/services/contextDuas.js` and `src/services/placeLookup.js`.
- **Today's reminders, in-app.** While the app is open, a card in the bottom-right corner of the main tabs appears when a reminder is due and stays there until you mark it done, snooze it for five minutes or close it. It plays the chime chosen in Reminders once per appearance, re-checks today's Quran and custom reminders every five minutes, and leaves the dashboard behind it fully usable. It is not an OS notification and cannot fire while the app is closed. The Home dashboard also carries a reminder card that always shows what is due, what is next, or how to add the first reminder. See `src/components/TodaysRemindersPopup.jsx` and `src/components/TodaysRemindersStrip.jsx`.
- **Live weather on Home.** The hero shows the current conditions and the day's high/low for the city saved for prayer times, with a moon or sun icon for day and night. It uses the keyless Open-Meteo API, caches a reading for thirty minutes, falls back to the last one offline, and never sends coordinates. See `src/services/weather.js` and `src/components/HomeWeather.jsx`.
- **Sky-aware hero.** The Home banner draws the sun or the moon for the current hour behind your name and the Hijri date, tinting the gradient from dawn through daylight, golden hour, dusk and night. Windows come from cached prayer times when available and the clock otherwise; the moon's phase comes from the Hijri day. See `src/utils/sky.js`.
- **Live prayer countdown.** The next-prayer card carries a ring that fills from the previous prayer and ticks down to the second, then refreshes the card the moment the prayer arrives. See `src/components/PrayerCountdownRing.jsx`.

## Requirements

- Node.js 18+
- PostgreSQL (local, Supabase or Neon) for accounts, bookmarks, notes and AI history
- Expo Go or a development build for testing on a phone

## Quick start

```bash
cp .env.example .env        # then fill in the values you need
npm install
npm run server:migrate      # create the schema
npm run server              # API on http://localhost:3001
npm start                   # Expo dev server (separate terminal)
```

For the web preview use `npm run web` (port 8081), or `npm run dev` to start the API and Expo together.

The API defaults to `http://localhost:3001/api`. On a physical phone the app resolves the dev machine's LAN address automatically; set `EXPO_PUBLIC_API_URL` to override.

**Never run `start.bat`** — it force-kills every `node.exe` on the machine. Use the npm scripts above.

## Environment

All secrets stay in the server-side `.env`. Nothing sensitive belongs in `EXPO_PUBLIC_*`, because those values are compiled into the shipped bundle.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` / `DB_*` | PostgreSQL connection |
| `JWT_SECRET` | Session signing; enforced in production |
| `CORS_ORIGIN` | Allowed origins; enforced in production |
| `ANTHROPIC_API_KEY` | Optional live assistant key (`npm run ai:configure`) |
| `EXPO_PUBLIC_API_URL` | Backend base URL |
| `EXPO_PUBLIC_PRIVACY_URL` | Privacy policy link shown in Settings |
| `EXPO_PUBLIC_TERMS_URL` | Terms of use link shown in Settings |

See [`.env.example`](.env.example) for the full list and comments.

## Legal pages

The privacy policy and terms live in [`src/data/legal.js`](src/data/legal.js) and are rendered inside the app at Settings → Legal & Privacy, so they can be read offline.

`npm run legal:export` generates self-contained HTML from the same source into `public/privacy/index.html` and `public/terms/index.html`. Deploy `public/` (or copy those two folders) to the address configured in `EXPO_PUBLIC_PRIVACY_URL` / `EXPO_PUBLIC_TERMS_URL` — the defaults are `https://qitabe-noor.app/privacy` and `/terms`. Both store listings should point at those published addresses.

Edit the data, run the export, and commit both together; a test fails if the generated pages no longer match the app's copy. Set `LEGAL_BASE_URL` when the site lives somewhere other than `qitabe-noor.app`.

## Scripts

```bash
npm run server        # API on :3001
npm start             # Expo
npm run web           # web preview on :8081
npm run dev           # API + Expo together
npm run server:migrate
npm test              # Jest (app + server projects)
npm run lint
npm run doctor        # expo-doctor
npm run verify        # lint + tests + doctor
npm run ai:configure  # write the Anthropic key to .env
npm run ai:status     # check key + server state
npm run legal:export  # regenerate the hosted privacy and terms pages
```

Restarting the dev API rotates `JWT_SECRET`; old tokens then return 401 and users may need to sign in again.

## AI

There is exactly one live model integration: Anthropic Claude through `POST /api/ai/chat` in [`server/routes/ai.js`](server/routes/ai.js). The app never calls Anthropic directly — it goes through [`src/ai/claudeClient.js`](src/ai/claudeClient.js).

The pipeline in [`src/ai/assistant.js`](src/ai/assistant.js) is: small talk → offline retrieval → optional live call → offline answer → Quran search → unavailable. Source labels stay honest: `claude+rag`, `claude`, `offline`, `offline+quran`, `unavailable`.

The key is optional. Without it, `/api/ai/status` reports `configured: false` and the 161-topic offline knowledge base answers instead.

Settings → Islamic AI Assistant shows a local usage summary: how many questions were answered by live AI, the offline knowledge base or a Quran search, plus the last seven days. Only counts are stored on the device — never question text — and they can be reset at any time.

- [`docs/AI_USAGE.md`](docs/AI_USAGE.md) — complete inventory of where AI is and is not used
- [`docs/LIVE_AI_SETUP.md`](docs/LIVE_AI_SETUP.md) — configuration
- [`docs/CUSTOM_AI_TRAINING_GUIDE.md`](docs/CUSTOM_AI_TRAINING_GUIDE.md) — extending the knowledge base

## News and text mining

The Islamic News screen merges six publishers behind `GET /api/news`: Al Jazeera, Middle East Eye, Middle East Monitor, The Guardian's Islam feed, About Islam and Religion News Service. Al Jazeera is the lead publisher — its three newest stories open the feed, and the rest stay newest-first. Al Jazeera's own RSS is tried first; when the publisher blocks the server network, its headlines arrive through a site-scoped Google News feed and the source is marked `via: "fallback"`.

Headlines are analysed on the server with deterministic text mining in [`server/services/newsTextMining.js`](server/services/newsTextMining.js): stop-word removal, a curated topic lexicon (Gaza, Palestine, Ramadan, Hajj, Quran, mosques, conflict, economy and others), per-story keywords and feed-wide trends. The News screen shows the trends as chips that filter the feed, and every card carries a few mined keywords. This is lexical analysis, not AI summarisation — no model is involved, and the screen says so.

## Layout

```text
src/
  ai/           assistant, Claude client, 161-topic knowledge base
  components/   shared UI
  navigation/   screen registry and linking
  screens/      one screen per module
  services/     backend, cache, Quran, Hadith, storage, backup, notifications
  utils/        share, citation links, formatting
server/
  routes/       auth, bookmarks, notes, modules, news, ai
  middleware/   auth, validation, security, rate limits
  migrations/   PostgreSQL schema
docs/           product, AI, CI/CD documentation
scripts/        asset, sound and AI configuration scripts
```

## Documentation

- [`AGENTS.md`](AGENTS.md) — operating rules for contributors and coding agents
- [`docs/PRODUCT_PRINCIPLES.md`](docs/PRODUCT_PRINCIPLES.md)
- [`docs/AI_USAGE.md`](docs/AI_USAGE.md)
- [`docs/LIVE_AI_SETUP.md`](docs/LIVE_AI_SETUP.md)
- [`docs/CUSTOM_AI_TRAINING_GUIDE.md`](docs/CUSTOM_AI_TRAINING_GUIDE.md)
- [`docs/ci-cd.md`](docs/ci-cd.md)

## Before finishing a change

Run `npm run lint` and the relevant tests. Check the mobile path, and the web preview where relevant. Confirm the five guardrails still hold. Report verification gaps honestly instead of claiming a check that did not run.
