# Excel Skills — Learn & Test

A lean, fast internal web app for learning job-ready Excel skills and taking
auto-graded tests for interview preparation. Built with Next.js (App Router),
TypeScript, Tailwind CSS and shadcn/ui.

It covers 17 skills (IF, SUMIFS, COUNTIFS, XLOOKUP, VLOOKUP, INDEX+MATCH,
IFERROR, TRIM, LEFT/RIGHT/MID, PivotTables, Conditional Formatting, Data
Validation, DATEDIF, NETWORKDAYS, FILTER, SORT, UNIQUE) with lessons, practice
questions and tests.



---

## 1. What was built

- **Auth** — custom username/password login from a `APP_USERS_JSON` env var.
  Passwords are stored in plaintext and compared directly; sessions are signed
  HttpOnly cookies (JWT via `jose`). All app routes are protected by a Next.js
  proxy (middleware); only `/login` is public.
- **Dashboard** — overall progress, continue-learning, next recommended skill,
  high-priority skills, weak skills and recent test attempts.
- **Learn** — 17 skill lessons rendered from JSON (syntax, job use-cases,
  worked examples, common mistakes, practice tips).
- **Practice** — per-skill question drills with **instant client-side grading**
  and partial credit. Progress is saved.
- **Tests** — 7 timed, auto-graded tests (single-skill, mixed and job-simulation)
  with a question palette, countdown timer and auto-submit.
- **Grading** — not just string matching. Formula answers are normalised
  (case/whitespace/`$`/locale separators), accept multiple correct variants, and
  award **partial credit** based on the required functions used.
- **Reports** — skill mastery, weak areas with next-step recommendations, and
  full test-attempt history.
- **Admin** (role-gated) — read-only view of configured users, content stats and
  persistence status.
- **Storage** — Supabase (Postgres) when configured; otherwise a graceful
  in-memory fallback so the app runs without a database.
- **Responsive** — sidebar on desktop, slide-over menu + bottom nav on mobile,
  light/dark theme toggle.

### Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
shadcn/ui (Radix) · lucide-react · next-themes · `@supabase/supabase-js` ·
`jose` · pnpm.

---

## 2. Setup

```bash
pnpm install
cp .env.example .env.local   # then edit .env.local (see below)
pnpm dev                     # http://localhost:3000
```

If `pnpm install` reports ignored build scripts, run `pnpm approve-builds --all`
once (this project pre-approves them in `pnpm-workspace.yaml`).

---

## 3. Environment variables

Set these in `.env.local` (local) or your host's env settings (production).

| Variable                    | Required   | Purpose                                                                                               |
| --------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `APP_USERS_JSON`            | yes        | JSON array of users (see below).                                                                      |
| `SESSION_SECRET`            | yes (prod) | Long random string used to sign session cookies. A dev fallback is used if unset in development only. |
| `NEXT_PUBLIC_SUPABASE_URL`  | optional   | Supabase project URL.                                                                                 |
| `SUPABASE_SERVICE_ROLE_KEY` | optional   | Supabase service-role key (server-only — never exposed to the browser).                               |

If the Supabase vars are omitted, the app uses an in-memory store (data resets
when the server restarts) so it still runs end-to-end.

Generate a session secret with:

```bash
openssl rand -base64 48
```

### `APP_USERS_JSON` shape

```json
[
  {
    "userKey": "user1",
    "username": "amit",
    "password": "learner123",
    "role": "learner"
  },
  {
    "userKey": "admin1",
    "username": "admin",
    "password": "admin123",
    "role": "admin"
  }
]
```

Passwords are stored in plaintext and compared directly, so no hashing or `$`
escaping is needed.

Example `.env.local` line:

```
APP_USERS_JSON='[{"userKey":"user1","username":"amit","password":"learner123","role":"learner"}]'
```

---

## 4. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run [`supabase/schema.sql`](./supabase/schema.sql).
   It creates `user_progress`, `test_attempts` and `test_answers`, indexes, and
   enables Row Level Security (no public policies — access is via the
   service-role key from the server only).
3. From **Project Settings → API**, copy the **Project URL** and the
   **service_role** key into `NEXT_PUBLIC_SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY`.
4. Restart the dev server. The Admin page shows "Supabase connected" when wired
   up correctly.

---

## 5. Running locally

```bash
pnpm dev      # dev server with HMR
pnpm build    # production build
pnpm start    # run the production build
pnpm lint     # ESLint
pnpm typecheck# tsc --noEmit
```

A working `.env.local` with demo users is included for convenience:
**`amit` / `learner123`** (learner) and **`admin` / `admin123`** (admin).
Change these before any real use.

---

## 6. Content

All lessons, questions and tests are JSON in [`/content`](./content):

- `content/skills/*.json` — one lesson per skill.
- `content/questions/*.json` — question banks (`if`, `sumifs`, `countifs`,
  `lookup`, `cleaning`, `combo`, `pivot-tables`, `misc`).
- `content/tests/*.json` — tests; each references question ids.

Question types: `mcq`, `formula_input`, `output_prediction`, `fix_formula`,
`scenario`, `multi_function_formula`. To add content, drop a new JSON file in the
right folder and register it in [`lib/content.ts`](./lib/content.ts).

---

## 7. Limitations & follow-ups

- **In-memory fallback** is per-process and non-persistent; configure Supabase
  for durable progress/attempts.
- **User management** is via env vars (no UI). There is no signup, password
  reset, or email — by design.
- **Formula grading** is heuristic: it normalises formulas, checks accepted
  variants and awards partial credit by required functions, but does not execute
  formulas against the dataset. Add an evaluator for stricter output checking.
- **PivotTables / Conditional Formatting / Data Validation** are taught and
  tested conceptually (no live spreadsheet).
- Possible next steps: spaced-repetition review, more question variety per
  skill, per-question timing analytics, and CSV export of reports.
