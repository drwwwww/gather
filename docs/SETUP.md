# Gather Setup

_Last updated: October 2026. Windows is the primary dev machine; see CLAUDE.md → "Local dev quirks"._

## Prerequisites

- Node.js 22, pnpm 9+
- Expo Go on a phone (iOS/Android) for quick mobile testing
- `eas-cli` (`npm i -g eas-cli`) for builds — no Mac needed, builds run in Expo's cloud
- Supabase CLI via `npx supabase` (linked to the live project)

## Install

```bash
pnpm install
```

If Windows throws `ENOENT … _tmp_*` during install, retry (it's a known hardlink race). `.npmrc` uses `node-linker=hoisted` locally; Vercel builds with the isolated linker (see `vercel.json`).

## Environment

- Web: `apps/web/.env.local` — Supabase URL/keys, `SUPABASE_SERVICE_ROLE_KEY`, Brevo, Sentry, optional Stripe and `CRON_SECRET`. Full list in CLAUDE.md → Environment Variables.
- Mobile: Supabase URL + publishable key live in `apps/mobile/app.json` → `extra` (committed, so cloud builds have them). `SENTRY_AUTH_TOKEN` is an EAS secret.

## Database

Migrations are applied directly — **do not use `supabase db push`** (the remote migration history is out of sync):

```bash
npx supabase db query --linked -f supabase/migrations/00NN_name.sql
```

Never `supabase config push` either (see CLAUDE.md Known Gaps).

## Run

All from the repo root:

| Command | What |
|---|---|
| `pnpm dev` | Web at http://localhost:3000 |
| `pnpm mobile` | Expo on your Wi-Fi (scan the QR in Expo Go) |
| `pnpm mobile:tunnel` | Expo over a tunnel (works on any network) |
| `pnpm mobile:clear` | Expo with a cleared cache |
| `pnpm mobile:web` | The mobile app in a browser at http://localhost:8082 |

After adding a native mobile package: `node apps/mobile/scripts/ensure-hoisted-module-links.js`, then restart Expo with `--clear`.

## Verify

- Web: `npx tsc --noEmit -p apps/web`
- Mobile: compare the `error TS` count of `npx tsc --noEmit` in `apps/mobile` to the ~131 baseline, and `npx expo export --platform ios --output-dir <tmp>` must exit 0.

## Demo data

Hillside Community Church (`hillside-community`) with 96 people (about a third with stock profile photos); demo password is in team notes. Admin `pastor@hillside.test` (also on the serving schedule), admin `admin@hillside.test`, volunteer `marcus.torres@hillside.test`, member `wesley.patel@hillside.test`. Seeded by `.seed-tmp/seed_hillside.mjs`.

## Shipping

iOS/Android builds and store submission: `docs/launch/app-store-and-google-play.md`.
