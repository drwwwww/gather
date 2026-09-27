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
- **No native form controls** in styled contexts — every `<select>`, `<input[type=date]>`, `<input[type=time]>` gets replaced with a custom component. Use `components/ui/SelectMenu.tsx` — searchable, keyboard-navigable, portalled to `document.body` (so no ancestor `overflow: hidden` can clip it; a card container's `overflow-hidden` clipped an early version). Rolled out to the service plan editor; ~10 native `<select>`s remain elsewhere in the app (volunteers, presets, run-of-show) — flagged, not yet migrated.
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
│   └── migrations/   # 34 SQL migrations (up-only)
└── design-handoff/   # HTML/markdown dossiers from design system
```

**Commands:** `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm format`

**Mobile-specific:** `pnpm mobile` / `pnpm mobile:clear` (`expo start --clear`) / `pnpm mobile:tunnel` — all run from the **repo root** and always target `apps/mobile` via `pnpm --filter mobile`. Running `npx expo start` directly from the repo root instead of `cd apps/mobile` fails with `Unable to resolve "../../App"` — Metro treats whatever directory it's invoked from as the project root.

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
| Print layout | `PrintablePlan` built but not linked from service plans page |
| `service_plan_items.status` | PLANNED/DONE/SKIPPED stored but no live "mark done" flow during service |
| Mobile ServicePlanScreen | Read-only; editing is web-only |
| Native `<select>`s | ~10 remain outside the service plan editor (`runOfShow/StepRow`, `servicePresets/PresetEditor`, `ServiceTimeSelector`, both `AssignmentsTable` files) — same rule violation, not yet migrated to `SelectMenu`. `AssignmentsTable.v1.tsx` may be dead code, worth checking before migrating it. |
| Web/mobile React version split | Web is pinned to React 18 (Next 14.2 doesn't officially support React 19); mobile runs React 19.2.3 (Expo 57 requires it). Kept apart via `pnpm.overrides`. Resolves itself once web moves to Next 15. |
| Vercel build needs `node-linker=isolated` | `vercel.json` overrides the install command to `pnpm install --filter web... --config.node-linker=isolated` — the default hoisted linker (used locally, see `.npmrc`) puts two physically separate copies of React 18 in the graph when mobile's React 19 is also present, which crashes `/404`/`/500` prerendering (`styled-jsx`'s `StyleRegistry` gets a null hook dispatcher). Do not remove this override without re-verifying a real Vercel/isolated-linker build. |
| Nearby-church search has no real second church | `churches.discoverable`/`latitude`/`longitude` exist and the RLS/UI are live, but the only seeded church has a fictional demo address — "Nearby churches" will correctly show nothing until a second real, geocoded church exists. |
| App Store submission not yet done | `app.json` now has a `scheme`, iOS privacy manifest, and correct location/photo permission strings, and the in-app Profile menu links to `/privacy` — but the actual Apple Developer enrollment, App Store Connect listing (screenshots, description, data-safety answers), and `eas submit` credentials still need to be done by a human with Apple/Google account access. |
| Service-team "Check In" is a stub | `ServicePlanScreen.tsx`'s "Check In" button (SERVICE/ADMIN only) just shows an Alert saying "future update" — no backend wiring yet. Meant to become the live day-of attendance flow for the `service_plan_items.status` gap above (mark PLANNED → DONE as volunteers actually show up), not built. |
| Remote `auth.sms.enable_signup` still off | Phone sign-in/sign-up code is live (see below), but the matching Supabase Auth toggle ("Allow new users to sign up with phone" under Authentication → Providers → Phone) hasn't been flipped on the live project — `supabase config push` couldn't do this surgically because remote's `auth.sms.twilio.enabled` is `true` with real (masked, unmanaged) credentials the CLI can't diff around, and the TOML schema won't let `enabled=false` coexist with a set `account_sid` locally. Needs a manual one-toggle flip in the dashboard; do not try to push the full config file to set it. |

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

---

## Environment Variables

**Web** (`apps/web/.env.local`): `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `NEXT_PUBLIC_GATHER_IOS_APP_URL` · `NEXT_PUBLIC_GATHER_ANDROID_APP_URL` · `BREVO_API_KEY` · `BREVO_FROM_EMAIL` (must be `Name <email>` format — a bare email breaks Brevo's `parseFrom()`) · `NOTIFICATION_LOOKAHEAD_HOURS` · `SENTRY_AUTH_TOKEN` (source map upload; must be in `turbo.json`'s `build.passThroughEnv` or Vercel silently won't create a release) · `STRIPE_SECRET_KEY` · `STRIPE_PRICE_PARISH_MONTHLY` / `_ANNUAL`, `STRIPE_PRICE_CONGREGATION_MONTHLY` / `_ANNUAL`, `STRIPE_PRICE_NETWORK_MONTHLY` / `_ANNUAL` (checkout is a friendly no-op without these) · `DEMO_REQUEST_INBOX` (optional, defaults to `support@gatherministry.online`) · `NEXT_PUBLIC_SITE_URL` (optional, checkout success/cancel URLs fall back to the request's own origin)

**Mobile** (`apps/mobile/.env`): `EXPO_PUBLIC_SUPABASE_URL` · `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Local dev quirks (Windows):** `.npmrc` sets `node-linker=hoisted` specifically to avoid a Windows `pnpm install` race (`ENOENT` on `_tmp_*` dirs during hardlinking) — this is why the Vercel build needs the `isolated`-linker override noted in Known Gaps rather than just matching local dev. If `pnpm install` throws that ENOENT, it's transient — just retry, or `pnpm store prune` if it persists. If Expo Go reports "check your internet connection" on the same Wi-Fi, it's almost always Windows Firewall blocking Metro's port or router client-isolation, not a real network issue — `expo start --tunnel` routes around both.
