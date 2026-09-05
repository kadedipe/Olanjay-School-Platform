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
6. Set a strong `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then run `npm run db:seed` once.
7. Start the app: `npm run dev` and sign in at `/login`.

Open `http://localhost:3000`.

## Railway deployment

1. Create a Railway project from this GitHub repository.
2. Add a PostgreSQL service to the same project.
3. On the application service, set `DATABASE_URL=${{Postgres.DATABASE_PRIVATE_URL}}` (replace `Postgres` if the database service has another name).
4. Generate a 32-byte or longer `AUTH_SECRET`, set `AUTH_TRUST_HOST=true`, and set `NEXTAUTH_URL` to the Railway public URL using `https://`.
5. For the first deployment only, configure `ADMIN_EMAIL`, a strong `ADMIN_PASSWORD`, `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME`, and `RUN_BOOTSTRAP_SEED=true`.
6. Generate a public domain for the application service and deploy. `railway.json` selects the Dockerfile, runs the committed Prisma migrations, starts the app, and checks `/api/health`.
7. After the first successful administrator login, set `RUN_BOOTSTRAP_SEED=false` and remove `ADMIN_PASSWORD` from Railway.

Optional invitation email delivery requires `RESEND_API_KEY` and a verified `EMAIL_FROM`. Without them, an administrator receives a one-time invitation URL to share securely.

Do not expose PostgreSQL publicly. The application and database communicate over Railway's private network.

## Authentication and authorization

- Credentials are verified using bcrypt cost 12 and never stored in plaintext.
- Five failed attempts lock an account for 15 minutes.
- Sessions expire after eight hours and protected pages validate roles on the server.
- Invitations contain 256-bit random tokens; only SHA-256 token hashes are stored.
- Invitations expire after 48 hours, are single-use, and prior active invitations are revoked when replaced.
- Administrator, teacher, student, and guardian routes reject cross-role access.
- Invitation creation and acceptance generate audit events.

## Delivery roadmap

1. Foundation: database schema, responsive dashboard, Docker and health check.
2. Identity: Auth.js credentials/OAuth, invitations, password reset, RBAC middleware.
3. Academics: students, guardians, teachers, courses, enrollment and timetable CRUD.
4. Attendance and examinations: bulk entry, approval, grade rules, report cards.
5. Finance: fee structures, invoices, provider adapters, receipts and reconciliation.
6. Production hardening: audit UI, rate limiting, observability, backups, CI and E2E tests.

## Security baseline

Never commit `.env`. Passwords must be hashed with bcrypt or Argon2. Every mutation must verify the server-side session and role; hiding UI controls is not authorization. Payment callbacks must verify provider signatures and be idempotent.
