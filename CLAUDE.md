# Gather — Claude Code Project Brief

## Mission

Gather exists to give churches their time back. Church leaders spend too many hours juggling spreadsheets, email threads, and disconnected tools to coordinate volunteers, communicate with members, and plan weekly services. Gather replaces all of that with one calm, focused workspace — so pastors and ministry leads can spend less time on administration and more time doing the work they were called to do.

**Core belief:** software for the local church should feel as thoughtful and polished as the best consumer tools — not like enterprise software that happens to have a "church" label on it.

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
- **Warm** — amber brand, Rubik typeface, soft neutral backgrounds. Never cold or clinical.
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
- **Amber is sacred** — `#f59e0b` / `--primary` is used only for brand, active states, and primary CTAs. Never sprinkled decoratively.
- **Flat over gradients** — solid color surfaces; the one exception is the dashboard hero strip which uses a subtle warm mesh.
- **Rubik** at 300–700 weight. Never a different font.
- **Radius is soft** — `rounded-xl` (12px) on cards/buttons, never perfectly square or pill-shaped for utility UI.
- **No native form controls** in styled contexts — every `<select>`, `<input[type=date]>`, `<input[type=time]>` gets replaced with a custom component. Use `components/ui/SelectMenu.tsx` — searchable, keyboard-navigable, portalled to `document.body` (so no ancestor `overflow: hidden` can clip it; a card container's `overflow-hidden` clipped an early version). Now used everywhere — the last native `<select>`s (live `AssignmentsTable`) were migrated, and three dead components that held the rest (`AssignmentsTable.v1`, `PresetEditor`, `ServiceTimeSelector`) were deleted.
- **Every number has context** — stats always carry a label, trend, or supporting count. Orphaned numbers are a bug.
- **Dashboard scale, not marketing scale** — admin page titles run 20px default / 24px for hero pages (`AdminHeader`, `PageHeader`), not the 30–48px display type appropriate on the auth screen or marketing site. An earlier pass had these too large, pushing real content off the fold; `(admin)/layout.tsx` content wrapper is `space-y-6` / `max-w-[1600px]`, not the `space-y-12` / `max-w-7xl` it started as.
- **One warm neutral hue** — `--surface`/`--surface-2`/`--border`/`--divider`/`--text-muted` all sit on the same warm hue (~70) rather than drifting across cool blue-grays and pink/orange-tinted grays. A prior mismatch (three different hues plus cool-gray borders) was the main source of surfaces reading as "muddy" where cards stack.

---

## Designer Role & Autonomy

Claude acts as **executive web designer** on this project with full creative autonomy over the admin portal UI. This means:

- **Take liberties freely** — change grid layouts, rescale components, replace or create new components, adjust spacing, reorder sections, rethink interaction patterns. Do not ask permission for visual decisions; make them and the user will redirect if needed.
- **Modern UI standards apply** — reference patterns from Linear, Notion, Figma, Stripe dashboard. Flat colors over gradients, generous whitespace, clear hierarchy, consistent interaction states.
- **Replace DaisyUI primitives** — when a DaisyUI class (`card`, `btn-outline`, `select-bordered`, `badge`, `modal-box`) produces dated or inconsistent output, replace it with custom Tailwind. The design system tokens in `globals.css` are authoritative.
- **Native selects are banned** from styled UI contexts. Always replace with custom dropdown components.
- **Hover states required** on every interactive element — minimum `transition-colors`, prefer lift (`hover:-translate-y-0.5`) on cards/buttons.
- **No orphaned numbers** — every stat needs a trend indicator or supporting context.
- **Amber is semantic** — only for brand accent, active states, and primary CTAs. Never decorative.

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
│   └── migrations/   # 44 SQL migrations (up-only)
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
| `churches` | id, name, slug, timezone, address, `worship_days` (int[], migration 0027) |
| `profiles` | id (FK auth.users), church_id, full_name, email, role, disabled, `avatar_url`, `favorite_verse`, `ministry_interests` (text[]), `profile_completed_at` (migration 0032) |
| `service_times` | church_id, name, day_of_week, start_time, timezone |
| `volunteer_roles` | church_id, ministry_id?, name |
| `service_presets` | church_id, service_time_id?, name, is_default, `worship_day` (int, nullable service_time_id since 0028) |
| `service_preset_items` | preset_id, position, title, duration_minutes, notes, owner_role_id |
| `service_plans` | church_id, service_time_id?, service_date (unique per church+time+date), preset_id?, title, `start_time` (text, since 0027 — service_time_id is nullable) |
| `service_plan_role_slots` | plan_id, role_id, assigned_user_id, backup_user_id, status, notes |
| `service_plan_items` | plan_id, position, title, duration_minutes, assigned_user_id, backup_user_id, status, `assignment_status` (ASSIGNED/CONFIRMED/DECLINED, separate from the PLANNED/DONE/SKIPPED `status`) |
| `announcements` | church_id, title, body, audience, publish_at, image_url |
| `events` | church_id, title, start_at, end_at, audience, is_cancelled, image_url |
| `event_rsvps` | event_id, user_id, status |
| `notification_log` | church_id, user_id?, type, payload (jsonb), sent_at, read_at |
| `profile_private` | user_id, phone, expo_push_token — migration 0038; owner + same-church admins only (never put contact/device data on `profiles`, which the whole church can read) |
| `content_reports` | church_id, reporter_id, reported_user_id, reason, details, resolved_at — migration 0038 |
| `user_blocks` | blocker_id, blocked_id — migration 0038, self-only RLS |
| `serve_requests` | church_id, user_id, role_ids (uuid[]), role_names (text[]) — migration 0033, member-initiated "I'd like to serve" requests |

> **Important:** `volunteer_assignments` was dropped in migration 0024. All scheduling now uses `service_plan_role_slots` and `service_plan_items`.

> **Important:** to tell two same-day services apart (e.g. a 9:00 and an 11:00 Sunday), always resolve `service_plans.service_time_id → service_times.name` and show it alongside the date/time — the date+time alone is ambiguous. Both `AssignmentsScreen` and `HomeScreen` on mobile do this via an extra `service_times` lookup keyed by the distinct `service_time_id`s in the fetched plans.

### Key RPCs

| Function | What it does |
|---|---|
| `bootstrap_church(name, slug, timezone)` | Creates church + sets profile to ADMIN |
| `create_service_plan_from_preset(service_time_id, date, preset_id)` | Clones preset into a new plan |
| `respond_assignment(source, id, response)` | CONFIRMED/DECLINED for slot or item; promotes backup on decline |
| `admin_remove_member_from_church(user_id)` | Nulls church_id; guards last-admin removal |

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
    ├── notifications/dispatch/route.ts
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
- **`PricingTables`** — monthly/yearly toggle, calls `/api/checkout` which needs `STRIPE_PRICE_*` env vars per plan+cycle to actually complete (see Environment Variables).
- **`lib/marketing/plans.ts`** — single source of truth for plan pricing (Parish $74/mo, Congregation $149/mo, Network $225/mo; ~2 months free annually), the comparison matrix, and the pricing FAQ. Both the landing preview and `/pricing` read from here.
- **Imagery rule:** anything added to a wide/short card slot (hero, feature panels, browse tiles) must be genuinely landscape (~1.75:1) and subject-filling. A portrait source cropped into a short card shows only a thin band of background — this actually happened once and produced "black cards with a sliver of a gradient." Verify orientation before using an image, don't assume.

### Auth transition ("Dawn") — `components/auth/`, `lib/authTransition.ts`

A full-screen amber overlay (bloom + per-letter "Gather" wordmark reveal) that plays on sign-in, sign-up, and sign-out. It's mounted once in the root layout (`AuthTransition`, not inside the auth page) so it survives the route change from `/auth` to `/admin` — the auth page calls `coverForAuthTransition()`, awaits the overlay fully covering the screen, then navigates; the overlay uncovers only once `usePathname` confirms the destination route has actually mounted (not a fixed delay — an earlier version guessed a delay and uncovered while still on the old route). Skips entirely under `prefers-reduced-motion` or when the tab is backgrounded.

---

## AdminShell

Fixed left sidebar (200px), sticky top header (56px / h-14), main content offset by sidebar width.

**Nav items:** Dashboard · People · Volunteers · Service Plans · Service Presets · Announcements · Events · Notifications (with red unread badge) · Account

Active item: amber left rail (`w-1`, `--primary`) + `--primary-soft` background. Notification count polled from `notification_log` on mount and on `gather-notifications-updated` window event.

---

## Component Inventory

### Volunteers (`components/volunteers/`)

| Component | Purpose |
|---|---|
| `AssignmentsTable` | Main bulletin editor: role slots + run-of-show items |
| `ScheduleBuilder` | Generate/copy schedule |
| `NextServiceReadinessStrip` | Three-layer donut + stats + action buttons |
| `PendingResponsesCard` | ASSIGNED slots awaiting response |
| `DeclinedCard` | DECLINED slots needing replacement |
| `QuickRolePresets` | One-click add Greeter / Usher / Sound Team |

### Dashboard (`components/dashboard/`)

`KpiRow`, `ThisWeekStrip`, `RosterDonutCard`, `NextServiceTeamCard`, `PendingConfirmationsCard`, `LatestAnnouncementsCard`, `UpcomingEventsCard`, `RecentActivityCard`, `VenusAccentStrip`

### People (`components/people/`)

`MembersTable`, `MemberFilters`, `MemberDetailsDrawer`, `InviteMembersForm`

### Service Plans (`components/servicePlans/`)

`ServicePlanHeader`, `ServicePlanRoleSlotsSection`, `ServicePlanStepsEditor`, `PlanEditor`, `PrintablePlan`, `GenerateFromPresetButton`, `CopyLastPlanButton`

`ServicePlanRoleSlotsSection` was reworked from ~400px stacked cards per slot to single 44px rows (`[status ▾] [assigned ▾] [backup ▾] [note] [×]`), with the whole section collapsible, unused roles hidden behind a disclosure, and per-role coverage counts. Uses `SelectMenu` throughout — the native `<select>`s it used to have were the reason status changes silently reset an assignment; that's now fixed too (assigning someone only advances a slot still marked `OPEN`, never downgrades a `CONFIRMED` one).

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
- **`components/app/ConfirmCelebration.tsx`** — the post-confirmation overlay, wired into `AssignmentsScreen`'s both RPC and fallback success paths. Fires only on confirm, never decline.
- **`lib/churchImagery.ts`** — the shared fallback-photo system (`eventFallback(id)`, `newsFallback(id)`, deterministic per-id so the same record always shows the same fallback). Used by `EventsScreen`, `HomeScreen`, `AnnouncementsScreen`, and both detail screens whenever a real `image_url` is absent. **Every image here must be landscape (~1.75:1) and subject-filling** — see the Marketing Site imagery rule above; this bit twice before the rule was written down.

### Key screens

| Screen | What it shows |
|---|---|
| `HomeScreen` | Grouped "Next up" hero, "Awaiting your reply" (SERVICE/ADMIN), image Browse tiles, "Upcoming" list, "Latest news" carousel |
| `AssignmentsScreen` ("Your Schedule") | User's upcoming assignments grouped by date, each showing `{service name} · {time}` (not just time — see the service_time_id note under Database); confirm/decline via `respond_assignment` RPC, triggers `ConfirmCelebration` on confirm |
| `ServicePlanScreen` | Read-only bulletin view of run-of-show |
| `AnnouncementsScreen` | Featured card + list, all with a real photo or a deterministic fallback |
| `EventsScreen` | Eventbrite-style filter chips + large photo cards, share/save actions |
| `SignInScreen` | Two-step email → password reveal, full-width pill CTA, "Forgot password?" as its own step |

---

## Known Gaps / Stubs

| Gap | Notes |
|---|---|
| `packages/ui` | Placeholder only — no shared component library |
| Stripe billing | `/api/checkout` calls Stripe's REST API directly (no SDK), but needs real `STRIPE_SECRET_KEY` + `STRIPE_PRICE_*` env vars to actually complete a purchase — currently returns a friendly "not configured" error |
| No data-fetching/caching layer | Screens call Supabase directly with local `useState` (no React Query/SWR) — fine at current scale, but means duplicate fetches between screens and no stale-while-revalidate. Deliberately not migrated wholesale; touches every screen's fetch logic and isn't safe to do without per-screen device testing. Revisit as a scoped, incremental migration, not a single pass. |
| Mobile ServicePlanScreen | Read-only; editing is web-only |
| Web/mobile React version split | Web is pinned to React 18 (Next 14.2 doesn't officially support React 19); mobile runs React 19.2.3 (Expo 57 requires it). Kept apart via `pnpm.overrides`. Resolves itself once web moves to Next 15. |
| Vercel build needs `node-linker=isolated` | `vercel.json` overrides the install command to `pnpm install --filter web... --config.node-linker=isolated` — the default hoisted linker (used locally, see `.npmrc`) puts two physically separate copies of React 18 in the graph when mobile's React 19 is also present, which crashes `/404`/`/500` prerendering (`styled-jsx`'s `StyleRegistry` gets a null hook dispatcher). Do not remove this override without re-verifying a real Vercel/isolated-linker build. |
| Nearby churches uses a demo neighbor | Grace Community is placed at its ZIP (27510, Carrboro NC — its street address is fictional) and a demo church, **"Hope Fellowship (demo)"** (`hope-fellowship-demo`, Chapel Hill, ~2.8 mi away, 4 public events, no members), exists so "Nearby churches" has something to show. Remove it before real churches launch: `node .seed-tmp/nearby_seed.mjs undo` (or set `discoverable = false`). Real churches get coordinates when an admin saves their address on Account (`/api/geocode`). |
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
- **Warm neutral token unification** — `--surface`/`--surface-2`/`--border`/`--divider` moved off three drifting hues (plus cool-blue-gray borders) onto one warm hue (~70)
- **Dawn auth transition** — full-screen amber overlay on sign-in/up/out, mounted in the root layout so it survives the route change; see Marketing Site section above
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
- **Tab bar: classic bottom bar (after trying floating circles and floating glass)** — `TabBar.tsx` is a full-width solid-surface bar flush with the screen bottom, hairline on top, icon over a short label (`News`/`Plan` visible, full names spoken: five tabs leave ~70pt each), active tab in `palette.amberInk` (#B45309, ~5:1 on white — plain amber is ~2.1:1 and `amberDeep` ~2.9:1, both too faint for 11px text) with a semibold label; inactive is `inkSoft` (~5.7:1). Bottom padding is the live safe-area inset so the surface runs under the home indicator / gesture bar (Android 15 + SDK 57 are edge-to-edge; `edgeToEdgeEnabled: true` is set in `app.json`). Each tab spring-animates a cross-fade between idle/active layers (`Animated`, no bounce, interruptible, skipped under Reduce Motion via `hooks/useReduceMotion.ts`, mounts settled so nothing animates on first render). `role="tab"` + `aria-label` + `aria-selected` inside a `tablist` (use `aria-selected`, not `accessibilityState` — react-native-web does not translate the latter), iOS press-scale 0.94 vs Android ripple, `expo-haptics` selection tick on tab change, tab labels capped at `maxFontSizeMultiplier={1.2}`. History: the floating-glass version used `expo-blur`, which does NOT blur on Android by default (`blurMethod` defaults to 'none', just a translucent tint) and a heavy shadow shows through glass as a gray smudge; it was dropped on taste. `expo-blur` has since been removed. `expo-haptics` is a native module: fine in Expo Go, but standalone builds need a rebuild. `runtimeVersion` is now `{policy: "fingerprint"}`, so `eas update` only reaches binaries with matching native code.
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
- **App icon flattened** — `assets/icon.png` re-saved as RGB (no alpha channel); App Store Connect rejects store icons with an alpha channel even when every pixel is opaque.
- **Photos on web too** — `components/ui/avatar.tsx` is now the single web avatar (photo or two-letter initials, falls back on load error, `className` carries each caller's initials colors). Used in AdminShell (sidebar + header; prefers `profiles.avatar_url` over OAuth metadata and listens for `gather-avatar-updated`), People table + member drawer, Volunteers assignments table + Pending/Declined cards, dashboard team strip + pending list, and admin search. Row data carries `avatarUrl` (dashboard builds an `avatarById` map). Account pages (admin + member) get a photo control in `ProfileCard`: `lib/avatar.ts` center-crops and re-encodes to a 512px JPEG in the browser (canvas) before upload, same `<uid>/avatar-<ts>.jpg` layout as mobile. `NextServiceTeamCard` is unused (only its `TeamRow` type is imported).
- **Tour is account-level, first login only** — `useFirstChurchTutorialCard` now reads/writes `user_metadata.tour_offered_at` (plus the old device flag as a fast path) and only offers it to accounts under 14 days old, so it no longer reappears on new devices/reinstalls/web or for existing users. `GuidedTourScreen` was rebuilt: each slide shows a miniature of the real tab bar with its tab lit (`MEMBER_TABS`/`SERVE_TABS` are now exported from `TabBar.tsx`), segmented progress, Back/Next, one light parallax (none under Reduce Motion), no idle bobbing/rotation. Replayable from Profile → App tour.
- **Tab bar rebuilt to platform specs** — root cause of the "off" spacing was leftovers from the floating-bar era: `MainTabs` still set `tabBarStyle.position: "absolute"` + `sceneContainerStyle.paddingBottom: 88` (removed in React Navigation 7), the bar itself was absolute, and every tab screen hard-coded `paddingBottom: 130–132`. Now the custom bar sits in normal flow below the scenes (bottom-tabs 7 lays a non-absolute custom bar out after the scene), tab screens end with `space.xxl`, and the bar's bottom padding is exactly `insets.bottom`. Metrics per platform (`M` in `TabBar.tsx`): iOS HIG 49pt + inset, 25pt glyph, 10pt label 3pt above the bar edge, dim-to-0.5 on press, selection haptic iOS-only; Android Material 3 80dp, 24dp icon in a 64×32 active-indicator pill (scaleX-in), 12sp label, ripple bounded to the pill. Selected tabs use the filled glyph (`glyphActive`), idle the outline. Emits `tabPress` before navigating. Do not reintroduce absolute positioning or per-screen bottom padding guesses.
- **Docs** — `docs/launch/app-store-and-google-play.md` (Apple as Individual → LLC conversion/transfer → Google Play), `docs/launch/store-privacy-answers.md`, `docs/security/incident-response.md`.
---

## Environment Variables

**Web** (`apps/web/.env.local`): `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `NEXT_PUBLIC_GATHER_IOS_APP_URL` · `NEXT_PUBLIC_GATHER_ANDROID_APP_URL` · `BREVO_API_KEY` · `BREVO_FROM_EMAIL` (must be `Name <email>` format — a bare email breaks Brevo's `parseFrom()`) · `NOTIFICATION_LOOKAHEAD_HOURS` · `SENTRY_AUTH_TOKEN` (source map upload; must be in `turbo.json`'s `build.passThroughEnv` or Vercel silently won't create a release) · `STRIPE_SECRET_KEY` · `STRIPE_PRICE_PARISH_MONTHLY` / `_ANNUAL`, `STRIPE_PRICE_CONGREGATION_MONTHLY` / `_ANNUAL`, `STRIPE_PRICE_NETWORK_MONTHLY` / `_ANNUAL` (checkout is a friendly no-op without these) · `DEMO_REQUEST_INBOX` (optional, defaults to `support@gatherministry.online`) · `NEXT_PUBLIC_SITE_URL` (optional, checkout success/cancel URLs fall back to the request's own origin)

**Mobile** (`apps/mobile/.env`): `EXPO_PUBLIC_SUPABASE_URL` · `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Local dev quirks (Windows):** `.npmrc` sets `node-linker=hoisted` specifically to avoid a Windows `pnpm install` race (`ENOENT` on `_tmp_*` dirs during hardlinking) — this is why the Vercel build needs the `isolated`-linker override noted in Known Gaps rather than just matching local dev. If `pnpm install` throws that ENOENT, it's transient — just retry, or `pnpm store prune` if it persists. If Expo Go reports "check your internet connection" on the same Wi-Fi, it's almost always Windows Firewall blocking Metro's port or router client-isolation, not a real network issue — `expo start --tunnel` routes around both.
