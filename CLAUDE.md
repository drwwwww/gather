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
- **No native form controls** in styled contexts — every `<select>`, `<input[type=date]>`, `<input[type=time]>` gets replaced with a custom component.
- **Every number has context** — stats always carry a label, trend, or supporting count. Orphaned numbers are a bug.

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

- **Web admin portal** — Next.js 14 App Router, for church admins and staff
- **Mobile app** — Expo 54 / React Native, for all members

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
│   └── migrations/   # 25 SQL migrations (up-only)
└── design-handoff/   # HTML/markdown dossiers from design system
```

**Commands:** `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm format`

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
| `churches` | id, name, slug, timezone, address |
| `profiles` | id (FK auth.users), church_id, full_name, email, role, disabled |
| `service_times` | church_id, name, day_of_week, start_time, timezone |
| `volunteer_roles` | church_id, ministry_id?, name |
| `service_plans` | church_id, service_time_id, service_date (unique per church+time+date) |
| `service_plan_role_slots` | plan_id, role_id, assigned_user_id, backup_user_id, status, notes |
| `service_plan_items` | plan_id, position, title, duration_minutes, assigned_user_id, backup_user_id, status |
| `announcements` | church_id, title, body, audience, publish_at |
| `events` | church_id, title, start_at, end_at, audience, is_cancelled |
| `event_rsvps` | event_id, user_id, status |
| `notification_log` | church_id, user_id?, type, payload (jsonb), sent_at, read_at |

> **Important:** `volunteer_assignments` was dropped in migration 0024. All scheduling now uses `service_plan_role_slots` and `service_plan_items`.

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
└── api/notifications/dispatch/route.ts
```

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

### Layout

`PageGrid` — 12-column grid with `PageGridFull`, `PageGridRowTwoOne` (split="default" 2/3+1/3 or split="wideMain" 9/12+3/12), `PageGridRowFour`, `PageGridRowThirds`

---

## Mobile App

**Stack:** Expo 54, React Native 0.81, React Navigation 7

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

### Key screens

| Screen | What it shows |
|---|---|
| `HomeScreen` | Church info, upcoming service, announcements feed |
| `AssignmentsScreen` | User's upcoming assignments; confirm/decline via `respond_assignment` RPC |
| `ServicePlanScreen` | Read-only bulletin view of run-of-show |
| `AnnouncementsScreen` | Paginated list + detail |
| `EventsScreen` | Event list with RSVP + detail |

---

## Known Gaps / Stubs

| Gap | Notes |
|---|---|
| `packages/ui` | Placeholder only — no shared component library |
| Stripe billing | `services/stripe.ts` exists but no billing flows in UI |
| Push notifications | `notification_log` exists and in-app badge works; Expo push not yet wired |
| Print layout | `PrintablePlan` built but not linked from service plans page |
| `service_plan_items.status` | PLANNED/DONE/SKIPPED stored but no live "mark done" flow during service |
| Mobile ServicePlanScreen | Read-only; editing is web-only |

---

## Engineering Decisions (Recent)

- **Migration 0024** — `volunteer_assignments` deprecated. All scheduling via `service_plan_role_slots` + `service_plan_items`
- **RolesCard** removed from Volunteers page — roles managed on Service Plans page only
- **UI compaction pass** — sidebar 288→200px, navbar h-20→h-14, donut h-48→h-36, card padding reduced
- **Volunteers date strip** — replaced gray pill container with bare vertical strip; amber dot = has service plan; calendar opens as centered modal portal (z-[1000])
- **Readiness donut** — three-layer SVG: gray track / pale amber (confirmed+pending) / solid amber (confirmed only). Center label = "X% Confirmed"
- **Status correctness fix** — slots with `assigned_user_id != null` but `status = "OPEN"` promoted to ASSIGNED in read layer

---

## Environment Variables

**Web** (`apps/web/.env.local`): `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `NEXT_PUBLIC_GATHER_IOS_APP_URL` · `NEXT_PUBLIC_GATHER_ANDROID_APP_URL`

**Mobile** (`apps/mobile/.env`): `EXPO_PUBLIC_SUPABASE_URL` · `EXPO_PUBLIC_SUPABASE_ANON_KEY`
