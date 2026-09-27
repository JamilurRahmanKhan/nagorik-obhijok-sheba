# নাগরিক অভিযোগ সেল — Citizen Grievance Management System

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · lucide-react · MongoDB. UI is in Bengali (Noto Sans Bengali, bundled).
Built from the client's HTML design; decisions are logged in [`docs/decisions.md`](docs/decisions.md), tokens in [`docs/03-art-direction.md`](docs/03-art-direction.md).

## Run

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET
npm run dev      # http://localhost:3000
npm run build && npm start
```

`.env.local` is required — the app throws a clear error naming the missing variable if it's absent. Generate `SESSION_SECRET` with `openssl rand -base64 48`. See `.env.example` for every variable and what it's for.

## Pages

| Route | Who | What |
|---|---|---|
| `/` | citizen | Landing: submit / quick track, how it works, topics, FAQ |
| `/submit` | citizen | Complaint form (validation, attachments, tracking-ID success screen) |
| `/track` | citizen | Status timeline; needs tracking ID **and** mobile number |
| `/admin/login` | staff | Sign-in (credentials are `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `.env.local`) |
| `/admin` | staff | Dashboard: counts (clickable filters) + recent complaints |
| `/admin/complaints` | staff | Search, filter, sort, paginate, CSV export (state kept in the URL) |
| `/admin/complaints/new` | staff | Log a complaint on behalf of a citizen |
| `/admin/complaints/[id]` | staff | Detail, timeline, assign officer, change status/priority, notes, SMS, activity log, SLA |
| `/admin/reports` | staff | KPIs, monthly trend, category/status split, department & officer performance, CSV/print |
| `/admin/officers` | staff | Add / edit / activate / delete officers, workload |
| `/admin/settings` | staff | Org info, SLA days, categories, departments, SMS templates, backup / reset demo data |

## Data & auth

Data lives in MongoDB. An empty database is auto-seeded on first request with 128 demo complaints (`src/lib/seed.ts`;
BD-2026-0114…0128 are the ones from the design) so a fresh Atlas cluster demos immediately — see `docs/decisions.md` #17 onward for
the full backend architecture (collections, API routes, auth). In short:

- **API routes** — `src/app/api/**/route.ts`. All database access goes through `src/lib/server/*.ts` (server-only); nothing else touches
  the MongoDB driver directly.
- **Client data layer** — `src/lib/store.ts` (SWR-backed hooks: `useDb()`, plus one async function per mutation) and `src/lib/auth.ts`
  (`useSession()`, `login()`, `logout()`). Every read/write in the UI goes through these two files.
- **Auth** — one admin account, credentials in `.env.local` (`ADMIN_EMAIL`/`ADMIN_PASSWORD`), session is a signed httpOnly cookie
  (`src/lib/session.ts`). `/admin/*` is protected server-side in `src/proxy.ts` (this Next.js version renamed `middleware.ts` → `proxy.ts`).
  This is still a *single* demo admin, not a user-management system — real per-officer accounts would need hashed passwords stored in
  the DB instead of env vars.
- **SMS is still simulated** (logged on the complaint's activity feed only) — no gateway is wired up.
- Reset the database to the seed data any time from Settings → ডেটা → "ডেমো ডেটা পুনরুদ্ধার", or `POST /api/settings/reset` while
  logged in.
