# Ruby Essentials API starter

Express + TypeScript API for clan members and events.

## Local setup
```bash
npm install
cp .env.example .env
# Configure DATABASE_URL, then apply the schema:
psql "$DATABASE_URL" -f sql/schema.sql
npm run dev
```

Health check: `GET /api/health`. Public read endpoints: `GET /api/members` and `GET /api/events`.

**Not yet production-ready:** login, email verification/password recovery, join-application submission, admin authorization, audit logs, and rate-limited protected mutation routes must be implemented and tested before real use. Never store secrets in frontend environment variables.
