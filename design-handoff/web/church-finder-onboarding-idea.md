# Church Finder — Member Onboarding Idea (not yet implemented)

Status: idea capture only. No build, no schema changes, no UI work has happened against this doc. Saved for a future planning/implementation pass.

## The gap this fills

Today, a brand-new person can only land inside Gather two ways: they were invited by an admin (`/join?code=...`), or they sign up and become the founding ADMIN of a brand-new church (`/onboarding/create-church`). There is no path for "I'm a member, I don't have an invite code, and I don't know if my church is even on this platform yet." That's the flow this doc sketches: help a completely new member *find* their church — whether it's already on Gather or not — instead of forcing them into the admin-onboarding flow or leaving them stuck.

This sits alongside the existing `/onboarding/create-church` (admin path) and `/onboarding/rejoin-church` (orphaned profile path) as a third onboarding branch, specifically for people who hit sign-up with no church context at all.

## Two flows hiding inside one feature

It's worth naming these separately because they have different data needs and different payoffs for Gather:

1. **Match to a church already in Gather.** Straightforward win — surface it, let the member request to join, done.
2. **Match to a church that isn't in Gather yet.** This is really a growth/lead-gen mechanism wearing a member-onboarding costume. If we can identify "Grace Community, a Nigerian Baptist congregation two miles away" via scraping/directories, we've both helped the member *and* found a warm lead for Gather's own sales/outreach — "tell your church about Gather."

Both should probably exist in the same results screen (clearly labeled — "on Gather, join now" vs. "found nearby, not yet on Gather"), but the backend and success criteria differ.

## Matching inputs

From the member, ideally collected as a short quiz rather than a form:

- **Denomination** (Baptist, Catholic, Non-denominational, Pentecostal, Lutheran, AME, Orthodox, etc.) — dropdown/searchable select
- **Location** — zip/city or device geolocation, used for radius search
- **Nationality / cultural affinity** — optional, free-text-or-tag (e.g. "Nigerian," "Korean," "Haitian," "Ethiopian Orthodox"). This maps to real self-identified church naming conventions ("First Nigerian Baptist," "Korean Presbyterian Church of X") — it's the member choosing a community they'll feel at home in, not the church screening people out. Needs careful framing (see Sensitivity section).
- **Language** of service, if different from cultural tag
- **Other signals worth considering**: service day/time that fits their schedule, congregation size preference, worship style (contemporary/traditional/liturgical), kids/youth ministry presence, accessibility needs. These are good "refine your results" filters rather than required upfront fields — keep the first screen short.

## Suggested phased approach

**Phase 1 — keyword match against Gather's own church directory.**
Query `churches` (plus new fields — see Data model) by denomination + geo radius + keyword match against name/address/description for the cultural/nationality tag. No AI needed yet; this is just structured filtering. Ships fastest, zero external dependencies, and immediately useful even with a small number of churches on the platform.

**Phase 2 — scrape/aggregate nearby churches not yet on Gather.**
Supplement Phase 1 results with churches found via Google Places API (or similar), plus — where possible — official denominational locator directories (SBC, ELCA, LCMS, AME, Catholic diocese finders, etc. often publish structured, scrape-friendly or API-accessible locators, which is a much safer and more accurate source than scraping generic map listings). Tag these scraped entries with denomination/keywords parsed from their name and any public description, and mark them clearly as "not yet on Gather."

**Phase 3 — AI-assisted matching.**
Once there's enough data, replace/augment keyword matching with something smarter: let the member describe what they're looking for in their own words ("a small Spanish-speaking church with a strong youth group"), embed that against church descriptions, and rank by semantic similarity rather than exact tag overlap. This is also where an AI pass could clean up/normalize the scraped Phase 2 data (inferring denomination and tags from messy scraped text).

## Suggested pages/screens

1. **Entry point** — a "Don't have an invite code? Find your church" link from sign-up, or a dedicated `/find-church` landing for members arriving with no church context.
2. **Preference quiz** — one to three short screens (denomination → location → optional cultural/language tag), matching the "one focused decision per screen" pattern used elsewhere in onboarding. Skippable fields stay skippable.
3. **Results** — ranked list, clearly split or badged between "on Gather" (instant request-to-join) and "found nearby" (external — website link, address, maybe "let them know about Gather" CTA).
4. **Request-to-join** — for in-system matches. Needs a real mechanism that doesn't exist yet: either an admin-configurable "open join" toggle per church, or a join-request queue that notifies the church admin (would hook into the existing `notification_log` pattern) for approval.
5. **No-match fallback** — manual search by name/city, "enter an invite code instead" link back to the existing join flow, and (if they're actually the leader, not a member) a path back to the admin `/onboarding/create-church` flow.

## Data model gaps to solve before building

- `churches` has no `denomination` or `tags`/culture field today — needs new column(s), likely `denomination text` and `tags text[]` or `jsonb`.
- No lat/lng on `churches.address` — geocoding needed for radius search (or a lightweight PostGIS/haversine approach).
- No concept of an "unclaimed" church record (scraped, not a real tenant) — needs a way to represent these distinctly from real Gather tenants, plus a later "claim this listing" path for when that church's staff eventually signs up.
- No join-request/approval flow — currently joining is invite-code-only (`/join?code=`). Self-serve discovery implies a new request → approve state machine.

## Sensitivity notes

Matching on nationality/culture is the member choosing a community for themselves — the same way "First Nigerian Baptist" or "Korean Presbyterian Church" names themselves publicly today. That framing should carry through the UI copy: this is about helping someone find a place they'll feel welcome, not a filter a church uses to screen people out. The field should always be optional, never required, explained in plain language, and not exposed to churches as a way to pre-screen join requests. Scraped/aggregated data about real churches (Phase 2) should be handled carefully too — attribution, staleness, and a way for a church to correct or claim their listing once they're aware of it.

## Open questions for whenever this gets picked up

- Legal/ToS review for whichever data source Phase 2 leans on (Places API vs. denominational directories vs. general scraping) — official APIs and denominational directories are the safer starting point.
- Does "request to join" require admin approval by default, or can a church opt into instant self-serve join?
- Where does this live — web only, mobile only, or both? (Mobile is the primary member surface per the project brief, so this arguably belongs there first, or in both.)
- What's the minimum viable tag set for Phase 1 before it's worth building the quiz UI at all?
