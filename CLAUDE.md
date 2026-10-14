# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@.agents/AGENTS.md

## Roles & Environment Division

This project is worked on from three environments. Figure out which one you are in before acting.

1. **Razmels-Local (laptop, Windows)** — the only place to build new features, write code, do heavy debugging, and test locally. When the work is done, `git push` to GitHub.
2. **Razmels-Repo (GitHub, `azmi9115/Razmels-Property`)** — only for reviewing Pull Requests, checking code quality, and merging branches into `main`/dev.
3. **Razmels-Server (VPS, Ubuntu, `/home/aril/Razmels-Property`)** — only for deployment, maintaining the server environment (database/env), and watching logs. **Do not rewrite code or build new features directly on the VPS.**

Flow: Local → push to GitHub → review PR on Repo → merge → VPS pulls & restarts (`update.sh`).

## Commands

Run everything from `razmels-web/` (the git root; the parent folder holds only the original Excel data and assets).

```bash
npm run dev                 # dev server on http://localhost:3000
npm run build               # production build — strict TypeScript; run this before pushing
npm run lint                # eslint
npx prisma generate         # after any change to prisma/schema.prisma
npx prisma db push --accept-data-loss   # sync SQLite schema (no migrations folder; db push is the workflow)
node scripts/seed-user.mjs  # create admin@razmels.com
```

There is no test suite. "Testing" means running `npm run dev` and checking the feature in the browser, plus making sure `npm run build` passes (dev mode hides type errors that break the Docker build).

## Architecture

- **Next.js 16 (App Router) + React 19**, Tailwind v4, shadcn/ui (on `@base-ui/react`), Recharts, sonner toasts. Path alias `@/*` → `src/*`. UI text and code comments are in Indonesian.
- **Data layer:** Prisma 5 + **SQLite** (`prisma/dev.db`, via `DATABASE_URL`). Use the singleton in `src/lib/prisma.ts`. `supabase/schema.sql` and `@supabase/supabase-js` are present but not used by `src/`.
- **Mutations are Server Actions** in `src/app/actions/*.ts` (`"use server"`). They take `FormData`, return `{ error }` / `{ success }` instead of throwing, and call `revalidatePath(...)` for every affected dashboard page. Dashboard pages are server components that query Prisma directly and set `export const dynamic = "force-dynamic"` so data is never cached statically. Keep both conventions in new pages/actions.
- **API routes** (`src/app/api/`) are only for things Server Actions don't fit: NextAuth, Excel export, bulk payment insert (from the mutation-verification flow), and file upload (writes to `public/uploads/`).
- **Auth:** NextAuth v4 credentials provider + JWT session; `authOptions` lives in `src/lib/auth.ts` (the route file only re-exports the handler). Route protection lives in `src/proxy.ts` (Next 16's replacement for `middleware.ts`), which guards `/dashboard/*`. Roles are `OWNER` and `ADMIN`; `admin@razmels.com` is auto-promoted to `OWNER` on login. The sidebar hides owner-only menus based on role.

### UI conventions

- **Design tokens** live in `src/app/globals.css` (brand navy `#121826`, green `#42c18e`, indigo `#5b5fe0`; light + `.dark` via next-themes). Use token classes (`bg-card`, `text-muted-foreground`, `bg-success-soft text-success`, `text-danger`, …) — never raw `slate-*`/hex, or dark mode breaks. The sidebar is always navy.
- **Fonts** come from `@fontsource-variable/*` (Plus Jakarta Sans, JetBrains Mono), not `next/font/google` — the VPS Docker build has no reliable access to Google Fonts.
- **Formatting**: always use `src/lib/format.ts` (`formatRupiah`, `formatRupiahCompact`, `formatDate`, `whatsappLink`, `isBlank` for imported placeholder values like NIK `"0"`). Due-date status (`late`/`soon`/`ok`) comes from `getDueInfo` in `src/lib/rent.ts`.
- **Page building blocks**: `PageHeader`, `Panel`, `StatCard`, `StatusPill`, `EmptyState`. Tables render as `<Table>` on `md+` and a card list below `md`.
- **Navigation** is defined once in `src/lib/nav.ts` (sidebar, breadcrumb, and the Ctrl+K command menu all read it). The dashboard layout reads the session server-side and passes `role` down, so owner-only menus render without a flash.
- **Charts**: series colors are `var(--chart-1)` (income) / `var(--chart-2)` (expense), validated for color-blind safety. No dual-axis charts and no pie charts — use separate charts or `BreakdownList`.

### Domain model (`prisma/schema.prisma`)

`Building` (a room/kontrakan/kios, with `rent_price` and `rent_period`) ← `Tenant` (`status` "Active"/"Deactive") ← `Payment`. `RoomHistory` tracks tenants moving between buildings. `Cashflow` is the general ledger (`type` "Pemasukan"/"Pengeluaran"). `FinancialSnapshot` holds manual savings/investment/account balances. Enum-like fields are plain strings — match the exact Indonesian values.

### Business logic to know before touching payments

- `createPayment` (`src/app/actions/payments.ts`) computes the due date `rent_end_date`: it starts from the tenant's latest `rent_end_date` (or `entry_date` if none), adds `rent_duration_months`, snaps back to the original entry day-of-month, and clamps to the month's last day (e.g. entry on the 31st → Feb 28/29). It also **writes a matching `Cashflow` "Pemasukan" row** — payment changes must keep the ledger in sync.
- **Mutation verification (beta):** `mutation-upload-dialog.tsx` parses a BRI bank CSV in the browser (papaparse; raw data never goes to the server), matches incoming amounts that **exactly** equal an active tenant's rent price, breaks ties with fuzzy name matching on the transfer note, and saves the rows the user ticks via `/api/payments/bulk`. Details: `docs/features/mutation-verification.md`.
- The system migrated from `Master Data Kontrakan.xlsm` (in the parent folder). Mapping between Excel and schema plus the due-date rules: `docs/Analyzing Master Data Structure.md` (very large — search it, don't read it whole).

### `scripts/`

One-off Node scripts (`check-*`, `inspect-*`, `fix-*`, `import-juli.js`, etc.) that run Prisma/xlsx against the local `dev.db` for data migration and inspection. They are not part of the app; run them with `node scripts/<name>.js`.

## Deployment

**Automatic:** every push to `main` runs `.github/workflows/deploy.yml`. The `check` job runs `npm run build` (the gate — `npm run lint` currently has many errors and is not part of it). Then `deploy` joins Tailscale, SSHes to the VPS, runs `git pull --ff-only`, `docker compose build`, and `up -d`, and health-checks `localhost:3001/login`. It never copies `dev.db` into the container volume; that step stays manual (below).

**Manual (from the local laptop):** `dev.db` is committed to git and is the production data source. Docker (`node:20-slim`, see AGENTS rules) serves the app on host port **3001**, and on start it runs `prisma db push --accept-data-loss` and then `npm start`. `/app/prisma` is a **named volume**, so a pulled `dev.db` does NOT reach the container on its own.

```powershell
ssh -o BatchMode=yes -o StrictHostKeyChecking=no aril@192.168.0.200 "cd /home/aril/Razmels-Property && bash ./update.sh"
# only if dev.db data changed:
ssh -o BatchMode=yes -o StrictHostKeyChecking=no aril@192.168.0.200 "docker cp /home/aril/Razmels-Property/prisma/dev.db razmels-web:/app/prisma/dev.db && docker restart razmels-web"
```

Always SSH as `aril` (with `BatchMode`); `root` hangs on a password prompt. After deploying, ask the user to hard refresh (Ctrl+F5). On the VPS, `auto-heal.sh` runs every minute from cron (installed by `setup-cron.sh`) and restarts Docker if port 3001 doesn't respond. More: `docs/DEPLOYMENT_AGENT_MANUAL.md`, `docs/TROUBLESHOOTING.md`. Record notable changes in `CHANGELOG.md`.
