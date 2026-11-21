// Privacy policy and terms of use, kept in the app so both can be read
// offline — a link to a website is useless in airplane mode, which is exactly
// when an offline-first app is being used.
//
// The same text should be published at APP_CONFIG.privacyUrl and
// APP_CONFIG.termsUrl for the store listings. When the policy changes, update
// it here and at those addresses together, and bump `updated`.
//
// IMPORTANT: this is a factual draft written from what the code actually does.
// It is not legal advice. Have it reviewed before publishing, and replace the
// governing-law sentence in the terms with the operator's actual jurisdiction.

export const LEGAL_DOCUMENTS = {
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    updated: '29 October 2026',
    summary:
      'Qitab-e-Noor keeps your worship record on your device. An account is optional and only stores what syncs — bookmarks, notes and similar saved items. There are no ads, no analytics trackers, and nothing is sold.',
    sections: [
      {
        title: 'The short version',
        paragraphs: [
          'Most of what you do in this app — reading, prayer tracking, dhikr counts, journal entries, downloaded Quran — stays on your phone or tablet.',
          'If you create an account, the items you choose to sync are stored on our server so they survive a new device. You can delete the account and everything attached to it from Settings at any time.',
        ],
      },
      {
        title: 'What stays on your device',
        paragraphs: [
          'These stay on your phone or tablet and are not uploaded anywhere:',
        ],
        bullets: [
          'Your name, prayer log, tasbih counts, good-deed record, journal reflections, bookmarks cache and reminder settings.',
          'Community posts and comments, and E-Learning course progress. These are local-only by design.',
          'Downloaded Quran translations, reciter audio and cached hadith or news, so the app works without a connection.',
          'AI usage counts \u2014 how many answers came from live AI or the offline knowledge base. Only totals are kept; no question or answer text is stored with them.',
          'Your app-lock PIN, stored in the operating system\u2019s secure storage, never on our server.',
          'Uninstalling the app removes this local data. Export a backup from Settings first if you want to keep it.',
        ],
      },
      {
        title: 'What an account stores on our server',
        paragraphs: [
          'If you sign in, the server stores your email address, your name, and a password hash produced by bcrypt. It never stores your password itself. The session token is kept in the device\u2019s secure storage, not in ordinary app storage.',
          'The server also stores the items you sync: bookmarks, notes, favourite duas, reminders, tasbih history, prayer toggles, good deeds, journal reflections, Khatm plans, and preferences such as theme, language, calculation method and a saved location if you set one.',
        ],
      },
      {
        title: 'Duas for where you are',
        paragraphs: [
          'The Duas screen can suggest a dua that fits your moment. The time of day, the day of the week and the chips you tap (mosque, home, market, travelling, rain, unwell, study, worried) are handled entirely on the device.',
          'If you tap \u201cUse my location\u201d, the app asks for location permission and reads a single position. The coordinates are passed to the location service built into your phone \u2014 Apple Maps on iOS, Google Play services on Android \u2014 to obtain a short place label such as \u201cCentral Masjid\u201d or \u201cSouq Road\u201d. The label is used on the device to choose a dua.',
          'Your coordinates are not sent to the Qitab-e-Noor server, are not saved to your account, and are not kept after the lookup. Apple or Google sees the request as part of your phone\u2019s normal location service. The button is optional: the chips offer the same suggestions without using location at all, and the web preview cannot name places, so it relies on the chips.',
        ],
      },
      {
        title: 'The AI assistant',
        paragraphs: [
          'When you ask the Islamic assistant a question, the app sends that question and up to three short entries from the app\u2019s built-in knowledge base to our server. If a live model is configured, the server forwards that material to Anthropic, the provider of the Claude model, to produce an answer.',
          'Your chat history is not sent to the server, and we do not store conversation transcripts. Anthropic processes the request under its own terms and privacy policy. Please do not type personal, medical or financial details into the assistant; it is a study companion, not a confidential service.',
          'If no model is configured or the connection fails, the answer is produced entirely on your device from the offline knowledge base, and nothing leaves the phone.',
        ],
      },
      {
        title: 'Permissions the app may request',
        paragraphs: [
          'The app asks only for the permissions these features need:',
        ],
        bullets: [
          'Notifications, for prayer times, Quran reminders and daily dhikr. These are scheduled by the device. While the app is open, today\u2019s reminders also appear on the main screens every five minutes; that card only reads the reminders saved on your device.',
          'Approximate or precise location, for prayer times, the Qibla direction and the optional \u201cdua for where you are\u201d lookup described above. Coordinates are used on the device and are only saved to your account if you choose to save a location.',
          'Motion and compass sensors, for the Qibla finder.',
          'It does not request access to your contacts, photos, microphone, camera or files.',
        ],
      },
      {
        title: 'Third-party content services',
        paragraphs: [
          'Quran translations and recitations are fetched from the Quran.com API, hadith texts from a public content CDN, and Islamic news headlines from the publishers\u2019 RSS feeds \u2014 including Al Jazeera, and occasionally through Google News when a publisher blocks our server. Those services receive the ordinary technical details of any web request, such as your IP address, but not your account details.',
          'The weather shown on the Home dashboard comes from Open-Meteo. The app sends only the city name already saved for prayer times \u2014 never your coordinates \u2014 and keeps the latest reading on the device for thirty minutes, so it can still be shown without a connection.',
        ],
      },
      {
        title: 'Sharing content',
        paragraphs: [
          'When you share a verse, dua or page through WhatsApp, Instagram, Copy Link or the system share sheet, the text and link are handed to the app you picked. We do not record what you share or with whom.',
        ],
      },
      {
        title: 'Security',
        paragraphs: [
          'Traffic between the app and the server uses HTTPS in production. Passwords are hashed, and tokens are stored in the operating system\u2019s keystore or keychain. You can also set a PIN to lock the app.',
          'No system is perfectly secure. The strongest protection for your account is a password you do not reuse elsewhere.',
        ],
      },
      {
        title: 'Keeping and deleting your data',
        paragraphs: [
          'Synced data is kept for as long as your account exists. Deleting the account from Settings asks for your password, then removes the account and every row attached to it immediately, including the synced items listed above. Personal data stored on that device is cleared at the same time.',
          'Some backups you exported yourself, and data you shared with other people, are outside our control and are not removed by deleting the account.',
        ],
      },
      {
        title: 'Children',
        paragraphs: [
          'The app is not directed at children under 13, and an account requires an email address. Core reading and prayer features work without an account.',
        ],
      },
      {
        title: 'Changes and contact',
        paragraphs: [
          'If this policy changes in a way that affects what is collected, the in-app version and the published version are updated together, and the date at the top changes.',
          'Questions about privacy can be sent to support@qitabe-noor.app.',
        ],
      },
    ],
  },

  terms: {
    id: 'terms',
    title: 'Terms of Use',
    updated: '28 October 2026',
    summary:
      'Use the app for learning and worship. It is a study companion, not a mufti, and it is not a substitute for a qualified scholar. Do not misuse the service or the AI assistant.',
    sections: [
      {
        title: 'Accepting these terms',
        paragraphs: [
          'By installing or using Qitab-e-Noor you agree to these terms. If you do not agree, please do not use the app.',
        ],
      },
      {
        title: 'What the app is — and is not',
        paragraphs: [
          'Qitab-e-Noor is a study and worship companion: Quran text and translations, hadith, duas, prayer times, Qibla, zakat calculation, learning material and a knowledge assistant.',
          'It is not a religious authority. Answers, summaries and search results are aids to study. For a ruling on your specific situation, consult a qualified scholar who knows the details. Where schools of law differ, the app may summarise the difference rather than decide it.',
        ],
      },
      {
        title: 'Your account',
        paragraphs: [
          'You may use the app without an account; offline reading and the core worship features remain available. If you create one, give accurate details, keep your password private, and accept that you are responsible for activity under your account.',
          'You can delete your account at any time in Settings. Deletion is permanent: synced bookmarks, notes and related records are removed with it.',
        ],
      },
      {
        title: 'Acceptable use',
        paragraphs: [
          'Do not use the app in any of these ways:',
        ],
        bullets: [
          'For anything unlawful, or to harass, threaten or defame anyone.',
          'To break, overload or bypass the service, its rate limits or its authentication.',
          'To scrape, resell or redistribute the app\u2019s content or API at scale.',
          'To post content in communities that is abusive, sectarian, sexually explicit, or that encourages violence or self-harm.',
          'We may suspend access that puts the service or other users at risk.',
        ],
      },
      {
        title: 'Content and ownership',
        paragraphs: [
          'Quran translations, recitations, hadith texts and news headlines come from third parties and remain subject to their own licences and terms. The app\u2019s own code, design, learning material and knowledge base belong to the project and may not be copied for commercial use without permission.',
          'Your personal content — notes, journal entries, reflections — remains yours. By syncing it you allow us to store it so it can be shown back to you on your devices.',
        ],
      },
      {
        title: 'The AI assistant',
        paragraphs: [
          'The assistant can be wrong, can miss context, and can cite a verse imprecisely. Verify references before relying on them, and do not treat its output as a fatwa, a legal opinion, or medical, mental-health or financial advice.',
          'If a question is outside Islamic knowledge or app guidance, the assistant may answer briefly or redirect you. For a crisis, contact emergency services or a qualified professional; the assistant is not a substitute for urgent help.',
        ],
      },
      {
        title: 'Free core features',
        paragraphs: [
          'Quran reading, prayer times, the Qibla finder, duas, reminders and the offline Quran are free. No feature of the app requires a payment today.',
        ],
      },
      {
        title: 'Availability and changes',
        paragraphs: [
          'Offline features keep working without a connection. Online features — live assistant answers, news, sync and account services — depend on third parties and may be unavailable or change without notice.',
          'Features may be added, changed or removed as the app develops. Material changes to these terms are reflected here with a new date.',
        ],
      },
      {
        title: 'Disclaimer and liability',
        paragraphs: [
          'The app is provided as it is. To the extent permitted by law, the operator is not liable for indirect or consequential loss arising from use of the app, including reliance on religious content, translations, calculations or assistant answers.',
          'Nothing in these terms limits liability that cannot lawfully be limited.',
        ],
      },
      {
        title: 'Ending your use',
        paragraphs: [
          'You may stop using the app at any time and delete your account. We may end access if these terms are seriously or repeatedly broken.',
        ],
      },
      {
        title: 'Governing law',
        paragraphs: [
          'These terms are governed by the laws of the country in which the operator of Qitab-e-Noor is established, without regard to conflict-of-law rules.',
        ],
      },
      {
        title: 'Contact',
        paragraphs: [
          'Questions about these terms can be sent to support@qitabe-noor.app.',
        ],
      },
    ],
  },
};

export const LEGAL_IDS = Object.keys(LEGAL_DOCUMENTS);

/** Route param or URL value → a document that exists, defaulting to privacy. */
export function legalDocument(id) {
  return LEGAL_DOCUMENTS[id] || LEGAL_DOCUMENTS.privacy;
}
