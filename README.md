# Olanjay School Platform

A production-oriented school information system for Olanjay Technical School / New Africa Technical Institute.

## Release-one scope

- Role-based accounts: administrators, teachers, students, guardians
- Student admissions, profiles, guardian links, and enrollment
- Course catalog and teacher assignments
- Attendance and timetables
- Assessments, results, grades, and publication workflow
- Fee invoices, payments, balances, and reconciliation
- Audit trail and operational dashboard

## Architecture

- Next.js 15 App Router and strict TypeScript
- PostgreSQL with Prisma ORM
- Auth.js-compatible user and role model
- Zod validation at application boundaries
- Standalone Docker build for Railway or any container platform
- `/api/health` deployment health check

## Local setup

1. Copy `.env.example` to `.env` and replace `AUTH_SECRET`.
2. Start PostgreSQL: `docker compose up -d db`.
3. Install dependencies: `npm install`.
4. Generate Prisma: `npm run db:generate`.
5. Create the initial migration: `npm run db:migrate -- --name initial`.
6. Start the app: `npm run dev`.

Open `http://localhost:3000`.

## Railway

Create a PostgreSQL service and an application service from this repository. Set `DATABASE_URL`, `AUTH_SECRET`, and `NEXTAUTH_URL`. Use `npm run build` as the build command, `npm run db:deploy && npm start` as the start command, and `/api/health` as the health-check path.

## Delivery roadmap

1. Foundation: database schema, responsive dashboard, Docker and health check.
2. Identity: Auth.js credentials/OAuth, invitations, password reset, RBAC middleware.
3. Academics: students, guardians, teachers, courses, enrollment and timetable CRUD.
4. Attendance and examinations: bulk entry, approval, grade rules, report cards.
5. Finance: fee structures, invoices, provider adapters, receipts and reconciliation.
6. Production hardening: audit UI, rate limiting, observability, backups, CI and E2E tests.

## Security baseline

Never commit `.env`. Passwords must be hashed with bcrypt or Argon2. Every mutation must verify the server-side session and role; hiding UI controls is not authorization. Payment callbacks must verify provider signatures and be idempotent.
