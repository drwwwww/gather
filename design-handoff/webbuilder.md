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
Below is the mobile app.  <!-- Sign In -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700;800&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "tertiary-container": "#ff9837",
                        "surface-container-lowest": "#ffffff",
                        "secondary-fixed": "#e3e2df",
                        "background": "#faf9f5",
                        "inverse-primary": "#ffb95f",
                        "secondary": "#5e5f5c",
                        "inverse-surface": "#2f312e",
                        "surface-container-low": "#f4f4f0",
                        "surface-tint": "#855300",
                        "tertiary-fixed-dim": "#ffb77d",
                        "inverse-on-surface": "#f2f1ed",
                        "primary-fixed-dim": "#ffb95f",
                        "surface-container-high": "#e9e8e4",
                        "primary-fixed": "#ffddb8",
                        "outline": "#867461",
                        "on-secondary-fixed": "#1b1c1a",
                        "error-container": "#ffdad6",
                        "on-secondary-container": "#626361",
                        "surface-variant": "#e3e2df",
                        "on-background": "#1b1c1a",
                        "tertiary": "#904d00",
                        "on-secondary": "#ffffff",
                        "primary": "#855300",
                        "on-primary-container": "#613b00",
                        "outline-variant": "#d8c3ad",
                        "surface-container": "#efeeea",
                        "tertiary-fixed": "#ffdcc3",
                        "on-primary-fixed": "#2a1700",
                        "surface-dim": "#dbdad6",
                        "on-surface-variant": "#534434",
                        "on-secondary-fixed-variant": "#464745",
                        "on-tertiary-fixed": "#2f1500",
                        "on-error": "#ffffff",
                        "on-error-container": "#93000a",
                        "on-primary": "#ffffff",
                        "primary-container": "#f59e0b",
                        "on-tertiary-container": "#6a3700",
                        "secondary-fixed-dim": "#c7c6c4",
                        "on-surface": "#1b1c1a",
                        "error": "#ba1a1a",
                        "on-tertiary-fixed-variant": "#6e3900",
                        "surface-container-highest": "#e3e2df",
                        "on-tertiary": "#ffffff",
                        "secondary-container": "#e0e0dd",
                        "surface": "#faf9f5",
                        "surface-bright": "#faf9f5",
                        "on-primary-fixed-variant": "#653e00"
                    },
                    "borderRadius": {
                        "DEFAULT": "1rem",
                        "lg": "2rem",
                        "xl": "3rem",
                        "full": "9999px"
                    },
                    "fontFamily": {
                        "headline": ["Rubik", "Plus Jakarta Sans", "sans-serif"],
                        "body": ["Rubik", "Plus Jakarta Sans", "sans-serif"],
                        "label": ["Rubik", "Plus Jakarta Sans", "sans-serif"]
                    }
                },
            },
        }
    </script>
<style>
        body {
            background-color: #FDFCF8;
            font-family: 'Rubik', sans-serif;
        }
        .amber-aura-gradient {
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12">
<!-- Brand Identity (Anchor) -->
<header class="mb-12 text-center">
<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFF7E6] text-[#F59E0B] mb-4">
<span class="material-symbols-outlined text-4xl" data-icon="church">church</span>
</div>
<h1 class="text-[1.75rem] font-bold text-[#111827] tracking-tight font-headline">Gather</h1>
</header>
<!-- Sign In Canvas -->
<main class="w-full max-w-md">
<!-- Asymmetric Editorial Header -->
<div class="mb-10 text-left">
<h2 class="text-[3.5rem] leading-tight font-bold text-[#111827] -tracking-[0.02em] font-headline mb-2">
                Welcome back
            </h2>
<p class="text-[#4B5563] text-lg leading-relaxed max-w-xs font-body">
                Step back into the sanctuary. Your community is waiting.
            </p>
</div>
<!-- Form Section -->
<form action="#" class="space-y-6" method="POST">
<div class="space-y-4">
<!-- Email Field -->
<div>
<label class="block text-[#4B5563] text-sm font-medium mb-2 px-1" for="email">Email Address</label>
<input class="w-full px-6 py-4 bg-[#F5F4F1] border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B]/40 transition-all duration-300 placeholder:text-[#9CA3AF]" id="email" name="email" placeholder="yourname@domain.com" required="" type="email"/>
</div>
<!-- Password Field -->
<div>
<div class="flex justify-between items-center mb-2 px-1">
<label class="block text-[#4B5563] text-sm font-medium" for="password">Password</label>
<a class="text-[#F59E0B] text-sm font-medium hover:underline transition-all" href="#">Forgot?</a>
</div>
<div class="relative">
<input class="w-full px-6 py-4 bg-[#F5F4F1] border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B]/40 transition-all duration-300 placeholder:text-[#9CA3AF]" id="password" name="password" placeholder="••••••••" required="" type="password"/>
<button class="absolute right-4 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#111827] transition-colors" type="button">
<span class="material-symbols-outlined" data-icon="visibility">visibility</span>
</button>
</div>
</div>
</div>
<!-- CTA Primary Button -->
<div class="pt-4">
<button class="w-full amber-aura-gradient text-white font-bold py-5 rounded-full shadow-[0_32px_32px_-4px_rgba(245,158,11,0.08)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-lg" type="submit">
                    Sign In
                </button>
</div>
</form>
<!-- Secondary Actions & Social Logic -->
<div class="mt-12 text-center space-y-8">
<div class="relative">
<div class="absolute inset-0 flex items-center">
<div class="w-full border-t border-[#E5E7EB]"></div>
</div>
<div class="relative flex justify-center text-sm">
<span class="px-4 bg-[#FDFCF8] text-[#9CA3AF] uppercase tracking-widest font-label">Or join with</span>
</div>
</div>
<!-- Social Bento Grid (Simplified for Login) -->
<div class="grid grid-cols-2 gap-4">
<button class="flex items-center justify-center py-4 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#FFF7E6] hover:border-[#F59E0B]/30 transition-all duration-300 group">
<img alt="Google" class="w-6 h-6 mr-2 opacity-80 group-hover:opacity-100" data-alt="clean minimal google logo on transparent background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuA0B89cy_0nI_vyFWwjQ_EIl9-H0KhKXUqY0quBAJiR-FiQHRXTQ5c5z-1lSxD7K7W_szjCucI_d7WU8OIDvfBIeI6SbaHUCLVzAxj0ipTfkxOHS__ZZ6iz6pgYDQwKDmymDh8e-AeHqcDDfW05p551vMXPZvx3n7tY6_nfyce-v0SXoM9rMdfOwmKXuPb0ZO1U3hwOh2U-seq9a6QS5CII0xqGz5Dt1z25Tb7du_EJxa9VBPBBzLJLBMHjqMAuSpg5SzT5Bvvn0"/>
<span class="text-[#4B5563] font-medium">Google</span>
</button>
<button class="flex items-center justify-center py-4 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#FFF7E6] hover:border-[#F59E0B]/30 transition-all duration-300 group">
<span class="material-symbols-outlined mr-2 text-[#4B5563] group-hover:text-[#F59E0B]" data-icon="apple">ios</span>
<span class="text-[#4B5563] font-medium">Apple</span>
</button>
</div>
<!-- Signup Link -->
<p class="text-[#4B5563] font-body">
                Don't have an account? 
                <a class="text-[#F59E0B] font-bold ml-1 hover:underline decoration-2 underline-offset-4" href="#">Sign up</a>
</p>
</div>
</main>
<!-- Decorative Bottom Gradient for Depth -->
<div class="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#F5F4F1] to-transparent pointer-events-none opacity-50"></div>
<!-- Background Ambient Aura -->
<div class="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F59E0B]/5 rounded-full blur-[120px] -z-10"></div>
<div class="fixed bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-[#F59E0B]/3 rounded-full blur-[100px] -z-10"></div>
</body></html>

<!-- Join Church -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700;800&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "tertiary-container": "#ff9837",
                    "surface-container-lowest": "#ffffff",
                    "secondary-fixed": "#e3e2df",
                    "background": "#fdfcf8",
                    "inverse-primary": "#ffb95f",
                    "secondary": "#5e5f5c",
                    "inverse-surface": "#2f312e",
                    "surface-container-low": "#f4f4f0",
                    "surface-tint": "#855300",
                    "tertiary-fixed-dim": "#ffb77d",
                    "inverse-on-surface": "#f2f1ed",
                    "primary-fixed-dim": "#ffb95f",
                    "surface-container-high": "#e9e8e4",
                    "primary-fixed": "#ffddb8",
                    "outline": "#867461",
                    "on-secondary-fixed": "#1b1c1a",
                    "error-container": "#ffdad6",
                    "on-secondary-container": "#626361",
                    "surface-variant": "#e3e2df",
                    "on-background": "#1b1c1a",
                    "tertiary": "#904d00",
                    "on-secondary": "#ffffff",
                    "primary": "#855300",
                    "on-primary-container": "#613b00",
                    "outline-variant": "#d8c3ad",
                    "surface-container": "#efeeea",
                    "tertiary-fixed": "#ffdcc3",
                    "on-primary-fixed": "#2a1700",
                    "surface-dim": "#dbdad6",
                    "on-surface-variant": "#534434",
                    "on-secondary-fixed-variant": "#464745",
                    "on-tertiary-fixed": "#2f1500",
                    "on-error": "#ffffff",
                    "on-error-container": "#93000a",
                    "on-primary": "#ffffff",
                    "primary-container": "#f59e0b",
                    "on-tertiary-container": "#6a3700",
                    "secondary-fixed-dim": "#c7c6c4",
                    "on-surface": "#1b1c1a",
                    "error": "#ba1a1a",
                    "on-tertiary-fixed-variant": "#6e3900",
                    "surface-container-highest": "#e3e2df",
                    "on-tertiary": "#ffffff",
                    "secondary-container": "#e0e0dd",
                    "surface": "#fdfcf8",
                    "surface-bright": "#fdfcf8",
                    "on-primary-fixed-variant": "#653e00"
            },
            "borderRadius": {
                    "DEFAULT": "1rem",
                    "lg": "2rem",
                    "xl": "3rem",
                    "full": "9999px"
            },
            "spacing": {},
            "fontFamily": {
                    "headline": ["Plus Jakarta Sans", "sans-serif"],
                    "body": ["Plus Jakarta Sans", "sans-serif"],
                    "label": ["Plus Jakarta Sans", "sans-serif"]
            }
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .amber-aura-gradient {
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        }
        .glass-nav {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-[#FDFCF8] font-body text-[#111827] min-h-screen">
<!-- TopAppBar -->
<header class="bg-[#FDFCF8] w-full top-0 z-40">
<div class="flex justify-between items-center w-full px-6 py-4 mt-2">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-[#F59E0B] text-2xl" data-icon="church">church</span>
<h1 class="text-[1.75rem] font-bold text-[#111827] tracking-tight font-['Rubik']">Gather</h1>
</div>
<div class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container/20">
<img class="w-full h-full object-cover" data-alt="Portrait of a friendly smiling person in soft warm natural sunlight with a blurred outdoor background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB02MGsPsb9fdEtCvCURjX4sZWZGKoycmv-mUeRf6UM_fMCKmrwciO6ds2p12zauMKd_kv4q4AfWOodxS0EDZ_6Njqwj05baCMqKbQKxWgBhirq9kLwf4IAZPb-5wxSV3eDN2rkebU0bmBHsISvZsGgYQr5GrWPDX3E_AK1_O88dAOQupBxmWhEqqJsNNJuRFhT3GXUflxTJwYync5iypJzjV53on0AoPxE54IpkR1ByUWoD5MUgvtFkJzWmLcFV2Ll4PF5cKgX_jg"/>
</div>
</div>
</header>
<main class="max-w-2xl mx-auto px-6 pt-8 pb-32">
<!-- Hero Section -->
<div class="mb-12">
<h2 class="text-[3.5rem] leading-tight font-extrabold tracking-tight text-[#111827] font-['Rubik'] mb-4">
                Join your church
            </h2>
<p class="text-[#4B5563] text-lg leading-relaxed max-w-md">
                Find your local community and stay connected with the heartbeat of your sanctuary.
            </p>
</div>
<!-- Search Section -->
<div class="relative mb-12 group">
<div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
<span class="material-symbols-outlined text-[#4B5563] group-focus-within:text-[#F59E0B] transition-colors" data-icon="search">search</span>
</div>
<input class="w-full pl-12 pr-6 py-5 bg-[#F5F4F1] border-none rounded-xl focus:ring-2 focus:ring-[#F59E0B]/40 focus:bg-white transition-all text-lg placeholder:text-[#4B5563]/50" placeholder="Search by name or slug (e.g. grace-church)" type="text"/>
</div>
<!-- Recommended / Featured Bento Grid -->
<div class="mb-10">
<h3 class="font-['Rubik'] font-bold text-xl mb-6 flex items-center gap-2">
<span class="w-2 h-6 bg-[#F59E0B] rounded-full"></span>
                Nearby Communities
            </h3>
<div class="space-y-4">
<!-- Church Row Item 1 -->
<div class="group flex items-center justify-between p-6 bg-white rounded-lg hover:shadow-[0_20px_40px_-12px_rgba(245,158,11,0.12)] transition-all duration-300">
<div class="flex items-center gap-5">
<div class="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-surface-container-low">
<img class="w-full h-full object-cover" data-alt="Stained glass window inside a traditional church with sunlight streaming through, creating colorful patterns" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3dIY1EB_a83D1XcT7Mg8QvCGWCrXvM09MbIugC4XZ8J4TxhSxemSUT6BXVza5_187Sv6cx3Bxv116U--Ez8Z7Z3Y0LRk0JpWoT6YPh8nh_YUyFcNfWQd7s-9vg7X7b_FtYrDRvBnHMoAaikqnBegF4LVyN0LAvDKVcD3w_BSfHbhWPkpC4bEBG68zOsZHjh7QnbSqnD9i-z-Y0r0VyJpGRZtwpN5_2Dw9pLpEVoaZDQV05Awcy_FuhdKVpL2MLKHVp_pANzZiQPs"/>
</div>
<div>
<h4 class="font-['Rubik'] font-bold text-xl text-[#111827]">Grace Church</h4>
<p class="text-[#4B5563] text-sm font-medium tracking-wide">@grace-church</p>
</div>
</div>
<button class="amber-aura-gradient text-white font-bold py-3 px-8 rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-[0_8px_16px_-4px_rgba(245,158,11,0.3)]">
                        Join
                    </button>
</div>
<!-- Church Row Item 2 -->
<div class="group flex items-center justify-between p-6 bg-white rounded-lg hover:shadow-[0_20px_40px_-12px_rgba(245,158,11,0.12)] transition-all duration-300">
<div class="flex items-center gap-5">
<div class="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-surface-container-low">
<img class="w-full h-full object-cover" data-alt="Modern architectural detail of a community center with warm wood panels and large glass windows" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJ1hyYRTxpyjRV8cZz_C-c-AtSDrQsLL0MXy-No3lWQVNN_E6ail8ZZWxBN1P9O8p2JeU7NuZP9SfdmlxC4AW9N55QPuFmpLapXFcwLm-HJ65NiG3wR9zInNEKIsYYDfAxqmwvfeIIOajXBuSiYAQeGu68j5Mg1FpHSOuIbd2YLeY1stUCqdEKwIhwB8bwx5w3ZgOadtiRWiDrft4BxoIcJ0i2YzIZrTydwDnQpBSiGNSUbkk-mS8MiWRoBJqRod1DZdBlOSBKn_0"/>
</div>
<div>
<h4 class="font-['Rubik'] font-bold text-xl text-[#111827]">Redeemer Community</h4>
<p class="text-[#4B5563] text-sm font-medium tracking-wide">@redeemer-city</p>
</div>
</div>
<button class="amber-aura-gradient text-white font-bold py-3 px-8 rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-[0_8px_16px_-4px_rgba(245,158,11,0.3)]">
                        Join
                    </button>
</div>
<!-- Church Row Item 3 -->
<div class="group flex items-center justify-between p-6 bg-white rounded-lg hover:shadow-[0_20px_40px_-12px_rgba(245,158,11,0.12)] transition-all duration-300">
<div class="flex items-center gap-5">
<div class="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-surface-container-low">
<img class="w-full h-full object-cover" data-alt="Close up of a warm cup of coffee and an open bible on a rustic wooden table in a cozy cafe" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUCbJHwPb4gQYX9wuoTDOuIKBZRKl8LFTQVyF8iSxGVLDbCCdmVFbGTzmxgBVkTYHWITQuhvUOYIUgNRTpGLq5-1TUFzfmm_l2jXT9BHOBn8bR5a4ikz38_mtYWiErwPSUnY8wYHTAkHtG_9_jJc2QfxVhUSqvwdGqouh51YfASmKcs3-Jj22rY7hQPvWpRQ2KAjHxYqK2Ovhe0naKGW8dkdH3Vpwkkoy9asG8sp8uTT-Bs_6Og9oEFPRkJrw7UosuE_G57JGRUl4"/>
</div>
<div>
<h4 class="font-['Rubik'] font-bold text-xl text-[#111827]">The Well</h4>
<p class="text-[#4B5563] text-sm font-medium tracking-wide">@the-well-campus</p>
</div>
</div>
<button class="amber-aura-gradient text-white font-bold py-3 px-8 rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-[0_8px_16px_-4px_rgba(245,158,11,0.3)]">
                        Join
                    </button>
</div>
<!-- Church Row Item 4 -->
<div class="group flex items-center justify-between p-6 bg-white rounded-lg hover:shadow-[0_20px_40px_-12px_rgba(245,158,11,0.12)] transition-all duration-300">
<div class="flex items-center gap-5">
<div class="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-surface-container-low">
<img class="w-full h-full object-cover" data-alt="Beautiful sunrise over a quiet meadow with tall grass and soft golden light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQJ33WvzByz1xosR3_mgYj3NnsOsTav96t4kdT2qxD4rNxl-hIrsv4ruD1HYn6pXEMu2VZrKSmtM9iylyrw3VW6ZLs5S72rzZszl1h3273WnTf6_pQWO-6Q9hKkBmnUF-z0PGPJKtdFY30oZ6XIi0JDbW3tcJw45B1ONF8LnXpehHFuFuJW_otMZJ8c1y88aOxff2Zl9miRbZIYbRYrflYYNizbzZr_a72pdQEOtquJvIdXl1KN7j7vPK2CeGX2-1FOG18vC_qGbM"/>
</div>
<div>
<h4 class="font-['Rubik'] font-bold text-xl text-[#111827]">Hope Chapel</h4>
<p class="text-[#4B5563] text-sm font-medium tracking-wide">@hope-chapel-east</p>
</div>
</div>
<button class="amber-aura-gradient text-white font-bold py-3 px-8 rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-[0_8px_16px_-4px_rgba(245,158,11,0.3)]">
                        Join
                    </button>
</div>
</div>
</div>
<!-- Asymmetric Promotional Banner -->
<div class="relative overflow-hidden bg-[#FFF7E6] rounded-lg p-10 mt-16 flex flex-col md:flex-row items-center gap-8">
<div class="flex-1 space-y-4">
<h3 class="font-['Rubik'] font-extrabold text-2xl text-[#111827]">Don't see your church?</h3>
<p class="text-[#4B5563] text-lg">Contact your ministry leaders to get your congregation added to Gather or start a new digital sanctuary today.</p>
<button class="flex items-center gap-2 text-[#F59E0B] font-bold py-2 group">
                    Register a new church
                    <span class="material-symbols-outlined transition-transform group-hover:translate-x-1" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
<div class="w-full md:w-1/3 aspect-square rounded-md overflow-hidden">
<img class="w-full h-full object-cover grayscale opacity-40 mix-blend-multiply" data-alt="Diverse group of people gathering in a bright modern community hall, talking and laughing together" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD75XmRvW8yY3YPCwDttOxUzK36MDyTMCuXhD6Nep2vF4Y6TLPwJyBz3pB5jI2aBqaaycN_Xgu0Hsj96IIXnFrnYjGj2v3eR6i0LfU2FKeaIMGiACbuzctXhDAKBoxfrWz5RJWkPfxSTCRS6pyDIzpXJUnBwcRFcuQCh2_W-8gXa8sP2kVXCyipNjKrAy4d8p9liYqji6nCm4rmWInENLCcy56dwKGui5Fk9I2-WwWG0PVjYhFPLT_edNGMLoOxjRev8zNoUJWNOjg"/>
</div>
</div>
</main>
<!-- BottomNavBar (Hidden on desktop as per rules) -->
<nav class="fixed bottom-3 left-3 right-3 z-50 flex justify-around items-center py-3 bg-white/85 backdrop-blur-xl rounded-full mx-4 mb-4 shadow-[0_32px_32px_-4px_rgba(245,158,11,0.08)] md:hidden">
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined mb-1" data-icon="home">home</span>
<span class="font-['Rubik'] text-[0.6rem] uppercase tracking-wider font-bold">Home</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined mb-1" data-icon="newspaper">newspaper</span>
<span class="font-['Rubik'] text-[0.6rem] uppercase tracking-wider font-bold">News</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined mb-1" data-icon="calendar_month">calendar_month</span>
<span class="font-['Rubik'] text-[0.6rem] uppercase tracking-wider font-bold">Events</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined mb-1" data-icon="article">article</span>
<span class="font-['Rubik'] text-[0.6rem] uppercase tracking-wider font-bold">Bulletin</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined mb-1" data-icon="volunteer_activism">volunteer_activism</span>
<span class="font-['Rubik'] text-[0.6rem] uppercase tracking-wider font-bold">Serve</span>
</a>
</nav>
</body></html>

<!-- News -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700;800&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "tertiary-container": "#ff9837",
                    "surface-container-lowest": "#ffffff",
                    "secondary-fixed": "#e3e2df",
                    "background": "#fdfcf8",
                    "inverse-primary": "#ffb95f",
                    "secondary": "#5e5f5c",
                    "inverse-surface": "#2f312e",
                    "surface-container-low": "#f4f4f0",
                    "surface-tint": "#855300",
                    "tertiary-fixed-dim": "#ffb77d",
                    "inverse-on-surface": "#f2f1ed",
                    "primary-fixed-dim": "#ffb95f",
                    "surface-container-high": "#e9e8e4",
                    "primary-fixed": "#ffddb8",
                    "outline": "#867461",
                    "on-secondary-fixed": "#1b1c1a",
                    "error-container": "#ffdad6",
                    "on-secondary-container": "#626361",
                    "surface-variant": "#e3e2df",
                    "on-background": "#1b1c1a",
                    "tertiary": "#904d00",
                    "on-secondary": "#ffffff",
                    "primary": "#855300",
                    "on-primary-container": "#613b00",
                    "outline-variant": "#d8c3ad",
                    "surface-container": "#efeeea",
                    "tertiary-fixed": "#ffdcc3",
                    "on-primary-fixed": "#2a1700",
                    "surface-dim": "#dbdad6",
                    "on-surface-variant": "#534434",
                    "on-secondary-fixed-variant": "#464745",
                    "on-tertiary-fixed": "#2f1500",
                    "on-error": "#ffffff",
                    "on-error-container": "#93000a",
                    "on-primary": "#ffffff",
                    "primary-container": "#f59e0b",
                    "on-tertiary-container": "#6a3700",
                    "secondary-fixed-dim": "#c7c6c4",
                    "on-surface": "#1b1c1a",
                    "error": "#ba1a1a",
                    "on-tertiary-fixed-variant": "#6e3900",
                    "surface-container-highest": "#e3e2df",
                    "on-tertiary": "#ffffff",
                    "secondary-container": "#e0e0dd",
                    "surface": "#faf9f5",
                    "surface-bright": "#faf9f5",
                    "on-primary-fixed-variant": "#653e00"
            },
            "borderRadius": {
                    "DEFAULT": "1rem",
                    "lg": "2rem",
                    "xl": "3rem",
                    "full": "9999px"
            },
            "fontFamily": {
                    "headline": ["Rubik", "Plus Jakarta Sans"],
                    "body": ["Rubik", "Plus Jakarta Sans"],
                    "label": ["Rubik", "Plus Jakarta Sans"]
            }
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .amber-aura {
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        }
        .glass-nav {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(24px);
        }
        body {
            background-color: #FDFCF8;
            font-family: 'Rubik', sans-serif;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="text-on-surface">
<!-- TopAppBar from JSON -->
<header class="fixed top-0 w-full z-50 bg-[#FDFCF8] flex justify-between items-center px-6 py-4 mt-2">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-[#F59E0B] text-2xl">church</span>
<h1 class="text-[1.75rem] font-bold text-[#111827] tracking-tight">Gather</h1>
</div>
<div class="w-10 h-10 rounded-full overflow-hidden bg-surface-container">
<img alt="User Profile" class="w-full h-full object-cover" data-alt="Close up portrait of a smiling man with friendly eyes in soft natural morning light, minimalist background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9mWpf2ViCo5XSgYwuSCna9zLqmssLNof_QGFE6_XRgDmLCk8VOJioKFeaouZDzZrY-ERBgQiGmdRnnp5Ux8GSGGSGS6WcchEn4mWzilu_sqUQo03WrDgqEvL-3aYAxYuLdetpoiJ0Ncx0oYEtRJ3yFEuViYaRhmQMqSaLXi4eTGMeLGq808LulHS3DHEkgO6W5mPLPMzcV2M-fvJjHonw8M2j-W-aFKm6UeQfVJBqpwEqzjz8GmOyoCkO3HH4ZHrmHbZZeFF2ApA"/>
</div>
</header>
<main class="pt-24 pb-32 px-6 max-w-2xl mx-auto min-h-screen">
<!-- Refresh Indicator Hint (Asymmetric Design) -->
<div class="flex justify-center mb-8 opacity-40">
<span class="material-symbols-outlined animate-bounce">expand_more</span>
</div>
<!-- Editorial Header -->
<section class="mb-12">
<h2 class="text-[3.5rem] leading-none font-extrabold tracking-tight text-on-surface mb-4">News</h2>
<p class="text-on-surface-variant body-lg leading-relaxed max-w-md">
                Stay connected with the heart of our sanctuary. Updates, stories, and seasonal announcements.
            </p>
</section>
<!-- Announcements Feed -->
<div class="space-y-12">
<!-- Featured Announcement (Bento Style) -->
<article class="group relative bg-surface-container-low rounded-lg p-8 hover:bg-surface-container transition-all duration-300">
<div class="flex justify-between items-start mb-6">
<span class="label-md uppercase tracking-wider text-primary font-bold">Featured</span>
<span class="text-on-surface-variant text-sm font-medium">Today</span>
</div>
<h3 class="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">Spring Community Garden Launch</h3>
<p class="text-on-surface-variant body-lg leading-relaxed mb-6">
                    Join us this Saturday as we break ground on our new organic community garden. We're looking for volunteers of all skill levels to help plant seeds and prepare the soil for a season of growth.
                </p>
<div class="w-full h-48 rounded-md overflow-hidden mb-6">
<img alt="Community Garden" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="Sun-drenched community garden with wooden raised beds, lush green seedlings, and warm atmospheric golden hour lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBK_aQJwflINtVWyC3C3ASy9CLAkCtB9Nhdt-iJwOPTCAymMoMMPpd2lJVbfopt-KlXyuHxf-z9gI8J1WGG46aW62a7dgVti7VUPOT5K6dpmcVvzspC5_NqW43bfngLcpX3BAD6uRj-RQoU8OypRKvw4WUep_qfv5s3HNadamJEgiqWpoKpKVtmTNg1WNgqJf3VUPVm310uyxeNSS39l4lREVZyHvkE9E9v0NfhyIOpJ2zvbXkONXgSbbukSRx58VLwu_svfwnKyGE"/>
</div>
<button class="amber-aura text-white px-8 py-3 rounded-full font-medium scale-100 active:scale-95 transition-all">
                    Register to Help
                </button>
</article>
<!-- Standard List Items (No Borders, Spacing used as separator) -->
<article class="px-2">
<div class="flex items-center gap-2 mb-2">
<span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1;">circle</span>
<span class="text-on-surface-variant text-sm font-medium">2 days ago</span>
</div>
<h3 class="text-xl font-bold mb-2">Renovations in the North Wing</h3>
<p class="text-on-surface-variant body-lg leading-relaxed">
                    Starting Monday, the North Wing will be closed for floor polishing and repainting. Mid-week studies will move to the Main Hall temporarily.
                </p>
</article>
<article class="px-2">
<span class="text-on-surface-variant text-sm font-medium block mb-2">4 days ago</span>
<h3 class="text-xl font-bold mb-2">Summer Youth Retreat: Early Bird</h3>
<p class="text-on-surface-variant body-lg leading-relaxed">
                    Registration is now open for the Wilderness Seekers retreat. Secure your spot before May 1st to receive the commemorative t-shirt and discounted rate.
                </p>
</article>
<article class="bg-[#FFF7E6] rounded-md p-8">
<div class="flex items-center gap-4 mb-4">
<div class="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary">
<span class="material-symbols-outlined">volunteer_activism</span>
</div>
<div>
<h3 class="text-xl font-bold">Food Bank Collection</h3>
<span class="text-on-surface-variant text-sm">Last week</span>
</div>
</div>
<p class="text-on-surface-variant body-lg leading-relaxed mb-4">
                    Our monthly drive was a huge success. Thanks to your generosity, we collected over 500lbs of dry goods for the local pantry.
                </p>
<div class="flex gap-2">
<span class="px-3 py-1 bg-white rounded-full text-xs font-bold text-primary-container uppercase tracking-tight">Gratitude</span>
<span class="px-3 py-1 bg-white rounded-full text-xs font-bold text-primary-container uppercase tracking-tight">Mission</span>
</div>
</article>
<article class="px-2">
<span class="text-on-surface-variant text-sm font-medium block mb-2">1 week ago</span>
<h3 class="text-xl font-bold mb-2">Choir Practice Schedule Change</h3>
<p class="text-on-surface-variant body-lg leading-relaxed">
                    Please note that Thursday rehearsals will now begin at 6:30 PM instead of 7:00 PM to allow for more time on the Easter cantata pieces.
                </p>
</article>
</div>
</main>
<!-- BottomNavBar from JSON -->
<nav class="fixed bottom-3 left-3 right-3 z-50 flex justify-around items-center py-3 bg-white/85 backdrop-blur-xl rounded-full mx-4 mb-4 shadow-[0_32px_32px_-4px_rgba(245,158,11,0.08)]">
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined" data-icon="home">home</span>
<span class="font-['Rubik'] text-[0.75rem] uppercase tracking-wider mt-1">Home</span>
</a>
<a class="flex flex-col items-center justify-center bg-[#FFF7E6] text-[#F59E0B] rounded-full px-4 py-2 transition-all duration-300 ease-in-out" href="#">
<span class="material-symbols-outlined" data-icon="newspaper" style="font-variation-settings: 'FILL' 1;">newspaper</span>
<span class="font-['Rubik'] text-[0.75rem] uppercase tracking-wider mt-1">News</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined" data-icon="calendar_month">calendar_month</span>
<span class="font-['Rubik'] text-[0.75rem] uppercase tracking-wider mt-1">Events</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined" data-icon="article">article</span>
<span class="font-['Rubik'] text-[0.75rem] uppercase tracking-wider mt-1">Bulletin</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined" data-icon="volunteer_activism">volunteer_activism</span>
<span class="font-['Rubik'] text-[0.75rem] uppercase tracking-wider mt-1">Serve</span>
</a>
</nav>
</body></html>

<!-- Home -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Gather - Home</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&amp;family=Rubik:wght@300;400;500;600;700;800&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "tertiary-container": "#ff9837",
                    "surface-container-lowest": "#ffffff",
                    "secondary-fixed": "#e3e2df",
                    "background": "#faf9f5",
                    "inverse-primary": "#ffb95f",
                    "secondary": "#5e5f5c",
                    "inverse-surface": "#2f312e",
                    "surface-container-low": "#f4f4f0",
                    "surface-tint": "#855300",
                    "tertiary-fixed-dim": "#ffb77d",
                    "inverse-on-surface": "#f2f1ed",
                    "primary-fixed-dim": "#ffb95f",
                    "surface-container-high": "#e9e8e4",
                    "primary-fixed": "#ffddb8",
                    "outline": "#867461",
                    "on-secondary-fixed": "#1b1c1a",
                    "error-container": "#ffdad6",
                    "on-secondary-container": "#626361",
                    "surface-variant": "#e3e2df",
                    "on-background": "#1b1c1a",
                    "tertiary": "#904d00",
                    "on-secondary": "#ffffff",
                    "primary": "#855300",
                    "on-primary-container": "#613b00",
                    "outline-variant": "#d8c3ad",
                    "surface-container": "#efeeea",
                    "tertiary-fixed": "#ffdcc3",
                    "on-primary-fixed": "#2a1700",
                    "surface-dim": "#dbdad6",
                    "on-surface-variant": "#534434",
                    "on-secondary-fixed-variant": "#464745",
                    "on-tertiary-fixed": "#2f1500",
                    "on-error": "#ffffff",
                    "on-error-container": "#93000a",
                    "on-primary": "#ffffff",
                    "primary-container": "#f59e0b",
                    "on-tertiary-container": "#6a3700",
                    "secondary-fixed-dim": "#c7c6c4",
                    "on-surface": "#1b1c1a",
                    "error": "#ba1a1a",
                    "on-tertiary-fixed-variant": "#6e3900",
                    "surface-container-highest": "#e3e2df",
                    "on-tertiary": "#ffffff",
                    "secondary-container": "#e0e0dd",
                    "surface": "#faf9f5",
                    "surface-bright": "#faf9f5",
                    "on-primary-fixed-variant": "#653e00"
            },
            "borderRadius": {
                    "DEFAULT": "1rem",
                    "lg": "2rem",
                    "xl": "3rem",
                    "full": "9999px"
            },
            "fontFamily": {
                    "headline": ["Plus Jakarta Sans"],
                    "body": ["Plus Jakarta Sans"],
                    "label": ["Plus Jakarta Sans"],
                    "rubik": ["Rubik"]
            }
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            display: inline-block;
            vertical-align: middle;
        }
        .amber-aura {
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        }
        .glass-nav {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background font-body text-on-surface min-h-screen pb-32">
<!-- TopAppBar from JSON -->
<header class="w-full top-0 sticky z-40 bg-[#FDFCF8] flex justify-between items-center px-6 py-4 mt-2">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-[#F59E0B] text-2xl" data-icon="church">church</span>
<h1 class="font-['Rubik'] headline-md text-[#111827] text-[1.75rem] font-bold tracking-tight">Gather</h1>
</div>
<div class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed">
<img alt="User Profile" class="w-full h-full object-cover" data-alt="portrait of a smiling woman with warm lighting and a soft bokeh background of a sunny garden" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCDtGplT8RKGm4smH4W47ZfU1N4_dwxUmH4vRS_wLIjrop9Np2CEdjjxDssqtX4GVWLhukAwQBqUI3NV8hJaLi9gpF8sB3eWv3BVzep-rDYzWtlGc5k8oKuWZUMFFgsKaaTTDV6ijccttFznmwjG54BWoqI8MpNm5MVQptfGqJkIZerIDxlE9cNk0xPufeLME2RyH2h6V7tsbJKt7j3xF16Wwh0AqX9TtFBAbudVOJcQ2C4Vkbp54w9-QkzGG6NuWFnSpn_eT3e6w"/>
</div>
</header>
<main class="max-w-2xl mx-auto px-6 space-y-10 mt-6">
<!-- Message of the Day: Editorial Moment -->
<section class="relative overflow-hidden rounded-lg p-10 bg-surface-container-low">
<div class="absolute -top-12 -right-12 w-48 h-48 bg-primary opacity-5 rounded-full blur-3xl"></div>
<div class="relative z-10 space-y-6">
<span class="label-md uppercase tracking-wider text-primary font-bold">Message of the Day</span>
<p class="font-rubik text-3xl md:text-4xl lg:text-5xl font-light italic leading-tight text-on-surface-variant">
                    "Let all that you do be done in love."
                </p>
<p class="text-on-surface/60 font-medium tracking-wide">1 COR 16:14</p>
</div>
</section>
<!-- Quick Access Bento Row -->
<section class="grid grid-cols-3 gap-4">
<button class="flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-md shadow-[0_4px_20px_-4px_rgba(245,158,11,0.05)] hover:bg-[#FFF7E6] transition-all duration-300 group">
<span class="material-symbols-outlined text-primary text-3xl mb-3 transition-transform group-hover:scale-110" data-icon="groups">groups</span>
<span class="text-sm font-semibold tracking-tight text-on-surface">Members</span>
</button>
<button class="flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-md shadow-[0_4px_20px_-4px_rgba(245,158,11,0.05)] hover:bg-[#FFF7E6] transition-all duration-300 group">
<span class="material-symbols-outlined text-primary text-3xl mb-3 transition-transform group-hover:scale-110" data-icon="diversity_3">diversity_3</span>
<span class="text-sm font-semibold tracking-tight text-on-surface">Groups</span>
</button>
<button class="flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-md shadow-[0_4px_20px_-4px_rgba(245,158,11,0.05)] hover:bg-[#FFF7E6] transition-all duration-300 group">
<span class="material-symbols-outlined text-primary text-3xl mb-3 transition-transform group-hover:scale-110" data-icon="calendar_today">calendar_today</span>
<span class="text-sm font-semibold tracking-tight text-on-surface">Calendar</span>
</button>
</section>
<!-- Upcoming Events Section -->
<section class="space-y-6">
<div class="flex justify-between items-end px-2">
<h2 class="font-rubik text-2xl font-bold tracking-tight text-on-surface">Upcoming Events</h2>
<button class="text-primary font-bold text-sm">See All</button>
</div>
<div class="space-y-4">
<!-- Event Row 1 -->
<div class="flex items-center justify-between p-5 bg-surface-container-lowest rounded-md transition-all hover:bg-surface-container-low cursor-pointer">
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center">
<span class="text-primary font-bold">12</span>
</div>
<div>
<h3 class="font-bold text-on-surface">Community Potluck</h3>
<p class="text-sm text-on-surface-variant">Today • 6:30 PM</p>
</div>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="chevron_right">chevron_right</span>
</div>
<!-- Event Row 2 -->
<div class="flex items-center justify-between p-5 bg-surface-container-lowest rounded-md transition-all hover:bg-surface-container-low cursor-pointer">
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center">
<span class="text-primary font-bold">14</span>
</div>
<div>
<h3 class="font-bold text-on-surface">Youth Bible Study</h3>
<p class="text-sm text-on-surface-variant">Wednesday • 7:00 PM</p>
</div>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="chevron_right">chevron_right</span>
</div>
<!-- Event Row 3 -->
<div class="flex items-center justify-between p-5 bg-surface-container-lowest rounded-md transition-all hover:bg-surface-container-low cursor-pointer">
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center">
<span class="text-primary font-bold">17</span>
</div>
<div>
<h3 class="font-bold text-on-surface">Morning Prayer</h3>
<p class="text-sm text-on-surface-variant">Saturday • 8:30 AM</p>
</div>
</div>
<span class="material-symbols-outlined text-outline-variant" data-icon="chevron_right">chevron_right</span>
</div>
</div>
</section>
<!-- Attendance Placeholder Widget -->
<section class="bg-surface-container rounded-lg p-8">
<div class="flex justify-between items-center mb-8">
<div>
<h2 class="font-rubik text-xl font-bold tracking-tight text-on-surface">Attendance</h2>
<p class="text-sm text-on-surface-variant">Trends this month</p>
</div>
<div class="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center gap-1">
<span class="material-symbols-outlined text-sm" data-icon="trending_up">trending_up</span>
                    +12%
                </div>
</div>
<!-- Simple Bar Chart Placeholder -->
<div class="flex items-end justify-between h-32 px-2 gap-4">
<div class="flex-1 bg-primary-fixed rounded-t-lg transition-all hover:bg-primary" style="height: 40%;"></div>
<div class="flex-1 bg-primary-fixed rounded-t-lg transition-all hover:bg-primary" style="height: 65%;"></div>
<div class="flex-1 bg-primary-fixed rounded-t-lg transition-all hover:bg-primary" style="height: 55%;"></div>
<div class="flex-1 bg-primary-fixed rounded-t-lg transition-all hover:bg-primary" style="height: 85%;"></div>
<div class="flex-1 bg-primary-fixed rounded-t-lg transition-all hover:bg-primary" style="height: 70%;"></div>
<div class="flex-1 bg-primary rounded-t-lg transition-all" style="height: 95%;"></div>
</div>
<div class="flex justify-between mt-4 px-2 text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">
<span>Wk 1</span>
<span>Wk 2</span>
<span>Wk 3</span>
<span>Wk 4</span>
<span>Wk 5</span>
<span>Now</span>
</div>
</section>
</main>
<!-- BottomNavBar from JSON -->
<nav class="fixed bottom-3 left-3 right-3 z-50 flex justify-around items-center py-3 bg-white/85 backdrop-blur-xl rounded-full mx-4 mb-4 shadow-[0_32px_32px_-4px_rgba(245,158,11,0.08)]">
<a class="flex flex-col items-center justify-center bg-[#FFF7E6] text-[#F59E0B] rounded-full px-4 py-2 transition-all duration-300" href="#">
<span class="material-symbols-outlined" data-icon="home" style="font-variation-settings: 'FILL' 1;">home</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider text-[10px] mt-1">Home</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined" data-icon="newspaper">newspaper</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider text-[10px] mt-1">News</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined" data-icon="calendar_month">calendar_month</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider text-[10px] mt-1">Events</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined" data-icon="article">article</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider text-[10px] mt-1">Bulletin</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined" data-icon="volunteer_activism">volunteer_activism</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider text-[10px] mt-1">Serve</span>
</a>
</nav>
</body></html>

<!-- Events -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Gather - Events Calendar</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700;800&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "tertiary-container": "#ff9837",
                    "surface-container-lowest": "#ffffff",
                    "secondary-fixed": "#e3e2df",
                    "background": "#FDFCF8",
                    "inverse-primary": "#ffb95f",
                    "secondary": "#5e5f5c",
                    "inverse-surface": "#2f312e",
                    "surface-container-low": "#f4f4f0",
                    "surface-tint": "#855300",
                    "tertiary-fixed-dim": "#ffb77d",
                    "inverse-on-surface": "#f2f1ed",
                    "primary-fixed-dim": "#ffb95f",
                    "surface-container-high": "#e9e8e4",
                    "primary-fixed": "#ffddb8",
                    "outline": "#867461",
                    "on-secondary-fixed": "#1b1c1a",
                    "error-container": "#ffdad6",
                    "on-secondary-container": "#626361",
                    "surface-variant": "#e3e2df",
                    "on-background": "#1b1c1a",
                    "tertiary": "#904d00",
                    "on-secondary": "#ffffff",
                    "primary": "#855300",
                    "on-primary-container": "#613b00",
                    "outline-variant": "#d8c3ad",
                    "surface-container": "#efeeea",
                    "tertiary-fixed": "#ffdcc3",
                    "on-primary-fixed": "#2a1700",
                    "surface-dim": "#dbdad6",
                    "on-surface-variant": "#534434",
                    "on-secondary-fixed-variant": "#464745",
                    "on-tertiary-fixed": "#2f1500",
                    "on-error": "#ffffff",
                    "on-error-container": "#93000a",
                    "on-primary": "#ffffff",
                    "primary-container": "#f59e0b",
                    "on-tertiary-container": "#6a3700",
                    "secondary-fixed-dim": "#c7c6c4",
                    "on-surface": "#1b1c1a",
                    "error": "#ba1a1a",
                    "on-tertiary-fixed-variant": "#6e3900",
                    "surface-container-highest": "#e3e2df",
                    "on-tertiary": "#ffffff",
                    "secondary-container": "#e0e0dd",
                    "surface": "#FDFCF8",
                    "surface-bright": "#FDFCF8",
                    "on-primary-fixed-variant": "#653e00"
            },
            "borderRadius": {
                    "DEFAULT": "1rem",
                    "lg": "2rem",
                    "xl": "3rem",
                    "full": "9999px"
            },
            "fontFamily": {
                    "headline": ["Rubik", "sans-serif"],
                    "body": ["Plus Jakarta Sans", "sans-serif"],
                    "label": ["Plus Jakarta Sans", "sans-serif"]
            }
          },
        }
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .amber-aura {
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        }
        .organic-amber-shadow {
            box-shadow: 0 32px 32px -4px rgba(245, 158, 11, 0.08);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-surface font-body selection:bg-primary-fixed">
<!-- TopAppBar -->
<header class="bg-[#FDFCF8] w-full top-0 sticky z-40">
<div class="flex justify-between items-center w-full px-6 py-4 mt-2">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-[#F59E0B] text-2xl">church</span>
<h1 class="text-[1.75rem] font-bold text-[#111827] tracking-tight font-['Rubik']">Gather</h1>
</div>
<div class="flex items-center gap-4">
<button class="bg-surface-container-low p-2 rounded-full hover:bg-[#FFF7E6] transition-all duration-300">
<span class="material-symbols-outlined text-on-surface-variant">search</span>
</button>
<div class="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary-container/20">
<img alt="User Profile" class="w-full h-full object-cover" data-alt="Close up portrait of a young woman with a warm smile in soft natural morning sunlight" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5qVEdZp960r5RTWHDLo4BxGVxmwwu_GlO5oVcwkV0ciRae-5Tr3BUn5HmHcWYMlfesBmoRnai6EfTzz_UPhxE4nj2EsXSwu2tqB4cJj8JxEWUIpFSh6XMdHrATA8QcibOo1zg4WpNIrbjrvojaWpAtjfP8SI99t3tG46G-uJuF4Te9zhvcNfLieaLV4H1p9n4kqUoGVg4IK2207D-1Qq5PXNNU7V8kAO6-qqoPxK6RxKeGMZxnVZNCcvFOZWmlsVdz_iB9MzWbj4"/>
</div>
</div>
</div>
</header>
<main class="pb-32">
<!-- Date Strip Container -->
<section class="mt-4 px-6">
<div class="flex justify-between items-end mb-6">
<div>
<h2 class="font-headline headline-md text-2xl font-bold text-on-surface">September</h2>
<p class="text-on-surface-variant body-lg">Sanctuary Events</p>
</div>
<button class="bg-surface-container-low px-5 py-2 rounded-full font-medium text-primary hover:bg-[#FFF7E6] transition-all duration-300 flex items-center gap-2">
<span class="material-symbols-outlined text-sm">event_repeat</span>
                    Today
                </button>
</div>
<!-- 60-day day strip -->
<div class="flex overflow-x-auto hide-scrollbar gap-3 py-2 -mx-6 px-6">
<!-- Active Day -->
<div class="flex flex-col items-center justify-center min-w-[3.5rem] h-20 bg-primary-container text-white rounded-full transition-all duration-300 shadow-lg shadow-primary-container/20">
<span class="label-md font-bold uppercase tracking-wider opacity-80">Mon</span>
<span class="text-xl font-bold">12</span>
</div>
<!-- Other Days (Mocked subset of 60) -->
<div class="flex flex-col items-center justify-center min-w-[3.5rem] h-20 bg-white rounded-full text-on-surface-variant hover:bg-[#FFF7E6] transition-all duration-300 cursor-pointer">
<span class="label-md font-bold uppercase tracking-wider opacity-60">Tue</span>
<span class="text-xl font-bold">13</span>
</div>
<div class="flex flex-col items-center justify-center min-w-[3.5rem] h-20 bg-white rounded-full text-on-surface-variant hover:bg-[#FFF7E6] transition-all duration-300 cursor-pointer">
<span class="label-md font-bold uppercase tracking-wider opacity-60">Wed</span>
<span class="text-xl font-bold">14</span>
</div>
<div class="flex flex-col items-center justify-center min-w-[3.5rem] h-20 bg-white rounded-full text-on-surface-variant hover:bg-[#FFF7E6] transition-all duration-300 cursor-pointer">
<span class="label-md font-bold uppercase tracking-wider opacity-60">Thu</span>
<span class="text-xl font-bold">15</span>
</div>
<div class="flex flex-col items-center justify-center min-w-[3.5rem] h-20 bg-white rounded-full text-on-surface-variant hover:bg-[#FFF7E6] transition-all duration-300 cursor-pointer">
<span class="label-md font-bold uppercase tracking-wider opacity-60">Fri</span>
<span class="text-xl font-bold">16</span>
</div>
<div class="flex flex-col items-center justify-center min-w-[3.5rem] h-20 bg-white rounded-full text-on-surface-variant hover:bg-[#FFF7E6] transition-all duration-300 cursor-pointer">
<span class="label-md font-bold uppercase tracking-wider opacity-60">Sat</span>
<span class="text-xl font-bold">17</span>
</div>
<div class="flex flex-col items-center justify-center min-w-[3.5rem] h-20 bg-white rounded-full text-on-surface-variant hover:bg-[#FFF7E6] transition-all duration-300 cursor-pointer">
<span class="label-md font-bold uppercase tracking-wider opacity-60">Sun</span>
<span class="text-xl font-bold">18</span>
</div>
<div class="flex flex-col items-center justify-center min-w-[3.5rem] h-20 bg-white rounded-full text-on-surface-variant hover:bg-[#FFF7E6] transition-all duration-300 cursor-pointer">
<span class="label-md font-bold uppercase tracking-wider opacity-60">Mon</span>
<span class="text-xl font-bold">19</span>
</div>
</div>
</section>
<!-- Timeline / Main Area -->
<section class="mt-8 px-6 space-y-8">
<!-- Time Block -->
<div class="relative flex gap-6">
<!-- Timeline indicator -->
<div class="flex flex-col items-center shrink-0">
<span class="label-md font-bold text-primary py-1 px-2 bg-primary-fixed/30 rounded-lg">08:00 AM</span>
<div class="w-px h-full bg-outline-variant/30 mt-2"></div>
</div>
<div class="flex-1 pb-4">
<!-- Event Card -->
<div class="group bg-surface-container-lowest rounded-lg p-5 organic-amber-shadow hover:scale-[1.01] transition-all duration-300">
<div class="flex justify-between items-start mb-3">
<span class="bg-primary/5 text-primary text-[0.65rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Community</span>
<span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">more_vert</span>
</div>
<h3 class="headline-md text-xl font-bold text-on-surface mb-2 leading-tight">Morning Meditation &amp; Prayer</h3>
<div class="flex items-center gap-4 text-on-surface-variant label-md">
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-[1rem]">location_on</span>
                                Main Sanctuary
                            </div>
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-[1rem]">group</span>
                                24 attending
                            </div>
</div>
</div>
</div>
</div>
<!-- Time Block -->
<div class="relative flex gap-6">
<div class="flex flex-col items-center shrink-0">
<span class="label-md font-bold text-on-surface-variant py-1 px-2">10:30 AM</span>
<div class="w-px h-full bg-outline-variant/30 mt-2"></div>
</div>
<div class="flex-1 pb-4">
<div class="bg-surface-container rounded-lg p-5 flex flex-col md:flex-row gap-6 hover:bg-surface-container-high transition-colors cursor-pointer">
<div class="w-full md:w-32 h-32 rounded-md overflow-hidden shrink-0">
<img alt="Coffee Connect" class="w-full h-full object-cover" data-alt="Artisanal coffee cups on a wooden table with soft morning sunlight casting long shadows" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZbvgOZWD0o1zmflAz7CCnn65ZEZhyeSIy1RsjwhytuN13LFva6WvArAxGymphCXIzvUBoHytpSx9fhMFSs4o5l_Vh5rFsqg66t7K4AQAXlEBpnlRoF4Op9W_JXx4RCFdvLFOaOh4EHe5W77Wzu1MGFN_iTj6aRxorLudzu6YVGS0b8ghRVzhAtvkWNfEHZMPjS1q-gSWgh_mPhC25F-_94U0LcsEI1KrqQQs64lPFN760kqL7pZ5-BdNEEcmnJOOC5QzmIWOozaw"/>
</div>
<div class="flex flex-col justify-center">
<h3 class="headline-md text-xl font-bold text-on-surface mb-1">Coffee Connect</h3>
<p class="body-lg text-on-surface-variant mb-3 line-clamp-2">A casual space for new members to meet the team and learn about our mission over local roasts.</p>
<div class="flex items-center gap-2 text-primary font-bold">
<span class="material-symbols-outlined">coffee</span>
<span class="label-md uppercase tracking-wider">Social Hall B</span>
</div>
</div>
</div>
</div>
</div>
<!-- Time Block -->
<div class="relative flex gap-6">
<div class="flex flex-col items-center shrink-0">
<span class="label-md font-bold text-on-surface-variant py-1 px-2">12:00 PM</span>
<div class="w-px h-full bg-outline-variant/30 mt-2"></div>
</div>
<div class="flex-1 pb-4">
<div class="bg-surface-container-lowest rounded-lg p-5 organic-amber-shadow">
<div class="flex justify-between items-start mb-3">
<span class="bg-tertiary/5 text-tertiary text-[0.65rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Serve</span>
<span class="material-symbols-outlined text-outline-variant">more_vert</span>
</div>
<h3 class="headline-md text-xl font-bold text-on-surface mb-2 leading-tight">Neighborhood Food Drive</h3>
<div class="flex items-center gap-4 text-on-surface-variant label-md">
<div class="flex items-center gap-1">
<span class="material-symbols-outlined text-[1rem]">location_on</span>
                                East Entrance
                            </div>
</div>
<div class="mt-4 flex -space-x-2">
<img alt="volunteer" class="w-8 h-8 rounded-full border-2 border-white" data-alt="portrait of a man smiling" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAmmCVS06psmeh9N8BoI-7Cx2N2qijiycI8LeJu9yvEqY2Ax0fss09iyFyUsWcG6Q26DLPlUIeiYgK8ztK3JKSdhXkxzJUKOt_ZtupvW4BZE5ALwXVYdQjpEN_Cc5egADYwjHOeQ8dllfNhc4-rjIzM5m-efiGkPZAmqtBlIj23YuUkDmtcpPxrp3bfWzc8tsh5cB8oTWPFgEEQzkOBRcHgGqViwuO0KHpc0AqT4AMjJnlTjvAOrgWk9FxsRvThn9Z0zPTnU-RyPo"/>
<img alt="volunteer" class="w-8 h-8 rounded-full border-2 border-white" data-alt="portrait of a woman laughing" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRp2gw18DPNeEv1vUIJPDo-wMjre8dmZBG8_GMHarecAZ9seo6XqU0_sps17IaVISLU9HPZv1Acqus1_-60ORB_iM1f-XQKayLnE7vT1mdtfJdS6m4VlFvBy-WBaOBMvoft4i-BOpHsmoijXyTZ-fJD0GlQXhTIlSWhb_j9zuupnbjvjae9BxIDuBx-nHvgnSyGsWjeIEfCdO9uPKkBzwL87QwzqqYR67vGygs9NvmChVfhCKqFPeceLedZn9msSstopvW8PkasPQ"/>
<div class="w-8 h-8 rounded-full border-2 border-white bg-surface-container-high flex items-center justify-center text-[0.6rem] font-bold text-on-surface-variant">+12</div>
</div>
</div>
</div>
</div>
</section>
</main>
<!-- Floating Action Button (Contextual for Calendar) -->
<button class="fixed bottom-24 right-6 w-14 h-14 amber-aura text-white rounded-full flex items-center justify-center shadow-xl z-40 transition-all duration-300 hover:scale-105 active:scale-95">
<span class="material-symbols-outlined text-2xl">add</span>
</button>
<!-- BottomNavBar -->
<nav class="fixed bottom-3 left-3 right-3 z-50 flex justify-around items-center py-3 bg-white/85 backdrop-blur-xl rounded-full mx-4 mb-4 shadow-[0_32px_32px_-4px_rgba(245,158,11,0.08)]">
<!-- Home -->
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">home</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider mt-1">Home</span>
</a>
<!-- News -->
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">newspaper</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider mt-1">News</span>
</a>
<!-- Events (Active) -->
<a class="flex flex-col items-center justify-center bg-[#FFF7E6] text-[#F59E0B] rounded-full px-4 py-2 scale-95 transition-all duration-300 ease-in-out" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">calendar_month</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider mt-1">Events</span>
</a>
<!-- Bulletin -->
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">article</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider mt-1">Bulletin</span>
</a>
<!-- Serve -->
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">volunteer_activism</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider mt-1">Serve</span>
</a>
</nav>
</body></html>

<!-- Event Detail -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700;800&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "tertiary-container": "#ff9837",
                    "surface-container-lowest": "#ffffff",
                    "secondary-fixed": "#e3e2df",
                    "background": "#faf9f5",
                    "inverse-primary": "#ffb95f",
                    "secondary": "#5e5f5c",
                    "inverse-surface": "#2f312e",
                    "surface-container-low": "#f4f4f0",
                    "surface-tint": "#855300",
                    "tertiary-fixed-dim": "#ffb77d",
                    "inverse-on-surface": "#f2f1ed",
                    "primary-fixed-dim": "#ffb95f",
                    "surface-container-high": "#e9e8e4",
                    "primary-fixed": "#ffddb8",
                    "outline": "#867461",
                    "on-secondary-fixed": "#1b1c1a",
                    "error-container": "#ffdad6",
                    "on-secondary-container": "#626361",
                    "surface-variant": "#e3e2df",
                    "on-background": "#1b1c1a",
                    "tertiary": "#904d00",
                    "on-secondary": "#ffffff",
                    "primary": "#855300",
                    "on-primary-container": "#613b00",
                    "outline-variant": "#d8c3ad",
                    "surface-container": "#efeeea",
                    "tertiary-fixed": "#ffdcc3",
                    "on-primary-fixed": "#2a1700",
                    "surface-dim": "#dbdad6",
                    "on-surface-variant": "#534434",
                    "on-secondary-fixed-variant": "#464745",
                    "on-tertiary-fixed": "#2f1500",
                    "on-error": "#ffffff",
                    "on-error-container": "#93000a",
                    "on-primary": "#ffffff",
                    "primary-container": "#f59e0b",
                    "on-tertiary-container": "#6a3700",
                    "secondary-fixed-dim": "#c7c6c4",
                    "on-surface": "#1b1c1a",
                    "error": "#ba1a1a",
                    "on-tertiary-fixed-variant": "#6e3900",
                    "surface-container-highest": "#e3e2df",
                    "on-tertiary": "#ffffff",
                    "secondary-container": "#e0e0dd",
                    "surface": "#faf9f5",
                    "surface-bright": "#faf9f5",
                    "on-primary-fixed-variant": "#653e00"
            },
            "borderRadius": {
                    "DEFAULT": "1rem",
                    "lg": "2rem",
                    "xl": "3rem",
                    "full": "9999px"
            },
            "fontFamily": {
                    "headline": ["Rubik", "sans-serif"],
                    "body": ["Plus Jakarta Sans", "sans-serif"],
                    "label": ["Rubik", "sans-serif"]
            }
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .amber-aura-gradient {
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        }
        .glass-nav {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(24px);
        }
        body {
            background-color: #FDFCF8;
            color: #111827;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="font-body selection:bg-primary-container/30">
<!-- TopAppBar -->
<header class="bg-[#FDFCF8] w-full top-0 sticky z-40">
<div class="flex justify-between items-center w-full px-6 py-4 mt-2">
<div class="flex items-center gap-3">
<div class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#FFF7E6] transition-all duration-300 cursor-pointer">
<span class="material-symbols-outlined text-[#F59E0B]">arrow_back</span>
</div>
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-[#F59E0B]">church</span>
<h1 class="text-[1.75rem] font-bold text-[#111827] tracking-tight font-['Rubik']">Gather</h1>
</div>
</div>
<div class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container/20 hover:scale-95 transition-all duration-300 ease-in-out cursor-pointer">
<img alt="User Profile" class="w-full h-full object-cover" data-alt="Close up portrait of a friendly man with a warm smile, soft natural studio lighting, clean background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1fPv2nEAZn7z9a6eDGjkUA_lspfCRIZ1jiQBaxyymKa18lYQpzGJj1NppeAmOrEtPGeVRnqtUJ6dhydNiAYfnv0AJ7okl_DTqhPJLqC15T1dOyIqsxzW130-OGH4oQqR8RJ6mLz4vXMgEi85FEyRGKyqt0ZUdOhjzOHn8RdXdiXlyVNYS-WirrlNccBPRvogv84F3HFZb1CtrakL_rKHdKoNUJ2FTznKRtjTceREgSN7vwMXMc58pd2mETOt_q1u67cGHn1GhBJA"/>
</div>
</div>
</header>
<main class="pb-32">
<!-- Hero Section -->
<section class="px-4 md:px-8 mb-8">
<div class="relative w-full h-[353px] md:h-[442px] rounded-xl overflow-hidden group">
<img alt="Event Header" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="Community gathering in a sunlit open space with warm amber lighting, people interacting joyfully in a sophisticated modern setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVnk4UHN2ZgweY0FnQFQGu0FoPwaxaou3qdMfsxxQk8aqYqqIH3Zo32TPhteXyL4zKbpN0vkWSSAu53PDVwqo1heRPlRKujtcrlu-bDZJM_7lLipaJkcxrdZWqWCv5vB_G8bTgcFc05H9Iax5b6wpcRE9w33Deg3iHNgGDouVpkdjjNPuXWG_uM3gdloFFgmUaLavbInnx0Pci6YVbkHxfi-HkRZDQp-uuwwFLkS9p349flryH1c1UpDATPlYCcN9EQs8XumZLrK8"/>
<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
<div class="absolute bottom-8 left-8 right-8">
<span class="inline-block px-4 py-1 rounded-full bg-primary-container text-white text-xs font-bold uppercase tracking-widest mb-4">Featured Event</span>
<h2 class="text-white text-4xl md:text-6xl font-extrabold font-headline leading-tight tracking-tight">Community Harvest Dinner</h2>
</div>
</div>
</section>
<!-- Details Bento Grid -->
<section class="px-4 md:px-8 max-w-6xl mx-auto">
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
<!-- Main Content Area -->
<div class="md:col-span-2 space-y-8">
<!-- Event Meta Info -->
<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
<div class="flex items-center gap-4 p-5 rounded-lg bg-surface-container-low">
<div class="w-12 h-12 flex items-center justify-center rounded-full bg-primary-container/10 text-primary">
<span class="material-symbols-outlined">calendar_today</span>
</div>
<div>
<p class="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label">Date</p>
<p class="text-lg font-bold text-on-surface">Oct 24, 2024</p>
</div>
</div>
<div class="flex items-center gap-4 p-5 rounded-lg bg-surface-container-low">
<div class="w-12 h-12 flex items-center justify-center rounded-full bg-primary-container/10 text-primary">
<span class="material-symbols-outlined">schedule</span>
</div>
<div>
<p class="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label">Time</p>
<p class="text-lg font-bold text-on-surface">6:00 PM</p>
</div>
</div>
<div class="flex items-center gap-4 p-5 rounded-lg bg-surface-container-low">
<div class="w-12 h-12 flex items-center justify-center rounded-full bg-primary-container/10 text-primary">
<span class="material-symbols-outlined">location_on</span>
</div>
<div>
<p class="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label">Location</p>
<p class="text-lg font-bold text-on-surface">The Great Hall</p>
</div>
</div>
</div>
<!-- Description Text -->
<div class="space-y-6">
<h3 class="text-2xl font-bold font-headline text-on-surface">About the Event</h3>
<p class="text-lg leading-relaxed text-secondary font-body">
                            Join us for our annual Community Harvest Dinner, a night dedicated to gratitude and togetherness. We're bringing together local artisans, families, and neighbors for a curated seasonal menu prepared by our volunteer chefs. 
                        </p>
<p class="text-lg leading-relaxed text-secondary font-body">
                            This year, we're focusing on the "Illuminated Sanctuary" theme—creating a space that feels like a warm exhale. Expect live acoustic music, communal tables adorned with local flora, and stories shared across generations. Whether you're a long-time member or a first-time visitor, there's a seat at the table for you.
                        </p>
<!-- Map Preview -->
<div class="w-full h-64 rounded-lg overflow-hidden bg-surface-container-high relative">
<img alt="Map location" class="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-500" data-alt="Stylized map showing a specific neighborhood with soft amber markers and minimalist design aesthetic" data-location="Austin, Texas" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqFfR-kC9us40Pljg5dUzLcoH6qcUU816I9DrNO6ToUT1vG1mYzY6296VaOdSHZi4nMesqe8eNm3VMPh5MmcWcyuY4dRK_xVDR-a2NAJ6sY3TTeaAJt9Va5YiH9djq9loeG78zqY4LU1h3g68i-OHlYdpGNznAy6q1myODYd5zdcgSurDPf6Np7TumOlrwjrFygy9vJBBgKOGPeGPHJwwNdiQfCLRL3VCgEF4wig-nxwYyG8hCY-PqdG_4jK-YmzRVfil5kpLXArk"/>
<div class="absolute inset-0 flex items-center justify-center">
<div class="bg-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 border border-primary-container/20">
<span class="material-symbols-outlined text-primary">directions</span>
<span class="font-bold text-on-surface">Open in Maps</span>
</div>
</div>
</div>
</div>
</div>
<!-- Sidebar RSVP Card -->
<div class="md:col-span-1">
<div class="sticky top-24 p-8 rounded-lg bg-white shadow-[0_32px_32px_-4px_rgba(245,158,11,0.08)] space-y-8">
<div class="text-center">
<h4 class="text-xl font-bold font-headline text-on-surface mb-2">Are you joining us?</h4>
<p class="text-sm text-secondary">34 members are already going!</p>
</div>
<!-- Attendee Avatars -->
<div class="flex justify-center -space-x-3">
<img class="w-10 h-10 rounded-full border-2 border-white object-cover" data-alt="Portrait of a smiling woman in warm lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVBkSJ9gRH0hQb3g-Vg2QjCoIbfgCwRwd56m8XUEU-vQ5zdxwMrZUU9uprVEMxxS9kcqPZ3JKKBJRk5U_R2O949zOF0AdRV78TT2uMlnrk0-v1X5IwuyPEtToNowcdZaGhkmvZKdj23oqjIms6AGlO5ms5Me2Cm70wtIw0FcLPIZfqfDV3Q8Cx1HUhrOr-XCwMhdfZK6NShukl2bwqv5myiBsPEUEsGNZkoFyMKNgBd-fGURnSbOV80hrLUs1RM0OV-WWFu71B2yQ"/>
<img class="w-10 h-10 rounded-full border-2 border-white object-cover" data-alt="Portrait of a young man with a friendly expression" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKtOm0CrOy6BtlHpeA3mABjkuaw0yCsaUZd7i7asfd8qPPoxytUfmJGV0b2cXy_c4wq0z_OjQbW2MN-zIxcroy_oloxUjzod8N9Php4Fr8PwbufdKXK4gS2K3Dtn-21DJDiXUPujDU8LKUiw1vU3omR6Zl2QdoElYlmbvqmj4BpPv_tjSIAs7fCU5gCufDoMx25iw1Yi3sn2L8ZPVsVkfQIs69VnrpEow9lCSC8KkoxKZN6JTgZ9kSS-JNWjCgh1TL-7OIrJrdnEA"/>
<img class="w-10 h-10 rounded-full border-2 border-white object-cover" data-alt="Portrait of a thoughtful woman with soft natural light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcMWYSiT8ITg_ksY68a2YRy1H9p3jyLiHyoR91T0lYm021aSFqvIRGldKEgGNd6_ievTVaERA1jbfRJYiku9OyRAXWVREjmyZPN4RS8KnhtGX6CpMpHyJJ886TQA3TBzGEdJu1vtCQ58d2USjGjtYlrc5wlMnJSnj65opaoqJnQKwJIwp_SrxykN_3EYBGMEFE_Kg-Bx7ZowJ_IiGb6obW2-zKqaD44AFgmcowOnZubQYBEoiR-DfEn4MBMB0ysZ5Mw9J7CAQRO30"/>
<div class="w-10 h-10 rounded-full border-2 border-white bg-primary-container flex items-center justify-center text-[10px] font-bold text-white tracking-tighter">+31</div>
</div>
<!-- RSVP Buttons -->
<div class="space-y-3">
<button class="w-full py-4 amber-aura-gradient rounded-full text-white font-bold tracking-wide hover:scale-[0.98] transition-all duration-300 shadow-[0_12px_24px_-8px_rgba(245,158,11,0.4)]">
                                Going
                            </button>
<button class="w-full py-4 rounded-full border-2 border-outline-variant/40 text-on-surface font-bold tracking-wide hover:bg-[#FFF7E6] hover:border-primary-container/40 transition-all duration-300">
                                Maybe
                            </button>
<button class="w-full py-4 rounded-full text-secondary font-medium tracking-wide hover:text-error transition-colors duration-300">
                                Can't go
                            </button>
</div>
<div class="pt-6 border-t border-surface-container-low">
<button class="w-full flex items-center justify-center gap-2 text-primary font-bold text-sm">
<span class="material-symbols-outlined text-sm">share</span>
                                Share with friends
                            </button>
</div>
</div>
</div>
</div>
</section>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-3 left-3 right-3 z-50 glass-nav rounded-full mx-4 mb-4 flex justify-around items-center py-3 shadow-[0_32px_32px_-4px_rgba(245,158,11,0.08)]">
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">home</span>
<span class="font-['Rubik'] text-[0.65rem] uppercase tracking-wider mt-1">Home</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">newspaper</span>
<span class="font-['Rubik'] text-[0.65rem] uppercase tracking-wider mt-1">News</span>
</a>
<a class="flex flex-col items-center justify-center bg-[#FFF7E6] text-[#F59E0B] rounded-full px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">calendar_month</span>
<span class="font-['Rubik'] text-[0.65rem] uppercase tracking-wider mt-1">Events</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">article</span>
<span class="font-['Rubik'] text-[0.65rem] uppercase tracking-wider mt-1">Bulletin</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">volunteer_activism</span>
<span class="font-['Rubik'] text-[0.65rem] uppercase tracking-wider mt-1">Serve</span>
</a>
</nav>
</body></html>

<!-- Bulletin -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "tertiary-container": "#ff9837",
                    "surface-container-lowest": "#ffffff",
                    "secondary-fixed": "#e3e2df",
                    "background": "#faf9f5",
                    "inverse-primary": "#ffb95f",
                    "secondary": "#5e5f5c",
                    "inverse-surface": "#2f312e",
                    "surface-container-low": "#f4f4f0",
                    "surface-tint": "#855300",
                    "tertiary-fixed-dim": "#ffb77d",
                    "inverse-on-surface": "#f2f1ed",
                    "primary-fixed-dim": "#ffb95f",
                    "surface-container-high": "#e9e8e4",
                    "primary-fixed": "#ffddb8",
                    "outline": "#867461",
                    "on-secondary-fixed": "#1b1c1a",
                    "error-container": "#ffdad6",
                    "on-secondary-container": "#626361",
                    "surface-variant": "#e3e2df",
                    "on-background": "#1b1c1a",
                    "tertiary": "#904d00",
                    "on-secondary": "#ffffff",
                    "primary": "#855300",
                    "on-primary-container": "#613b00",
                    "outline-variant": "#d8c3ad",
                    "surface-container": "#efeeea",
                    "tertiary-fixed": "#ffdcc3",
                    "on-primary-fixed": "#2a1700",
                    "surface-dim": "#dbdad6",
                    "on-surface-variant": "#534434",
                    "on-secondary-fixed-variant": "#464745",
                    "on-tertiary-fixed": "#2f1500",
                    "on-error": "#ffffff",
                    "on-error-container": "#93000a",
                    "on-primary": "#ffffff",
                    "primary-container": "#f59e0b",
                    "on-tertiary-container": "#6a3700",
                    "secondary-fixed-dim": "#c7c6c4",
                    "on-surface": "#1b1c1a",
                    "error": "#ba1a1a",
                    "on-tertiary-fixed-variant": "#6e3900",
                    "surface-container-highest": "#e3e2df",
                    "on-tertiary": "#ffffff",
                    "secondary-container": "#e0e0dd",
                    "surface": "#faf9f5",
                    "surface-bright": "#faf9f5",
                    "on-primary-fixed-variant": "#653e00"
            },
            "borderRadius": {
                    "DEFAULT": "1rem",
                    "lg": "2rem",
                    "xl": "3rem",
                    "full": "9999px"
            },
            "fontFamily": {
                    "headline": ["Plus Jakarta Sans"],
                    "body": ["Plus Jakarta Sans"],
                    "label": ["Plus Jakarta Sans"]
            }
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .amber-aura {
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        }
        .glass-nav {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background font-body text-on-surface antialiased min-h-screen pb-32">
<!-- TopAppBar -->
<header class="bg-[#FDFCF8] flex justify-between items-center w-full px-6 py-4 mt-2 sticky top-0 z-40">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-[#F59E0B] text-2xl" data-icon="church">church</span>
<h1 class="text-[1.75rem] font-bold text-[#111827] tracking-tight font-['Rubik']">Gather</h1>
</div>
<div class="w-10 h-10 rounded-full bg-surface-container overflow-hidden">
<img alt="User Profile" class="w-full h-full object-cover" data-alt="close-up portrait of a smiling person in a bright airy studio with warm natural lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuChxPPslrq5-h5I-PYZunDck6VgGQpu7KZfEy-kqv82rTFRcLGdtIJbvKz6IFdnRHCuF7cJHap9Le-KDCSJopZmhqBoXq8lmp20saJ7nq7LzutnU2JtiKFdaBoCoXOwSX4F3M851cbxpUFF36RPvBbJEnPZbBDzRUo2QDJ9mqNpCKutr3F_IBtilmtQtr_DAdyJWqCmJ7HFgQoW3mR7JKif32MJjD8F-5aTvuj9_o8eaEcu0Iikxfnh5xuVXUOVk7cW0RsBw_UaCs0"/>
</div>
</header>
<main class="px-6 max-w-5xl mx-auto space-y-8">
<!-- Hero Header -->
<section class="mt-8">
<div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<span class="text-primary font-bold label-md uppercase tracking-wider block mb-2">Current Bulletin</span>
<h2 class="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight font-headline">Sunday Morning Service</h2>
<p class="text-on-surface-variant body-lg mt-2 flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-xl">event</span>
                        October 22, 2023 • 10:30 AM
                    </p>
</div>
<div class="flex gap-3">
<button class="bg-surface-container-high text-on-surface font-medium px-6 py-3 rounded-full hover:bg-surface-container-highest transition-all">
                        Print PDF
                    </button>
<button class="amber-aura text-white font-bold px-6 py-3 rounded-full hover:scale-95 transition-all shadow-lg">
                        Check In
                    </button>
</div>
</div>
</section>
<!-- Assignments Banner -->
<section class="amber-aura rounded-lg p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
<div class="relative z-10">
<h3 class="text-2xl font-bold mb-1">Your Assignments</h3>
<p class="opacity-90">You have 2 roles today. Please be at the stage by 10:15 AM.</p>
<div class="mt-4 flex gap-4">
<div class="bg-white/20 rounded-full px-4 py-2 flex items-center gap-2 backdrop-blur-sm">
<span class="material-symbols-outlined text-sm">mic</span>
<span class="font-medium">Worship Lead</span>
</div>
<div class="bg-white/20 rounded-full px-4 py-2 flex items-center gap-2 backdrop-blur-sm">
<span class="material-symbols-outlined text-sm">record_voice_over</span>
<span class="font-medium">Scripture Reading</span>
</div>
</div>
</div>
<div class="absolute -right-10 -top-10 opacity-10">
<span class="material-symbols-outlined text-[12rem]">volunteer_activism</span>
</div>
</section>
<!-- Main Content Grid -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
<!-- Order of Service -->
<section class="lg:col-span-8 space-y-4">
<div class="flex items-center justify-between mb-2">
<h3 class="headline-md font-bold text-on-surface">Order of Service</h3>
<span class="bg-[#FFF7E6] text-primary px-3 py-1 rounded-full text-xs font-bold">60 MIN TOTAL</span>
</div>
<div class="space-y-3">
<!-- Item 1 -->
<div class="bg-surface-container-lowest p-6 rounded-lg transition-all hover:translate-x-1 group">
<div class="flex justify-between items-start">
<div class="flex gap-4">
<span class="text-outline-variant font-bold text-xl mt-1">01</span>
<div>
<h4 class="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">Opening Hymn: Amazing Grace</h4>
<p class="text-on-surface-variant body-lg mt-1">Standard arrangement with acoustic guitar intro.</p>
</div>
</div>
<div class="flex flex-col items-end">
<span class="bg-surface-container-low text-on-surface px-3 py-1 rounded-full text-xs font-bold">5 MIN</span>
</div>
</div>
</div>
<!-- Item 2 -->
<div class="bg-surface-container-lowest p-6 rounded-lg border-l-4 border-primary shadow-sm">
<div class="flex justify-between items-start">
<div class="flex gap-4">
<span class="text-primary font-bold text-xl mt-1">02</span>
<div>
<h4 class="text-xl font-bold text-on-surface">Call to Worship</h4>
<p class="text-on-surface-variant body-lg mt-1 italic">Read Psalm 100 together as a congregation.</p>
<div class="mt-3 inline-flex items-center gap-2 text-primary font-bold text-sm">
<span class="material-symbols-outlined text-sm">person</span>
                                        Assigned to You
                                    </div>
</div>
</div>
<div class="flex flex-col items-end">
<span class="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-xs font-bold">3 MIN</span>
</div>
</div>
</div>
<!-- Item 3 -->
<div class="bg-surface-container-lowest p-6 rounded-lg transition-all hover:translate-x-1 group">
<div class="flex justify-between items-start">
<div class="flex gap-4">
<span class="text-outline-variant font-bold text-xl mt-1">03</span>
<div>
<h4 class="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">Pastoral Prayer</h4>
<p class="text-on-surface-variant body-lg mt-1">Lead by Elder Thompson.</p>
</div>
</div>
<div class="flex flex-col items-end">
<span class="bg-surface-container-low text-on-surface px-3 py-1 rounded-full text-xs font-bold">7 MIN</span>
</div>
</div>
</div>
<!-- Item 4 -->
<div class="bg-surface-container-lowest p-6 rounded-lg transition-all hover:translate-x-1 group">
<div class="flex justify-between items-start">
<div class="flex gap-4">
<span class="text-outline-variant font-bold text-xl mt-1">04</span>
<div>
<h4 class="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">Sermon: The Way Home</h4>
<p class="text-on-surface-variant body-lg mt-1">Sermon notes available in the mobile app downloads section.</p>
</div>
</div>
<div class="flex flex-col items-end">
<span class="bg-surface-container-low text-on-surface px-3 py-1 rounded-full text-xs font-bold">30 MIN</span>
</div>
</div>
</div>
<!-- Item 5 -->
<div class="bg-surface-container-lowest p-6 rounded-lg transition-all hover:translate-x-1 group">
<div class="flex justify-between items-start">
<div class="flex gap-4">
<span class="text-outline-variant font-bold text-xl mt-1">05</span>
<div>
<h4 class="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">Closing &amp; Benediction</h4>
<p class="text-on-surface-variant body-lg mt-1">Dismissal with quiet organ postlude.</p>
</div>
</div>
<div class="flex flex-col items-end">
<span class="bg-surface-container-low text-on-surface px-3 py-1 rounded-full text-xs font-bold">5 MIN</span>
</div>
</div>
</div>
</div>
</section>
<!-- Role Slots / Side Card -->
<aside class="lg:col-span-4 space-y-6">
<div class="bg-[#F5F4F1] p-8 rounded-lg">
<h3 class="headline-md font-bold text-on-surface mb-6">Service Team</h3>
<div class="space-y-6">
<div class="flex items-center justify-between">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-[#FFF7E6] text-primary flex items-center justify-center font-bold text-sm">
                                    LW
                                </div>
<div>
<p class="text-xs font-bold text-outline uppercase tracking-widest">Worship Lead</p>
<p class="font-bold text-on-surface">Lucas Walker</p>
</div>
</div>
<span class="material-symbols-outlined text-outline-variant">check_circle</span>
</div>
<div class="flex items-center justify-between">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-[#FFF7E6] text-primary flex items-center justify-center font-bold text-sm">
                                    ST
                                </div>
<div>
<p class="text-xs font-bold text-outline uppercase tracking-widest">A/V Tech</p>
<p class="font-bold text-on-surface">Sarah Tanner</p>
</div>
</div>
<span class="material-symbols-outlined text-outline-variant">check_circle</span>
</div>
<div class="flex items-center justify-between">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-[#FFF7E6] text-primary flex items-center justify-center font-bold text-sm">
                                    MJ
                                </div>
<div>
<p class="text-xs font-bold text-outline uppercase tracking-widest">Piano</p>
<p class="font-bold text-on-surface">Michael J.</p>
</div>
</div>
<span class="material-symbols-outlined text-outline-variant">check_circle</span>
</div>
<div class="flex items-center justify-between">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-outline-variant/20 text-outline flex items-center justify-center font-bold text-sm">
                                    ??
                                </div>
<div>
<p class="text-xs font-bold text-outline uppercase tracking-widest">Greeter</p>
<p class="font-bold text-on-surface-variant italic">Unassigned</p>
</div>
</div>
<button class="text-primary text-sm font-bold underline">Claim</button>
</div>
</div>
<div class="mt-10 pt-6 border-t border-outline-variant/10">
<div class="bg-surface-container-lowest rounded-md p-4">
<p class="text-sm font-bold text-on-surface mb-2">Stage Map</p>
<img alt="Stage Map" class="w-full rounded-sm grayscale opacity-60" data-alt="minimalist architectural floor plan of a church sanctuary stage showing microphone and instrument placement" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWMkElw_8skVOBcitR29dT72_8XHX9Y3Aptq4mCh7TskZq0EWFBnu91jbpAxczS1QYe7EVBAul5BbCQWv9SaFPlL-O6EXJUVMsJVIasqjnfBhQu54mqXEAX29sO_ugm-N6ktXmBSvuNdbZoZjbxVsgsc5m1KQ_7GhG9ZjoqOtrVFvn8PMSK6cuEvKhJ23tyYBhcAn_2VP3nwx9JsjTX3xkMXCDpkeoZUPTWxNQc5Vt0AfrwNC3LsRldzMnkbvtB02iEMpHhIu1eR4"/>
</div>
</div>
</div>
</aside>
</div>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-3 left-3 right-3 z-50 flex justify-around items-center py-3 bg-white/85 backdrop-blur-xl rounded-full mx-4 mb-4 shadow-[0_32px_32px_-4px_rgba(245,158,11,0.08)]">
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined" data-icon="home">home</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider mt-1">Home</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined" data-icon="newspaper">newspaper</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider mt-1">News</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined" data-icon="calendar_month">calendar_month</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider mt-1">Events</span>
</a>
<a class="flex flex-col items-center justify-center bg-[#FFF7E6] text-[#F59E0B] rounded-full px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined" data-icon="article">article</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider mt-1">Bulletin</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined" data-icon="volunteer_activism">volunteer_activism</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider mt-1">Serve</span>
</a>
</nav>
</body></html>

<!-- Members -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "tertiary-container": "#ff9837",
                    "surface-container-lowest": "#ffffff",
                    "secondary-fixed": "#e3e2df",
                    "background": "#faf9f5",
                    "inverse-primary": "#ffb95f",
                    "secondary": "#5e5f5c",
                    "inverse-surface": "#2f312e",
                    "surface-container-low": "#f4f4f0",
                    "surface-tint": "#855300",
                    "tertiary-fixed-dim": "#ffb77d",
                    "inverse-on-surface": "#f2f1ed",
                    "primary-fixed-dim": "#ffb95f",
                    "surface-container-high": "#e9e8e4",
                    "primary-fixed": "#ffddb8",
                    "outline": "#867461",
                    "on-secondary-fixed": "#1b1c1a",
                    "error-container": "#ffdad6",
                    "on-secondary-container": "#626361",
                    "surface-variant": "#e3e2df",
                    "on-background": "#1b1c1a",
                    "tertiary": "#904d00",
                    "on-secondary": "#ffffff",
                    "primary": "#855300",
                    "on-primary-container": "#613b00",
                    "outline-variant": "#d8c3ad",
                    "surface-container": "#efeeea",
                    "tertiary-fixed": "#ffdcc3",
                    "on-primary-fixed": "#2a1700",
                    "surface-dim": "#dbdad6",
                    "on-surface-variant": "#534434",
                    "on-secondary-fixed-variant": "#464745",
                    "on-tertiary-fixed": "#2f1500",
                    "on-error": "#ffffff",
                    "on-error-container": "#93000a",
                    "on-primary": "#ffffff",
                    "primary-container": "#f59e0b",
                    "on-tertiary-container": "#6a3700",
                    "secondary-fixed-dim": "#c7c6c4",
                    "on-surface": "#1b1c1a",
                    "error": "#ba1a1a",
                    "on-tertiary-fixed-variant": "#6e3900",
                    "surface-container-highest": "#e3e2df",
                    "on-tertiary": "#ffffff",
                    "secondary-container": "#e0e0dd",
                    "surface": "#faf9f5",
                    "surface-bright": "#faf9f5",
                    "on-primary-fixed-variant": "#653e00"
            },
            "borderRadius": {
                    "DEFAULT": "1rem",
                    "lg": "2rem",
                    "xl": "3rem",
                    "full": "9999px"
            },
            "fontFamily": {
                    "headline": ["Rubik", "sans-serif"],
                    "body": ["Plus Jakarta Sans", "sans-serif"],
                    "label": ["Plus Jakarta Sans", "sans-serif"]
            }
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .amber-aura {
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        }
        body {
            background-color: #FDFCF8;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="min-h-screen text-on-surface">
<!-- TopAppBar -->
<header class="fixed top-0 z-50 w-full bg-[#FDFCF8] flex justify-between items-center px-6 py-4 mt-2">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-[#F59E0B]">church</span>
<span class="text-[1.75rem] font-bold text-[#111827] tracking-tight font-['Rubik']">Gather</span>
</div>
<div class="flex items-center gap-4">
<button class="p-2 hover:bg-[#FFF7E6] transition-all duration-300 rounded-full">
<span class="material-symbols-outlined text-[#4B5563]">search</span>
</button>
<div class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container">
<img alt="User Profile" class="w-full h-full object-cover" data-alt="close-up portrait of a friendly smiling man with short beard in warm natural sunlight" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCt5DdHqO9yZFK2lWPHzo8QSLaxkFcQ8lJ-jeB6OLfPXfEwaV3WMG8PpmfsKfOAs9HHeVU0zGNml8qiJjwJVfgxPGYW47EhuCmzniJ-75Xbj-MzJlnKIiPLyyImgX17eh9wOhONzSW1_DC3MJqSU6aJYGb45Oj7WWPE6l_GOkdSexP1U8MpVZ7vBQZCpGZ6j82MewdA2SMZU3tcI7su4DDxab5CzVq3eL8eAMgBrgRnDoTeBzU48On6icEvz9fkQeubXuF7iLX8ooo"/>
</div>
</div>
</header>
<main class="pt-24 pb-32 px-6 max-w-4xl mx-auto">
<!-- Search & Filter Header -->
<div class="mb-10">
<h1 class="font-headline text-[3.5rem] leading-tight font-bold tracking-tight mb-6 text-on-surface">Community Directory</h1>
<div class="relative group">
<div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
<span class="material-symbols-outlined text-outline">search</span>
</div>
<input class="w-full bg-surface-container-low border-none rounded-sm py-4 pl-12 pr-6 focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all duration-300 text-body-lg" placeholder="Find a member by name or role..." type="text"/>
</div>
</div>
<!-- Current User (Highlighted) -->
<div class="mb-12">
<h2 class="font-label text-[0.75rem] uppercase tracking-wider text-outline mb-4 ml-2">My Profile</h2>
<div class="bg-primary-soft rounded-lg p-6 bg-[#FFF7E6] shadow-[0_8px_24px_-8px_rgba(245,158,11,0.12)] border border-primary-container/10 flex items-center justify-between group hover:scale-[1.01] transition-all duration-300">
<div class="flex items-center gap-5">
<div class="relative">
<img alt="My Profile" class="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" data-alt="close-up portrait of a smiling man with gentle eyes and light beard in warm lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9Nk9QaUsC46itqcnvLik7QcCzuuGBEdhIkQ7gg3wljTcNXVg0ITsE62rafNTNlxv197iqn42sPsFZp7_qBLDF-MCFSa9qSXPBV1YRlvA2ZbwdgEk1QFE1e1IHbP9hMNPYR2TRlAUXsHaeM8-blwnxA5wVV4IOBq4ynariwl6cKZvLaS0zqCbUNhY8DJdX5H0_e9VI0zsLyHSz3UpB9TQQw2IW9T1hhEWtYz-1MRTC9ZE0625K-WLzSB-5DWBZxSujDrrtmyRdjDU"/>
<div class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
</div>
<div>
<div class="flex items-center gap-2">
<h3 class="font-headline text-xl font-bold text-on-surface">David Miller</h3>
<span class="px-3 py-0.5 bg-primary-container text-white text-[0.7rem] font-bold rounded-full uppercase tracking-tighter">Admin</span>
</div>
<p class="text-secondary text-sm">david.miller@sanctuary.org</p>
</div>
</div>
<button class="p-3 rounded-full hover:bg-white transition-colors duration-300">
<span class="material-symbols-outlined text-primary">edit_note</span>
</button>
</div>
</div>
<!-- Directory List -->
<div class="space-y-4">
<div class="flex justify-between items-center mb-6 ml-2">
<h2 class="font-label text-[0.75rem] uppercase tracking-wider text-outline">Sanctuary Members</h2>
<span class="text-xs text-outline">124 Members</span>
</div>
<!-- Member Rows -->
<!-- Member 1 -->
<div class="bg-surface-container-lowest rounded-md p-5 flex items-center justify-between hover:bg-[#FFF7E6] transition-all duration-300 group cursor-pointer">
<div class="flex items-center gap-5">
<img alt="Sarah Chen" class="w-12 h-12 rounded-full object-cover" data-alt="portrait of a young woman with a bright smile wearing a knitted sweater in a sunlit cozy room" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnKnMNg7raWCm3tzE759Ke9ano4fEvxiMIUluaAYH-V94QfS21CgrCuewiz8Hy_Q8jSHQSmrZh3PNaFY-nTV71KNh9TaD-41S_294gR1UeCxOJTEnoE_w_hjELNyM7WJdgP8QGpNwtGWPE0gic0zm3S9omjX99xm4Hcoud2IxJjeJEmKjKAFyufm2o-PSU6FOTg3ev4vuAmus6IA_X7AgT1buYdWwhcwshGcRMnyh4sRP5cthFIcwrAXoHodBhrMLfs6abip_SL4w"/>
<div>
<h3 class="font-headline text-lg font-semibold text-on-surface group-hover:text-primary transition-colors">Sarah Chen</h3>
<p class="text-secondary text-sm">sarah.c@community.com</p>
</div>
</div>
<div class="flex items-center gap-6">
<span class="hidden md:inline px-3 py-1 bg-surface-container text-secondary text-[0.7rem] font-medium rounded-full uppercase tracking-wider">Service Team</span>
<span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">mail</span>
</div>
</div>
<!-- Member 2 -->
<div class="bg-surface-container-lowest rounded-md p-5 flex items-center justify-between hover:bg-[#FFF7E6] transition-all duration-300 group cursor-pointer">
<div class="flex items-center gap-5">
<img alt="Marcus Thompson" class="w-12 h-12 rounded-full object-cover" data-alt="middle-aged man with kind expression wearing glasses and a denim shirt against a soft bokeh background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSF6kFFdlkvApB_aEaJP7kMCIEu25U0KT1hI8ok6J8lFeP0XV1OL8d2Ph89DOVfhkGpNhuUA5C642VbOxdUk9v2vnYmnNMZZEkJyG82IyLxmTRcHIhA03RsWMbujcwwt_3_YoLo1OrQkJdkfCXy3ZxFyfeHAyLfeKdURoOz8iLO3ombxe6iGgz3g3jgAEj2LUgVds0imGi_DyUnwS1GoCZA2t8KTTpVia2IlUw7TYEPD2J811ifWIZ_RkHvCzotl4VcyRPogSCePk"/>
<div>
<h3 class="font-headline text-lg font-semibold text-on-surface group-hover:text-primary transition-colors">Marcus Thompson</h3>
<p class="text-secondary text-sm">m.thompson@email.net</p>
</div>
</div>
<div class="flex items-center gap-6">
<span class="hidden md:inline px-3 py-1 bg-surface-container text-secondary text-[0.7rem] font-medium rounded-full uppercase tracking-wider">Member</span>
<span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">mail</span>
</div>
</div>
<!-- Member 3 -->
<div class="bg-surface-container-lowest rounded-md p-5 flex items-center justify-between hover:bg-[#FFF7E6] transition-all duration-300 group cursor-pointer">
<div class="flex items-center gap-5">
<img alt="Jonathan Wu" class="w-12 h-12 rounded-full object-cover" data-alt="young man with short dark hair smiling warmly in golden hour outdoor lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_66t9XoM7DmuULCBqKK9qTjALi9FuwwWD3-q_f6d6bVoXIox8BffpYZrWvgfFZfVkCPxxr6g3QYm9yBVjoLOIVhGVBj9bOAvXvMOkRqw4kYGyl2t1LwAfxaIXwH6UXtcCWntqyTI_UdnlLptqnJL_lHHz2tYOcuVEE0E35joE-keDU5jkybWJGEbPXhP12ITj_U00ffbEW2B76eUHW_MLy7cxPvRYv-VujOH2jE8OZHq6AjZsfvYbBXcb3v4uReUlNKtanh1YM4U"/>
<div>
<h3 class="font-headline text-lg font-semibold text-on-surface group-hover:text-primary transition-colors">Jonathan Wu</h3>
<p class="text-secondary text-sm">j.wu@sanctuary.org</p>
</div>
</div>
<div class="flex items-center gap-6">
<span class="hidden md:inline px-3 py-1 bg-surface-container text-secondary text-[0.7rem] font-medium rounded-full uppercase tracking-wider">Service Team</span>
<span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">mail</span>
</div>
</div>
<!-- Member 4 -->
<div class="bg-surface-container-lowest rounded-md p-5 flex items-center justify-between hover:bg-[#FFF7E6] transition-all duration-300 group cursor-pointer">
<div class="flex items-center gap-5">
<img alt="Elena Rodriguez" class="w-12 h-12 rounded-full object-cover" data-alt="smiling woman with long hair in a peaceful outdoor setting with soft afternoon sun" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVHovshyRVDcSXEEXXjyQ_NJLEGRuFM-jkEgT6LEEVBNa302ivYLNyHp5-7fSbUxtPL6qXeQJweUdJT_spBAjbfRrehg1KolIt0T7YZx8ksRPwIbaDzvMeXZfRJADkB5eFdmlrksrZ1bqaigJWCq59k7ILhgS9aEFWe7HE2xIimeia_UYCdb0rmgRxGXHo_gaTBhkHAdVL8pDmZJBwAGbTEgeEHfYvQc4LeX--im6TKMCW6ZNY80ihaWdklXMq-snbdZ02d2IN214"/>
<div>
<h3 class="font-headline text-lg font-semibold text-on-surface group-hover:text-primary transition-colors">Elena Rodriguez</h3>
<p class="text-secondary text-sm">elena.r@webmail.com</p>
</div>
</div>
<div class="flex items-center gap-6">
<span class="hidden md:inline px-3 py-1 bg-surface-container text-secondary text-[0.7rem] font-medium rounded-full uppercase tracking-wider">Member</span>
<span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">mail</span>
</div>
</div>
<!-- Member 5 -->
<div class="bg-surface-container-lowest rounded-md p-5 flex items-center justify-between hover:bg-[#FFF7E6] transition-all duration-300 group cursor-pointer">
<div class="flex items-center gap-5">
<img alt="Arthur P" class="w-12 h-12 rounded-full object-cover" data-alt="professional man with a friendly demeanor wearing a casual grey t-shirt in bright studio lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNjThJpCO0UvQCb5XFbdypsOSeg2e0u6fKwJe7TfBl9wEqth2cXBUzDtVg2ezSVQ7T0AqgHHoQbgTp4pzzMj1piTD7RMMHqfZ4awRb2vo3Lse6SxEkMrauST7pyWih9ruCewCMc3rq5KmjXcK3BYp8Ony7QYrjz1UWNNAt6TrC6DxFVhsWT4QChQafUjBeSUlJeQiU4LTwkPFwdcG6F7F32E53Za8JJtelKftDYo0RSWusHB7KY-dMmBS8va_65ZuQ1MS8w0axnuo"/>
<div>
<h3 class="font-headline text-lg font-semibold text-on-surface group-hover:text-primary transition-colors">Arthur P</h3>
<p class="text-secondary text-sm">arthur.p@church.org</p>
</div>
</div>
<div class="flex items-center gap-6">
<span class="hidden md:inline px-3 py-1 bg-surface-container text-secondary text-[0.7rem] font-medium rounded-full uppercase tracking-wider">Admin</span>
<span class="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">mail</span>
</div>
</div>
</div>
<!-- Load More (Asymmetric Layout Moment) -->
<div class="mt-12 flex justify-center">
<button class="amber-aura text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-primary-container/20 hover:scale-105 transition-all duration-300 flex items-center gap-2">
                Show more members
                <span class="material-symbols-outlined text-base">expand_more</span>
</button>
</div>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-3 left-3 right-3 z-50 bg-white/85 backdrop-blur-xl rounded-full mx-4 mb-4 shadow-[0_32px_32px_-4px_rgba(245,158,11,0.08)] flex justify-around items-center py-3">
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">home</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider text-[0.65rem] mt-1">Home</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">newspaper</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider text-[0.65rem] mt-1">News</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">calendar_month</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider text-[0.65rem] mt-1">Events</span>
</a>
<a class="flex flex-col items-center justify-center bg-[#FFF7E6] text-[#F59E0B] rounded-full px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">article</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider text-[0.65rem] mt-1">Bulletin</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">volunteer_activism</span>
<span class="font-['Rubik'] label-md uppercase tracking-wider text-[0.65rem] mt-1">Serve</span>
</a>
</nav>
</body></html>

<!-- Serve -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&amp;family=Rubik:wght@300;400;500;700;900&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "tertiary-container": "#ff9837",
                    "surface-container-lowest": "#ffffff",
                    "secondary-fixed": "#e3e2df",
                    "background": "#faf9f5",
                    "inverse-primary": "#ffb95f",
                    "secondary": "#5e5f5c",
                    "inverse-surface": "#2f312e",
                    "surface-container-low": "#f4f4f0",
                    "surface-tint": "#855300",
                    "tertiary-fixed-dim": "#ffb77d",
                    "inverse-on-surface": "#f2f1ed",
                    "primary-fixed-dim": "#ffb95f",
                    "surface-container-high": "#e9e8e4",
                    "primary-fixed": "#ffddb8",
                    "outline": "#867461",
                    "on-secondary-fixed": "#1b1c1a",
                    "error-container": "#ffdad6",
                    "on-secondary-container": "#626361",
                    "surface-variant": "#e3e2df",
                    "on-background": "#1b1c1a",
                    "tertiary": "#904d00",
                    "on-secondary": "#ffffff",
                    "primary": "#855300",
                    "on-primary-container": "#613b00",
                    "outline-variant": "#d8c3ad",
                    "surface-container": "#efeeea",
                    "tertiary-fixed": "#ffdcc3",
                    "on-primary-fixed": "#2a1700",
                    "surface-dim": "#dbdad6",
                    "on-surface-variant": "#534434",
                    "on-secondary-fixed-variant": "#464745",
                    "on-tertiary-fixed": "#2f1500",
                    "on-error": "#ffffff",
                    "on-error-container": "#93000a",
                    "on-primary": "#ffffff",
                    "primary-container": "#f59e0b",
                    "on-tertiary-container": "#6a3700",
                    "secondary-fixed-dim": "#c7c6c4",
                    "on-surface": "#1b1c1a",
                    "error": "#ba1a1a",
                    "on-tertiary-fixed-variant": "#6e3900",
                    "surface-container-highest": "#e3e2df",
                    "on-tertiary": "#ffffff",
                    "secondary-container": "#e0e0dd",
                    "surface": "#faf9f5",
                    "surface-bright": "#faf9f5",
                    "on-primary-fixed-variant": "#653e00"
            },
            "borderRadius": {
                    "DEFAULT": "1rem",
                    "lg": "2rem",
                    "xl": "3rem",
                    "full": "9999px"
            },
            "fontFamily": {
                    "headline": ["Plus Jakarta Sans"],
                    "body": ["Plus Jakarta Sans"],
                    "label": ["Plus Jakarta Sans"]
            }
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .amber-aura-gradient {
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        }
        .glass-nav {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(24px);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-[#FDFCF8] text-[#111827] font-body min-h-screen pb-32">
<!-- TopAppBar -->
<header class="bg-[#FDFCF8] w-full top-0 sticky z-40">
<div class="flex justify-between items-center w-full px-6 py-4 mt-2">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-[#F59E0B] text-2xl">church</span>
<h1 class="font-['Rubik'] text-[1.75rem] font-bold text-[#111827] tracking-tight">Gather</h1>
</div>
<div class="w-10 h-10 rounded-full bg-[#F5F4F1] flex items-center justify-center overflow-hidden border border-[#F5F4F1]">
<img alt="User Profile" class="w-full h-full object-cover" data-alt="portrait of a smiling man with a warm expression in soft natural morning light, high-end editorial style" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuxyprAcUtcpw6bGR87GczYWssVfuuagztlaA3Y3yAGVcQbayBeMuBhxcUw6TuO4vadUqGWVN7B6RRLysgOt-iPnUUdGXnOMV6VKkLWcXEeWogibl3GtAECptuvZeGf57tFa3ChCqBf2OFKRaf6D8OhbxMW8pXlJDPw3DBg3wnr1CmzLzfxH2UDgFcL8Gz42Rk7OpILzR43OReSjJ85YtTC1_ROEZuntO4BswJ79NAPaYqliMB2P1OYFVf8Yf5Ta9LKldVzmZ92Fc"/>
</div>
</div>
</header>
<main class="px-6 max-w-2xl mx-auto">
<!-- Hero Section -->
<section class="mt-8 mb-12">
<h2 class="font-['Rubik'] text-[3.5rem] leading-[1.1] font-bold tracking-tight mb-4">Serve</h2>
<div class="flex items-center gap-2 px-4 py-2 bg-[#FFF7E6] rounded-full inline-flex">
<span class="material-symbols-outlined text-[#F59E0B] text-sm" style="font-variation-settings: 'FILL' 1;">notification_important</span>
<span class="font-['Rubik'] text-[0.75rem] font-bold uppercase tracking-wider text-[#F59E0B]">2 ASSIGNMENTS NEED RESPONSE</span>
</div>
</section>
<!-- Assignments List -->
<div class="space-y-10">
<!-- Date Group -->
<div>
<h3 class="font-['Rubik'] text-[0.75rem] font-bold uppercase tracking-widest text-[#4B5563] mb-6 px-2">Sunday, Oct 22</h3>
<div class="space-y-4">
<!-- Assignment Card (Pending) -->
<div class="bg-white rounded-lg p-6 shadow-[0_32px_32px_-4px_rgba(245,158,11,0.04)] border border-transparent hover:border-[#F59E0B]/20 transition-all duration-300">
<div class="flex justify-between items-start mb-4">
<div>
<h4 class="font-['Rubik'] text-[1.25rem] font-semibold text-[#111827]">Welcome Team</h4>
<p class="text-[#4B5563] text-sm mt-1">Volunteer schedule</p>
</div>
<span class="px-3 py-1 rounded-full bg-[#FFF7E6] text-[#F59E0B] font-bold text-[0.65rem] uppercase tracking-wider">ASSIGNED</span>
</div>
<div class="flex items-center gap-2 mb-6 text-[#4B5563] text-sm">
<span class="material-symbols-outlined text-lg">schedule</span>
<span>9:00 AM — 10:30 AM</span>
</div>
<div class="flex gap-3">
<button class="flex-1 amber-aura-gradient text-white font-bold py-3 px-4 rounded-full text-sm scale-100 hover:scale-[0.98] transition-all duration-300">Confirm</button>
<button class="flex-1 bg-[#F5F4F1] text-[#4B5563] font-bold py-3 px-4 rounded-full text-sm hover:bg-[#E9E8E4] transition-all duration-300">Decline</button>
</div>
</div>
<!-- Assignment Card (Confirmed) -->
<div class="bg-white/60 rounded-lg p-6 border border-[#F5F4F1] transition-all duration-300">
<div class="flex justify-between items-start">
<div>
<h4 class="font-['Rubik'] text-[1.25rem] font-semibold text-[#111827]">Communion Server</h4>
<p class="text-[#4B5563] text-sm mt-1">Bulletin</p>
</div>
<div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F4F1] text-[#4B5563] font-bold text-[0.65rem] uppercase tracking-wider">
<span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                                CONFIRMED
                            </div>
</div>
<div class="flex items-center gap-2 mt-4 text-[#4B5563] text-sm">
<span class="material-symbols-outlined text-lg">schedule</span>
<span>10:30 AM — 12:00 PM</span>
</div>
</div>
</div>
</div>
<!-- Date Group -->
<div>
<h3 class="font-['Rubik'] text-[0.75rem] font-bold uppercase tracking-widest text-[#4B5563] mb-6 px-2">Wednesday, Oct 25</h3>
<div class="space-y-4">
<!-- Assignment Card (Pending) -->
<div class="bg-white rounded-lg p-6 shadow-[0_32px_32px_-4px_rgba(245,158,11,0.04)] border border-transparent hover:border-[#F59E0B]/20 transition-all duration-300">
<div class="flex justify-between items-start mb-4">
<div>
<h4 class="font-['Rubik'] text-[1.25rem] font-semibold text-[#111827]">Youth Mentor</h4>
<p class="text-[#4B5563] text-sm mt-1">Volunteer schedule</p>
</div>
<span class="px-3 py-1 rounded-full bg-[#FFF7E6] text-[#F59E0B] font-bold text-[0.65rem] uppercase tracking-wider">ASSIGNED</span>
</div>
<div class="flex items-center gap-2 mb-6 text-[#4B5563] text-sm">
<span class="material-symbols-outlined text-lg">schedule</span>
<span>6:30 PM — 8:00 PM</span>
</div>
<div class="flex gap-3">
<button class="flex-1 amber-aura-gradient text-white font-bold py-3 px-4 rounded-full text-sm scale-100 hover:scale-[0.98] transition-all duration-300">Confirm</button>
<button class="flex-1 bg-[#F5F4F1] text-[#4B5563] font-bold py-3 px-4 rounded-full text-sm hover:bg-[#E9E8E4] transition-all duration-300">Decline</button>
</div>
</div>
</div>
</div>
<!-- Date Group -->
<div>
<h3 class="font-['Rubik'] text-[0.75rem] font-bold uppercase tracking-widest text-[#4B5563] mb-6 px-2">Saturday, Oct 28</h3>
<div class="space-y-4">
<!-- Assignment Card (Confirmed) -->
<div class="bg-white/60 rounded-lg p-6 border border-[#F5F4F1] transition-all duration-300">
<div class="flex justify-between items-start">
<div>
<h4 class="font-['Rubik'] text-[1.25rem] font-semibold text-[#111827]">Landscape Maintenance</h4>
<p class="text-[#4B5563] text-sm mt-1">Serve Day</p>
</div>
<div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F4F1] text-[#4B5563] font-bold text-[0.65rem] uppercase tracking-wider">
<span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                                CONFIRMED
                            </div>
</div>
<div class="flex items-center gap-2 mt-4 text-[#4B5563] text-sm">
<span class="material-symbols-outlined text-lg">schedule</span>
<span>8:00 AM — 12:00 PM</span>
</div>
</div>
</div>
</div>
</div>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-3 left-3 right-3 z-50 flex justify-around items-center py-3 bg-white/85 backdrop-blur-xl rounded-full mx-4 mb-4 shadow-[0_32px_32px_-4px_rgba(245,158,11,0.08)]">
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">home</span>
<span class="font-['Rubik'] text-[0.75rem] uppercase tracking-wider mt-1">Home</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">newspaper</span>
<span class="font-['Rubik'] text-[0.75rem] uppercase tracking-wider mt-1">News</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">calendar_month</span>
<span class="font-['Rubik'] text-[0.75rem] uppercase tracking-wider mt-1">Events</span>
</a>
<a class="flex flex-col items-center justify-center text-[#4B5563] px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined">article</span>
<span class="font-['Rubik'] text-[0.75rem] uppercase tracking-wider mt-1">Bulletin</span>
</a>
<a class="flex flex-col items-center justify-center bg-[#FFF7E6] text-[#F59E0B] rounded-full px-4 py-2 hover:scale-105 transition-transform duration-300" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">volunteer_activism</span>
<span class="font-['Rubik'] text-[0.75rem] uppercase tracking-wider mt-1">Serve</span>
</a>
</nav>
</body></html> | Keep continuity, Do all pages and links. Complete the sidebar. No heavy glows.