<div align="center">

# UzPolis — Admin Panel

**Back-office for the UzPolis online insurance platform.**
Agents sell OSAGO policies on behalf of customers and earn cashback; administrators manage
roles, commissions, wallets and audit every action in the system.

[![CI](https://github.com/j-onfroy/UzPolis-Admin-Web/actions/workflows/ci.yml/badge.svg)](https://github.com/j-onfroy/UzPolis-Admin-Web/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

## Overview

UzPolis is an online insurance marketplace for Uzbekistan. This repository contains the
**admin & agent panel** — a Next.js application that talks to the UzPolis Admin API
(Spring Boot). Customer-facing web: [uzpolis-website](https://github.com/j-onfroy/uzpolis-website).

## Features

| Module | What it does |
| --- | --- |
| **Dashboard** | System health and key sales metrics at a glance |
| **OSAGO sales** | Agents issue OSAGO policies for customers directly from the panel |
| **Pending payments** | Track unpaid contracts and re-check payment status with the insurer |
| **Sales** | Personal and company-wide sales statistics and history |
| **Wallets** | Agent wallets, balances and transaction history |
| **Cashback** | Configure global and per-agent cashback rates |
| **Admins** | Onboard agents/admins — credentials are delivered by SMS |
| **Roles & permissions (RBAC)** | Create roles and assign granular, module-grouped permissions |
| **Audit history** | Searchable, paginated logs for admins, users, vehicles, calculations, policies and sales |
| **Auth** | Phone + password login with SMS OTP second factor, self-registration via passport data, JWT with silent refresh |

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui (Base UI), Lucide icons, Sonner toasts |
| Data | Axios with a token-refresh request queue, typed DTOs |
| Quality | ESLint (Next.js + React Compiler rules), strict TypeScript |
| Delivery | Docker (standalone Next.js output), GitHub Actions → GHCR → server |

## Project structure

```
app/                 # App Router pages (one folder per module)
│   ├── dashboard/  osago-sell/  pending-payments/  sales/  wallets/
│   ├── cashback/   admins/      roles/             settings/
│   ├── history/    # admins · users · vehicles · calculations · policies · sales
│   └── login/  register/
components/          # Layout, sidebar, data table, filters, pagination
│   └── ui/          # Design-system primitives (shadcn/ui)
lib/
    ├── api.ts           # Axios client, auth header, 401 → refresh → replay
    ├── auth.ts          # Token / session storage helpers
    ├── usePagedQuery.ts # Paginated fetching with request cancellation
    └── types.ts         # API DTOs
```

## Getting started

**Prerequisites:** Node.js 20+ and a running UzPolis Admin API.

```bash
git clone https://github.com/j-onfroy/UzPolis-Admin-Web.git
cd UzPolis-Admin-Web
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at your API
npm install
npm run dev                  # http://localhost:4000
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server on port 4000 |
| `npm run build` | Production build (standalone output) |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

### Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the UzPolis Admin API (build-time, public) |

## Deployment

A multi-stage Dockerfile builds the Next.js standalone server. Pushing to the `prod` branch
runs GitHub Actions, which builds the image, publishes it to GitHub Container Registry and
rolls it out on the server over SSH with Docker Compose. Every pull request runs lint,
type-check and build in CI.

```bash
docker build -t uzpolis-admin-ui .
docker run -p 4000:4000 uzpolis-admin-ui
```

## Branching

| Branch | Purpose |
| --- | --- |
| `main` | Stable, reviewed code (default) |
| `prod` | Production — pushes trigger deployment |
| `feature/*`, `fix/*`, `chore/*`, `docs/*` | Short-lived branches merged via pull request |

## Author

**Doniyorjon Davlataliyev** — [@j-onfroy](https://github.com/j-onfroy)

---

<sub>© UzPolis. Source is published for portfolio and reference purposes.</sub>
