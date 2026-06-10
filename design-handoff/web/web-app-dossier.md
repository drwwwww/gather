# Gather Web App — Design & Functionality Dossier (Admin + public flows)

This document describes **what the Gather Next.js web app does today** under `apps/web`: routes, flows, data, and behaviors for **church admins** (primary web audience), **public join**, **auth/onboarding**, and the **minimal member web surface**. It is **not** a pixel spec of every Tailwind class—Stitch or a redesign may change layout while preserving **functionality**, **information hierarchy**, and **tokens** in [`apps/web/app/globals.css`](../../apps/web/app/globals.css).

**Relationship to other handoffs**

- **Mobile parity:** Same Supabase tables, roles (`MEMBER` | `SERVICE` | `ADMIN`), and church model as [`design-handoff/mobile/mobile-app-dossier.md`](../mobile/mobile-app-dossier.md). Web is the **administration and content** hub; mobile is the **day-of volunteer / member** experience.
- **Admin dashboard UI detail:** Hero, cards, roster donut, typography, and component-level notes for `/admin` live in [`design-handoff/dashboard-dossier.md`](../dashboard-dossier.md). This dossier summarizes dashboard **behavior** and lists **all other web routes**.

**Product tone:** Warm, church-appropriate, **light mode** default—Rubik, cream/off-white surfaces, amber primary. Align with mobile dossier §1 (web `:root` is canonical).

---

## 1. Canonical brand system (source of truth: web)

All semantic colors, radii, button tokens, and sidebar variables live in **[`apps/web/app/globals.css`](../../apps/web/app/globals.css)** (`:root`). Do not replace primary amber with unrelated browns or olives for main CTAs.

**Hard rules (same intent as mobile dossier)**

- Light backgrounds: `--bg`, `--surface`, white cards.
- **`--primary`** / **`--primary-hover`** / **`--primary-soft`** used consistently; hover is one step darker, not a second brand color.
- Body font: **Rubik** (see `body` rule in `globals.css`).

For a tabular recap of dashboard-facing tokens, see **§1–2** in [`dashboard-dossier.md`](../dashboard-dossier.md).

---

## 2. Auth, profile, and access model (web)

### 2.1 Supabase auth

- **Sign in / sign up UI:** [`apps/web/app/auth/page.tsx`](../../apps/web/app/auth/page.tsx) (re-exported as [`apps/web/app/login/page.tsx`](../../apps/web/app/login/page.tsx)).
- **Sign in:** `signInWithPassword`.
- **Sign up:** `signUp` with `options.data.full_name`; may require email confirmation (inline messaging).
- **Post-auth routing:** [`apps/web/lib/postLoginDestination.ts`](../../apps/web/lib/postLoginDestination.ts) — `destinationAfterSignIn`, `sanitizeNextPath`, `isJoinNextPath`.
- **Join intent:** If `next` query is a `/join` URL, sign-in/sign-up branches route users back to complete join (see [`apps/web/app/join/page.tsx`](../../apps/web/app/join/page.tsx)) instead of always sending new users to create-church only.

### 2.2 Profile (`profiles`)

Same fields as mobile: `id`, `church_id`, `full_name`, `email`, `role`, `disabled`.

- **`church_id` null:** Onboarding paths (`/onboarding/create-church`, `/onboarding/rejoin-church`, or public **`/join?code=…`**).
- **`disabled` true:** Should be treated like mobile inactive (enforce where profile loads in web flows).
- **`role`:** `ADMIN` uses the full **`(admin)`** shell and dashboard. **`MEMBER`** / **`SERVICE`** are redirected away from admin nav (see **§3.2**).

### 2.3 `getCurrentContext` ([`apps/web/lib/supabaseData.ts`](../../apps/web/lib/supabaseData.ts))

Returns `{ userId, profile, church, serviceTimes }` or **`null`** if no session, no profile, or **`church_id` is null** (church not loaded). Most admin pages call this and send user to `/login` if null.

### 2.4 Middleware ([`apps/web/middleware.ts`](../../apps/web/middleware.ts))

Runs `updateSession` for matched protected prefixes. **`/join` is not in the matcher** — public join landing is reachable without a session.

---

## 3. Navigation map (Next.js routes)

### 3.1 Public (no `AdminShell`)

| Route | Purpose |
|-------|---------|
| `/login` | Auth card (sign in / sign up tabs); supports `?next=`, `?tab=signup` |
| `/join` | **Public** join landing: resolve church by `?code=` (slug), sign-in/up links with preserved `next`, signed-in user upserts `profiles` to `MEMBER` + `church_id` |
| `/auth/sign-in`, `/auth/sign-up` | Redirect into `/login` with appropriate query |
| `/signup` | Redirect to signup tab on login |

### 3.2 `(admin)` layout — [`AdminShell`](../../apps/web/components/admin/AdminShell.tsx)

**Shell behavior:** Loads profile; if **`role !== "ADMIN"`**, redirects to **`/member`** or **`/member/account`** (not `/account` in admin for non-admin). So **only `ADMIN`** uses the sidebar + primary admin pages.

**Primary sidebar nav** (labels / hrefs):

| href | Label |
|------|--------|
| `/admin` | Dashboard |
| `/people` | People |
| `/volunteers` | Volunteers |
| `/admin/service-plans` | Service Plans |
| `/admin/service-presets` | Service Presets |
| `/announcements` | Announcements |
| `/events` | Events |

**Footer nav:** `/notifications`, `/account`

**Global:** Search input in shell navigates to **`/admin/search?q=…`**; church name + user display; notification badge count (unread `notification_log` for user or broadcast `user_id` null).

### 3.3 Admin pages (representative files)

| Path | Purpose |
|------|---------|
| `/` (under `(admin)`) | Redirects to **`/admin`** |
| `/admin` | Dashboard: stats, next service, team, pending confirmations, announcements preview, events, activity, roster donut (see dashboard dossier) |
| `/admin/search` | Search results across church-scoped entities |
| `/people` | Members table, filters, details drawer, pending local invites; **Invite members** → `/people/invite` |
| `/people/invite` | Admin invite hub: join link + QR (`buildJoinLink`), copy, mailto/SMS, `InviteMembersForm` |
| `/volunteers` | Roles, ministries, schedule builder, assignments table, bulletin slots/items for selected date, pending/declined cards |
| `/admin/service-plans` | List future plans |
| `/admin/service-plans/[planId]` | Plan editor (steps, role slots, assignments) |
| `/admin/service-plans/print/[planId]` | Printable plan view |
| `/admin/service-presets` | Preset list |
| `/admin/service-presets/[presetId]` | Preset editor |
| `/announcements` | Composer (publish now / schedule, draft), audience, list with edit/delete/publish flows |
| `/events` | Create/edit events, tabs (upcoming/past), RSVP panel, attendee dialog |
| `/notifications` | Church-scoped notification log; mark read / mark all read |
| `/account` | Profile, security (password), church settings, team overview, plan placeholder card, service times |
| `/admin/ui-debug`, `/admin/token-debug` | Internal/debug surfaces |

### 3.4 Member web (minimal)

| Route | Purpose |
|-------|---------|
| `/member` | Marketing-style page: “Use Gather on your phone”; optional store links via `NEXT_PUBLIC_GATHER_IOS_APP_URL` / `NEXT_PUBLIC_GATHER_ANDROID_APP_URL` |
| `/member/account` | Member-facing account (subset of admin account patterns) |

### 3.5 Onboarding

| Route | Purpose |
|-------|---------|
| `/onboarding/create-church` | New church bootstrap (name, slug, address, timezone, service time/day) — **admin** path after first signup when no church |
| `/onboarding/rejoin-church` | Copy + links when profile exists but `church_id` null (removed from church); points to mobile and **public `/join`** |

### 3.6 Other

| Route | Notes |
|-------|--------|
| `/logout` | Sign out + redirect |
| `/church/new` | Exists in tree—verify product use vs create-church |
| `/search` | Top-level search page if used |

---

## 4. Per-area functional specification

### 4.1 Dashboard (`/admin`)

- **Access:** `refreshStats` requires auth + profile with `church_id` + **`role === "ADMIN"`**; otherwise `restricted` UI or redirect to login/onboarding.
- **Data:** Parallel fetches: assignments, events, announcements, service times, roles, profiles, church address, **next** `service_plans` row (date ≥ today). Computes `rosterMix`, `teamRows`, `pendingRows`, strip counts, etc.
- **Deep links:** e.g. “View all” navigates to volunteers, events, announcements as implemented in page.
- **Visual spec:** See [`dashboard-dossier.md`](../dashboard-dossier.md).

### 4.2 People (`/people`)

- **Goal:** Manage roster, roles, disabled flag, invites (local storage pending list merged into table).
- **Data:** `getCurrentContext`, `listProfilesByChurch`, role updates via Supabase, etc.
- **Invite hub:** Separate route **`/people/invite`** — QR encodes **public** `buildJoinLink(origin, slug)` → `/join?code=…`.

### 4.3 Volunteers (`/volunteers`)

- **Goal:** Configure roles/ministries/service times; build schedule for a date; view and filter assignments; see bulletin-derived slots/items for selected service date.
- **Data:** `volunteer_assignments`, `volunteer_roles`, `ministries`, `service_times`, `service_plans`, `service_plan_items`, `service_plan_role_slots`, `profiles`.
- **Actions:** Create slots, assign members, open responses (RPC `respond_assignment` where used), toast errors.

### 4.4 Service plans & presets

- **Plans:** CRUD on `service_plans` + ordered `service_plan_items` + `service_plan_role_slots`; print view for run sheet.
- **Presets:** Reusable templates for plan structure.

### 4.5 Announcements (`/announcements`)

- **Goal:** Author rich text announcements; publish now, schedule, or save draft; audience (`ALL` / etc. per schema).
- **Data:** `announcements` for `church_id`; ordered by publish/created.
- **List:** Edit, delete, publish scheduled, preview modes as implemented.

### 4.6 Events (`/events`)

- **Goal:** CRUD church events; RSVP summary; attendee list dialog; templates if wired.
- **Data:** `events`, `event_rsvps`, profiles for names.

### 4.7 Notifications (`/notifications`)

- **Goal:** Same table as mobile: `notification_log` scoped by `church_id` and `(user_id = self OR user_id IS NULL)`; mark one or all read; relative timestamps.

### 4.8 Account (`/account`)

- **Goal:** Admin self-service + church metadata: profile name, password change, church name/slug/timezone/address, team counts, service times editor, placeholder “plan” card.
- **Data:** `getCurrentContext`, `listProfilesByChurch`, `service_times` CRUD.

### 4.9 Admin search (`/admin/search`)

- **Goal:** Query-driven discovery across people/events/plans (per [`SearchResults`](../../apps/web/components/search/SearchResults.tsx) implementation).

### 4.10 Public join (`/join`)

- **Not** behind auth middleware.
- **Church resolve:** `churches` select by `slug` (normalized lowercase) — relies on RLS policy allowing read for join/onboarding (see mobile dossier DB notes).
- **Anonymous:** Sign in / Create account with `next` preserving full join URL.
- **Authenticated:** Join upsert (`MEMBER`, `church_id`, `disabled: false`); already-member and switch-congregation flows; redirect via `destinationAfterSignIn`.

### 4.11 Member hub (`/member`)

- **Goal:** Direct users to native apps; not a feature-complete web client for MEMBER/SERVICE.

---

## 5. Cross-cutting behaviors (web)

- **Client-only data:** Most admin pages are `"use client"` with Supabase browser client [`apps/web/lib/supabaseClient.ts`](../../apps/web/lib/supabaseClient.ts).
- **Toasts / errors:** Several pages use `useToast` or local toast state for mutations.
- **Print:** Invite hub and service plan print route use `window.print()` / dedicated print layout.
- **Events:** `window.dispatchEvent(new CustomEvent("gather-notifications-updated"))` pattern where implemented to refresh shell badge.

---

## 6. Shared layout & components (non-page)

- **`PageGrid` / `PageGridFull` / `PageGridRowTwoOne`:** [`components/layout/PageGrid.tsx`](../../apps/web/components/layout/PageGrid.tsx) — standard content width and two-column rows on large screens.
- **`AdminHeader`:** Title + subtitle + optional actions row on many pages.
- **UI primitives:** `components/ui/*` — Button, Badge, PageLoader, Input, etc. (DaisyUI + Tailwind migration in progress per repo conventions).
- **Font Awesome in `AdminShell`:** Sidebar icons use `@fortawesome` packages (not Lucide) in current shell.

---

## 7. Stitch / redesign checklist (web)

1. **Preserve `:root` tokens** in `globals.css` for brand consistency with mobile.
2. **Do not remove behaviors** listed in §4 without product sign-off—especially volunteers scheduling, plan editor, announcement publish states, and public `/join`.
3. **Admin-only shell:** Non-`ADMIN` users must not see admin chrome; they land on `/member` today.
4. **Dashboard detail:** Use [`dashboard-dossier.md`](../dashboard-dossier.md) for card specs and Venus accent assets where referenced.
5. **Public join + QR:** Invite hub must keep generating links to **`/join?code={slug}`** on the **deployed origin** (not localhost in production materials).
6. **Rubik** + light surfaces + white cards on warm background—match mobile §1 intent.

---

*Generated from `apps/web` routes and key libraries. For DB and RLS, cross-reference `supabase/migrations` and the mobile dossier §2.*
