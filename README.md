# Wrenchwise

Wrenchwise is a production-oriented Next.js app for mechanics and DIY mechanics. It is deliberately **not** shipped with fabricated DTC/fix/forum content.

## What is live

- VIN decoding through NHTSA vPIC.
- NHTSA recall lookup for the decoded vehicle.
- Supabase/Postgres for DTCs, symptoms, repair sources, confirmed fixes, forum content and noise reports.
- Supabase Auth via email magic links.
- Supabase private Storage for audio uploads.
- Anthropic API calls are server-side only. The browser never receives your AI key.
- AI is constrained to classification/research; it is not used as a source of invented repair procedures.

## Important limitation

There is no single free, authoritative, redistributable database containing every vehicle manufacturer's diagnostic procedure, TSB, wiring diagram, torque spec, repair illustration and confirmed fix. Wrenchwise therefore has a **source-library architecture**: authoritative documents/data that you are licensed to use can be added to `repair_sources` and associated with a vehicle. The app does not pretend that generic web/AI output is a manufacturer procedure.

## Setup

### 1. Supabase

Create a Supabase project, open SQL Editor, and run `supabase/schema.sql`.

Then create an `.env.local` from `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

Keep `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` secret. Never put either in `NEXT_PUBLIC_*`.

### 2. Anthropic

Create your API key in the Anthropic Console. Put it in Vercel as `ANTHROPIC_API_KEY`. Do not paste the key into source files or send it to anyone.

### 3. Run locally

```bash
npm install
npm run dev
```

Open the local address shown by Next.js.

### 4. Vercel

Push this folder to GitHub. In Vercel choose **Add New → Project**, select the repo, add the four environment variables, then Deploy.

After deployment, open the Vercel URL on your phone.

## Adding real repair information

Use Supabase's table editor or build an admin UI next. Populate:

- `dtc_codes`: code, description, plain language, system, manufacturer, source URL.
- `repair_sources`: vehicle key, title, source type, URL and licensed/reference content.
- `confirmed_fixes`: only fixes actually supported by a source or clearly reported by a user.
- `symptoms`: expand the taxonomy as the product grows.

For manufacturer service information, use information you have a right/license to use. Do not scrape or redistribute copyrighted service manuals, diagrams or TSBs without permission.

## Next production upgrades

1. Admin-only source ingestion and moderation.
2. Vehicle-specific service-document indexing/RAG.
3. Thread replies and confirmed-fix workflow.
4. Signed URLs and retention rules for audio.
5. VIN history/workspace persistence.
6. Manufacturer source integrations where licensed.
7. Image/diagram viewer tied to source page and vehicle.
8. Audit trail showing exactly which source supports every diagnostic statement.
