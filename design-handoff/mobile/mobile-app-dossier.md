# Gather Mobile App — Design & Functionality Dossier (Stitch / UI rebuild)

This document describes **what the Gather mobile app does today**: screens, flows, data, and behaviors. It is **not** a specification of the current React Native layout primitives—Stitch should feel free to redesign visuals while preserving **functionality**, **information hierarchy**, and the **locked design tokens** below.

**Product tone (art direction):** Warm, welcoming, and **church-appropriate** without feeling stiff: clear hierarchy, generous whitespace on **light** surfaces, friendly microcopy where errors occur, and a sense of **community rhythm** (gathering, serving, calendar). Avoid gloomy dark modes or heavy “dashboard” chrome unless you add a separate dark theme later—this handoff assumes **light mode only**, matching Gather web.

---

## 1. Canonical brand system (do not deviate)

Mobile aligns with `apps/web/app/globals.css` (`:root`). React Native uses **hex approximations** in `apps/mobile/src/theme/tokens.ts` because RN does not parse `oklch()` in styles.

### 1.1 Colors — web source of truth (`:root` in `apps/web/app/globals.css`)

| Token | Value | Usage |
|-------|--------|--------|
| `--bg` | `oklch(98.6% 0.002 67.8)` | App canvas / page background |
| `--surface` | `oklch(96% 0.002 17.2)` | Secondary panels, subtle fills |
| `--surface-2` | `oklch(92.2% 0.005 34.3)` | Tertiary / pressed surfaces |
| `--text-primary` | `#111827` | Primary text |
| `--text-secondary` | `#4b5563` | Secondary text |
| `--text-muted` | `#9ca3af` | Hints, timestamps, de-emphasized |
| `--border` | `#e5e7eb` | Hairline borders |
| `--divider` | `#f1f5f9` | Soft separators |
| **`--primary`** | **`oklch(82.8% 0.189 84.429)`** | Brand amber — **primary actions, key highlights** |
| **`--primary-hover`** | **`oklch(76.9% 0.188 70.08)`** | **Only** for hover/pressed states on primary controls (approved step darker—not a new brown) |
| **`--primary-soft`** | **`oklch(96.2% 0.059 95.617)`** | Soft amber wash (chips, selected tab pill, gentle emphasis) |
| `--success` | `oklch(72.3% 0.219 149.579)` | Confirmed / positive |
| `--warning` | `oklch(70.5% 0.213 47.604)` | Caution (distinct from primary; use sparingly) |
| `--danger` | `oklch(57.7% 0.245 27.325)` | Errors, destructive |
| `--info` | `oklch(62.3% 0.214 259.815)` | Informational accents |
| `--btn-primary-text` | `#ffffff` | Text on solid primary buttons |

**Hard rules for Stitch**

- **Light backgrounds only:** `--bg`, `--surface`, white cards on top—no charcoal app chrome as the default.
- **Do not “rebrand” the amber:** keep the perceived hue in the **same warm amber family** as `--primary`. Do **not** substitute deep brown, burnt orange, or olive-gold for primary CTAs.
- **Primary vs hover:** main filled buttons use **`--primary`**; **one** step darker **`--primary-hover`** is allowed for press/hover only—not for large fills or hero gradients that read as a different color.
- **Cards** in mobile tokens use `#FFFFFF` (`card`) on top of warm off-white page background—preserve that **paper-on-cream** contrast.

### 1.2 Colors — mobile implementation reference (`apps/mobile/src/theme/tokens.ts`)

These hex values are the **shipping RN approximations**; Figma should either import the **oklch** above or these hexes—keep them visually consistent.

| Token key | Hex | Notes |
|-----------|-----|--------|
| `background` | `#FDFCF8` | ~ `--bg` |
| `surface` | `#F5F4F1` | ~ `--surface` |
| `surface2` | `#EEEAE2` | ~ `--surface-2` |
| `card` | `#FFFFFF` | Card surfaces |
| `textPrimary` / alias `primaryText` | `#111827` | |
| `textSecondary` | `#4B5563` | |
| `textMuted` / alias `muted` | `#9CA3AF` | |
| `border` | `#E5E7EB` | |
| `divider` | `#F1F5F9` | |
| **`primary`** | **`#F59E0B`** | ~ `--primary` |
| **`primaryHover`** | **`#D97706`** | ~ `--primary-hover` (interaction only) |
| **`primarySoft`** | **`#FFF7E6`** | ~ `--primary-soft` |
| `onPrimary` | `#FFFFFF` | Text/icons on primary solid |
| `success` / soft / on-soft | `#22C55E` / `#DCFCE7` / `#166534` | Status pills |
| `warning` / soft / on-soft | `#F59E0B` / `#FFEDD5` / `#9A3412` | Overlap with primary hue—use for **status**, not primary CTAs |
| `danger` / soft | `#DC2626` / `#FEE2E2` | Errors |
| `info` | `#3B82F6` | Secondary system color |

### 1.3 Typography

- **Family:** **Rubik** (Google Fonts; loaded in the app via Expo / `useFonts` in `App.tsx`).
- **Weights in use:** 300 (light), 400, 500, 600, 700 — see `typography.fontWeight` in `tokens.ts`.
- **Scale (px, from `tokens.ts`):** `xs` 12, `sm` 13, `md` 16, `lg` 18, `xl` 22, `title` 28.
- **Web parity:** `globals.css` sets `body { font-family: 'Rubik', Arial, sans-serif; }` — mobile should match.

### 1.4 Spacing & radii (mobile `tokens.ts`)

- **Spacing scale:** `xs` 4, `sm` 8, `md` 16, `lg` 24, `xl` 32.
- **Radii:** `sm` 12, `md` 14, `lg` 18, `xl` 24 (practical RN equivalents of web pill/box radii).

---

## 2. Auth, profile, and access model

### 2.1 Supabase auth

- **Sign in:** `supabase.auth.signInWithPassword({ email, password })`.
- **Sign up:** `supabase.auth.signUp` with `options.data.full_name`; may require email confirmation (message shown when no user returned).
- **Sign out:** `supabase.auth.signOut()` from Account and Account inactive screens.

### 2.2 Profile (`profiles` table)

Loaded fields: `id`, `church_id`, `full_name`, `email`, `role`, `disabled`.

- **`church_id` null:** user must complete **Church select** flow before entering the main app.
- **`disabled` true:** user sees **Account inactive**; only sign out is offered.
- **`role`:** `MEMBER` | `SERVICE` | `ADMIN` (string). **Serve tab visibility:** `SERVICE` or `ADMIN` get two extra tabs: **Bulletin** (`ServicePlan`) and **Serve** (`Assignments`). Members get **Home**, **News** (Announcements), **Events** only.

### 2.3 Global loading

Until auth resolves, a full-screen spinner + “Loading…” is shown (`RootNavigator`).

---

## 3. Navigation map (routes & params)

### 3.1 Root stack (unauthenticated / gatekeeping)

| Route | When shown | Purpose |
|-------|------------|---------|
| `SignIn` | No session | Email/password sign-in; link to Sign up |
| `SignUp` | User navigates from Sign in | Create account (full name, email, password) |
| `AccountDisabled` | `profile.disabled` | Explain admin disabled access; sign out |
| `ChurchSelect` | Session exists, `profile.church_id` is null | Join church: list all churches or search by slug; upsert profile with `church_id`, `role: "MEMBER"` |

**`ChurchSelect` params (optional):** `userId`, `fullName`, `email` — used when upserting profile on join.

### 3.2 Main app stack (`AppNavigator`)

| Route | Params | Purpose |
|-------|--------|---------|
| `MainTabs` | `{ showServe?: boolean }` | Bottom tabs (see §4) |
| `AnnouncementsDetail` | `{ announcement: { id, title, body, publish_at? } }` | Read full announcement |
| `EventDetail` | `{ eventId: string }` | Event detail + RSVP |
| `ProfileMenu` | — | Account summary, directory link, sign out |
| `ChurchInfo` | — | **Placeholder** church info (hardcoded copy in current app; not linked from other screens today) |
| `AssignmentDetail` | `{ assignmentId: string }` | Legacy-style detail for **schedule** `volunteer_assignments` row only |
| `Notifications` | — | In-app notification log |
| `Members` | — | Church directory |
| `FeaturePlaceholder` | `{ title: string; subtitle?: string }` | Generic “coming soon” |

### 3.3 Bottom tabs (`MainTabs` + `TabBar`)

**Member tabs (labels as shown in tab bar):**

1. **Home** → `HomeScreen`
2. **News** → `AnnouncementsScreen`
3. **Events** → `EventsScreen`

**+ Service team (`showServe`):**

4. **Bulletin** → `ServicePlanScreen`
5. **Serve** → `AssignmentsScreen`

**Global entry to profile:** `ProfileMenuAvatar` in several headers navigates to `ProfileMenu` (avatar currently uses app logo asset as a stand-in).

---

## 4. Per-screen functional specification

For each screen: **user goal**, **data**, **actions**, **empty/error**, **navigation**.

### 4.1 `SignInScreen`

- **Goal:** Authenticate.
- **Fields:** Email, password.
- **Actions:** Sign in; navigate to Sign up (`replace`).
- **Errors:** Supabase error message inline.

### 4.2 `SignUpScreen`

- **Goal:** Register a new account.
- **Fields:** Full name, email, password.
- **Actions:** Submit sign-up.
- **Outcomes:** Error from Supabase; or message to check email if confirmation required; or success path returns to signed-in flow when user exists.

### 4.3 `AccountDisabledScreen`

- **Goal:** Explain blocked access.
- **Content:** Copy that admin turned off access; contact church office.
- **Actions:** Sign out.

### 4.4 `ChurchSelectScreen`

- **Goal:** Attach the user to a church (`profiles.church_id`).
- **Data:** Loads all `churches` (`id`, `name`, `slug`) ordered by name.
- **Search:** Text field for **slug**; query `slug.eq` OR `slug.ilike.%term%`; first result shown with join CTA.
- **Actions:** “Join this church” on a row or search result → `profiles` upsert (`id`, `church_id`, `full_name`, `email`, `role: "MEMBER"`, `disabled: false`) on conflict `id`; then `refreshProfile()`.
- **Errors:** Load failure, no slug match, profile upsert failure, session expired.

### 4.5 `HomeScreen`

- **Goal:** Quick orientation + shortcuts + next events.
- **Data (on focus):**
  - Unread notification count: `notification_log` count where `user_id` = self and `read_at` is null.
  - Next **3** events: `events` where `church_id` matches profile, `is_cancelled` false, `start_at` ≥ now, ordered by `start_at`, limit 3.
- **Actions:**
  - Open **Notifications**.
  - **Quick access:** Members directory; **Groups** opens `FeaturePlaceholder` (copy: small groups/ministries coming later); **Calendar** jumps to **Events** tab.
  - **Upcoming events:** “See all” / FAB-style control navigates to Events tab; each row opens `EventDetail`.
- **Static / placeholder content (important for redesign honesty):**
  - **Message of the Day** is **hardcoded** scripture quote (1 Cor 16:14)—not from CMS.
  - **“This Month’s Attendance”** block is **placeholder UI** (+12%, bar, “Goal: 500 Active Members”) — **not wired to real data**.

### 4.6 `AnnouncementsScreen` (tab: **News**)

- **Goal:** Read church announcements.
- **Data:** `announcements` for `church_id`: `id`, `title`, `body`, `publish_at`, `created_at`; limit 50; ordered by `publish_at` desc then `created_at` desc.
- **Visibility rule:** Non-admins only see rows where `publish_at` is set and `publish_at ≤ now`. Admins see all rows (including drafts / scheduled).
- **Actions:** Tap row → `AnnouncementsDetail` with announcement object (body passed for offline read).
- **Empty:** No announcements copy.
- **Refresh:** Pull to refresh.

### 4.7 `AnnouncementsDetailScreen`

- **Goal:** Read one announcement in full.
- **Content:** Title; optional date (`publish_at` or legacy `date`); body text (`body` or `message`).
- **Actions:** Back.

### 4.8 `EventsScreen` (tab: **Events**) — calendar behavior

This is the **primary calendar experience** in the mobile app.

- **Goal:** Browse upcoming events by day; open detail.
- **Data window:** Fetches up to **200** future events from **now** (`start_at >= now` ISO), `church_id` match, `is_cancelled` false, ordered by `start_at`. Fields: `id`, `title`, `location`, `start_at`, `end_at`.
- **Day strip:** **60 consecutive days** starting **today** (local calendar). Each cell: weekday letter, date number; **dot** under the number if **any** event’s `start_at` falls on that local calendar day (string prefix match `YYYY-MM-DD`).
- **Selected day:** User picks a day from the strip; main area shows **only events for that local date** (`start_at` starts with selected `YYYY-MM-DD`). If none → empty state “Nothing scheduled for this day.”
- **Header:** Large selected date; weekday + month/year; **Today** pill appears when selected ≠ today (snaps selection and scroll to today).
- **Timeline list:** For each event on selected day: start time (12h), optional end time, title, optional location; first row on **today** is treated as “active” in current logic (for emphasis in a redesign, preserve “highlight next/current” intent).
- **Actions:** Row → `EventDetail`; pull to refresh reloads events.
- **Profile:** Avatar opens `ProfileMenu`.

**Note:** Past events before “now” are excluded from the query even if user scrolls to earlier strip days—which only spans forward from today—so no past days in the 60-day strip.

### 4.9 `EventDetailScreen`

- **Goal:** See event info; set RSVP.
- **Params:** `eventId` required.
- **Data:** Single `events` row: `title`, `description`, `location`, `start_at`, `is_cancelled`. User’s RSVP from `event_rsvps` (`status`) for (`event_id`, `user_id`).
- **Actions:** RSVP **Going** / **Maybe** / **Can’t go** → `event_rsvps` upsert on conflict `event_id,user_id` with status `GOING` | `MAYBE` | `NO`. Disabled when cancelled or while saving.
- **Empty/error:** Missing id, failed load, inline error on upsert; cancelled banner.

### 4.10 `ServicePlanScreen` (tab: **Bulletin**) — service team + admin only

- **Goal:** Show **next upcoming** published service plan (“bulletin”) for the church and who is on it.
- **Data:**
  - Next `service_plans` row for `church_id` with `service_date >= today` (local `YYYY-MM-DD` slice), earliest date, fields `id`, `title`, `service_date`, `service_time_id`.
  - `service_times` for that plan’s `service_time_id` (`name`, `start_time`).
  - `service_plan_items` for plan: `title`, `duration_minutes`, `notes`, `status`, `assigned_user_id` ordered by `position`.
  - `service_plan_role_slots` for plan: `role_id`, `assigned_user_id`, `backup_user_id`, `status` ordered by `sort_order`.
  - `volunteer_roles` for church (role names).
  - `profiles` in same church (non-disabled) for resolving assigned names.
- **Personalization:** If user is `SERVICE` or `ADMIN`, compute **“my”** plan items and role slots (assigned or backup) and surface them as a **banner/summary** (current app: “Your assignments on this plan”).
- **Display:** Plan title, human-friendly service date, service time; order-of-service list (duration, notes, assignee initials/name); role slots with assignee/backup and status.
- **Empty:** No future plan.
- **Refresh:** Pull to refresh.

### 4.11 `AssignmentsScreen` (tab: **Serve**) — service team + admin only

- **Goal:** One place for **all upcoming serving commitments**, merged from **volunteer schedule** and **bulletin** assignments.

**Sources merged into one list:**

1. **Schedule (`volunteer_assignments`)** — rows where user is `assigned_user_id` OR `backup_user_id`; `scheduled_date >= today`; up to 40; includes `status`, `role_id`, `service_time_id`. If backup-only column unsupported, falls back to assigned-only query.
2. **Bulletin parts (`service_plan_items`)** — items on future `service_plans` where `assigned_user_id` = user (with fallback select if `assignment_status` column missing).
3. **Bulletin roles (`service_plan_role_slots`)** — slots on future plans where user is assignee or backup.

**Labels:** Each row has `titleLine` (role name or part title), `subtitleLine` distinguishing “Volunteer schedule”, “Bulletin · run of show”, “Bulletin · role”, and backup variants.

**Sorting:** By `scheduled_date`, then source order: schedule → bulletin role → bulletin part.

**Filtering:** `DECLINED` rows with `scheduled_date < today` dropped from list.

**Grouping:** By service date with a date header.

**Status model:** `CONFIRMED`, `DECLINED`, `ASSIGNED`, `OPEN` (and possibly others)—chip colors map success/danger/primary/surface.

**Actions:** Tap row → modal (in current implementation) to **Confirm** or **Decline** when status allows.

**Respond behavior:**

- Preferred: `supabase.rpc('respond_assignment', { p_source, p_id, p_response })` where `p_source` is `volunteer_assignment` | `plan_role_slot` | `plan_item` and `p_response` is `CONFIRMED` | `DECLINED`.
- Fallback if RPC missing: direct table updates with specific user-facing errors referencing migrations if columns/RLS block.
- Special case: if RPC returns `promoted` and user **declined**, row may disappear (no longer assigned after backup promotion logic).

**Empty:** No upcoming assignments.

**Refresh:** Pull to refresh.

**Header subtitle:** Dynamic count of assignments needing response (`ASSIGNED` / `OPEN`).

### 4.12 `AssignmentDetailScreen` (stack)

- **Goal:** Confirm/decline a **single schedule assignment** by `volunteer_assignments.id` (does **not** cover bulletin slot/item IDs—those are handled on `AssignmentsScreen`).
- **Data:** Row scoped to `church_id`; joins `volunteer_roles.name`, `service_times.start_time` for subtitle.
- **Actions:** Confirm → update `status` to `CONFIRMED` (for assignee or backup); Decline → `DECLINED`; then `goBack`. Read-only message if status not `ASSIGNED` or `OPEN`.

### 4.13 `NotificationsScreen`

- **Goal:** Read in-app notifications; mark read.
- **Data:** `notification_log` for `user_id`, fields `id`, `type`, `payload`, `sent_at`, `read_at`; latest 50.
- **Display rules:**
  - Title: for `ASSIGNMENT_REMINDER`, title depends on `payload.source` (`bulletin_part` → “Bulletin — run of show”; `bulletin_role` → “Bulletin — role”; else “Assignment reminder”). Other types: humanized `type` string.
  - Detail line for reminders: part title or role name + formatted service date when present.
- **Actions:** Tap card → mark that row `read_at = now` if unread. **Mark all as read** when unread count > 0. Pull to refresh.

### 4.14 `MembersScreen`

- **Goal:** Directory of people in the same church.
- **Data:** `profiles` where `church_id` matches: `id`, `full_name`, `email`, `role`; sorted with **current user first**, then name/email.
- **Display:** Name (fallback email local-part), optional email line, role badge (`Admin` / `Service team` / `Member`).
- **Empty:** No members.
- **Refresh:** Pull to refresh.

### 4.15 `ProfileMenuScreen`

- **Goal:** Account overview and exit.
- **Data:** Auth user + profile; async load `churches.name` by `profile.church_id`.
- **Actions:** Members directory; Sign out.

### 4.16 `ChurchInfoScreen`

- **Current state:** **Static placeholder** (“Grace Church”, fake join code). **Not** reached from in-app navigation in the codebase today—only registered on the stack. For Stitch: either hide until wired to real `churches` + join flow, or treat as future “church details / join QR” screen.

### 4.17 `FeaturePlaceholderScreen`

- **Goal:** Explain unavailable feature; point users to web dashboard.
- **Params:** `title` (default “Coming soon”), optional `subtitle`.

---

## 5. Cross-cutting behaviors

- **Pull to refresh** on list-heavy screens: Announcements, Events timeline, Assignments, Service plan, Members, Notifications.
- **Focus reload:** Home, Events, Assignments, Service plan, Announcements, Members, Notifications refetch when screen gains focus (`useFocusEffect`) where implemented.
- **Supabase missing:** Several screens no-op or clear data if client is not configured (development guard).

---

## 6. Orphan / shared building blocks (non-screens)

- **`DateSelector` component:** Exists in codebase but is **not** referenced by screens today—optional pattern for prev/next date; calendar tab uses horizontal strip instead.
- **`AppShell`:** Safe area + page background token—semantic “screen wrapper” for Stitch layouts.

---

## 7. Stitch checklist (short)

1. **Lock colors** to §1 (oklch preferred in design files; hex from `tokens.ts` for RN export).
2. **Rubik** only; use the defined type scale and weights.
3. **Light** surfaces; white cards; warm cream page background.
4. Preserve **tab count and labels** semantics: News = announcements; Bulletin = next service plan; Serve = merged assignments.
5. **Calendar:** 60-day forward strip + day-scoped event list + event detail + RSVP—behavior in §4.8–4.9.
6. Replace placeholder Home widgets (scripture MOTD / attendance) only if product later specifies real data—until then, label clearly as optional or remove.

---

*Generated from codebase under `apps/mobile` and web tokens in `apps/web/app/globals.css`. For implementation questions, trace `src/navigation/*` and `src/screens/*`.*
