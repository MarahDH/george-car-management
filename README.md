# ورشة · Warsha

Management system for a car service center (mechanic / electrical / alignment) — replaces the paper
ledger with fast invoicing, a customer & car history, a debt book, reports, and customer
notifications. **Arabic-first (RTL).**

## Structure — fully decoupled mono-repo

```
car-management/
├── backend/     Laravel 13 REST API (JSON, Sanctum tokens, MySQL)
└── frontend/    React 19 + TypeScript SPA (Vite, Tailwind v4)
```

Two independently deployable apps in one repo. The same API can later serve a mobile app or
third-party integrations.

| Part | Dev URL |
|------|---------|
| API | `http://127.0.0.1:8000` |
| SPA | `http://localhost:5173` |

## Requirements

- PHP 8.3+ and Composer (Laravel Herd provides these)
- Node 20+ and npm
- MySQL (Herd) — database `car_management`

## First-time setup

**Backend:**

```bash
cd backend
composer install
php artisan migrate:fresh --seed
```

> `backend/.env` is already configured for MySQL (database `car_management`).

**Frontend:**

```bash
cd frontend
npm install
```

> `frontend/.env` sets `VITE_API_URL=http://127.0.0.1:8000/api`.

## Run (two terminals)

```bash
cd backend && php artisan serve --host=127.0.0.1 --port=8000
```

```bash
cd frontend && npm run dev
```

Then open **http://localhost:5173**.

> Note: the API runs via `php artisan serve`. To use a Herd `.test` domain instead, run
> `herd link` inside `backend/`.

## Default login (dev)

- **Email:** `admin@warsha.test`
- **Password:** `password`

Change this after first login. Seeded in `backend/database/seeders/DatabaseSeeder.php`.

## Settings (seeded)

Currency **SYP** (ل.س), invoice number format `{year}-{month}-{seq}` (e.g. `2026-08-0001`),
business name — all in the `settings` table, served at `GET /api/settings`.

## API endpoints (Phase 0)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | — | Liveness check |
| POST | `/api/login` | — | Issue a bearer token |
| GET | `/api/me` | token | Current user |
| POST | `/api/logout` | token | Revoke current token |
| GET | `/api/settings` | token | App settings map |

## Status

Phases 0–8 are **built and verified**. Only Phase 9 (production deploy) remains — blocked on the
hosting decision (see the build plan).

- **P0 Foundation** — decoupled API + SPA, Sanctum auth, RTL Arabic shell, settings, multi-user-ready users
- **P1 Customers & cars** — smart search (name/plate), profiles, car CRUD
- **P2 Invoicing** — work orders, labor by department, parts (buy/sell/supplier), auto totals + profit, A4 PDF, fast Tab entry
- **P3 Debts & receipts** — debt dashboard, payments (running-balance model), receipt PDF
- **P4 Suppliers** — suppliers + per-supplier purchase statement
- **P5 Reports** — date-filtered summary, department breakdown, PDF + Excel export
- **P6 WhatsApp** — one-click compose (ready / invoice / debt reminder) via `wa.me`
- **P7 Backup** — nightly auto backup (pure-PHP, no `mysqldump`) + on-demand + download
- **P8 PWA** — installable, offline app shell
- **P9 Deploy** — pending hosting

Default login: `admin@warsha.test` / `password`.
