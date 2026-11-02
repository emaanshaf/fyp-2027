# AGENTS.md — Operating rules for Qitab-e-Noor

This file is binding for any coding agent or contributor working in this repository. Read it before changing code, content, AI behaviour, navigation or monetisation. The detailed product rules live in [`docs/PRODUCT_PRINCIPLES.md`](docs/PRODUCT_PRINCIPLES.md).

## What this project is

Qitab-e-Noor is an Expo SDK 57 / React Native 0.86 mobile app with an Express API. It combines Quran, Hadith, Duas, prayer times, Qibla, Zakat, Hajj, Islamic news, communities, E-Learning and an Islamic assistant.

- **Mobile-first.** Android and iOS are the real targets; the react-native-web preview is secondary.
- **Offline-first.** Downloaded Quran, the 161-topic knowledge base and local user data must keep working without a connection.
- **Local-first by default.** Communities and course progress are device-only until moderation and sync are explicitly designed.

## Hard rules

1. **Never run `start.bat`.** It force-kills every `node.exe` on the machine. Use `npm run server`, `npm start`, `npm run dev` or `npm run web`.
2. **Never put secrets in the app.** API keys stay in the server-side `.env`. Never use `EXPO_PUBLIC_*` for secrets, never print a key, and never commit `.env`.
3. **Follow the five product guardrails:**
   - No new top-level modules by default — improve Home, Search, Recents, Favourites or an existing module.
   - Do not label templates, search or static content as "AI".
   - Do not build a social network without moderation, reporting and blocking.
   - The AI must not issue personal fatwas; keep the scholar boundary, citations and crisis guidance.
   - Core worship (Quran, prayer times, Qibla, Duas, basic reminders, offline Quran) stays free.
4. **Keep feature/module names in English.** The brand "Qitab-e-Noor", the tagline "Your Spiritual Companion", "Explore Modules" and the AI assistant stay English even in Urdu mode. Urdu is available for optional interface and religious content.
5. **Every module offers sharing.** WhatsApp, Instagram, Copy Link and the system share sheet must be present wherever content can be shared.
6. **Preserve the offline path.** Any new feature must degrade clearly when the network, account or AI key is missing.
7. **Do not silently change server error contracts.** The API returns machine-readable `reason` values; the app maps those, not prose.

## AI rules

- The only live model integration is Anthropic Claude through `POST /api/ai/chat` (`server/routes/ai.js`).
- The app calls its own backend through `src/ai/claudeClient.js`; screens must not call Anthropic directly.
- The assistant pipeline is `getAIAnswer()` in `src/ai/assistant.js`: small talk → retrieval → optional live call → offline answer → Quran search → unavailable.
- Keep source labels honest: `claude+rag`, `claude`, `offline`, `offline+quran`, `unavailable`.
- The live key is optional. When absent, `/api/ai/status` reports `configured:false` and offline answers must still work.
- Never send chat history to the server; only the current question plus up to three retrieved entries.
- Do not add a feature that claims to "decide" a religious dispute.

See [`docs/AI_USAGE.md`](docs/AI_USAGE.md) for the full inventory and [`docs/LIVE_AI_SETUP.md`](docs/LIVE_AI_SETUP.md) for configuration.

## Layout

```text
src/            Expo app (ES modules)
  ai/           assistant, Claude client, 161-topic knowledge base
  components/   shared UI
  navigation/   screen registry and linking
  screens/      one screen per module
  services/     backend, cache, Quran, Hadith, storage, backup, notifications
server/         Express API (CommonJS)
  routes/       auth, bookmarks, notes, modules, news, ai
  middleware/   auth, validation, security, rate limits
  migrations/   PostgreSQL schema
docs/           setup, AI, principles, CI/CD
scripts/        asset, sound and AI configuration scripts
```

Notes:

- The app uses a custom `ThemeProvider`; use `useColors`, `useThemedStyles` and `useGlobalStyles` rather than module-level colour constants.
- The API base URL is configurable through `EXPO_PUBLIC_API_URL` (default `http://localhost:3001/api`).
- Restarting the dev API rotates `JWT_SECRET`; old tokens return 401 and users may need to sign in again.

## Commands

```bash
npm run server        # API on :3001
npm start             # Expo
npm run web           # web preview on :8081
npm test              # Jest (app + server projects)
npm run lint          # ESLint
npm run doctor        # expo-doctor
npm run verify        # lint + tests + doctor
npm run ai:configure  # write the Anthropic key to .env (hidden prompt)
npm run ai:status     # check key + server state
```

Do not use `start.bat`. Do not bypass hooks or commit secrets.

## Before finishing a change

- Run the relevant tests and `npm run lint`.
- Check the mobile path and, where relevant, the web preview.
- Confirm the five product guardrails still hold.
- Update documentation if behaviour, configuration or AI scope changed.
- Report verification gaps honestly instead of claiming a check that did not run.

## Documentation

- [`docs/PRODUCT_PRINCIPLES.md`](docs/PRODUCT_PRINCIPLES.md)
- [`docs/AI_USAGE.md`](docs/AI_USAGE.md)
- [`docs/LIVE_AI_SETUP.md`](docs/LIVE_AI_SETUP.md)
- [`docs/CUSTOM_AI_TRAINING_GUIDE.md`](docs/CUSTOM_AI_TRAINING_GUIDE.md)
- [`docs/ci-cd.md`](docs/ci-cd.md)
