# Member Sign-Up — "Build Your Profile" Step (Mobile) — idea, not yet implemented

Status: plan/idea capture only. No build, no schema changes, no UI work has happened against this doc.

## Where this idea comes from

Source: ["The UX Psychology Behind Apps People Can't Stop Using"](https://www.youtube.com/watch?v=2TlIg3VokY8) (uxpeak). The relevant principle is the **IKEA effect / endowment effect**: people value things more when they've built or personalized them themselves, even a little. The video's example is Duolingo — before you ever see an account-creation screen, you've picked a language, set a goal, and finished a lesson. By the time signup appears, you've already invested effort, so the button says "Continue," not "Sign up," and closing the tab feels like abandoning something you made rather than skipping a form.

Two supporting principles from the same video apply here too: **the goal gradient effect** (never show a user 0% progress — an artificial head start creates real motivation, the way LinkedIn's profile-strength meter never starts empty) and **decision fatigue / smart defaults** (blank fields make people leave; give tappable common choices instead of empty text boxes wherever possible).

## The honest constraint

Gather's auth is Supabase email + password with an email-confirmation click required before a session exists. That's a harder wall than Duolingo's — you can't write anything to the database as "this user" until they've verified their email and signed in for real. So this can't be a 1:1 copy of "build first, account wall never really appears." There are two ways to handle that honestly:

**Recommended for v1 — build immediately after the account wall, before anything else.** Keep `SignUpScreen` as-is (name, email, password), keep the existing "check your inbox" step. But the moment someone signs in for the first time with no church yet, instead of dropping them straight into `ChurchSelectScreen` (today's behavior), send them through the profile-builder first. It's technically after the auth wall, but it's still their very first real interaction with the product — before they've seen a single real screen, before church search, before anything. That's enough to capture most of the IKEA effect and all of the goal-gradient effect, for a fraction of the engineering cost.

**Stretch goal — build before the wall.** Collect photo/name/verse in local component state on the client, before ever calling `supabase.auth.signUp()`, so the flow visually matches Duolingo more closely (pick your look and feel, then hit "Continue" which is the actual signUp call). The catch: after signUp, Supabase still requires the email-confirmation click, which means the app may be closed and reopened before the user is ever really authenticated. Whatever they built pre-signup would need to survive that gap — e.g. stashed in device storage keyed by the pending email, then applied to their real profile row the first time they successfully sign in. Worth doing later; not worth the complexity for a first pass.

## Where this fits in the current flow

Today (`apps/mobile/src/navigation/RootNavigator.tsx`): `SignIn`/`SignUp` → (email confirm, external) → `SignIn` → if no `profile.church_id`, straight to `ChurchSelectScreen`, which is also the *only* place a `profiles` row gets created (an upsert that sets `church_id`, `full_name`, `email`, `role: MEMBER` all at once). There's no personalization step of any kind right now, and no profile row exists at all until a church is picked.

Proposed insertion point: a new stack state between "authenticated, no profile row yet" and "authenticated, no church yet" — i.e., the profile-builder screens run once, right after first sign-in, before church selection, regardless of how the user got there.

## Why this must be identical whether or not there's a join link

A join link only removes a decision (which church) — it shouldn't remove the personalization moment, since that's the part actually driving investment/retention, not the church-picking part. So: join-link users skip straight past `ChurchSelectScreen` (church is pre-set), but still go through the profile-builder. Non-join-link users go through the profile-builder, then land on `ChurchSelectScreen` (or, longer-term, the [church-finder flow](./../web/church-finder-onboarding-idea.md) already sketched separately). Both paths converge on the same two profile-builder screens.

One current-state note: there's no actual join-link/deep-link handling in the mobile app yet — `ChurchSelectScreen` only supports manual search by name/slug today. The web app's `/join?code=` flow doesn't have a mobile equivalent yet. That's a separate, smaller piece of work this idea depends on eventually (a deep link that opens the app with a church pre-selected), noted here as a dependency, not solved by this doc.

## Suggested screens

**Screen A — "Add a photo"**
Profile photo picker (camera roll or take a photo), with a friendly default fallback (initials on a colored circle, so skipping doesn't leave a blank state) if they skip. Name pre-fills from what they typed at signup so it isn't asked twice — this screen just confirms it and adds the visual.

**Screen B — "Make it yours"**
Favorite Bible verse: not a blank text field (decision fatigue) — a short row of tappable common verses (John 3:16, Philippians 4:13, Jeremiah 29:11, Psalm 23:1, etc.) plus a "write your own" option underneath. Below that, one or two optional extras (see next section), all clearly skippable, with a single "Continue" button — never "Skip" phrased as a loss, just let Continue work with nothing filled in.

Two screens, not one long one — matches the "one primary decision per screen" rule already in the project's design system, and keeps each screen fast enough that finishing feels easy.

## Other optional fields worth considering, and why

- **Ministry interests / how you'd like to serve** (tag picker: worship, kids, hospitality, tech, prayer, greeting) — this is the one field here with real downstream product value beyond personalization: it's a direct feed into volunteer role matching later, so it's not just decoration.
- **Birthday (month + day only, no year)** — enables birthday shoutouts / care-team follow-up without collecting age.
- **A one-line "about me"** — low priority, easy to cut if the screen feels crowded.
- **Household/family members** — interesting for future "family check-in" style features, but probably too much for a first pass; flag as a later idea rather than building now.

Keep the total optional-field count small. The video's own opening point is that more choices reduce completion, not improve it — a study cited in it found a grocery display with 24 jam options converted at 3%, and dropping to 6 options converted at 30%. Same logic applies here: better to ship 3-4 well-chosen optional fields than a long "tell us about yourself" form.

## Progress framing

Carry a single progress indicator across the *whole* signup arc — account creation counts as step 1, not a separate ungated event. Something like: Create account (step 1 of 4) → Add a photo (2 of 4) → Make it yours (3 of 4) → Find your church (4 of 4). Never show 0%; account creation itself should already read as meaningful progress, the same way LinkedIn's profile-strength meter is never empty.

## Data model gaps to solve before building

- No `avatar_url` (or similar) column on `profiles` today — needs adding.
- No `favorite_verse` / ministry-interest / birthday fields on `profiles` today — needs adding (all nullable/optional).
- No Supabase Storage bucket for avatars yet. There's already a working pattern to copy: `apps/web/components/announcements/ImageUpload.tsx` creates/uses a public bucket (`announcements`) and calls `.storage.from(...).upload(...)` / `.getPublicUrl(...)`. A new `avatars` bucket following the same shape is the obvious move.
- No `profiles` row exists until `ChurchSelectScreen`'s upsert runs today — for the profile-builder to have something to write to, either (a) create a minimal `profiles` row (church_id: null) right after first sign-in, before the builder screens run, and have `ChurchSelectScreen` become an update instead of a first-time upsert, or (b) hold builder answers in navigation/local state and fold them into the existing single upsert once a church is finally chosen. (a) is architecturally cleaner and consistent with the fact that RLS already supports a `profiles` row with a null `church_id` (that's exactly the `rejoin-church` state today). (b) is less schema work but means losing progress if the app is killed mid-flow.

## Open questions for whenever this gets picked up

- Do we actually build the join-link deep-link mechanism as part of this, or treat it as a prerequisite tracked separately?
- Minimal vs. full field set for v1 — probably just photo + verse to start, with ministry interests added once volunteer-matching is ready to consume it.
- Should the profile preview (photo + name + verse) show a live "here's your member card" preview as they build it, to make the payoff feel immediate (reciprocity-adjacent — a small reward while building, not just data entry)?
