# Product Principles & Guardrails

**Adopted:** 28 October 2026  
**Status:** Binding for all new features, screens, AI work and monetisation.  
**Applies to:** product design, frontend, backend, content, store releases and documentation.

These five rules exist because Qitab-e-Noor is a worship companion, not a generic content app. Trust, focus and honest labelling matter more than feature count. An exception is allowed only when it is written down in the pull request with a clear reason.

---

## Rule 1 — Do not add more top-level modules by default

**The rule:** New capabilities go inside an existing module, the Home screen, Search, Recents or Favourites. A new drawer item or tab must clear a high bar.

**Why:** The drawer is already dense (40+ screens). Every new top-level module makes the app harder to navigate and dilutes the modules that matter. Most "new feature" requests are better served by improving an existing surface.

**How to apply:**

- Put daily actions on the Home "Today" card, not in a new drawer section.
- Extend Search, Recents and Favourites before creating another browsing screen.
- Add a sub-screen inside the closest existing module (for example, a new Zakat tool belongs inside Zakat).
- A new top-level module is justified only when it serves a **distinct recurring job**, needs **three or more screens**, and cannot live inside an existing module.
- Do not create a second assistant, a second Quran reader, or a second prayer-time surface.

**Review question:** *Can this ship inside an existing module or on Home?*

**Current status:** Compliant. The module count is at the practical ceiling; improve discovery and personalisation instead of expanding the drawer.

---

## Rule 2 — Do not label templates, search or static content as "AI"

**The rule:** The word "AI" is reserved for features where a model actually generates the response. Templates, keyword retrieval, API search and curated content must be named and described accurately.

**Why:** Mislabeling erodes trust, especially in religious content. Users must know whether an answer is generated live, retrieved from a curated base, or simply a search result. Qitab-e-Noor's assistant already exposes this distinction through source labels; the rest of the app must follow the same standard.

**How to apply:**

- Use "AI" only for the live Claude path and clearly AI-generated output.
- Call retrieval-based features "knowledge base", "study", "search" or "guide".
- Keep the assistant's source labels: live, grounded live, bundled knowledge base, Quran translation search, no prepared answer.
- Never imply that a hard-coded sample or a templated string was generated for the user.
- When a module is renamed, keep old deep-link paths working if users may have saved them.

**Review question:** *Does a model generate this response? If not, why is it called AI?*

**Current status:** The former "AI Quran Assistant" has been renamed **Quran Study**. It remains a template + Quran-search feature and is described as such. The live assistant remains the only feature labelled AI.

---

## Rule 3 — Do not build a social network without moderation

**The rule:** Any feature that lets users publish content to other users must ship with moderation, reporting, blocking and a content policy. Local-only features are exempt because nothing is published.

**Why:** Unmoderated religious communities attract harassment, sectarian abuse, misinformation and legal risk. A local-first community can be a privacy advantage; a cloud community without moderation is a liability.

**How to apply:**

- Communities and course progress are **device-local today** and must stay so unless the checklist below is complete.
- Before adding sync or public posting, add:
  - report and block controls on every post and profile;
  - a moderation queue and moderator role;
  - rate limits and spam controls;
  - a written content policy and age suitability rules;
  - data retention and deletion rules;
  - escalation for threats, abuse and illegal content.
- Do not add likes, follower graphs, direct messages or public profiles as a shortcut to engagement.
- If moderation capacity does not exist, keep the feature local.

**Review question:** *Can a stranger publish content that another user will see? If yes, where is the moderation?*

**Current status:** Compliant. Communities and E-Learning progress are local-only by design; no public social graph exists.

---

## Rule 4 — The AI must not issue personal fatwas

**The rule:** The assistant explains principles, evidence and differing scholarly views. It does not give a definitive personal ruling on a specific dispute, and it always points to a qualified scholar for personal fiqh.

**Why:** A language model is not a mufti. It cannot know the full circumstances, and a confident wrong ruling can cause real harm. Trust is built by being clear about the boundary, not by pretending to cross it.

**How to apply:**

- Keep the server system prompt's fatwa, crisis, anti-harm and interfaith safeguards.
- Ground answers in Quran and authentic Hadith references where possible.
- Say when schools of law differ; do not declare one view binding.
- For medical, mental-health, legal or financial crises, give general Islamic reassurance and urge professional or emergency help.
- Never invent hadith numbers, gradings or citations.
- Keep the scholar-consultation note on personal fiqh answers and on the Zakat AI screen.
- Do not add a feature that claims to "decide" a religious dispute.

**Review question:** *Does this answer depend on facts the assistant cannot know, or would a scholar need to ask follow-up questions?*

**Current status:** Compliant. The live prompt, offline content and UI disclaimers all preserve the boundary; server tests assert the safeguards.

---

## Rule 5 — Core worship stays free

**The rule:** Quran, prayer times, Qibla, Duas, basic reminders and offline Quran access are free. Monetisation must not gate the acts of worship the app exists to support.

**Why:** Paywalling prayer or Quran access contradicts the product's purpose and damages trust. A worship app should earn money from optional depth, not from access to the basics.

**How to apply:**

- Free forever: Quran reading and offline downloads, prayer times, Qibla, Duas, basic reminders, Tasbih, and the offline knowledge base.
- Acceptable paid value: advanced AI usage above a free allowance, structured courses, certificates, advanced study tools, community moderation tools, or cosmetic themes.
- Never paywall: the Quran text, required prayers, Qibla, basic Duas, or the ability to read downloaded content offline.
- If AI has a cost, give a clear free allowance and show usage before charging.
- Do not use artificial scarcity or guilt-based prompts around worship.

**Review question:** *Would a user be unable to pray, read Quran or find the Qibla without paying?*

**Current status:** Compliant. There is no paywall or monetisation code in the app today.

---

## Pull-request checklist

Copy this into the PR description and answer every line:

- [ ] This does not add a new top-level module, or the PR explains why an existing surface cannot hold it.
- [ ] Nothing is labelled "AI" unless a model generates the response.
- [ ] If users can publish content to others, moderation, reporting and blocking are included.
- [ ] AI answers keep the scholar boundary, citations and crisis guidance.
- [ ] No core worship feature is placed behind a payment.
- [ ] No API key or secret is added to the app bundle or an `EXPO_PUBLIC_*` variable.
- [ ] `npm test` and `npm run lint` pass; mobile and web paths were checked.

## Exceptions

An exception requires:

1. a written rationale in the pull request;
2. an explicit note in this document under the relevant rule;
3. a follow-up task if the exception is temporary.

Silent exceptions are not allowed.

## Related documents

- [`AI_USAGE.md`](./AI_USAGE.md) — where AI is used and how it is secured.
- [`LIVE_AI_SETUP.md`](./LIVE_AI_SETUP.md) — enabling the live assistant.
- [`../AGENTS.md`](../AGENTS.md) — operating rules for coding agents.
