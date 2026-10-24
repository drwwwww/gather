# Gather — Claude Code Project Brief

## Mission

Gather exists to give churches their time back. Church leaders spend too many hours juggling spreadsheets, email threads, and disconnected tools to coordinate volunteers, communicate with members, and plan weekly services. Gather replaces all of that with one calm, focused workspace — so pastors and ministry leads can spend less time on administration and more time doing the work they were called to do.

**Core belief:** software for the local church should feel as thoughtful and polished as the best consumer tools — not like enterprise software that happens to have a "church" label on it.

---

## Where We Are (October 17, 2026)

**Phase: pre-submission.** The code side of App Store readiness is done; remaining work is on-device testing and the human steps of store submission.

| Area | State |
|---|---|
| Web admin | Feature-complete for v1 (dashboard, people, volunteers, **Live Service**, **Team Health**, service plans/presets with **Gather AI fill** (Congregation/Network only), announcements, events with repeat/announce/delete + RSVP export, account with plan/billing + data export, reports). UI-protocol audit done. |
| Mobile | All member + service-team flows live: home, news, events (address, directions, native calendar, saved, nearby churches), bulletin with check-in / run service, Serve schedule with backups, profile photos, report/block, account deletion, tour. Phone-only (`supportsTablet: false`). |
| Backend | 56 migrations; daily reminder cron (Vercel); pg_cron + pg_net (service-start notices every 5 min, notification queue every minute); scheduling and privilege rules enforced by triggers/RPCs; security audit and scheduling audit both done and verified live. |
| Legal / privacy | Privacy, Terms, DPA, Delete-account pages live; store privacy answers drafted. Not attorney-reviewed. |
| Store readiness | Icon flattened, privacy manifest, export compliance, deletion, report/block all done. **Next:** test on real iPhone + Android, first `eas build` → TestFlight (no Mac needed), screenshots, listing, submit. Guide: `docs/launch/app-store-and-google-play.md`. |
| Not started / deferred | Stripe products/keys/webhook in the Stripe dashboard (code is done), SMS provider for phone sign-in, data-caching layer, dark mode, Android device testing, LLC + D-U-N-S. |

---

## Goals

1. **Volunteer coordination without friction** — scheduling, role assignment, confirmations, and reminders should take minutes, not mornings.
2. **Member communication that reaches people** — announcements and events should be easy to compose, audience-targeted, and surfaced naturally (web + mobile).
3. **Service planning as a living document** — run-of-show order, role slots, and timing should live in one place that everyone on the team can see.
4. **Healthy roster visibility** — leadership should always know who's active, who's serving, and where gaps exist.
5. **Zero training required** — new staff should open the app and understand it within minutes. Complexity is hidden; power is discoverable.

---

## Audience

**Primary:** Church administrators and pastoral staff — typically 1–5 people managing a congregation of 50–500. They are often non-technical, time-constrained, and wearing many hats. They care deeply about their people, not their software.

**Secondary:** Ministry team leads (worship directors, children's directors, etc.) who coordinate volunteers for their area and need visibility into upcoming service plans.

**Tertiary:** Church members — primarily via the mobile app. They see announcements, RSVP to events, and confirm their serving assignments. Their experience should feel warm and personal, not transactional.

**What they are not:** Enterprise IT buyers. They are not evaluating feature matrices. They are asking: "Will this make my Sunday mornings less stressful?" — that is the question every screen must answer.

---

## Design Feel

Gather's UI is **warm, calm, and confident**. It should feel like a well-designed productivity tool that someone who loves the local church built specifically for them — not a generic SaaS product with a church skin on top.

### Adjectives that should describe every screen:
- **Warm** — amber brand, Rubik typeface, stone-grey text on near-white surfaces. Warmth comes from the brand and type, not from a tinted backdrop. Never cold or clinical.
- **Calm** — generous whitespace, unhurried layout, no visual noise. The UI shouldn't feel like it's demanding attention.
- **Focused** — one primary action per view. Clear hierarchy. The most important thing is always obvious.
- **Alive** — skeleton loaders instead of blank flashes, smooth transitions, hover microinteractions on every card and row. The interface responds to the user.
- **Trustworthy** — consistent spacing, aligned grids, no broken states. The product feels like it was made by people who care about the details.

### Visual references:
Linear (density + keyboard-first hierarchy), Notion (calm whitespace + typography), Stripe Dashboard (stat cards + clear data layout), Loom (warm brand + human tone).

### What it is not:
- Not dark-mode-first aggressive SaaS
- Not gradient-heavy marketing feel
- Not utilitarian form-over-form admin panels
- Not cold enterprise dashboards with 14 competing colors

### Specific rules:
- **Colour = brand + areas + status** (replaced the old amber-only rule, October 2026 — it read one-dimensional; mockups: the "Gather colour system" canvas artifact):
  - **Amber** (`#f59e0b` / `--primary`) is the brand, used sparingly: the logo, the one primary CTA per view, and a thin rail on the active nav item. Everything around it is warm grey — the active nav item, the dashboard hero, secondary buttons, quick actions and links are neutral (the owner found amber washes overbearing).
  - **Five area colours** say *what something is about*, Planning Center / Linear / Notion style — on content, **not on the sidebar** (tried, removed: the nav stays grey): **teal** = services & plans (service notices, plan tags) · **clay** = news/announcements · **blue** = people & team · **olive** = ministries · **plum** = events. Tokens `--area-<hue>-{mark,tint,ink}` in `globals.css`, helpers in `lib/areas.ts` (`AREA`, `hueAt`, `hueForSeed`). `mark` for icons/dots/chart marks, `tint` for backgrounds, `ink` for text on the tint (≥4.5:1). Ministries and any multi-series use the fixed order olive · blue · plum · teal · clay — never cycled past five. Validated for colour-blind separation and contrast (dataviz `validate_palette.js`); don't swap values without re-running it.
  - **Status** (green confirmed · amber-orange waiting · red can't make it) only ever means an answer/state, always with a word or icon, never reused as an area colour.
  - **Proportion ("Balanced")** — the dashboard reading of the 60-30-10 rule (dominant neutral / secondary / accent), skewed further to neutral because data UIs need colour to *mean* something: ~88% neutral (page + white cards + text), 8–10% area colour, 3–4% amber. Whole surfaces tinted only in two places: dashboard stat tiles and mobile Browse tiles; elsewhere colour lives in small things (tags, date tiles, ministry dots, initials avatars, notification icons).
  - Event date tiles don't all wear plum (read as monotone): they take `eventHue(index)` — soft amber first, then teal, clay, blue, olive, plum by list position — so neighbours differ. The dashboard hero's date is a light amber tile (not black, not a wash).
  - Where it shows. **Web:** dashboard stat tiles, event date tiles, initials avatars (`components/ui/avatar.tsx`), Service Board ministry dots, notification icons by type, announcement placeholders. **Mobile** (`src/theme/areas.ts`, same values and same person-hash as the web, so someone's avatar colour matches on both): initials avatars (`Avatar` in `ds/index.tsx`), Home "Upcoming" date tiles (`eventHue`), the "Awaiting your reply" icon (services teal), Notifications icons by type with an amber unread dot (the old amber side bar and "New" badge are gone). Browse tiles keep their own deep navy/olive/plum/teal photo tiles.
- **Flat over gradients** — solid color surfaces; the exceptions are the dashboard hero strip (subtle warm mesh) and the **Gather AI button** (`.ai-btn` in `globals.css`: ink core inside a rotating multi-color conic ring via an animated `@property --ai-angle`, a glow that drifts through the ring's colors, shimmering label, twinkling star; all motion off under `prefers-reduced-motion`). Keep that treatment exclusive to AI so it stays special.
- **Rubik** at 300–700 weight. Never a different font.
- **Radius is soft** — `rounded-xl` (12px) on cards/buttons, never perfectly square or pill-shaped for utility UI.
- **No native form controls** in styled contexts — every `<select>`, `<input[type=date]>`, `<input[type=time]>` gets replaced with a custom component. Use `components/ui/SelectMenu.tsx` — searchable, keyboard-navigable, portalled to `document.body` (so no ancestor `overflow: hidden` can clip it; a card container's `overflow-hidden` clipped an early version). Now used everywhere — the last native `<select>`s (live `AssignmentsTable`) were migrated, and three dead components that held the rest (`AssignmentsTable.v1`, `PresetEditor`, `ServiceTimeSelector`) were deleted.
- **Every number has context** — stats always carry a label, trend, or supporting count. Orphaned numbers are a bug.
- **Dashboard scale, not marketing scale** — admin page titles run 20px default / 24px for hero pages (`AdminHeader`, `PageHeader`), not the 30–48px display type appropriate on the auth screen or marketing site. An earlier pass had these too large, pushing real content off the fold; `(admin)/layout.tsx` content wrapper is `space-y-6` / `max-w-[1600px]`, not the `space-y-12` / `max-w-7xl` it started as.
- **Surfaces: near-neutral, raised = lighter** (October 2026; follows Vercel Geist `#fafafa` page / `#fff` cards, Shopify Polaris `#f1f1f1` / `#fff`, Primer `#f6f8fa` muted, Radix sand2 `#f9f9f8`). One ramp — Tailwind **stone** (chroma ≈ 0.001–0.004):
  - `--bg` **#FAFAF9** — page *and* sidebar (one canvas, Linear/Vercel style; the sidebar is not a separate colour).
  - `--surface` **#FFFFFF** — every card, table, popover. Never put a darker surface under content.
  - `--surface-2` **#F5F5F4** — small things only: hovers, chips, inputs, progress tracks. `--nav-pill-active-bg` **#EEEDEB** (one step darker than hover).
  - `--border` **#E7E5E4**, `--divider` **#F0EFED**, `--outline-variant` **#D6D3D1** (hover borders).
  - Text `#1C1917` / `#57534E` / `#78716C` (muted is 4.8:1 on white — never lighter for text).
  - Shadows are neutral (`rgba(28,25,23,…)`), soft, and only on raised/hovered things.
  - **No tinted backdrop.** The warm paper (#F8F7F4, then cream/greige before it) read brown at full-screen size; any page tone with visible hue reads "dirty" next to white cards. If something needs warmth, use amber or an area tint on a small element.
  - **Mobile** uses the same stone ramp one step deeper so white cards separate on a phone (iOS grouped-list pattern): `palette.bg` **#F5F5F4**, `sunken` #EEEDEB, `line` #E7E5E4, `lineSoft` #F0EFED, ink #1C1917 / #57534E / #78716C (inkMuted was #A29B8D, 2.6:1), neutral shadows. Home's morning glow and the amber Dawn sign-in are unchanged.

---

## Designer Role & Autonomy

Claude acts as **executive web designer** on this project with full creative autonomy over the admin portal UI. This means:

- **Take liberties freely** — change grid layouts, rescale components, replace or create new components, adjust spacing, reorder sections, rethink interaction patterns. Do not ask permission for visual decisions; make them and the user will redirect if needed.
- **Modern UI standards apply** — reference patterns from Linear, Notion, Figma, Stripe dashboard. Flat colors over gradients, generous whitespace, clear hierarchy, consistent interaction states.
- **Replace DaisyUI primitives** — when a DaisyUI class (`card`, `btn-outline`, `select-bordered`, `badge`, `modal-box`) produces dated or inconsistent output, replace it with custom Tailwind. The design system tokens in `globals.css` are authoritative.
- **Native selects are banned** from styled UI contexts. Always replace with custom dropdown components.
- **Hover states required** on every interactive element — minimum `transition-colors`, prefer lift (`hover:-translate-y-0.5`) on cards/buttons.
- **No orphaned numbers** — every stat needs a trend indicator or supporting context.
- **Colour is semantic** — amber for brand/active/primary CTAs, area colours to say where you are, status colours for answers. Never decorative (see Design Feel → Colour).

---

## What Is Gather

Gather is a church management SaaS. One church per tenant. Two surfaces:

- **Public marketing site** — landing, pricing, demo request — same Next.js app, `(marketing)` route group
- **Web admin portal** — Next.js 14 App Router, for church admins and staff
- **Mobile app** — Expo 57 / React Native 0.86, for all members

**Stack:** Next.js 14 · Tailwind 3.4 + DaisyUI 5 · Supabase (Postgres + Auth + Realtime) · TypeScript · pnpm workspaces + Turbo · Brevo (email) · Stripe (billing stub)

---

## Monorepo Layout

```
gather/
├── apps/
│   ├── web/          # Next.js 14 admin + member portal
│   └── mobile/       # Expo / React Native
├── packages/
│   ├── lib/          # @gather/lib — shared types, Zod schemas, Supabase factory, services
│   ├── ui/           # @gather/ui — placeholder (no source yet)
│   └── config/       # Shared ESLint + TS base config
├── supabase/
│   └── migrations/   # 56 SQL migrations (up-only)
└── design-handoff/   # HTML/markdown dossiers from design system
```

**Commands:** `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm format`

**Mobile-specific:** `pnpm mobile` / `pnpm mobile:clear` (`expo start --clear`) / `pnpm mobile:tunnel` / `pnpm mobile:web` (runs the mobile app in a browser at http://localhost:8082 — for when a phone/Expo Go isn't available; use Chrome DevTools' device toolbar for a phone-sized viewport; also a `gather-mobile-web` entry in `.claude/launch.json`) — all run from the **repo root** and always target `apps/mobile` via `pnpm --filter mobile`. Running `npx expo start` directly from the repo root instead of `cd apps/mobile` fails with `Unable to resolve "../../App"` — Metro treats whatever directory it's invoked from as the project root.

---

## Design System

### Tokens (CSS variables — `apps/web/app/globals.css`)

| Group | Key tokens |
|---|---|
| Backgrounds | `--bg`, `--surface`, `--surface-2`, `--surface-container-*`, `--app-canvas` |
| Text | `--text-primary`, `--text-secondary`, `--text-muted` |
| Brand / amber | `--primary` (oklch amber), `--primary-hover`, `--primary-soft`, `--nav-active-foreground` (#f59e0b) |
| Borders | `--border`, `--divider`, `--outline-variant` |
| Status | `--success`, `--warning`, `--danger` |
| Sidebar | `--sidebar-w: 200px`, `--sidebar-row-h: 40px` |

### Utility classes

- `.stitch-section-card` — bordered card, padding 1rem (sm: 1.25rem)
- `.card-elevated` — elevated card with hover shadow
- `.stitch-pill-toolbar` — flex row, pill border, border-radius: 9999px
- `.btn-primary / secondary / ghost / danger` — height 40px, radius 12px
- `.hero-gradient-bg` — orange mesh gradient for dashboard hero

### Logo mark

The heart-over-three-people mark on its own (no tile) is the default way Gather signs a screen; the amber app-icon tile is for app-icon contexts only (favicons, store, splash). Web: `public/brand/mark-amber.png`, `mark-ink.png`, `mark-white.png` (740×592, cut from `public/logo.png`) — nav, footer, admin sidebar, sign-in (amber on the dark panel), onboarding. Mobile: `assets/brand-glyph.png` (same cut, white, tinted at runtime) via `Mark` in `components/ds` (amber by default) on church select, church info and the tour, and tinted dawn ink on sign-in/sign-up (`DawnLayout`). The tiled `BrandMark` remains for icon-like spots.

### Font

**Rubik** (300–700) from Google Fonts, applied globally.

### Component library

DaisyUI 5 layered under custom tokens. Use Tailwind arbitrary values referencing CSS variables — e.g. `bg-[var(--surface-container-low)]`.

---

## Database Schema

All mutations flow through RLS-protected tables. SECURITY DEFINER helpers bypass RLS for aggregated checks.

### Enums
- `role_enum` — ADMIN | SERVICE | MEMBER
- `audience_enum` — ALL | MEMBER | SERVICE | ADMIN | MINISTRY
- `assignment_status_enum` — OPEN | ASSIGNED | CONFIRMED | DECLINED
- `rsvp_status_enum` — GOING | MAYBE | NO

### Key tables

| Table | Key columns |
|---|---|
| `churches` | id, name, slug, timezone, address, `worship_days` (int[], migration 0027), `plan` (parish/congregation/network), `plan_status`, `stripe_customer_id`, `stripe_subscription_id`, `plan_renews_at` (0046 — only the service role can change these; `trg_guard_church_billing`), `trial_ends_at` (0053) |
| `profiles` | id (FK auth.users), church_id, full_name, email, role, disabled, `avatar_url`, `favorite_verse`, `ministry_interests` (text[]), `profile_completed_at` (migration 0032) |
| `service_times` | church_id, name, day_of_week, start_time, timezone |
| `volunteer_roles` | church_id, ministry_id?, name |
| `service_presets` | church_id, service_time_id?, name, is_default, `worship_day` (int, nullable service_time_id since 0028) |
| `service_preset_items` | preset_id, position, title, duration_minutes, notes, owner_role_id |
| `service_plans` | church_id, service_time_id?, service_date (unique per church+time+date), preset_id?, title, `start_time` (text, since 0027 — service_time_id is nullable) |
| `service_plan_role_slots` | plan_id, role_id, assigned_user_id, backup_user_id, status, notes |
| `service_plan_items` | plan_id, position, title, duration_minutes, assigned_user_id, backup_user_id, status, `assignment_status` (ASSIGNED/CONFIRMED/DECLINED, separate from the PLANNED/DONE/SKIPPED `status`) |
| `announcements` | church_id, title, body, audience, publish_at, image_url, `kind` (UPDATE/EVENT/SIGNUP/PRAYER), `pinned`, `important`, `event_id`, `contact_user_id`, `closes_at`, `info` (jsonb [{label,text}], ≤8) — 0052 |
| `announcement_slots` / `announcement_signups` | sign-up slots (label, detail, capacity, position) and who took them — 0052; taking/leaving only via `take_announcement_slot` / `leave_announcement_slot` (one slot per person per post, refuses full/closed/unpublished) |
| `announcement_private` | note shown only to people who signed up + admins (address, door code) — 0052 |
| `announcement_reactions` | "Praying" on PRAYER posts, own insert/delete — 0052 |
| `events` | church_id, title, start_at, end_at, audience, is_cancelled, image_url |
| `event_rsvps` | event_id, user_id, status |
| `notification_log` | church_id, user_id?, type, payload (jsonb), sent_at, read_at |
| `profile_private` | user_id, phone, expo_push_token — migration 0038; owner + same-church admins only (never put contact/device data on `profiles`, which the whole church can read) |
| `content_reports` | church_id, reporter_id, reported_user_id, reason, details, resolved_at — migration 0038 |
| `user_blocks` | blocker_id, blocked_id — migration 0038, self-only RLS |
| `volunteer_unavailability` | church_id, user_id, start_date, end_date, note — migration 0046; volunteers set their own away days (mobile Serve), admins can set anyone's (Team Health) |
| `serve_requests` | church_id, user_id, role_ids (uuid[]), role_names (text[]) — migration 0033, member-initiated "I'd like to serve" requests |

> **Important:** `volunteer_assignments` was dropped in migration 0024. All scheduling now uses `service_plan_role_slots` and `service_plan_items`.

> **Important:** to tell two same-day services apart (e.g. a 9:00 and an 11:00 Sunday), always resolve `service_plans.service_time_id → service_times.name` and show it alongside the date/time — the date+time alone is ambiguous. Both `AssignmentsScreen` and `HomeScreen` on mobile do this via an extra `service_times` lookup keyed by the distinct `service_time_id`s in the fetched plans.

### Key RPCs

| Function | What it does |
|---|---|
| `bootstrap_church(name, slug, timezone)` | Creates church + sets profile to ADMIN |
| `respond_assignment(source, id, response)` | Primary: CONFIRMED/DECLINED, changeable until the service date (decline promotes backup; every primary decline notifies church admins as `ASSIGNMENT_DECLINED`, 0047). Backup: DECLINED steps down, CONFIRMED is an ack. Past services refused. |
| `check_in_to_plan(plan_id)` | Volunteer check-in, service day only (church tz) |
| `set_plan_item_status(item_id, status)` | Admin-only run of show: PLANNED/DONE/SKIPPED |
| `admin_remove_member_from_church(user_id)` | Nulls church_id, releases upcoming slots (`release_future_assignments`), guards last admin |
| `prepare_account_deletion(user_id)` | Service role only — slot hand-off + last-admin guard before auth user deletion |

### Helper functions (SECURITY DEFINER)

`current_user_role()` · `current_user_church_id()` · `is_admin()` · `is_service()` · `is_member()`

---

## Web App — Route Structure

```
app/
├── (marketing)/           # Public site — no auth, own layout (footer only, own nav per page)
│   ├── layout.tsx
│   ├── page.tsx           # "/" — landing page (hero, features, pricing preview, FAQ)
│   ├── pricing/page.tsx   # Full plan comparison + Stripe Checkout
│   └── demo/page.tsx      # Demo request lead form
├── (admin)/              # AdminShell layout — all protected admin routes
│   ├── layout.tsx
│   ├── account/page.tsx
│   ├── announcements/page.tsx
│   ├── events/page.tsx
│   ├── notifications/page.tsx
│   ├── people/
│   │   ├── page.tsx
│   │   └── invite/page.tsx
│   ├── volunteers/page.tsx
│   ├── live/page.tsx      # Live Service — check-ins, gaps, run of show, thank-you recap
│   ├── insights/page.tsx  # Team Health — stretched/steady/resting/new, away dates, serve requests, CSV
│   └── admin/
│       ├── page.tsx              # Dashboard
│       ├── service-plans/
│       │   ├── page.tsx
│       │   ├── [planId]/page.tsx
│       │   └── print/[planId]/page.tsx
│       └── service-presets/
│           ├── page.tsx
│           └── [presetId]/page.tsx
├── auth/page.tsx
├── onboarding/create-church/page.tsx
├── join/page.tsx
└── api/
    ├── notifications/dispatch/route.ts   # POST (admin) or GET (Vercel Cron, Bearer CRON_SECRET)
    ├── notifications/recap/route.ts      # post-service thank-you (admin, once per plan)
    ├── stripe/webhook/route.ts           # keeps churches.plan in step with Stripe
    ├── billing/portal/route.ts · billing/link/route.ts
    ├── export/route.ts                   # full church JSON export (admin, RLS-scoped)
    ├── checkout/route.ts        # Stripe Checkout session — calls Stripe's REST API via fetch, no SDK dependency
    └── demo-request/route.ts    # Emails the internal inbox + a confirmation via Brevo
```

> **Important:** `/` is the public landing page, not an admin redirect. There used to be an `app/(admin)/page.tsx` that redirected `/` → `/admin`; it was removed (two pages can't resolve to the same route) when the marketing site was added. Signed-in users landing on `/` see the marketing page, not an automatic bounce to the dashboard.

### Middleware

`apps/web/middleware.ts` — refreshes Supabase session, redirects unauthenticated users to `/login?next=<path>` for all admin routes.

### Data layer

| File | Purpose |
|---|---|
| `lib/supabaseClient.ts` | Browser singleton |
| `lib/supabaseData.ts` | `getCurrentContext()` — auth → profile → church → service times |
| `lib/db/servicePlans.ts` | Full CRUD for plans, items, role slots |
| `lib/format.ts` | Date/time formatters (avoids UTC offset shift bugs) |
| `lib/nextServiceDatetime.ts` | Computes next service from service_times rows |
| `lib/toast.ts` | `useToast()` hook |

---

## Marketing Site (`app/(marketing)/`, `components/marketing/`, `lib/marketing/plans.ts`)

Public, unauthenticated. Separate visual language from the admin portal — light/"respectful" copy tone (short declarative headlines, paired "The problem" / "The solution" framing, four-item benefit chip lists), warm off-white ground, `mk-*` CSS classes in `globals.css` rather than the admin's design tokens.

- **`MediaBackdrop`** — full-bleed hero media. Poster image always paints first (LCP-safe); an optional background video attaches only after mount, only ≥768px viewport, only without `prefers-reduced-motion`/`saveData`. Falls back to a slow Ken-Burns drift on the poster if no video file is present — the page never breaks on a missing video.
- **`MarketingNav`** — grid-based (`grid-cols-[1fr_auto_1fr]`, not flex), so the center nav pill is centered on the true bar width regardless of how wide the logo vs. CTA group are. Transparent over the hero (`overHero` prop), solid+blurred once scrolled. Nav text is always dark ink — the hero uses a light "dawn" wash, not a dark photo, so white nav text would be unreadable.
- **`PricingTables`** — monthly/yearly toggle (yearly default, "2 months free" pill; on monthly a teal "Switch to yearly and save up to $450 a year →" button), calls `/api/checkout` which needs `STRIPE_PRICE_*` env vars per plan+cycle to actually complete (see Environment Variables). Directly under the plan cards: the teal **reduced-pricing strip** ("Church plant, under 50 people, or tight budget this year?" → "Ask for reduced pricing" mailto) — it sits where the price objection happens, don't move it back down the page. Then a trust row and the testimonials grid.
- **`lib/marketing/testimonials.ts`** — the owner's testimonials, shared by the landing page (cards + the hero mini-proof under the CTAs) and /pricing. The landing pricing preview shows the **yearly** price with the monthly struck through, the same numbers /pricing opens on.
- **Marketing stance at launch: aggressive (owner decision, October 2026).** Lean hard on marketing psychology on the public site and in the product: urgency and loss framing (the trial countdown says what they'll lose), anchoring (monthly price struck through on yearly, savings in dollars), defaults (yearly preselected, Congregation "Recommended"), per-member framing ("About 25¢ per member a month"), social proof (the testimonials and the church-name strip are the owner's — keep them), reassurance under every CTA ("No card needed · then $X/mo · cancel any time"), and the trial as the first CTA ("Start your free trial" → `/auth?tab=signup`, demo second). Two hard limits that protect the business rather than soften it: product claims must match what ships (multi-campus, cross-campus sharing, advanced permissions and "confirm by text" were removed from Network/comparison because they don't exist), and payment/cancellation promises must be literally true ("no card to start", "cancel any time").
- **`lib/marketing/plans.ts`** — single source of truth for plan pricing (Community $74/mo — internal key `parish`; Vercel vars `STRIPE_PRICE_COMMUNITY_*`, old `STRIPE_PRICE_PARISH_*` still read; Congregation $149/mo, Network $225/mo; ~2 months free annually), the comparison matrix, and the pricing FAQ. Both the landing preview and `/pricing` read from here.
- **Colour on the public site:** more amber than the admin, but not everywhere. Amber is for the brand mark, primary CTAs ("Start your free trial" in the nav, hero, plan cards and final band) and the Recommended plan. Section labels (`.mk-eyebrow` is neutral; `.mk-eyebrow-{teal,blue,clay,plum,olive}` variants in `globals.css`) and feature icon tiles wear the area they describe — volunteers blue, services teal, news clay, member app plum, care/trust teal; plan checkmarks and "save $X a year" are teal; testimonial initials cycle blue/plum/olive; links and table group headings are ink. The scroll-progress bar is flat amber.
- **Landing page below the hero (October 2026 rebuild — "show the product", from the mockup canvas + Linear / Planning Center / Attio / Calendly / Beside on Mobbin):** church-name row → two-tone statement → `ProductShowcase` (tabs: Service plans · Volunteers · Announcements · Member app, each a faithful mock of the real screen; WAI-ARIA tabs with arrow keys) → "How it works" `WorkflowStrip` (Plan · Fill · Confirm · Run, `#how`) → `LandingBento` ("Why churches switch", `#why`) → "Handled by Gather" job list → testimonials (each led by its `result` line) → one-row trust (`#about`) → pricing → FAQ → light final CTA. No stock photos of buildings below the hero; show the product. Mock helpers (`MockAvatar`, `MockWindow`, `PhoneFrame`, `AnswerCard`) live in `ProductShowcase.tsx`.
- **Faces:** sample people in product mocks use stock faces from `public/images/people/` (Unsplash License, sources in `SOURCES.txt`), mapped by initials in `PHOTOS`; a few stay initials on purpose. Sample names are fictional and must never reuse the real testimonial givers. **Testimonials never get a stock face** — `PersonBadge` shows `testimonials.ts` `photo` (their own headshot) or initials.
- **Imagery rule:** anything added to a wide/short card slot (hero, feature panels, browse tiles) must be genuinely landscape (~1.75:1) and subject-filling. A portrait source cropped into a short card shows only a thin band of background — this actually happened once and produced "black cards with a sliver of a gradient." Verify orientation before using an image, don't assume.

### Sign-in transition

None. The full-screen amber "Dawn" overlay that used to play on sign-in/up/out (`AuthTransition`, `AuthIntro`, `lib/authTransition.ts`, `.auth-intro*` CSS) was removed at the owner's request — sign-in navigates straight to the destination. Don't reintroduce a cover/curtain animation on auth.

---

## AdminShell

Sidebar-only shell (Hilos/Linear pattern) — **there is no top bar**: it only duplicated search, the bell and the avatar, which all live in the sidebar. Fixed left sidebar (200px), main content offset by sidebar width and starting at the top of the screen (sticky things use `top-3`, toasts `top-6`).

Sidebar, top to bottom: church name (wraps to 2 lines) · **Search** row with the ⌘K/Ctrl K hint → `components/admin/CommandPalette.tsx` (centered panel; live results for people, service plans, events, announcements plus "Go to" pages; ↑↓/Enter/Esc; "See all results" → `/admin/search`) · Dashboard, Live Service · Planning (Volunteers, Service Plans) · People (People, Team Health) · Communication (Announcements, Events) · Notifications (red unread badge) · Settings · user card.

**Service Presets are "Service templates"** inside Service Plans: no nav item (Service Plans stays highlighted on `/admin/service-presets`), reached from the Service Plans "Templates" button or ⌘K; page has a back link. Code/table names stay `preset`.

Deep links used by search: `/people?member=<id>`, `/events?open=<id>`, `/announcements?open=<id>`, `/admin/service-plans?date=YYYY-MM-DD`.

Active item: neutral grey (`--nav-pill-active-bg`) + dark text, with a thin amber left rail as the only brand cue; icons are neutral grey (area colours were tried on the sidebar and removed). Notification count polled from `notification_log` on mount and on `gather-notifications-updated` window event.

---

## Component Inventory

### Volunteers (`components/volunteers/`)

**The Volunteers page is an overview, not an editor** — the only place to change who serves is the Service Board. `/volunteers` covers every regular service in the next 8 weeks (matched to its plan, or "Not planned yet") in two views, remembered per browser: **List** (default; Linear project list / Stripe table — date, service, confirmed meter "9 of 17", one-word Needs column: "1 can't make it" / "4 open spots" / "All set", team avatars; the whole row opens the plan or starts one) and **Grid** (Planning Center Matrix — roles × planned services, each spot a first-name chip coloured by answer, Open shown dashed; any cell opens that plan). No per-row action buttons and no AI button here (reminders and Fill with AI live on the plan): one quiet line — "N services in the next two weeks need attention · Show only those" — filters the list. The old editor components (`AssignmentsTable`, `ScheduleBuilder`, `NextServiceReadinessStrip`, `PendingResponsesCard`, `DeclinedCard`, `QuickRolePresets`) were deleted. Remaining in `components/volunteers/`: `RolesCard` (Service Plans), `ServiceTeamBulletinSummary`.

### Announcements (`components/announcements/`)

**Typed posts (0052):** the composer starts with `AnnouncementTypeFields` — What kind of post? (Update / Event / Sign-up / Prayer, area-coloured dots), Event picker (`SelectMenu` of upcoming events), Sign-up slots (name · detail · spots, warns before removing a taken slot) + closes date + "Only for people who sign up" note, Pin to the top / Mark important, Questions go to (person), Know before you go (≤6). Saved via `lib/announcements.ts` (`extrasColumns`, `saveSignupParts` keeps slot ids so sign-ups survive edits; Duplicate copies slots fresh). Publish needs an event for Event posts and a named slot for Sign-ups. The Events page's "Also post an announcement" now creates an Event post linked to the first date. List rows show type · audience · time with a star (important) or pin.

`AnnouncementBrowser` — list + phone preview (Mailchimp campaigns / Gmail / Linear inbox): compact rows (thumbnail, title, audience · time, Live/Scheduled/Draft pill) on the left; the selected post **exactly as the mobile app shows it** on the right (sticky, `AppAnnouncementPreview`, per type: event rows + RSVP bar, slots with taken counts, praying count, info, contact): a 340px screen card, no phone bezel (a full iPhone/lock-screen mock and a push-banner card were both tried and dropped as too much). Mirrors `AnnouncementsDetailScreen` — no photo → the same fallback photo the app picks (copies in `public/images/app/`, same hash). Keep the two in step, with Edit / Duplicate / Don't send (scheduled) / Delete. Replaced the full-width banner cards (`RecentAnnouncementsList`, deleted) and the stat cards that repeated the tab counts.

### Dashboard (`components/dashboard/`)

`KpiRow`, `ThisWeekStrip`, `RosterDonutCard`, `NextServiceTeamCard`, `PendingConfirmationsCard`, `LatestAnnouncementsCard`, `UpcomingEventsCard`, `RecentActivityCard`, `VenusAccentStrip`

### People (`components/people/`)

`MembersTable`, `MemberFilters`, `MemberDetailsDrawer`, `InviteMembersForm`

### Service Plans (`components/servicePlans/`)

`ServicePlanHeader`, `PrintablePlan`, `GenerateFromPresetButton`, `CopyLastPlanButton`

**Plan editing = the Service Board** (`components/serviceBoard/`), used by both the Service Plans page and `/admin/service-plans/[planId]`:
- `ServiceBoard` — sticky readiness bar (editable title, date · time · service name, confirmed/waiting/declined/open meter, Send reminders → `/api/notifications/dispatch` with `{ planId }`, Fill with AI), then two columns: **Order of service** (real clock times from `start_time` + cumulative durations, "ends 10:33 AM", inline title/length edit, drag or ↑↓ to reorder, notes, `N` focuses "Add a step…", quick-step chips) and **Team** (roles grouped by `ministries`, "filled / spots" per ministry, −/+ spots on hover, "+ Add a role to this service").
- `StatusAvatar` / `EmptySeat` — a person is an avatar whose ring is their answer (green confirmed, amber waiting, red declined) with a mini-avatar badge for the backup; an empty spot is a dashed "+". **Status is never a dropdown** — it comes from the volunteer (admins can "Mark confirmed" in the popover).
- `PeoplePicker` — one popover for every spot: Suggested (✦, ranked by `rankForRole` in `lib/ai/autofill.ts` with the reason), Service team (last-served fact), Other members, Can't this week (away / "Already on Bass", dimmed but pickable); ↑↓/Enter/Esc; after picking who's serving it asks for an optional backup. A filled spot opens a summary (change, backup, note, Mark confirmed, Clear spot, Remove spot).
- `useBoardData` — people with photos, 26 weeks of serving history (`buildServingStats`), who's away that day, ministries; loaded once per plan. Steps' answers are read from `service_plan_items.assignment_status`; a changed assignee shows as waiting.
- The board only edits the page's drafts (`PlanRoleSlotDraft[]` / `PlanItemDraft[]`); the page's existing in-place autosave (`syncRows`) persists. The old `ServicePlanRoleSlotsSection`, `ServicePlanStepsEditor`, `PlanEditor`, `ServicePlanStepRow` were removed; `runOfShow/StepRow` remains for the preset editor.

### Layout

`PageGrid` — 12-column grid with `PageGridFull`, `PageGridRowTwoOne` (split="default" 2/3+1/3 or split="wideMain" 9/12+3/12), `PageGridRowFour`, `PageGridRowThirds`

---

## Mobile App

**Stack:** Expo **57**, React Native **0.86.3**, React **19.2.3**, React Navigation 7. No Reanimated, no Lottie — all motion is built on RN's own `Animated` API (see Motion below).

> **SDK version is load-bearing.** Expo Go (the App/Play Store app) only ever supports **one SDK version at a time** — the newest — and cannot run a project on an older SDK. If Expo Go on a test device auto-updates, the project's SDK effectively has to follow. Bumping `expo` alone (`npx expo install expo@latest`) is **not enough** — it only moves the `expo` package itself. Always follow with `npx expo install --fix`, which aligns every other native dependency (react, react-native, react-navigation-adjacent native modules, expo-*, @sentry/react-native, babel-preset-expo) to the versions that SDK actually expects. Skipping that step is what produces `TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found` at runtime — a native/JS module registry mismatch, not a code bug.
>
> The root `pnpm.overrides` (`mobile>react`, `mobile>react-dom`) exists specifically to let mobile run a newer React than the web app (web is pinned to React 18 for its own reasons — see Known Gaps). **These overrides must move in lockstep with any mobile React bump**, or pnpm will clamp mobile's React back down and `react-native`'s own peer-dependency check will fail. Currently `19.2.3` to match SDK 57.
>
> **Mobile's `tsc --noEmit` is not a reliable gate.** The workspace has two different `@types/react` resolutions in play (root vs. `apps/mobile`), which throws ~120–130 baseline errors — `TS2305` "no exported member" on core RN exports (`StyleSheet`, `Animated`, etc.), `TS2786` on JSX component types, and `TS2322` specifically when a component like `RiseIn` wraps *multiple* JSX children (arrays trip a duplicate-`ReactNode`-type edge case that single-child usages don't). None of this reflects real breakage. To verify a mobile change, compare the *count* of `error TS` lines against the known baseline (diff, don't read line-by-line) and then confirm with a real bundle: `npx expo export --platform ios --output-dir <tmp-dir> --clear` — exit 0 and no "Unable to resolve" lines is the actual signal.

### Navigation tree

```
RootNavigator
  ├── Unauthenticated: SignInScreen / SignUpScreen
  ├── AccountDisabledScreen
  ├── ChurchSelectScreen (no church_id)
  └── AppNavigator (Stack)
       ├── MainTabs
       │   ├── Home
       │   ├── Announcements
       │   ├── Events
       │   ├── ServicePlan (SERVICE/ADMIN only)
       │   └── Serve / Assignments (SERVICE/ADMIN only)
       └── Detail screens: AnnouncementDetail, EventDetail, NotificationsScreen, ProfileMenu, ChurchInfo, Members
```

### Design language

Rebuilt (not a reskin) around three references: **Home** blends Monzo (grouped white cards on the ambient wash, identity-left/actions-in-one-pill header), Fiverr ("Awaiting your reply" horizontal offer cards — action-first), and OpenSea (image-led "Browse" category tiles, each its own muted color — navy/olive/plum/teal, never amber, with a photo layered over it at partial opacity so the category color reads *through* the image rather than under a tint). **Events** follows Eventbrite: pill search bar, filter chips, large photo-forward cards. **Sign-in** is a two-step reveal (email screen → password screen, `SignInScreen.tsx`) with a full-width pill CTA, rather than one screen with both fields — same `signInWithPassword` mechanics underneath, just the staged-reveal feel. Confirming a volunteer assignment shows a full-screen celebration (`ConfirmCelebration.tsx`) — Duolingo's lesson-complete *structure* (held beat, stat tiles, one CTA) with a deliberately different expression (no mascot, a checkmark with a light-sweep and two halo rings, restrained confetti, copy that thanks rather than scores) since amber-only branding.

- **`components/ds/motion.tsx`** — `SpringIn`, `RiseIn`, `CountUp`, `Confetti`, `Halo`, `usePressScale`, `Shimmer`. Built on RN `Animated`, every transform/opacity-only animation uses `useNativeDriver: true`.
- **In-app banner toast** (`ToastHost` in `components/ds/index.tsx`, payloads built in `lib/toasts.ts` — `announcementToast`, `eventToast`, `digestToast`, used by `useLiveUpdatesToast` and `useReopenDigest`). iOS in-app notification / Slack / Instagram pattern: compact 20-radius card hanging 6pt below the safe area, the content as the leading visual (post photo or fallback, or the event's date tile in plum), an area-coloured eyebrow ("News" clay / "New event" plum) + "now", the title on one line, a one-line preview. One PanResponder handles it all: tap opens, flick up dismisses, pull down rubber-bands; holding pauses the 5 s timer. No × (it was a sub-44pt target). Announced to screen readers with activate/dismiss actions; Reduce Motion fades instead of sliding. 3+ arrivals collapse into one digest ("2 new posts and 1 new event"). Replaced a 76pt card with a 50px icon tile, heavy shadow and a generic "New announcement" title.
- **`components/app/ConfirmCelebration.tsx`** — the post-confirmation overlay, wired into `AssignmentsScreen`'s both RPC and fallback success paths. Fires only on confirm, never decline.
- **`lib/churchImagery.ts`** — the shared fallback-photo system (`eventFallback(id)`, `newsFallback(id)`, deterministic per-id so the same record always shows the same fallback). Used by `EventsScreen`, `HomeScreen`, `AnnouncementsScreen`, and both detail screens whenever a real `image_url` is absent. **Every image here must be landscape (~1.75:1) and subject-filling** — see the Marketing Site imagery rule above; this bit twice before the rule was written down.

### Key screens

| Screen | What it shows |
|---|---|
| `HomeScreen` | Grouped "Next up" hero, "Awaiting your reply" (SERVICE/ADMIN), image Browse tiles, "Upcoming" list, "Latest news" carousel |
| `AssignmentsScreen` (Serve) | Answer first (Planning Center / shift apps): requests as cards with a teal date tile, role, service, "Be ready by" + who else is serving, and two equal buttons (`AnswerButtons`: Can't make it / I'll be there → `respond_assignment`, `ConfirmCelebration` on yes). Then "Coming up" as a list (Going / Backup / Can't make it) and rows for Dates you're away and Serve on another team. Data via `lib/serving.ts` (`loadMyServing`, `respondTo`) |
| `AssignmentDetailScreen` | One assignment: status chip, date + service time (Add to calendar), be ready by, church address (Directions), your parts with clock times, link to the whole order of service (opens the Plan tab on that plan via `planId` param), who's serving with you, your backup; bottom: answer / I can't make it anymore (confirm) / I can make it after all / Step down as backup |
| `AwayDatesScreen` | Month calendar (6 months) of the church's service days; tap toggles away (splits a longer range); days you serve are tinted teal and marking one warns you're still on the schedule; list of upcoming away dates with Remove. Replaced `AwayDatesCard` (deleted) |
| `ServicePlanScreen` (Plan) | Two-line service picker chips. Before the day: a ticket-style "You're serving" card (role, also-on, Date / Starts / Be ready by, perforation, then Check-in opens {day} + Add to calendar, or Check in on the day). Order of service with real clock times, your rows amber-tinted with a rail. Team grouped by ministry (area colour per ministry) as avatars with status rings + legend; on the day it becomes a Here / Not yet list. Once under way: a dark live card ("You're up next", step segments, checked-in time) and "Before you go on" notes. Admins on the day get Run the service → one Now card (Mark done / Skip, who's next gets notified), Coming up, Done with Undo, who isn't here |
| `EventDetailScreen` | Full-width date/time/place rows, Directions, native Add to calendar, Share, RSVP (own church only; closed after the event) |
| `AnnouncementsScreen` (News) | Filter chips (All · Needs you · Events · Sign-ups · Prayer, only those that exist), the important (amber) or pinned post on top, then a card per type with its action inline: Event (photo, when/where, I'm going / Going + count), Sign-up (progress, "You: slot" or Pick a slot, closes label), Prayer (I'm praying · count toggle), Update (thumbnail row). Published posts only. Data via `lib/announcements.ts` (`loadExtras`, `setRsvp`, `takeSlot`, `leaveSlot`, `setPraying`) |
| `AnnouncementsDetailScreen` | Article layout (Apple News / Substack): full-bleed 3:2 photo with floating Back + Share, white reading surface, type tag (+ Important) + date or "Closes …", 28pt title, church byline, 17/27 body. Per type: Event (Ticketmaster) date/place rows with Add to calendar / Directions and a bottom RSVP bar; Sign-up slot list (Take it / Switch / Leave, who took what, progress) and the private note once signed up; Prayer button with count. Then "Know before you go" and "Questions?" contact. Loads the full row by id. Mirrored by the web preview |
| `EventsScreen` | Eventbrite-style filter chips + large photo cards, share/save actions |
| `SignInScreen` | Two-step email → password reveal, full-width pill CTA, "Forgot password?" as its own step |

---

## Known Gaps / Stubs

| Gap | Notes |
|---|---|
| `packages/ui` | Placeholder only — no shared component library |
| Stripe billing | Code complete (checkout tied to the church, webhook, customer portal, pre-signup purchase claimed in onboarding via `/api/billing/link`). Needs Stripe products + `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*`, `STRIPE_WEBHOOK_SECRET` and the customer portal enabled in the Stripe dashboard. Until then checkout returns a friendly "not configured" error. |
| No data-fetching/caching layer | Screens call Supabase directly with local `useState` (no React Query/SWR) — fine at current scale, but means duplicate fetches between screens and no stale-while-revalidate. Deliberately not migrated wholesale; touches every screen's fetch logic and isn't safe to do without per-screen device testing. Revisit as a scoped, incremental migration, not a single pass. |
| Mobile ServicePlanScreen | Run-of-show *content* is edited on web only; mobile does check-in and run-service |
| Web/mobile React version split | Web is pinned to React 18 (Next 14.2 doesn't officially support React 19); mobile runs React 19.2.3 (Expo 57 requires it). Kept apart via `pnpm.overrides`. Resolves itself once web moves to Next 15. |
| Vercel build needs `node-linker=isolated` | `vercel.json` overrides the install command to `pnpm install --filter web... --config.node-linker=isolated` — the default hoisted linker (used locally, see `.npmrc`) puts two physically separate copies of React 18 in the graph when mobile's React 19 is also present, which crashes `/404`/`/500` prerendering (`styled-jsx`'s `StyleRegistry` gets a null hook dispatcher). Do not remove this override without re-verifying a real Vercel/isolated-linker build. |
| Nearby churches | The demo neighbor ("Hope Fellowship (demo)") was removed before App Review (October 23, 2026), so "Nearby churches" is empty until other real churches set an address and stay discoverable. Grace Community is placed at its ZIP (27510). `node .seed-tmp/nearby_seed.mjs` re-adds the demo if ever needed. |
| App Store / Play submission not yet done | Code side is ready (deletion, report/block, privacy manifest, legal pages, export-compliance flag). Listing, screenshots, privacy-label entry and `eas submit` credentials need a human — step-by-step in `docs/launch/app-store-and-google-play.md`, label answers in `docs/launch/store-privacy-answers.md`. |
| Legal docs are self-drafted | `/privacy`, `/terms`, `/dpa`, `/delete-account` are plain-language drafts, not attorney-reviewed. Operator is a sole proprietor (`lib/legal.ts` → `OPERATOR`) until an LLC exists — update that constant on formation. No church-data export tool yet (Terms/DPA promise export by email). |
| Remote `auth.sms.enable_signup` still off | Phone sign-in/sign-up code is live (see below), but the matching Supabase Auth toggle ("Allow new users to sign up with phone" under Authentication → Providers → Phone) hasn't been flipped on the live project — `supabase config push` couldn't do this surgically because remote's `auth.sms.twilio.enabled` is `true` with real (masked, unmanaged) credentials the CLI can't diff around, and the TOML schema won't let `enabled=false` coexist with a set `account_sid` locally. Needs a manual one-toggle flip in the dashboard (which in practice requires configuring an SMS provider); do not try to push the full config file to set it. Until then the mobile Email/Phone toggle is hidden behind `EXPO_PUBLIC_PHONE_AUTH=1` (`lib/phone.ts`) so reviewers can't hit a dead end. |

---

## Engineering Decisions (Recent)

- **Migration 0024** — `volunteer_assignments` deprecated. All scheduling via `service_plan_role_slots` + `service_plan_items`
- **RolesCard** removed from Volunteers page — roles managed on Service Plans page only
- **UI compaction pass** — sidebar 288→200px, navbar h-20→h-14, donut h-48→h-36, card padding reduced
- **Volunteers date strip** — replaced gray pill container with bare vertical strip; amber dot = has service plan; calendar opens as centered modal portal (z-[1000])
- **Readiness donut** — three-layer SVG: gray track / pale amber (confirmed+pending) / solid amber (confirmed only). Center label = "X% Confirmed"
- **Status correctness fix** — slots with `assigned_user_id != null` but `status = "OPEN"` promoted to ASSIGNED in read layer
- **Public marketing site added** — `(marketing)` route group at `/`, `/pricing`, `/demo`; removed the old `(admin)/page.tsx` placeholder that redirected `/` → `/admin`
- **Dashboard density pass** — admin content wrapper `space-y-12`/`max-w-7xl` → `space-y-6`/`max-w-[1600px]`; page titles down to dashboard scale (20–24px, was 30–48px)
- **Neutral surface ramp** — `--surface`/`--surface-2`/`--border`/`--divider` first unified onto one warm hue (~70), then (October 2026) moved to the near-neutral stone ramp with a #FAFAF9 page and white cards after the warm page read brown
- **Dawn auth transition** — added, then removed (owner disliked the curtain effect); auth now navigates directly
- **Service plan editor reworked** — role slots collapsed from ~400px cards to 44px rows, native `<select>`s replaced with the new `SelectMenu` component, fixed a bug where any assignment change reset status to `ASSIGNED` (could silently downgrade a `CONFIRMED` slot)
- **CI build fix** — Vercel install command pinned to `pnpm install --filter web... --config.node-linker=isolated` (see Known Gaps); `turbo.json` now declares the env vars the web build actually reads, since Turborepo wasn't forwarding Vercel-configured values to the build
- **Mobile SDK 54 → 57** — full `expo install --fix` upgrade (react-native 0.81.5→0.86.3, react 19.1.0→19.2.3, react-navigation-adjacent native modules, @sentry/react-native 8→7.11), plus the matching `pnpm.overrides` bump — forced by Expo Go on test devices auto-updating to only support the newer SDK
- **Mobile design overhaul** — Home, Events, Announcements, sign-in rebuilt (see Mobile App → Design language); new `ConfirmCelebration`, `ds/motion.tsx`, `lib/churchImagery.ts`
- **Demo/seed data replaced** — the old test churches (Test Church, Willow Creek Fellowship, Testman) and ~72 test accounts were wiped; the live database now seeds one realistic church ("Grace Community Church", `grace-community`) with ~96 members across ADMIN/SERVICE/MEMBER roles, multiple weekly services, realistic service plans/announcements/events. Demo account password: see team notes, not committed here.
- **Mobile search made real** — Home's search icon previously just navigated to Announcements; it now opens `SearchScreen.tsx`, a real cross-entity search (events/announcements/people) scoped to the member's own church. Events' search bar was a dead `Pressable` that navigated to itself; it's now a working text filter plus a "Your church / Nearby churches" tab.
- **Church discovery added** — migration `0035_church_discovery.sql` adds `churches.latitude`/`longitude`/`discoverable` and RLS policies letting any signed-in user see discoverable churches' basic info and their public (`audience='ALL'`, non-cancelled) events. Web's account page geocodes the church address via OpenStreetMap's Nominatim (`/api/geocode`, no API key) on save. Mobile's Events screen uses `expo-location` + haversine distance (`lib/geo.ts`) to sort nearby-church events; RSVP stays own-church-only (see `rsvps_self_insert` RLS), so `EventDetailScreen` shows a "Hosted by {church}" view-only card for cross-church events instead of the RSVP picker.
- **App Store readiness pass** — removed the unused `RECORD_AUDIO` Android permission and the two live debug routes (`admin/token-debug`, `admin/ui-debug`); added `app.json`'s `scheme` (deep linking), an iOS `privacyManifests` block (UserDefaults/file-timestamp reasons for AsyncStorage + Sentry), a Profile → Privacy policy link, and web's `robots.ts`/`sitemap.ts`/root `error.tsx` (distinct from the existing `global-error.tsx`, which only covers root-layout failures).
- **Push notifications wired** — migration `0036_push_tokens.sql` adds `profiles.expo_push_token`; `AuthContext` registers for push (`lib/pushNotifications.ts`, using `expo-notifications`/`expo-device`) once a member has a church, and saves the token. `/api/notifications/dispatch` now sends real Expo push alongside its existing email + `notification_log` write, batched via `https://exp.host/--/api/v2/push/send`. Requires an EAS native rebuild to take effect (config plugin, not OTA-updatable). **Expo Go cannot receive remote push at all as of SDK 53+** — test push only on a dev-client/EAS build, not Expo Go, or it'll look broken when it isn't.
- **OTA updates enabled** — added `expo-updates`, `app.json`'s `runtimeVersion: {policy: "appVersion"}` and `updates.url`, and a `channel` per `eas.json` build profile (development/preview/production) so `eas update --channel production` can ship JS-only fixes without an app-store review cycle. Requires one native rebuild to activate, same as push.
- **Offline banner added** — `@react-native-community/netinfo` + `components/app/OfflineBanner.tsx`, mounted in `AppNavigator` alongside `AppOverlays`; shows "You're offline" across every screen on connectivity loss. Screens still don't cache/serve last-known data while offline (see the data-fetching-layer gap above) — this only prevents the silent-blank-screen confusion, it doesn't make the app usable offline.
- **Accessibility labels added** — `AppBar`'s shared back button (used on nearly every detail screen) and the two icon-only close buttons in `ds/index.tsx` (toast dismiss, `CenterCardModal` close) now have `accessibilityLabel`s; this was a targeted fix of the highest-leverage shared components, not an exhaustive per-screen accessibility audit.
- **Fixed a real full-bleed-image bug, not a photo-selection one** — `<Image style={StyleSheet.absoluteFill}>` (no explicit `width`/`height`) lets a locally-`require()`'d image's own intrinsic pixel dimensions win over the fill positioning on react-native-web, rendering at native resolution and clipping to whatever tiny corner overlaps the container — this is what "too-zoomed" Browse tiles/cards actually were, not a bad crop. Fixed everywhere the pattern appeared (`HomeScreen.tsx`, `EventsScreen.tsx`, `AnnouncementsScreen.tsx`) by adding a `fillImg: { width: "100%", height: "100%" }` style alongside `absoluteFill`. Diagnosed by actually running `expo start --web` and inspecting the DOM (`img.naturalWidth`/`getBoundingClientRect()`), not by re-reading source images — this class of bug is invisible from the code alone. `churchImagery.ts`'s two swapped photos from the same session are fine as-is now that they crop correctly.
- **Phone sign-in/sign-up added (mobile)** — password-based, not OTP: `SignInScreen.tsx`/`SignUpScreen.tsx` gained an Email/Phone toggle; phone numbers are normalized to E.164 client-side (`lib/phone.ts`, US-centric — a `toE164`/`isLikelyPhone` pair). Migration `0037_profiles_phone.sql` adds `profiles.phone`; `AuthContext` populates it from `authUser.phone` on first login. Deliberately **not** SMS/OTP — no Twilio account, no per-message cost, phone is just an alternate identifier the same trust-level as email. "Forgot password" is hidden for phone accounts (no SMS channel to reset through) in favor of a "contact your church admin" note. The matching Supabase Auth dashboard toggle still needs a human to flip — see Known Gaps.
- **Tab bar: classic bottom bar (after trying floating circles and floating glass)** — `TabBar.tsx` is a full-width solid-surface bar flush with the screen bottom, hairline on top, icon over a short label (`News`/`Plan` visible, full names spoken: five tabs leave ~70pt each), active tab in `palette.amberInk` (#B45309, ~5:1 on white — plain amber is ~2.1:1 and `amberDeep` ~2.9:1, both too faint for 11px text) with a semibold label; inactive is `inkSoft` (~5.7:1). Bottom padding is the live safe-area inset so the surface runs under the home indicator / gesture bar (Android 15 + SDK 57 are edge-to-edge; `edgeToEdgeEnabled: true` is set in `app.json`). Each tab spring-animates a cross-fade between idle/active layers (`Animated`, no bounce, interruptible, skipped under Reduce Motion via `hooks/useReduceMotion.ts`, mounts settled so nothing animates on first render). `role="tab"` + `aria-label` + `aria-selected` inside a `tablist` (use `aria-selected`, not `accessibilityState` — react-native-web does not translate the latter), iOS press-scale 0.94 vs Android ripple, `expo-haptics` selection tick on tab change, tab labels capped at `maxFontSizeMultiplier={1.2}`. History: the floating-glass version used `expo-blur`, which does NOT blur on Android by default (`blurMethod` defaults to 'none', just a translucent tint) and a heavy shadow shows through glass as a gray smudge; it was dropped on taste. `expo-blur` has since been removed. `expo-haptics` is a native module: fine in Expo Go, but standalone builds need a rebuild. `runtimeVersion` is `{policy: "appVersion"}` — `fingerprint` was tried and broke the first EAS build: in this pnpm monorepo the fingerprint hashes node_modules *paths*, which differ between the local (hoisted) install and EAS's, so the runtime versions never match ("Configure expo-updates" phase fails). Consequence: bump `version` in app.json whenever native code changes (new native module, SDK bump), or an OTA update could reach a binary that can't run it.
- **Web preview of the mobile app** — `pnpm mobile:web` (http://localhost:8082). `MainTabs` sets `detachInactiveScreens` only on web (`DETACH_INACTIVE`): native keeps inactive tabs attached (Fabric-safe), but on web nothing hides them in that mode so every tab screen rendered stacked down one long page. `scripts/ensure-hoisted-module-links.js` now links every `package.json` dependency into `apps/mobile/node_modules` instead of a stale 3-package list (the stale list is why `expo-blur` failed to resolve in a running dev server). Web is an approximation: the real device is the source of truth for blur on Android, haptics, ripples and safe-area insets.

- **Security + privacy hardening (migration 0038)** — fixed real privilege escalation: `profiles_update` let any user set their own `role = 'ADMIN'` or move `church_id` to any church, and both `profiles_update` and `church_update` checked `is_admin()` with no church scope (cross-tenant writes). Policies are now church-scoped, and `trg_guard_profile_privileges` pins `role`/`disabled` on self-updates (joining/leaving a church forces MEMBER; the trigger only applies when `current_user` is `authenticated`/`anon`, so SECURITY DEFINER RPCs like `bootstrap_church` still work). `phone` + `expo_push_token` moved off the directory-readable `profiles` row into `profile_private` (owner + same-church admins; push tokens read only by the service role). Announcement-image storage policies scoped to `<church_id>/` folders. Verified live with a SERVICE-role session (escalation attempt leaves role unchanged; cross-church update hits 0 rows).
- **API routes authenticated** — `/api/notifications/dispatch` was fully public (anyone could trigger reminder email/push for every church); now church-admin-only (scoped to their church) or `Authorization: Bearer $CRON_SECRET`. `/api/geocode` requires a signed-in user. `/api/demo-request` has a honeypot (`website`) so it can't be used to mail arbitrary addresses. Shared helper `lib/apiAuth.ts → getRequestUser(req)` accepts a mobile bearer token or web cookies.
- **Account deletion** — `/api/account/delete` (service role): `prepare_account_deletion` RPC (service-role only) promotes backups / reopens slots, blocks the last admin of a church that still has members (`LAST_ADMIN` → 409), deletes the church if the user is its only person; then avatars are removed and `auth.admin.deleteUser` cascades everything else. UI: mobile `DeleteAccountScreen` (Profile → Delete account), web `DeleteAccountCard` on both account pages and on public `/delete-account` (the Google Play deletion URL).
- **Report / block (App Store 1.2)** — `content_reports` + `user_blocks` tables. Mobile: tap a member in `MembersScreen` → `MemberSafetySheet` (report with reason, block/unblock); blocked members hidden from Members and Search. `/api/moderation/report` inserts as the reporter (RLS) and emails church admins + support. Web: `ReportsCard` on People shows open reports (renders nothing when empty) with Disable account / No action needed.
- **Legal center** — `(marketing)/privacy`, `/terms`, `/dpa`, `/delete-account` share `components/legal/LegalDoc.tsx`: tab row across the four docs, sticky contents on desktop, and every section opens with a one-sentence "plain words" line (amber left rule) before the formal text. Facts live in `lib/legal.ts` (operator, governing state, subprocessor table). Old `app/privacy/page.tsx` removed. Sign-up on web and mobile now shows Terms + Privacy consent and a 13+ confirmation. Mobile links go through `src/lib/webApi.ts` (`WEB_URL`, override with `EXPO_PUBLIC_WEB_URL`).
- **Sentry tightened** — mobile `sendDefaultPii: false`, session replay only on error with all text/images/vectors masked, traces 20%; web `dataCollection: { userInfo: false, httpBodies: [] }`, replay only on error, masked. The store privacy answers assume this — see `docs/launch/store-privacy-answers.md`.
- **iOS privacy manifest completed** — `NSPrivacyTracking: false`, collected data types declared, required-reason APIs extended (file timestamp, boot time, disk space). Location is deliberately *not* declared as collected: it's used on-device only. `ITSAppUsesNonExemptEncryption: false` set.
- **Service-day flow (migration 0039)** — replaces the "Check In… future update" stub. Volunteers tap Check in on the mobile bulletin (`check_in_to_plan` RPC sets `checked_in_at` on their slots/parts; team list shows "Here"). ADMIN/SERVICE can toggle Run service: tap a part's circle to mark DONE, or Skip, with a progress bar and a "Now" highlight on the first PLANNED part (`set_plan_item_status` RPC, optimistic with rollback). Admins get an "Open printable bulletin" link to the web print route (which was already linked on web — that Known Gap was stale). **Migration 0040 tightened it:** Run service is ADMIN-only (UI and `set_plan_item_status`), and `check_in_to_plan` raises `NOT_SERVICE_DAY` unless the plan's date is today in the church's timezone — the screen shows "Check-in opens {weekday}" instead of the button. The screen also picks "today" in the church timezone, not UTC.
- **Profile photos actually work now** — they never did: uploads used `fetch(uri).blob()`, which on React Native hands supabase-js an unreadable Blob, so every file in the `avatars` bucket was **0 bytes**; and nothing ever rendered `profiles.avatar_url` (initials everywhere), and the only place to set one was onboarding. Now `lib/avatar.ts` uploads raw bytes (picker `base64: true` → `atob` → `Uint8Array`, Supabase's recommended RN approach), one file per user (`<uid>/avatar-<ts>.<ext>`, older files deleted, unique name doubles as cache-bust), and surfaces real error messages. `hooks/useAvatarEditor.ts` drives pick/take/remove (ActionSheetIOS on iOS, Alert on Android) for both onboarding and Profile (tap the photo — camera badge). `Avatar` gets `imageUri` on Home, Profile, Members, Search, the report/block sheet and the bulletin team list, falls back to initials on load error, and has a neutral hairline outline. Verified with a real JPEG: uploaded bytes == served bytes. Seed/wipe scripts must also delete `avatars/<uid>/` files — the August wipe left orphans.
- **Scheduling audit (migrations 0041–0043)** — rules now live in the database, not in each screen:
  - `normalize_schedule_row` trigger on `service_plan_role_slots` + `service_plan_items`: nobody assigned → `OPEN` (check-in cleared); a *different* person assigned → `ASSIGNED` (they haven't answered — previously the new person inherited "Confirmed"); `DECLINED` with a backup → backup promoted, `ASSIGNED`; backup can't equal primary; rows inserted from the app (`authenticated`) can't start `CONFIRMED`/`DECLINED`/`DONE` (fixes "Copy last plan" carrying last week's answers). When the people on a row change: the person must belong to the plan's church (raises otherwise) and a `MEMBER` is promoted to `SERVICE` (unrelated edits never re-promote someone an admin demoted).
  - `respond_assignment` rewritten: primary answers as before; a **backup's** Decline only removes them as backup and Confirm is an acknowledgement — it used to overwrite the primary's status. Past services can't be answered. Mobile Serve shows backup rows as "Backup" with "Step down as backup" (no Confirm/Decline) and the direct-table fallback is gone.
  - `release_future_assignments` runs from `admin_remove_member_from_church`, so removed members leave upcoming schedules (backup steps up or slot reopens).
  - Service-team audience policies now include `MEMBER` (composer promises "Members + service team"; volunteers were missing those posts). Volunteers' direct UPDATE policies on slots/parts were dropped — answering/check-in go through SECURITY DEFINER RPCs.
  - Data repaired on apply: 4 assigned-but-OPEN parts, 3 declined-but-unpromoted slots, 157 assignments held by MEMBER-role people (promoted to SERVICE — they had no Serve tab).
- **Plan editor saves in place** — `replacePlanItems`/`replacePlanRoleSlots` used to delete every row and re-insert on each 500ms autosave (new ids every save → broken reminders/open mobile screens, check-ins wiped, could lose the plan if the insert failed). Now `syncRows` sends only what the admin changed **relative to what this editor loaded** (`rememberPlanRows` baseline, registered by `fetchPlanItems`/`fetchPlanRoleSlots` and the `[planId]` page), updates in place, inserts new rows with the editor's own UUID (`newRowId()`, works on plain-http LAN hosts), deletes only rows this editor knew and removed, and serializes saves per plan. Verified live: a volunteer's confirmation / a decline-promotion made while an admin's editor was open survives that editor's autosave; no duplicate rows. Editor shows an inline "Also serving as … in this service" note for double-booking.
- **"Today" is local, not UTC** — web uses `localDateString()` (`lib/format.ts`) and mobile the church timezone; `toISOString().slice(0,10)` rolls to tomorrow on US evenings and hid Sunday's service. Reminder dispatch filters plans per church timezone.
- **Events: addresses + real event features (migration 0044)** — `events.address` (street address) alongside `location` (venue/room); apps show `event.address || church.address` everywhere (`eventAddress()` in `apps/mobile/src/lib/events.ts`), including nearby churches. Web `EventForm` has separate Venue and Address fields (placeholder = church address, "Use church address" reset); `EventsList` shows venue · address. Mobile: date and time are each their own full line (`eventWhen()` — "Friday, October 23" / "6:30 – 8:30 PM", multi-day aware) instead of a truncating 3-column `StatGrid`; detail has full-width info rows, Directions (Apple/Google Maps via `openDirections`), Add to calendar (`expo-calendar` `createEventInCalendarAsync` — the system sheet, no broad calendar access; needs `NSCalendars*UsageDescription`, a native module so standalone builds must be rebuilt), Share (with address), Happening now / Ended states (`eventPhase`), RSVP closed after an event ends, going/maybe counts kept live. Cards show "You're going" + N going; Save is persisted per user on device (`loadSavedEvents`) with a **Saved** filter (it used to be in-memory only); the fabricated "Free · All welcome" line was removed. Demo church address set to "Weaver Street, Carrboro, NC 27510" so Directions resolve.
- **Calendar fix + iPad off** — in SDK 57, `createEventInCalendarAsync` imported from `"expo-calendar"` is a stub that always throws; import it from `"expo-calendar/legacy"` (the new object API is stubbed in Expo Go). On phones `addToCalendar` is native-only (static import, retries once after requesting calendar access, otherwise surfaces the real error) — the Google Calendar link is used only in the web preview. `ios.supportsTablet` is now `false` (phone-only v1: no iPad screenshots/review). New native deps in this monorepo also need `node apps/mobile/scripts/ensure-hoisted-module-links.js` + a Metro restart with `--clear`, or a running dev server reports `Unable to resolve`.
- **Admin event workflow** — the create/edit modal now stays open (with the error shown) when saving fails instead of closing and losing the form; image removal actually clears `image_url`; all-day events are recognised when edited (00:00–23:59); **Delete event** in edit mode (warns with the RSVP count, suggests Cancel to keep a record); **Repeat** (weekly / every 2 weeks / monthly, 2–52 times — each occurrence is its own event, `expandRepeats` in the events page); **Also post an announcement** (same audience, body = when + where + details); button reads "Create N events" / "Saving…"; row menu buttons have `aria-label`s.
- **App icon flattened** — `assets/icon.png` re-saved as RGB (no alpha channel); App Store Connect rejects store icons with an alpha channel even when every pixel is opaque.
- **Photos on web too** — `components/ui/avatar.tsx` is now the single web avatar (photo or two-letter initials, falls back on load error, `className` carries each caller's initials colors). Used in AdminShell (sidebar + header; prefers `profiles.avatar_url` over OAuth metadata and listens for `gather-avatar-updated`), People table + member drawer, Volunteers assignments table + Pending/Declined cards, dashboard team strip + pending list, and admin search. Row data carries `avatarUrl` (dashboard builds an `avatarById` map). Account pages (admin + member) get a photo control in `ProfileCard`: `lib/avatar.ts` center-crops and re-encodes to a 512px JPEG in the browser (canvas) before upload, same `<uid>/avatar-<ts>.jpg` layout as mobile. `NextServiceTeamCard` is unused (only its `TeamRow` type is imported).
- **Tour is account-level, first login only** — `useFirstChurchTutorialCard` now reads/writes `user_metadata.tour_offered_at` (plus the old device flag as a fast path) and only offers it to accounts under 14 days old, so it no longer reappears on new devices/reinstalls/web or for existing users. `GuidedTourScreen` was rebuilt: each slide shows a miniature of the real tab bar with its tab lit (`MEMBER_TABS`/`SERVE_TABS` are now exported from `TabBar.tsx`), segmented progress, Back/Next, one light parallax (none under Reduce Motion), no idle bobbing/rotation. Replayable from Profile → App tour.
- **Tab bar rebuilt to platform specs** — root cause of the "off" spacing was leftovers from the floating-bar era: `MainTabs` still set `tabBarStyle.position: "absolute"` + `sceneContainerStyle.paddingBottom: 88` (removed in React Navigation 7), the bar itself was absolute, and every tab screen hard-coded `paddingBottom: 130–132`. Now the custom bar sits in normal flow below the scenes (bottom-tabs 7 lays a non-absolute custom bar out after the scene), tab screens end with `space.xxl`, and the bar's bottom padding is exactly `insets.bottom`. Metrics per platform (`M` in `TabBar.tsx`): iOS HIG 49pt + inset, 25pt glyph, 10pt label 3pt above the bar edge, dim-to-0.5 on press, selection haptic iOS-only; Android Material 3 80dp, 24dp icon in a 64×32 active-indicator pill (scaleX-in), 12sp label, ripple bounded to the pill. Selected tabs use the filled glyph (`glyphActive`), idle the outline. Emits `tabPress` before navigating. Do not reintroduce absolute positioning or per-screen bottom padding guesses.
- **Deleting a service time no longer deletes its plans (migration 0045)** — `service_plans.service_time_id` and `service_presets.service_time_id` were `ON DELETE CASCADE`, so removing a service time on Account silently wiped every plan (with assignments and answers) built on it. Both FKs are now `ON DELETE SET NULL`; plans keep their own `start_time` (backfilled where null). Account asks before removing a service time.
- **Web admin UI-protocol audit (October 2026)** — runtime sweep of all 12 admin pages (no console errors, no native selects/date/time inputs) plus a static pass against Vercel's Web Interface Guidelines. Fixed: one global `:focus-visible` amber outline in `globals.css` `@layer base` (28 controls had `focus:outline-none` with no replacement — keep the global rule rather than re-adding per-component rings); `aria-label`s on icon-only buttons (member/preset menus with `aria-haspopup`/`aria-expanded`, Volunteers add-slot, events clear-search) and on search/invite inputs that only had placeholders; Account labels tied to inputs with `htmlFor`/`id`; the Discoverable switch labeled; `transition-all` → `transition` and `...` → `…` across admin surfaces; confirmations before deleting a role (shows how many upcoming services use it — deleting a role still removes its slots) and a service time. Deletes elsewhere already confirmed.
- **Plans, Gather AI, and the "what's missing" pass (migration 0046)** —
  - **Plan gating:** `churches.plan` is the source of truth; web reads it through `lib/plan.ts` (`useChurchPlan`, `planHasAi`). **Gather AI is Congregation + Network only — Community (key `parish`) never sees it** (no button, no upsell). AI branding = `components/ai/AiBrand.tsx` (ink pill + amber `Sparkles` star) — ink, not amber, so it never competes with primary CTAs.
  - **Gather AI fill** (`lib/ai/autofill.ts`, `components/ai/AiFillDialog.tsx`, header button on the plan editor's roles section): v1 is a transparent ranking, not a model call — experience in the role, rest since last serve, load in the surrounding 2 weeks, recent declines, ministry interests; skips anyone away, already serving in the service, or a MEMBER with no interest/history. Every pick shows its reason; the admin reviews/skips, picks go into editor state and autosave persists them (status ASSIGNED — people still confirm). Model-backed suggestions should plug in behind the same `AutofillProposal` shape.
  - **Live Service** (`/live`): today's plans (tabs if several) or the next one; checked-in vs scheduled, gaps, run-of-show progress with Done/Skip/Undo (`set_plan_item_status`), team list Here/Not yet/Pending, polls every 15s while visible. After the service: **Send thank-you recap** → `/api/notifications/recap` (notification_log `SERVICE_RECAP` + push + email; `service_plans.recap_sent_at` makes it once-only).
  - **Team Health** (`/insights`): 90-day serving per person, 8-week sparkline, health = stretched (3+ of last 4 weeks) / steady / resting (60+ days) / new; away dates (admins add per service day); "Asked to serve" list from `serve_requests` (that flow already existed via `request_to_serve` — only the list view was missing); CSV export (`lib/csv.ts`, formula-injection safe).
  - **Away dates:** `volunteer_unavailability`; mobile Serve → Dates you're away (`AwayDatesScreen`, month calendar of service days, warns if already scheduled that day); plan editor pickers mark away people with an "Away" hint; AI fill skips them.
  - **Reminders are automatic:** `vercel.json` cron hits `/api/notifications/dispatch` daily at 22:00 UTC (about 6 PM ET, the evening before); needs `CRON_SECRET` set in Vercel (Vercel sends it as the Bearer token).
  - **Billing:** `PlanCard` shows plan/status/renewal and either plan choices (monthly/yearly → `/api/checkout`, which ties the subscription to the signed-in admin's church) or **Manage billing** (Stripe portal). `/api/stripe/webhook` verifies the signature by hand (`lib/stripeServer.ts`, no SDK) and maps the price id back to a plan.
  - **Data export:** Account → Export your data (`/api/export`, runs as the admin so RLS bounds it; includes phones, never push tokens). Marketing lists roster health + export as Congregation+, but both are on every plan for now — a product decision, not gated in code.
  - **RSVPs:** attendee dialog rebuilt (Going/Maybe/Not going tabs, avatars, CSV).
- **Mobile backgrounds: warm paper + Home glow + Dawn sign-in** — the lavender "Aurora" wash and cool lilac neutrals (bg #FAF8FE, sunken #F1EEF8, purple-tinted shadows) are gone: `palette` moved to warm paper (bg #F6F4EF) and then, with the web, to the near-neutral stone ramp (bg #F5F5F4 — see Design Feel → Surfaces). `Screen` is flat; `<Screen glow>` adds the morning-light wash (`gradient.glow`) — **Home only**. Sign-in and sign-up use `components/app/DawnLayout.tsx`: amber sunrise (`gradient.dawn`) with the mark + wordmark in a deep amber-brown (`DAWN_INK` #7A4A0C — the near-black #3A2600 read as jarring; never white on amber), form in a cream bottom sheet with a warm-brown heading (#3D2A14); the CTA pill text is `DAWN_INK_STRONG` (#5C3405, ≥4.5:1 on the amber pill). Mockups that led here: `design-handoff/mobile-backgrounds.html`.
- **Functional + navigation pass (migration 0047)** —
  - **Volunteers can change their answer (mobile Serve):** confirmed rows show "Can't make it anymore?" (native `Alert` with a destructive option — `window.confirm` on web, where RN's `Alert` is a no-op — plus a warning haptic); declined rows they still hold show "I can make it after all". Backup rows never get these (they mirror the primary's status). Admins get an `ASSIGNMENT_DECLINED` notification (web + mobile render it) saying whether the backup stepped in.
  - **Plan tab (mobile) has a service picker:** the next 8 services as chips; opens on the next one the person serves in (else the next one). Previously it showed only the earliest upcoming plan, so one stray plan hid Sunday's bulletin.
  - **No more plans on blank days (web):** Service Plans and Volunteers open on the next service day (`nextServiceDate` in `lib/format.ts`), new plans get `service_time_id` + start time from the matching service time (`serviceTimeForDate`), and creating a plan on a day with no service asks first. A stray "Sunday Morning Order" plan dated Sat Oct 17 (no time, no roles) came from exactly this.
  - **Resilience:** Home keeps what's on screen when a refresh request fails instead of blanking to "nothing on the calendar". The offline banner is hidden from screen readers while online (it was always in the a11y tree) and no longer claims "showing saved data" (nothing is cached).
  - **Web navigation:** sidebar grouped (Dashboard, Live Service · Planning · People · Communication — never "Sunday" in labels: some churches worship on Saturday; rows are 40px = `--sidebar-row-h`, tightening on short windows via `.sidebar-item` media queries, never a visible scrollbar); `Ctrl K` / `⌘K` / `/` focuses search (hint shown in the field); `AdminHeader` takes `back={{ href, label }}` (plan editor → Service plans); dashboard quick actions open the composers (`/announcements?new=1`, `/events?new=1`); hero links to Live Service; the admin's name in the greeting is no longer amber (decorative amber). "Fill with AI" is on the plan editor, the Service Plans page, and the Volunteers Assignments header (→ plan with `?ai=1`).
  - **Serving vs backup is always labeled:** `SelectMenu` takes `prefix` and `emptyText` (preset step rows use them); on plans the board's avatar badge + picker make primary vs backup explicit.
  - **Buttons:** `.btn-primary`/`.btn-secondary`/`.btn-ghost` are colour-only — always pair with `.btn` (or use `components/ui/button.tsx`). Disabled primary is neutral grey, not faded amber.
- **Live service progress (migration 0048)** — `trg_notify_plan_item_progress` (AFTER UPDATE OF status on `service_plan_items`, service day only, church timezone) writes to `notification_log` whenever a step is marked DONE/SKIPPED, from either client:
  - `STEP_THANKS` → the step's person (once per step, even if toggled); `STEP_PROGRESS` → every later-step person, one row each for their nearest step with `steps_away`/`minutes_away`. **Only the next person to serve gets a push** (`payload.push`/`next_up`, even if an unassigned step like a video comes first) — the rest are quiet in-app updates, so a 10-step service never buzzes a phone 10×.
  - `ASSIGNMENT_MISSED` → admins, when a done/skipped step's person never checked in anywhere in the service (never about the admin themself). `SERVICE_COMPLETE` → admins once, when no PLANNED steps remain, listing everyone scheduled who never checked in; stamps `service_plans.completed_at` (undoing a step clears it).
  - Push: the trigger can't make HTTP calls, so whoever runs the service calls `POST /api/live/push { planId }` right after each change (web Live Service and mobile Run service both do); it sends unsent `push` rows for that plan and stamps `payload.pushed`.
  - Web Live Service: Done → the check pops with a radial burst and the row washes green, "Now" glides to the next step, a toast says who was thanked / who's up next, "Missed" pills on steps and team; when finished, a "Service complete" panel draws a check, drops confetti, lists who didn't check in, and offers "Thank the team" (the recap). CSS: `.live-pop`, `.live-burst`, `.live-flash`, `.live-now`, `.live-check-*`, `.live-confetti` in `globals.css`, all off under reduced motion.
  - Mobile bulletin: on service day it refreshes every 15s and everyone (not just the admin running it) sees progress, the Now step, done/skipped marks and a personal line ("You're up now / next", "Your part is N steps away · about X min", "Your part is done — thank you"), then a "Service complete" card. The admin's check springs in with a success haptic. All four types render in web + mobile Notifications.
- **Service-start notices + kind notes (migration 0049)** —
  - **Whole church is told a service is about to start.** `pg_cron` runs `public.send_service_start_notices()` every 5 minutes (job `service-start-notices`); for each plan starting within 30 min (church timezone, `start_time` or its service time's), once per plan (`service_plans.start_notice_sent_at`, claimed before sending so overlapping runs can't double-send) it writes `SERVICE_STARTING` for every non-disabled member and pushes straight to Expo with `pg_net` (`net.http_post`, batches of 100). No web server or Vercel cron involved. Every service notifies everyone (a 9:00 and an 11:00 both go out); there's no per-member mute yet.
  - **No red "missed" on the finished service.** Live Service shows a neutral "No check-in" tag (steps and team) and, in the completion panel, a "Check in on …" card (neutral avatars + **Send a kind note**) → `/api/live/care` (admin; recomputes who didn't check in server-side, skips the sender, once per plan via `service_plans.care_note_sent_at`) → `CARE_NOTE` "We missed you at {service} today. Hope everything's okay — no need to reply." + push. `ASSIGNMENT_MISSED`/`SERVICE_COMPLETE` copy softened to "didn't check in" / "worth checking in on" (info/success tone, never warning red).
  - Testing note: check the time before faking a start ("now + 10 min" near midnight wraps to 00:xx of the same date, which is in the past).
- **Notifications for assignments, confirms, events, announcements (migration 0050)** —
  - `ASSIGNMENT_NEW`: trigger on slots + steps whenever someone becomes the person serving or the backup on an upcoming plan (one per person per plan, never about yourself). The push waits `delay_seconds` (45) and `send_queued_pushes()` deletes it unsent if they were taken off the plan meanwhile — admins trying names in the editor don't buzz phones.
  - `ASSIGNMENT_CONFIRMED` to admins alongside `ASSIGNMENT_DECLINED` (both skip the admin answering for themself), in `respond_assignment`.
  - `EVENT_NEW` / `ANNOUNCEMENT_NEW`: `queue_content_notices()` claims rows via `events.notified_at` / `announcements.notified_at` (announcements once `publish_at` passes), notifies everyone the audience reaches (`audience_reaches()` mirrors the select policies) except `created_by` (new column, defaults to `auth.uid()`); a repeating series made in one go announces once ("and 3 more dates").
  - pg_cron job `notification-queue` runs both functions every minute; pushes go out via pg_net with `push_title`/`push_body` from the payload. Live-service pushes still go through `/api/live/push`.
  - Mobile: `hooks/usePushTaps.ts` opens the right screen when a push (or an inbox row) is tapped — there was no tap handling before.
  - `follow_service_time_change` trigger: changing a service time moves upcoming plans that used the old time. The Service Plans page time picker now saves to the plan (it only changed local state, so the app kept the old time).
- **Run service only on the service day (migration 0051)** — `set_plan_item_status` now refuses DONE/SKIPPED (`NOT_SERVICE_DAY`) unless the plan's date is today in the church timezone (PLANNED, i.e. undo, is always allowed), matching web Live Service, which only shows Done/Skip on the day. Mobile bulletin shows Run service only on the day; before it, one full-width line ("Check-in and Run service open Sunday") replaces the half-width box that truncated.
- **Typed announcements (migration 0052)** — see Database and Announcements. RLS on the child tables follows the post's own visibility (`exists` on announcements under the caller's RLS); sign-ups are RPC-only; the private note is readable only by admins and people who signed up. Verified as real users with `.seed-tmp/audit_signups.mjs` (note hidden then shown, full slot refused, one slot per person, closed refused, direct insert refused, praying refused on non-prayer posts; the script cleans up its test post).
- **Mobile Serve / Plan / News rebuilt from the approved mockups** (canvas "Gather mobile — Announcements, Plan & Serve"): shared `lib/serving.ts`, `components/app/AnswerButtons.tsx`, new `AssignmentDetail` + `AwayDates` stack routes, `theme/areas.ts` gained `hueAt`, Icon gained `pray`/`pin`/`food`/`parking`/`baby`.
- **Read-only after the trial (migration 0054)** — `church_writable(church_id)` (paid via Stripe status, `active`, or `trial_ends_at` in the future) and `trg_read_only_after_trial` on announcements, events, service plans + steps + team, templates + steps, roles, ministries, service times, sign-up slots/notes and churches: app-user (`authenticated`) inserts/updates/deletes raise `READ_ONLY`. Not blocked: SECURITY DEFINER RPCs (answering, check-in, sign-ups, running the service, removing members), a person's own rows (profile, RSVPs, away dates, praying, reports) and the service role. The trigger function must NOT be SECURITY DEFINER or its `current_user` check sees the owner and never blocks. Verified as real users with `.seed-tmp/audit_read_only.mjs` (temporarily ends Grace's trial, restores it). Web: `TrialBanner` is an amber countdown during the trial ("When it ends, Gather goes read-only…" + "Keep everything running"), then a red bar plus a once-per-session "Your free trial has ended" dialog.
- **Pay by invoice / ACH / check** — Checkout uses Stripe's dynamic payment methods, so enabling **ACH Direct Debit** in the Stripe dashboard adds "pay from bank account" with no code (0.8%, $5 cap). Account → plan card has "Pay by invoice (ACH or check)" → `/api/billing/invoice`: creates the Stripe customer and a `collection_method=send_invoice` subscription (30 days to pay, first invoice at trial end if still in trial, `metadata.church_id` so the existing webhook updates the church). Checks are marked paid in the Stripe dashboard (Invoice → Change status → Paid). Pricing FAQ says so.
- **Trials that end (migrations 0053, 0055)** — new churches trial **Congregation** (Gather AI included) for **14 days** (0055 shortened it from 30; `churches.trial_ends_at`, default now()+14d; the billing guard sets it on app inserts and pins it on updates). Web: `lib/plan.ts` `accessFor()` → `paid` / `trial` / `expired` / `lapsed`; `aiEnabled` only when paid or in trial. `components/admin/TrialBanner.tsx` above every admin page (days left; amber in the last 7 days; after expiry "Gather AI is off. Everything you set up is still here."), links to `/account#plan`. When a trial ends without a plan the church goes read-only (0054); nothing is deleted. `PlanCard` shows days left, defaults to yearly. Checkout: a signed-in church keeps its `trial_end` (no second trial) and enters a card; a brand-new purchase from /pricing gets 14 days (`TRIAL_DAYS`) with `payment_method_collection=if_required` and `trial_settings.end_behavior.missing_payment_method=cancel`, so "no card to start" is true.
- **Launch conversion pass (migration 0056)** —
  - **14-day money-back guarantee** on top of the 14-day trial: pricing card reassurance line, a guarantee block under the reduced-pricing strip, FAQ entry, landing hero microcopy, and the Terms "Paid plans" section (refund of the first payment if asked within 14 days). Refunds are done by hand in the Stripe dashboard. Keep every mention literally true.
  - **Student organizations always get a discount** (campus ministries, college fellowships): reduced-pricing strip, FAQ, landing pricing line. Discounts are handed out as Stripe promotion codes (checkout has `allow_promotion_codes`).
  - **Trial emails** — `/api/billing/trial-emails` (Vercel Cron daily 14:00 UTC, `Bearer $CRON_SECRET`) emails church admins of trialing churches with no subscription: welcome (day 1), midway (7 days left, with counts), ending (2 days left, read-only warning), ended (within 3 days of the end). `trial_email_log` (0056, service-role only, PK church+kind) makes each send once; only the latest applicable stage is sent and earlier ones are marked done.
  - **Founding churches** — `components/marketing/FoundingOffer.tsx` (server component, landing pricing section + /pricing above the plans): the first `FOUNDING_SPOTS` (10) churches with a Stripe subscription keep their price for life + a free setup session. The count is real (`unstable_cache`, 10 min; both pages `revalidate = 600`) and the strip disappears at 0. Same promise in the FAQ and Terms → Paid plans — honour it: never move a founding church's subscription to a new price.
  - **Spreadsheet import** — People → Invite → `ImportPeopleCard` (CSV from Excel/Sheets/Planning Center/Breeze; columns matched by header: name or first+last, email, phone, role; template download; preview; default role; optional email). `/api/people/import` (admin, refuses when read-only, ≤100 rows per call, client chunks 50): `auth.admin.generateLink({type:'invite'})` creates the account without Supabase sending mail, profile upserted as MEMBER/SERVICE (never ADMIN), phone → `profile_private`, then a Brevo email with `/auth/set-password?token_hash=…&type=invite`. Never moves someone who already belongs to another church ("has a Gather account — send your join link"). Verified live with a throwaway user (added, re-import = already here, deleted).
  - **`/auth/set-password`** — one landing page for import invites (`verifyOtp` token_hash), web resets (PKCE `?code=`) and mobile resets (`#access_token`); an expired link offers a fresh one. A link that fails never falls back to whoever is already signed in on that browser. Web and mobile "Forgot password" now redirect here (before, web resets landed on `/login`, which had no way to set a new password). Needs `https://gatherministry.online/auth/set-password` in Supabase → Auth → URL Configuration → Redirect URLs.
  - **Analytics + attribution** — `components/marketing/SiteAnalytics.tsx` in the marketing layout: `@vercel/analytics` (cookieless; enable Web Analytics in the Vercel project) and `lib/attribution.ts`, which remembers `?ref=` / `utm_*` (and the first external referrer) in localStorage; web sign-up saves it as `user_metadata.signup_source`. `/auth` captures too, so reps can link straight to `/auth?tab=signup&ref=CODE`. Privacy policy + Vercel subprocessor row updated. Per-rep query and the whole outreach plan: `docs/launch/church-outreach-playbook.md`.
- **Volunteers page plan creation** — it upserted `service_plans` on `(church_id, service_date)`, but the unique key is `(church_id, service_time_id, service_date)`, so "Create the plan"/"Copy last service" failed with a raw Postgres ON CONFLICT error. Now find-or-create tied to that day's service time (asks first on a non-service day), plain-language errors in a dismissable banner.
- **Gather AI fill covers steps** — it only looked at team spots, so a plan with roles filled but steps empty said "Every role is already filled". Steps go to whoever holds the step's role in that service, else the best-rested match; empty states now say what's actually true.
- **Web speed** — middleware uses `auth.getClaims()` (verifies the JWT against cached keys) instead of `getUser()` per navigation; `getCurrentContext()` reads the session locally, runs church + service times in parallel, shares in-flight calls and caches 5s (`invalidateCurrentContext()` after Account edits); sign-in drops a round trip, prefetches the destination and stays "Signing in…" until it lands. Local `pnpm dev` still compiles each page on first visit (4–6s) — judge speed on the deployed site.
- **Docs** — `docs/launch/app-store-and-google-play.md` (Apple as Individual → LLC conversion/transfer → Google Play), `docs/launch/store-privacy-answers.md`, `docs/security/incident-response.md`.
---

## Environment Variables

**Web** (`apps/web/.env.local`): `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `NEXT_PUBLIC_GATHER_IOS_APP_URL` · `NEXT_PUBLIC_GATHER_ANDROID_APP_URL` · `BREVO_API_KEY` · `BREVO_FROM_EMAIL` (must be `Name <email>` format — a bare email breaks Brevo's `parseFrom()`) · `NOTIFICATION_LOOKAHEAD_HOURS` · `SENTRY_AUTH_TOKEN` (source map upload; must be in `turbo.json`'s `build.passThroughEnv` or Vercel silently won't create a release) · `STRIPE_SECRET_KEY` · `STRIPE_PRICE_COMMUNITY_MONTHLY` / `_ANNUAL` (old `STRIPE_PRICE_PARISH_*` names still accepted), `STRIPE_PRICE_CONGREGATION_MONTHLY` / `_ANNUAL`, `STRIPE_PRICE_NETWORK_MONTHLY` / `_ANNUAL` (checkout is a friendly no-op without these) · `STRIPE_WEBHOOK_SECRET` (webhook signing secret) · `CRON_SECRET` (Vercel Cron → reminder dispatch) · `DEMO_REQUEST_INBOX` (optional, defaults to `support@gatherministry.online`) · `NEXT_PUBLIC_SITE_URL` (optional, checkout success/cancel URLs fall back to the request's own origin)

**Mobile** (`apps/mobile/.env`): `EXPO_PUBLIC_SUPABASE_URL` · `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Local dev quirks (Windows):** `.npmrc` sets `node-linker=hoisted` specifically to avoid a Windows `pnpm install` race (`ENOENT` on `_tmp_*` dirs during hardlinking) — this is why the Vercel build needs the `isolated`-linker override noted in Known Gaps rather than just matching local dev. If `pnpm install` throws that ENOENT, it's transient — just retry, or `pnpm store prune` if it persists. If Expo Go reports "check your internet connection" on the same Wi-Fi, it's almost always Windows Firewall blocking Metro's port or router client-isolation, not a real network issue — `expo start --tunnel` routes around both.
