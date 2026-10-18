# API Contracts

_Last updated: October 2026. Column-level detail is in CLAUDE.md → Database Schema; types in `packages/lib/src/types/database.ts`._

## Tables (all RLS-protected, church-scoped)

`churches` · `profiles` · `profile_private` · `service_times` · `volunteer_roles` · `service_presets` / `service_preset_items` · `service_plans` · `service_plan_role_slots` · `service_plan_items` · `announcements` · `events` (`location` = venue, `address` = street address) · `event_rsvps` · `notification_log` · `serve_requests` · `content_reports` · `user_blocks` · `volunteer_unavailability`

(`volunteer_assignments` was dropped in migration 0024.)

## RPCs

| Function | Caller | Purpose |
|---|---|---|
| `bootstrap_church(name, slug, timezone)` | new admin | Create church, make caller ADMIN |
| `respond_assignment(source, id, response)` | volunteer | Primary: confirm/decline (decline promotes backup). Backup: decline steps down. Past services refused. |
| `check_in_to_plan(plan_id)` | volunteer | Service day only (church timezone) |
| `set_plan_item_status(item_id, status)` | admin | Run of show: PLANNED / DONE / SKIPPED |
| `admin_remove_member_from_church(user_id)` | admin | Removes member, releases their upcoming slots, guards last admin |
| `prepare_account_deletion(user_id)` | service role | Hand off slots / guard last admin before auth user deletion |

## HTTP routes (`apps/web/app/api`)

| Route | Auth | Body → Response |
|---|---|---|
| `POST /api/account/delete` | bearer or cookie | `{ confirm: "DELETE" }` → `{ ok }` · 409 `LAST_ADMIN` |
| `POST /api/moderation/report` | bearer or cookie | `{ reportedUserId, reason, details? }` → `{ ok }` (emails church admins + support) |
| `POST`/`GET /api/notifications/dispatch` | church admin, or `Bearer $CRON_SECRET` (Vercel Cron, daily) | `{ lookaheadHours?, userId? }` → `{ dispatched, emailsSent, emailFailures, pushSent }` |
| `POST /api/notifications/recap` | church admin | `{ planId }` → `{ sentTo, emailsSent, pushSent }` · 409 if already sent |
| `GET /api/export` | church admin | full church data as a JSON download |
| `POST /api/stripe/webhook` | Stripe signature | checkout.session.completed, customer.subscription.* → `churches.plan` |
| `POST /api/billing/portal` | church admin | → `{ url }` (Stripe customer portal) |
| `POST /api/billing/link` | church admin | `{ sessionId }` → `{ plan }` (claims a pre-signup checkout) |
| `POST /api/geocode` | signed in | `{ address }` → `{ latitude, longitude }` (Nominatim) |
| `POST /api/checkout` | public, or admin (ties to their church) | plan + cycle → Stripe Checkout URL (needs `STRIPE_*`) |
| `POST /api/demo-request` | public (honeypot) | lead form → `{ ok }` |
