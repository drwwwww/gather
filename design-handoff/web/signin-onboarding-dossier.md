# Gather — Style & Audience Dossier for Sign-In / Onboarding

**Purpose of this document:** brief a fresh Claude session (or designer) who has no prior context on this project, specifically to redesign or rebuild the **sign-in** ([`apps/web/app/auth/page.tsx`](../../apps/web/app/auth/page.tsx)) and **first-run onboarding** ([`apps/web/app/onboarding/create-church/page.tsx`](../../apps/web/app/onboarding/create-church/page.tsx)) flows. It covers *who this is for*, *what it should feel like*, the *hard design-system rules that must not be broken*, and *what currently exists* so nothing functional gets lost in a redesign.

---

## 1. What Gather is (one paragraph)

Gather is church management software for small-to-mid-size congregations (50–500 people). It replaces spreadsheets, group texts, and email threads for volunteer scheduling, service planning, and member communication. **Core belief:** software for the local church should feel as thoughtful and polished as the best consumer tools — never like enterprise software with a "church" label slapped on. Sign-in and onboarding are the *very first impression* of that belief — this is where a stressed, non-technical church admin decides in about ten seconds whether this tool was "made by people who get it."

---

## 2. Who is actually filling out this form

| Tier | Who | What they need from sign-in/onboarding |
|---|---|---|
| **Primary** | Church admins / pastoral staff (1–5 people per church). Often non-technical, time-constrained, wearing many hats. Not evaluating a feature matrix — asking "will this make my Sunday less stressful?" | Zero friction, zero jargon, obvious next step at every point. They should never feel like they're filling out enterprise paperwork. |
| **Secondary** | Ministry team leads (worship director, children's director) who get invited later, not through this flow directly | N/A for this flow, but the *tone* set here should carry through to their first login too |
| **Tertiary** | Members, via mobile app | Not relevant to this web flow — this dossier is web admin sign-in/onboarding only |

**What they are not:** IT buyers comparing SaaS options. Nobody filling out this form is thinking about "workspaces" or "tenants" — they're thinking "I need to get my volunteer schedule sorted before Sunday." Copy should sound like a helpful person, not a product.

---

## 3. Design feel — the adjectives every screen must earn

- **Warm** — amber brand, Rubik typeface, soft neutral/cream backgrounds. Never cold or clinical.
- **Calm** — generous whitespace, unhurried layout, no visual noise. Nothing should feel like it's demanding attention or throwing errors at the user before they've done anything.
- **Focused** — one primary action per view. On a form as short as sign-in, that's easy; on multi-field onboarding (church name, slug, timezone, service time), resist the urge to show everything at once if it undermines this.
- **Alive** — skeleton loaders over blank flashes, smooth transitions, hover microinteractions on every interactive element.
- **Trustworthy** — consistent spacing, aligned grids, no broken states, friendly (not raw/technical) error messages.

**Visual references:** Linear (density + keyboard-first hierarchy), Notion (calm whitespace + typography), Stripe Dashboard (clear data/form layout), Loom (warm brand + human tone). For an auth screen specifically: think Linear's minimal, confident split-screen sign-in, not a generic centered-card SaaS template.

**What it is explicitly not:** dark-mode-first aggressive SaaS, gradient-heavy marketing feel, utilitarian form-over-form admin panel, cold enterprise dashboard.

---

## 4. Hard design-system rules (do not violate)

Source of truth: [`apps/web/app/globals.css`](../../apps/web/app/globals.css) `:root`.

- **Amber (`#f59e0b` / `--primary`) is sacred** — brand, active states, primary CTAs only. Never decorative, never a second "accent" color layered on top.
- **Rubik**, weights 300–700, always. Never substitute another font.
- **Radius is soft** — `rounded-xl` (12px) on cards, buttons, inputs. Never square, never pill-shaped for utility UI.
- **Flat over gradients** — solid surfaces. (The dark hero/brand panel on the current sign-in page uses a photo + warm gradient overlay, which is the one sanctioned exception — treat it like the dashboard's hero-mesh exception, not a precedent for gradients elsewhere.)
- **No native form controls in styled contexts.** Every `<select>`, `<input type="date">`, `<input type="time">` must be a custom styled component. This is a hard, repeated rule in this codebase — **the current onboarding page violates it** (see §6.3) and should be fixed as part of any touch-up.
- **Hover states required** on every interactive element — minimum `transition-colors`, prefer a slight lift on cards/buttons.
- **Every number needs context** — not directly applicable to auth/onboarding since there are no stats here, but keep in mind if a "you're all set" summary screen is added.

---

## 5. Core tokens (condensed)

| Group | Tokens |
|---|---|
| Backgrounds | `--bg`, `--surface`, `--surface-2`, `--app-canvas` |
| Text | `--text-primary`, `--text-secondary`, `--text-muted` |
| Brand | `--primary` (amber), `--primary-hover`, `--primary-soft` |
| Borders | `--border`, `--divider` |
| Status | `--success`, `--warning`, `--danger` |

The current auth page hand-rolls a slightly different warm-cream palette (`#f7f0e7`, `#9c8778`, `#1c1209`, `#fffcf8`) instead of referencing the CSS variables directly. It reads as on-brand, but a redesign should reconcile this back to the canonical tokens rather than inventing a parallel palette — keeps the whole app, including auth, drawing from one source of truth.

---

## 6. What exists today (so a redesign doesn't lose functionality)

### 6.1 Sign-in (`/auth`, aliased at `/login`)

File: [`apps/web/app/auth/page.tsx`](../../apps/web/app/auth/page.tsx)

- Split screen: left 42–44% is a dark warm brand panel (photo + gradient overlay, headline "Give your church its time back," feature chips, a testimonial card); right panel is the actual form on a light cream background. Left panel hides below `lg` breakpoint.
- Segmented **Sign in / Sign up** tab switcher (not two separate routes) — pill-track selector, single active white tab.
- Sign-in fields: email, password. Forgot-password link inline next to the password label (not a separate page) — sends via `supabase.auth.resetPasswordForEmail`.
- Sign-up adds: full name. Uses `supabase.auth.signUp` with `options.data.full_name`.
- Friendly, humanized error copy (`getFriendlySignInError` / `getFriendlySignUpError`) — deliberately hides raw Supabase error strings behind a "Show details" disclosure. **Keep this pattern** — raw backend errors are exactly the kind of "enterprise software" feel this product is trying to avoid.
- Post sign-in routing is role/state-aware, not a flat redirect — see [`apps/web/lib/postLoginDestination.ts`](../../apps/web/lib/postLoginDestination.ts):
  - No `profiles` row yet → `/onboarding/create-church`
  - `profiles.church_id` is null (removed from a church, or never joined) → `/onboarding/rejoin-church`
  - Otherwise → role-appropriate destination (admin dashboard, or member surface)
- `?next=` query param support, including a special case: if `next` points into `/join` (someone arrived via an invite link), sign-in/up routes them back to finish joining instead of into onboarding. **This branch must survive any redesign** — it's the invite-link path.

### 6.2 Onboarding — create church (`/onboarding/create-church`)

File: [`apps/web/app/onboarding/create-church/page.tsx`](../../apps/web/app/onboarding/create-church/page.tsx)

- Appears to be admin-only, first-run, shown right after signup when no `profiles` row exists yet.
- Fields: church name (auto-generates a URL slug as you type, editable once touched), address (optional), timezone (custom searchable dropdown — see §6.3), a default service day/time.
- Slug becomes the public join link (`/join/{slug}`), shown live as the admin types the name — a nice bit of immediate feedback worth preserving.
- Submits via the `bootstrap_church` RPC (creates the church row + promotes the signing-up user to `ADMIN` in one call), then a `service_times` insert for the default service, then an optional `churches.address` update.
- There's a "Step progress" UI already in the file (line ~343) — worth checking during redesign whether it actually reads as a calm, single-focus wizard or as a longer form pretending to be steps.

### 6.3 Known inconsistency to fix

`create-church/page.tsx` uses a **native `<Input type="time">`** for the default service time. This directly violates the "no native form controls" rule that the rest of the app follows carefully (there's already a proper 15-minute-interval custom time picker component used elsewhere in the app — reuse that pattern here rather than a browser-native time widget). The timezone field, by contrast, *is* already a correct custom searchable dropdown (`TimezoneSelect` in the same file) — worth matching that same bar for the time field.

### 6.4 Other related routes

| Route | Purpose |
|---|---|
| `/join?code=…` | Public, unauthenticated join landing for invited members — not part of the admin onboarding flow but shares the sign-in/sign-up form and the `next`-preservation behavior above |
| `/onboarding/rejoin-church` | Shown when a signed-in user's `profiles.church_id` is null — points them to the public join flow or mobile |
| `/logout` | Sign out + redirect |

---

## 7. What's already working well — keep these instincts

- The split-panel treatment (warm photographic brand story on one side, clean functional form on the other) is a genuinely good, on-brand pattern — better than a generic centered white card. Don't default to a centered-card template just because it's more common.
- Real testimonial-style social proof and concrete feature chips on the brand panel, not abstract marketing copy.
- Segmented tab switcher for sign-in/sign-up instead of two separate page loads.
- Friendly error messages with progressive disclosure of the technical detail, rather than surfacing raw backend errors by default.
- Live slug preview during church creation — immediate, understandable feedback tied directly to what the admin is typing.

## 8. Checklist for whoever builds on this

1. Preserve the role/state-aware post-sign-in routing branches in §6.1 exactly — they are the actual product logic, not just navigation flourish.
2. Preserve the `next`-param / join-link redirect behavior — breaking it breaks the invite flow.
3. Fix the native `type="time"` input in onboarding to use the app's existing custom time picker.
4. Reconcile the auth page's hand-rolled cream palette back to the canonical `globals.css` tokens where it doesn't cost the warm feel.
5. Keep copy in the voice of a helpful person talking to a busy, non-technical church admin — not a SaaS product describing its own features.
6. Whatever changes, it should still feel like it belongs next to the rest of the admin app (dashboard, volunteers, service plans) — not like a separate marketing site bolted onto the product.

---

*Companion reading: [`web-app-dossier.md`](web-app-dossier.md) (full route map + auth/profile data model), [`dashboard-page-dossier.md`](dashboard-page-dossier.md) (visual detail for the post-login destination), and root `CLAUDE.md` for the full design system and schema reference.*
