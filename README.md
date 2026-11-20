# Aryavratt HRMS — College Human Resource Management System

A full-stack College/University HRMS for Indian institutions — built as a complete,
functional demonstration with realistic institutional workflows, secure role-based
access, configurable approval hierarchies, payroll processing, recruitment, faculty
workload, appraisals, document vault, analytics and a distinctive **SPATIAL GLASS**
design system.

> All names, organisations and data are fictional demonstration data
> (Faker.js, `en_IN` locale, seeded deterministically).

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, single-page hash routing), React 19, TypeScript |
| Backend | **NestJS 11** (separate service, `mini-services/hrms-api`, port 3001) |
| Database | **PostgreSQL 17** (embedded binaries, data at `db-pg/`) + Prisma ORM |
| Styling | Tailwind CSS 4 + shadcn/ui + custom SPATIAL GLASS layer |
| Charts | Recharts (animated) · Icons: Lucide |
| Auth | Email/password (bcrypt), JWT httpOnly cookie sessions, backend RBAC |
| Demo data | Faker.js `en_IN` — 332 employees, 14 months of history |

API requests from the browser go through the sandbox gateway
(`/api/v1/…?XTransformPort=3001`), which proxies to the NestJS service.
The NestJS app is a supervised mini-service (started by `.zscripts/dev.sh`,
with PostgreSQL provisioned idempotently by `scripts/ensure-pg.mjs`).

## Demo accounts (password for all: `Demo@2026`)

| Account | Role | Notes |
|---|---|---|
| `superadmin@aryavratt.edu.in` | Super Admin | Everything incl. users, roles, audit |
| `principal@aryavratt.edu.in` | Principal / Director | Final approvals, analytics |
| `hr.admin@aryavratt.edu.in` | HR Admin | Employees, leave, corrections, recruitment |
| `hod.cse@aryavratt.edu.in` | HOD (CSE) + Faculty | Multi-role user — role switcher in topbar |
| `hod.math@aryavratt.edu.in` | HOD (Mathematics) + Faculty | |
| `accounts@aryavratt.edu.in` | Accountant (+HOD of Accounts section) | Payroll processing |
| `faculty@aryavratt.edu.in` | Faculty Member | Self-service |
| `staff@aryavratt.edu.in` | Non-teaching Staff | Self-service |
| `tech@aryavratt.edu.in` | Technical / Support Staff | Self-service |

Every one of the 332 employees has a login account
(`<first>.<last><NN>@aryavratt.edu.in`, same password).

## The 12 modules

1. **Dashboard** — eight role-specific variants (KPIs, charts, pending approvals, activity)
2. **Employee Management** — directory, full profiles, qualifications, service records, separation
3. **Department Management** — campuses, faculties/schools, departments, HODs, designations
4. **Attendance** — daily register, monthly analytics, anomalies, manual entry, corrections
5. **Leave** — applications with balance validation, balances, team calendar, cancellation
6. **Payroll** — salary structures, monthly runs (create → compute → submit → dual parallel approval → Principal → disburse), payslips, adjustments
7. **Recruitment** — vacancy requisitions (approval workflow), candidates, interviews, offers, onboarding (creates a real employee + account)
8. **Faculty Workload** — subject allocation, workload computation vs 16h norm, research, mentoring, training, admin duties
9. **Performance & Appraisal** — cycles, goals with progress, self-assessment, HOD reviews, grades & recommendations
10. **Documents** — vault with access levels, expiry watchlist, guarded downloads (audited), reminders
11. **Reports & Analytics** — workforce/attendance/leave/payroll reports, CSV export
12. **Settings & User Management** — institution profile, operational settings, workflow configuration, users, roles & permissions matrix, audit log

## Configurable approval workflows

Seeded templates (editable in Settings → Workflows):

| Workflow | Stages |
|---|---|
| Leave — Standard | HOD Review → HR Final Approval |
| Leave — Extended | HOD → HR → Principal |
| Attendance Correction | HOD Confirmation → HR Application |
| Payroll — Dual Review | **HR Admin (parallel, ALL — every holder must approve) → Principal** |
| Vacancy Requisition | HOD Justification → Principal Sanction |

The engine supports sequential and parallel stages, `ANY`/`ALL`/`QUORUM` strategies,
role- or user-based approvers, department-scoped routing, approve/reject/return-for-correction
with comments, full decision timelines and notifications at each transition.

## Architecture

```
mini-services/hrms-api/        NestJS backend (port 3001)
├── src/core/                  auth guard, RBAC registry, approval engine, audit, envelope
├── src/modules/<name>/        controller · service · DTO per feature module
├── prisma/schema.prisma       ~50 relational entities (PostgreSQL)
├── prisma/seed.ts             Faker en_IN demo data
└── scripts/ensure-pg.mjs      idempotent PostgreSQL provisioner (data: db-pg/)

src/                           Next.js frontend (single visible route: /)
├── app/page.tsx               hash-routed SPA (#/employees/EMP-1002 …)
├── components/layout/         AppShell (sidebar/topbar), login, command palette, notifications
├── components/glass/kit.tsx   SPATIAL GLASS design system primitives
├── components/modules/        one folder per module UI
├── lib/                       api client (XTransformPort), session store, router, formatters
└── instrumentation.ts        ensures PostgreSQL is up on server boot
```

**Security**: bcrypt password hashing, httpOnly JWT cookie sessions, a global
auth guard + `@RequirePermissions` checks on every route (403s verified per
role), scope narrowing (institution / department / self) inside services,
confidential-document gating, and an audit trail on sensitive actions.

## Design — SPATIAL GLASS

- **Dark (default)**: Obsidian `#090A0B` · Deep Graphite `#17191B` · Charcoal
  `#292C2F` · Titanium `#777B7F` · Champagne `#C3B69C` · Soft Champagne `#E7DCC5`
- **Light**: monochrome Graphite/Silver/Black (`#F5F5F5` surface, graphite
  gradient CTAs) — no blue/violet in either theme identity
- Liquid-glass dropdowns, frosted sidebar/header, glassmorphic cards that lift
  with champagne hairlines on hover, metallic sheen gradients, neumorphic
  controls, ambient golden radial light, 160–300 ms motion, `prefers-reduced-motion` support

## Operations

```bash
# backend (from mini-services/hrms-api)
bun run db:seed       # reseed demo data (~40s, wipes first)
bun run db:push       # apply prisma schema changes
bun run dev          # ensure PostgreSQL + nest --watch (supervisor runs this)

# frontend (project root)
bun run lint
```

The system supervisor (`.zscripts/dev.sh`) installs and starts the NestJS
mini-service automatically alongside the Next.js dev server, and
`ensure-pg.mjs` boots PostgreSQL 17 with its data directory inside the project
(`db-pg/`), so the full stack comes up together.

### After a sandbox recycle (processes are stopped, files persist)

The stack now self-heals on the next boot, but if you ever need to bring a
service back by hand, remember: a plain `nohup cmd &` from a tool shell is
reaped when the command ends — only instantly-orphaned (double-fork +
`setsid`) processes survive. Use the provided launcher:

```bash
# backend (PostgreSQL + NestJS API on :3001) — double-fork detached
( setsid bash -c 'cd /home/z/my-project/mini-services/hrms-api && exec bun run dev' \
    >> /home/z/my-project/nest-dev.log 2>&1 < /dev/null & )

# frontend (:3000) — `bun run dev` prefers the built production bundle
( setsid bash -c 'cd /home/z/my-project && exec bun run dev' \
    >> /home/z/my-project/dev.log 2>&1 < /dev/null & )
```

Self-healing already built into the boot chain:

- `ensure-pg.mjs` re-chmods the data dir to `0700` and recreates PostgreSQL's
  empty runtime directories (`pg_notify`, `pg_tblspc`, …) — the sandbox file
  sync drops empty directories, which otherwise blocks `pg_ctl` startup.
- `mini-services/hrms-api/scripts/dev.sh` regenerates the Prisma client
  whenever `bun install` has wiped it.
- Verify recovery: `curl 'http://localhost:81/api/v1/health?XTransformPort=3001'`
  must answer `{"ok":true, ... "database":"up"}`.

### Frontend serving model (memory)

`bun run dev` runs `scripts/serve.sh`, which serves the prebuilt standalone
production bundle when `.next/standalone/server.js` exists (~100 MB RSS) and
falls back to `next dev` (with a JS heap cap) otherwise. Rationale: Turbopack
dev repeatedly ballooned past 1.9 GB of *native* (non-heap) memory and was
OOM-killed on this 4 GB box, taking the preview down.

- After changing frontend code: `bun run build` (refreshes the bundle), then
  restart the frontend with the launcher above.
- For hot-reload editing: delete `.next/standalone` (or run
  `bunx next dev -p 3000` directly) and restore the bundle with a rebuild
  afterwards.

### Production notes

- Payroll uses demonstration slabs (DA/HRA/EPF/TDS/PT) — **verify statutory
  rates before any production use**.
- Google OAuth is stubbed (disabled) — the auth service keeps a config slot.
- Prisma schema is PostgreSQL-native; deploy with `prisma migrate` for
  versioned migrations instead of `db push`.
- The simulated document vault streams audit-logged attestations; wire it to
  encrypted object storage for real files.
# college-hrms
