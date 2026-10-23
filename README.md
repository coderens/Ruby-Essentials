# Ruby Essentials — Clan Website

An original esports-clan website using a KNS-style multi-page structure, adapted for Ruby Essentials. Branding colors are provisional until the clan logo and banner are supplied.

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