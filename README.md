# Ruby Essentials — Clan Website


## Stack
- React + TypeScript + Vite frontend (Vercel)
- Node.js + Express API (deploy separately)
- PostgreSQL for accounts and clan data

## Website sections
- Home and clan announcements
- Member roster
- Events and tournament updates
- Join / login / password recovery screens
- Admin dashboard shell

## Local development
1. Install Node.js 20+
2. Run `cd frontend && npm install && npm run dev`
3. The API starter lives in `backend/`; configure its environment and PostgreSQL before using account features.

## Deployment
On Vercel, import this repository and set the Root Directory to `frontend`, Build Command to `npm run build`, and Output Directory to `dist`. Configure `VITE_API_URL` to point to the separately hosted backend API.

## Important
This repository is an initial scaffold. Authentication and password reset require configured backend secrets, database, and a real email provider before live use. Do not put secrets in frontend environment variables.


## Membership decision emails

When an admin approves or rejects a join request, the site uses the Supabase Edge Function `notify-application-status` to email the applicant. To use the free Gmail-based sender, follow the [email-notification setup guide](docs/email-notifications.md). Store its URL and shared secret in Supabase Edge Function secrets, never in frontend environment variables.
