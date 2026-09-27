# Decisions log — নাগরিক অভিযোগ সেল

Source of truth for the design: the user's `নাগরিক_অভিযোগ_ব্যবস্থাপনা_সিস্টেম.html` (3 boards: admin dashboard, complaint detail, citizen form). Unpacked with a script; all tokens below come from it.

| # | Decision | Why |
|---|----------|-----|
| 1 | Next.js 16 App Router + TypeScript + Tailwind v4, no UI kit | Matches global default stack; design is small and bespoke enough that shadcn adds no value. |
| 2 | ~~Data lives in a client store persisted to `localStorage`~~ — superseded by #17 (real MongoDB backend, 2026-09-27) | Original decision, kept for history. All reads/writes went through one file (`src/lib/store.ts`), which is exactly why swapping it for a real API only touched that file plus `src/lib/auth.ts`. |
| 3 | Seed data = 15 hand-written recent complaints (BD-2026-0114…0128, includes the 8 from the design) + deterministic generated history (0001…0113) | Reports need months of data to be meaningful. Next tracking id is BD-2026-0129, matching the design's success screen. |
| 4 | Status model: `new → reviewing → assigned → in_progress → resolved` (+ `rejected`) | Detail timeline in the design has 5 steps. Design used "প্রক্রিয়াধীন" on the dashboard and "সমাধানাধীন" on the detail for the same state; unified: badge = প্রক্রিয়াধীন, timeline step 4 = সমাধানাধীন. Dashboard "প্রক্রিয়াধীন" card counts reviewing + assigned + in_progress (all open, not new). |
| 5 | Added a "বিষয়" (subject) field to the citizen form | Admin table/detail show a subject; the design form had none. |
| 6 | Added status + priority selects to the detail action panel | Design had an "update status" button with no way to choose a status. |
| 7 | Extra pages beyond the 3 boards: `/`, `/track`, `/admin/login`, `/admin/complaints`, `/admin/complaints/new`, `/admin/reports`, `/admin/officers`, `/admin/settings`, 404 | User asked for all pages of the system; sidebar in the design lists reports, officers, settings. |
| 8 | ~~Admin auth is a demo gate, session in localStorage~~ — superseded by #18 (real cookie session, 2026-09-27) | Original decision, kept for history. |
| 9 | SMS is simulated (logged to the complaint's activity feed) | No gateway. Settings page states this; still true after the backend move (#17) — only storage changed, not this. |
| 10 | Tracking requires complaint id + mobile number | Prevents strangers reading someone's complaint by guessing sequential ids. |
| 11 | Attachments: images downscaled to ≤900px JPEG and stored as data URLs; PDFs store name/size only | localStorage quota (~5MB). |
| 12 | Contrast fixes vs. the source design: amber text `#B3760C → #8A5A06` (3.3:1 → 5.1:1), faint text `#9AA39C → #626C65` | WCAG AA floor (design-qa). |
| 13 | Font: Noto Sans Bengali variable woff2 files extracted from the source bundle, served from `/public/fonts` | Offline-safe, no build-time Google fetch. |
| 14 | Icons: lucide-react only. Sidebar keeps the design's dot indicators (not icons). | One icon library per project. |
| 15 | Charts on reports page are hand-built SVG/CSS | Avoids a chart lib for 3 simple charts. |
| 16 | Numbers/dates shown in Bengali digits (`src/lib/bn.ts`); ids stay Latin like the design | Matches design. Stored values are always Latin/ISO. |

## 2026-09-27 — real backend (MongoDB)

User asked for a real database (MongoDB, their choice). This replaces #2 and #8 above; everything else stands.

| # | Decision | Why |
|---|----------|-----|
| 17 | MongoDB via the official `mongodb` driver (no ORM), one DB (`MONGODB_DB`, default `nagorik_obhijog`), 4 collections: `complaints`, `officers`, `settings` (single doc, `_id: "app"`), `counters` (atomic per-year complaint-number sequence). App ids (`BD-2026-0117`, `off-1`) are used directly as Mongo `_id` — no separate ObjectId. All access goes through `src/lib/server/*.ts` (server-only); routes never touch the driver directly. First request auto-seeds an empty DB from the same `buildSeed()` used before (`src/lib/server/seed.ts`). | Simplest thing that's still real; the app's own ids are already unique and human-meaningful, so a second id column would be pure overhead. Auto-seed means a fresh Atlas cluster demos immediately, same as the old localStorage version did. |
| 18 | Auth: one admin account from env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, compared server-side, never shipped to the client), session is a signed JWT (`jose`, `SESSION_SECRET`) in an httpOnly cookie. Route protection for `/admin/*` happens in `src/proxy.ts` (this Next.js version renamed `middleware.ts` → `proxy.ts`), not just client-side. | Matches the "single demo admin" scope from #8, but the credential no longer sits in the client JS bundle, and a signed-out visitor can no longer even reach the admin page shell before the check runs. Multiple real officer accounts would need hashed passwords in the DB instead of env vars — flagged as follow-up work, not done here. |
| 19 | Complaint status/officer/priority/note changes go through **one** endpoint (`PATCH /api/complaints/[id]`, `applyComplaintUpdate`) that applies all of them in a single read-modify-write server-side, instead of the client sequencing four separate calls (assign, then re-read, then status, then note) the old localStorage version needed. | The old client-side sequencing existed only to work around localStorage having no transactions; a real backend can just do it correctly in one place, which is simpler and removes a class of race conditions. |
| 20 | Public endpoints: `GET /api/settings` (citizen form needs categories/departments/org name), `GET /api/track?id=&phone=` (id **and** phone number must both match; 404 either way — never reveals whether the id exists). `GET /api/complaints` (the admin list) requires a session — a real fix over the old version, where the entire complaints array sat in every visitor's browser via localStorage/client state. | Matches #10's intent (no guessing complaints by id) but now actually enforced server-side instead of only in the UI. |
| 21 | Tracking response includes the assigned officer's display name/designation (`officerLabel`) but never their phone/email | Useful for citizens, not sensitive; officer contact details stay admin-only. |
| 22 | Client data layer rewritten from a `useSyncExternalStore` + localStorage store to SWR (`useSWR`, cache key = API path) hitting the routes above; `src/lib/store.ts` keeps the same function names/shapes it had before (`useDb()`, `createComplaint`, `saveOfficer`, etc.) so page components needed only mechanical edits (sync → async, `useHydrated()` → `db.loading`). | SWR gives caching/revalidation/loading states for free instead of hand-rolling them; keeping the old export names minimized the diff across ~10 page files. |
| 23 | Backup/reset on the settings page now builds the JSON from already-loaded `useDb()` data and calls `POST /api/settings/reset` (drops + reseeds all 4 collections), instead of a synchronous `getDb()` snapshot | `getDb()` was a localStorage-only concept; there is no synchronous cross-request snapshot with a real DB. |

**Not done — flagged as follow-up, not started:** per-officer login accounts with hashed passwords, a real SMS gateway, rate limiting on the public `submit`/`track` endpoints, and moving large attachments out of MongoDB documents into object storage if volume grows.
