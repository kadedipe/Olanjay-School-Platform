# Olanjay School Platform

A production-oriented school information system for Olanjay Technical School / New Africa Technical Institute.

## Release-one scope

- Role-based accounts: administrators, teachers, students, guardians
- Student admissions, profiles, guardian links, and enrollment
- Course catalog and teacher assignments
- Attendance and timetables
- Assessments, results, grades, and publication workflow
- Fee invoices, payments, balances, and reconciliation
- Printable term report cards, fee invoices, and payment receipts
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

## Production hardening

- `/api/health` returns success only when both the application and PostgreSQL are ready.
- API traffic is rate limited by forwarded client IP, with a stricter authentication window and standard `RateLimit-*` response headers.
- Browser responses include CSP, HSTS, clickjacking, MIME-sniffing, referrer, permissions, and cross-origin isolation controls.
- Administrators can review live operational indicators and the latest 50 audit events at `/dashboard/operations`; `/api/audit-events` supports restricted server-side filtering.
- GitHub Actions runs migrations against PostgreSQL, unit tests, strict type checking, a production build, and live health/login smoke tests before changes are accepted.
- Dependabot monitors npm packages and GitHub Actions. Railway deployment should remain configured to wait for CI.

### Backup and incident checklist

1. Enable scheduled PostgreSQL backups in Railway and periodically test restoration into a non-production database.
2. Retain the application service and PostgreSQL in the same private Railway network; do not publish the database port.
3. Alert on repeated `/api/health` failures, container restarts, HTTP 5xx growth, authentication lockouts, and overdue-invoice growth.
4. Rotate `AUTH_SECRET`, email-provider credentials, and bootstrap credentials through Railway variables; never commit them.
5. Export audit events before the organization’s retention window and investigate unexpected administrator mutations.

## Reports and documents

- `/dashboard/reports` generates term report cards from published results and recorded attendance.
- Course scores are normalized by assessment maximums and combined using configured assessment weights.
- Teachers can report only on learners and courses assigned to them; students and guardians remain restricted to their own or linked records.
- Invoice numbers and payment references in `/dashboard/finance` open print-ready documents that can also be saved as PDF through the browser.
- Every report, invoice, and receipt route repeats authorization on the server, so knowing a document URL does not grant access.

## Security baseline

Never commit `.env`. Passwords must be hashed with bcrypt or Argon2. Every mutation must verify the server-side session and role; hiding UI controls is not authorization. Payment callbacks must verify provider signatures and be idempotent.
