## What changed

<!-- Describe the user-visible change and why it matters. -->

## Product guardrails

Answer every line. See `docs/PRODUCT_PRINCIPLES.md` for details.

- [ ] No new top-level module — or this PR explains why an existing surface cannot hold it.
- [ ] Nothing is labelled "AI" unless a model generates the response.
- [ ] If users can publish content to others, moderation, reporting and blocking are included.
- [ ] AI answers keep the scholar boundary, citations and crisis guidance.
- [ ] No core worship (Quran, prayer times, Qibla, Duas, basic reminders, offline Quran) is behind a payment.

## Security

- [ ] No secret, API key or `.env` value is added to the app bundle or an `EXPO_PUBLIC_*` variable.
- [ ] Any new endpoint has authentication, validation and rate limiting where appropriate.
- [ ] Error responses keep the machine-readable `reason` contract.

## Verification

- [ ] `npm test`
- [ ] `npm run lint`
- [ ] Checked on Android/iOS (or state what was not checked)
- [ ] Checked the web preview where relevant
- [ ] Offline behaviour checked for features that depend on the network

## Screenshots / notes

<!-- Optional: screenshots, recordings or verification gaps. -->
