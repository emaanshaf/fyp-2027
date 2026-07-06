# Qitab-e-Noor

Islamic companion mobile app built with Expo / React Native.

## Features
- Quran (with audio playback)
- Hadith
- Duas (with text-to-speech)
- Prayer Times & Qibla compass
- Zakat & Ushr calculator (AI Q&A)
- Tasbih counter
- Reminders/notifications
- Bookmarks
- Islamic AI chat assistant

## Running the app

```
npm install
npx expo start
```

- Press `a` to open in Android emulator, or scan the QR code with Expo Go.
- Press `w` to run in a browser (via react-native-web).

## Islamic AI Assistant

The AI assistant (chat screen + Zakat AI tab) works out of the box using a
built-in offline knowledge base (`src/ai/islamicKnowledge.js`) — no setup
required.

To enable live, more detailed answers via the Claude API:

1. Copy `.env.example` to `.env`
2. Add your Anthropic API key: `EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...`
3. Restart `npx expo start`

If the key is missing, offline, or a request fails, the app automatically
falls back to the offline knowledge base — the assistant never breaks.
