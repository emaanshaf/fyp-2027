# backend/ — Backend (Express API)

This is the **Node.js / Express API server** for Qitab-e-Noor.
Runs on port **3001** by default. Start it with `npm run server` from the project root.

---

## Folder Overview

| Folder | Role |
|--------|------|
| `config/` | Environment loading, database connection, email, API catalog |
| `middleware/` | JWT auth, input validation, security headers, error handler |
| `migrations/` | PostgreSQL schema migrations (SQL files + migration runner) |
| `routes/` | Express route handlers — one file per resource |
| `services/` | Server-side business logic (news fetching, text mining) |
| `__tests__/` | Jest integration tests for API endpoints |

---

## Key Files

| File | Purpose |
|------|---------|
| `server.js` | Entry point — creates Express app, mounts all middleware and routes |
| `config/env.js` | Loads and validates `.env` variables |
| `config/database.js` | PostgreSQL pool setup (falls back gracefully if DB not configured) |
| `config/email.js` | Nodemailer transporter for account emails |
| `config/apiCatalog.js` | Registry of all external APIs the server uses |
| `middleware/auth.js` | JWT token verification middleware |
| `middleware/security.js` | Helmet, CORS, rate limiting |
| `middleware/validate.js` | Request body validation helper |
| `middleware/errorHandler.js` | Centralised error response formatter |

---

## Routes

| Route file | Endpoints |
|------------|-----------|
| `routes/auth.js` | `POST /api/auth/register`, `/login`, `/logout`, `/refresh`, `/reset-password` |
| `routes/ai.js` | `POST /api/ai/chat` (Claude), `GET /api/ai/status` |
| `routes/bookmarks.js` | CRUD `/api/bookmarks` |
| `routes/notes.js` | CRUD `/api/notes` |
| `routes/modules.js` | `/api/modules` — module analytics and progress |
| `routes/news.js` | `GET /api/news` — proxies Islamic news |
| `routes/catalog.js` | `GET /api/catalog` — API catalog endpoint |
| `routes/deeds.js` | CRUD `/api/deeds` — good deeds tracker |
| `routes/favorites.js` | CRUD `/api/favorites` |
| `routes/journal.js` | CRUD `/api/journal` — reflection journal |
| `routes/khatm.js` | CRUD `/api/khatm` — Quran completion plans |
| `routes/reminders.js` | CRUD `/api/reminders` |
| `routes/settings.js` | `GET/PUT /api/settings` — user settings sync |
| `routes/tasbih.js` | CRUD `/api/tasbih` — tasbih counter data |
| `routes/prayerToggles.js` | `GET/PUT /api/prayer-toggles` — prayer completion flags |

---

## Migrations

Run with: `npm run server:migrate`

| File | Description |
|------|-------------|
| `migrations/001_create_schema.sql` | Core schema: users, bookmarks, notes, modules |
| `migrations/002_personal_tracking.sql` | Personal tracking: deeds, journal, khatm, reminders |
| `migrations/run.js` | Migration runner script |

---

## AI Pipeline Rule

- The only AI integration is Anthropic Claude via `POST /api/ai/chat`
- Route file: `routes/ai.js`
- Never add direct Anthropic calls in the mobile app
- When `ANTHROPIC_API_KEY` is absent, the route returns `configured: false` and offline mode takes over

---

## Environment Variables

See `backend/.env.example` for all supported variables. The key ones:

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default 3001) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Rotated on each restart — users need to re-login after restart |
| `ANTHROPIC_API_KEY` | Optional — enables live Claude AI responses |
| `EMAIL_*` | SMTP credentials for account emails |
