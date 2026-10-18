# Gather Architecture

_Last updated: October 2026. CLAUDE.md at the repo root is the detailed, always-current brief; this is the one-page map._

## Shape

One Supabase backend, three surfaces:

| Surface | Stack | Who uses it |
|---|---|---|
| Marketing site (`/`, `/pricing`, `/demo`, legal pages) | Next.js 14 `(marketing)` route group | Prospective churches, the public |
| Admin portal (`/admin`, `/people`, `/volunteers`, `/events`, …) | Next.js 14 App Router, Tailwind + DaisyUI under custom tokens | Church admins |
| Mobile app | Expo SDK 57 / React Native 0.86 / React Navigation 7 | Members, service team, admins |

Monorepo (pnpm + Turborepo): `apps/web`, `apps/mobile`, `packages/lib` (shared types/schemas/Supabase factory), `packages/config`, `supabase/migrations` (45 up-only migrations).

## Data & security

- Postgres with **row-level security on every table**, scoped by `church_id` via SECURITY DEFINER helpers (`current_user_church_id()`, `is_admin()`, …).
- **Rules live in the database, not the screens.** Triggers: `trg_guard_profile_privileges` (no self-promotion / cross-church moves), `normalize_schedule_row` (assignment status consistency, backup promotion, church-only scheduling, member→service promotion).
- **Writes that need special rules go through RPCs**: `respond_assignment`, `check_in_to_plan`, `set_plan_item_status`, `admin_remove_member_from_church`, `prepare_account_deletion` (service role only).
- **Private data is split out**: `profiles` is church-readable (directory); phone + push token live in `profile_private` (owner + same-church admins).
- Server-only work (service role) runs in Next.js API routes authenticated by `lib/apiAuth.ts` (mobile bearer token or web cookies): `/api/account/delete`, `/api/moderation/report`, `/api/notifications/dispatch` (admins or `CRON_SECRET`), `/api/geocode`, `/api/checkout`, `/api/demo-request`.

## Scheduling model

`service_plans` (one per church + date + time) → `service_plan_role_slots` (roles: primary, backup, status OPEN/ASSIGNED/CONFIRMED/DECLINED, `checked_in_at`) and `service_plan_items` (run of show: `status` PLANNED/DONE/SKIPPED + its own `assignment_status`). The web plan editor saves **in place against what it loaded** (never delete-and-reinsert), so volunteers' answers made meanwhile survive.

## Notifications

`/api/notifications/dispatch` writes `notification_log`, emails via Brevo, and sends Expo push (batched). Push needs a native build (not Expo Go).

## Observability & privacy

Sentry on web + mobile with PII off and replay only on error (masked). Store privacy answers in `docs/launch/store-privacy-answers.md` assume this.

## Payments

Stripe Checkout via REST (`/api/checkout`); not configured until `STRIPE_*` env vars are set.
