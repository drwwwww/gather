# Getting Gather onto the App Store and Google Play

Written October 2026 for an **Apple Developer account enrolled as an Individual** (Andrew Bernadel, team `87CQ7YHV4P`), with Gather on Expo SDK 57 / EAS (project `26babdf8-…`, owner `drww`, bundle ID `com.bernadelstudios.gather`).

Store rules change often. Before each big step, check the linked Apple or Google page. The flow below matches how both stores worked as of this writing.

---

## Part 0: Do these before you start (about 30 minutes)

| | Item | Where |
|---|---|---|
| ☐ | Deploy the web app, so `/privacy`, `/terms`, `/delete-account` and the new API routes (`/api/account/delete`, `/api/moderation/report`) are live at gatherministry.online. The mobile app calls them. | `git push` → Vercel |
| ☐ | Make sure `support@gatherministry.online` actually receives mail. Apple, Google, the privacy policy and report emails all point there. | Your email host |
| ☐ | Add `CRON_SECRET` in Vercel if you ever want scheduled reminders. The dispatch route now rejects anyone who isn't a church admin or the cron. | Vercel → Settings → Env |
| ☐ | Choose a reviewer account. Apple and Google both need a login that shows everything. Use an existing **SERVICE-role** Grace Community demo account, so the reviewer sees the Plan and Serve tabs too. The password is in team notes; don't put it in the repo. | — |
| ☐ | Decide on iPad. `app.json` has `supportsTablet: true`, which means Apple **requires 13" iPad screenshots** and tests the app on iPad. For a phone-first v1, consider setting it to `false`. | `apps/mobile/app.json` |

---

## Part 1: Apple App Store (Individual account)

### What "Individual" means for you
- The store shows **"Andrew Bernadel"** as the seller, not "Gather". That's normal and fine for launch.
- You can switch to an LLC later and keep the app, its reviews, and its users (see Part 2).
- You don't need a D-U-N-S number until you convert or move to an organization.

### Step 1: Agreements, tax and banking
App Store Connect → **Business**.
- The **Free Apps** agreement is already active. That's all you need, because the Gather app is free.
- You only need the **Paid Apps** agreement (W-9, bank account) if you ever sell inside the app. **Don't.** Churches subscribe on the website through Stripe. Keep the app free of prices, "Upgrade" buttons, and links to pricing. That's the cleanest position under Apple's guidelines 3.1.1/3.1.3, and it's how comparable church-management apps operate.

### Step 2: Create the app record
App Store Connect → **Apps → + → New App**
- **Platform:** iOS
- **Name:** "Gather" may already be taken. Have fallbacks ready, such as *Gather: Church Teams* or *Gather for Churches* (30 characters max).
- **Primary language:** English (U.S.)
- **Bundle ID:** `com.bernadelstudios.gather`. If it's missing from the list, run one EAS iOS build first, because EAS registers it.
- **SKU:** `gather-ios-001` (internal only, any unique string)
- **User access:** Full access

Copy the numeric **Apple ID** of the new app (App Information page). You'll paste it into `eas.json` for automatic submits:
```json
"submit": { "production": { "ios": { "ascAppId": "1234567890" } } }
```

### Step 3: App Store Connect API key (one time, makes builds and submits painless)
Users and Access → **Integrations → App Store Connect API → +**, role *App Manager*. Download the `.p8` once and store it safely (not in the repo). EAS will ask for it the first time you `eas submit`, or you can let EAS manage it interactively.

### Step 4: Build and upload (you run these)
From `apps/mobile`:
```bash
eas build --platform ios --profile production
```
```bash
eas submit --platform ios --latest
```
`autoIncrement` bumps the build number for you. Export compliance is pre-answered (`ITSAppUsesNonExemptEncryption: false`), so there's no encryption question.

### Step 5: TestFlight first (strongly recommended)
- **Internal testing:** up to 100 people on your App Store Connect team. No review, available within minutes of processing.
- **External testing:** up to 10,000 people by email or public link. The first build goes through a short Beta App Review, usually under a day.
- Test on a real phone: push notifications (they only work in a real build, never Expo Go), Check in, Run service, Report/Block, Delete account, and the sign-up consent links.

### Step 6: The listing
| Field | What to enter |
|---|---|
| Subtitle (30) | *Volunteers, services & news* |
| Promotional text (170) | Can change any time without review |
| Description | Lead with the member's view (see your schedule, confirm with a tap, never miss Sunday news), then the team view |
| Keywords (100, comma-separated, no spaces) | `church,volunteer,schedule,worship,ministry,serve,bulletin,announcements,events,rota` |
| Support URL | `https://gatherministry.online` (or a `/support` page) |
| Marketing URL | `https://gatherministry.online` |
| Privacy Policy URL | `https://gatherministry.online/privacy` |
| Category | Primary: **Lifestyle** (where church apps usually sit). Secondary: **Productivity** |
| Copyright | `2026 Andrew Bernadel` (change it after the LLC) |
| Screenshots | **6.9" iPhone (1320×2868) is required.** Apple scales it down for smaller phones. Add 13" iPad if `supportsTablet` stays true. 3–6 screenshots: Home, Your Schedule + confirm, Service plan in Run-service mode, Events, Announcements. |

### Step 7: App Privacy ("nutrition label")
Answer exactly as in [store-privacy-answers.md](store-privacy-answers.md). These answers match the privacy policy and `app.json`'s privacy manifest. Keep the three consistent.

### Step 8: Age rating
Answer the questionnaire honestly. The relevant questions are user-generated content (profiles and photos are visible to church members) and no unrestricted web access. Expect a teen-level rating. The Terms already require users to be 13+.

### Step 9: App Review information
- **Sign-in:** the SERVICE demo account email and password.
- **Notes** (paste and adjust):
  > Gather is a church-management app. Members join their own church and see its announcements, events and volunteer schedule. The demo account is a service-team volunteer at our sample church "Grace Community Church".
  > Account deletion: Profile (tap the avatar on Home) → "Delete account".
  > Report/block another member: Profile → View members → tap a member → Report profile / Block.
  > Church subscriptions are sold to church administrators on our website. The app has no purchases.
  > Location is optional and used only on-device to sort nearby churches' events.

### Step 10: Submit
Add the build to the version, choose **"Manually release this version"** for the first launch, so you control the date, and submit. Reviews currently take about 24–48 hours.

### The usual first-submission rejections (and our status)
| Guideline | Risk | Status |
|---|---|---|
| 2.1 App completeness: reviewer can't log in, or a crash | High | Provide a working demo account; test the build on TestFlight first |
| 5.1.1(v) Account deletion in-app | High | ✅ Built (Profile → Delete account; also web) |
| 1.2 User-generated content needs report + block | High | ✅ Built (member directory) plus a 24-hour admin review queue on People |
| 5.1.1 Privacy policy link in app and on the listing | Medium | ✅ Profile → Help & legal; sign-up consent line |
| 2.3 Metadata: screenshots must show the real app | Medium | Use real screenshots, no marketing mock-ups |
| 4.2 Minimum functionality | Low | The app does plenty |
| 4.8 Sign in with Apple | n/a | Only required if you add Google/Facebook login |
| Phone sign-in reaching a dead end | Was high | ✅ Hidden until SMS is configured (`EXPO_PUBLIC_PHONE_AUTH=1`) |

### Shipping fixes later
JS-only fixes use `eas update --channel production`. The runtime policy is now `fingerprint`, so an update can only reach binaries with the same native code. Anything that adds a native module needs a new store build.

---

## Part 2: Moving from Individual to an LLC later

### Form the LLC (Georgia)
1. **Name check and filing:** Georgia Corporations Division (ecorp.sos.ga.gov) → *Articles of Organization*. About **$100** online, usually approved within a few business days.
2. **Registered agent:** you can be your own (it must be a Georgia street address, which becomes public), or pay a service about $50–150/year to keep your home address private.
3. **EIN:** free at irs.gov, issued instantly online.
4. **Operating agreement:** single-member template; keep it on file.
5. **Business bank account** in the LLC's name, using the EIN.
6. **Annual registration:** **$50**, due **January 1 – April 1** every year (the fee goes up after April 1, and missing it can dissolve the LLC).
7. **D-U-N-S number:** free. Request it through Apple's D-U-N-S lookup tool. It can take up to about 5 business days, sometimes longer. Your legal name and address must match the state filing *exactly*.
8. **A website and email on a domain tied to the business** (gatherministry.online works). Apple checks that the organization's website is real.

> **Gather LLC or Bernadel Software LLC?** For liability, separate is cleaner: a lawsuit about Gather can't reach your other apps. Many solo founders start with one holding LLC and split later. Ask a Georgia CPA or attorney; it's a one-hour consult.

### Then pick one of two paths with Apple

**Path A: Convert this account to the LLC (simplest, if this account will only ever hold Gather)**
- Apple Developer → **Contact Us → Membership and Account → convert from Individual to Organization**. You'll need the D-U-N-S number, and you must have legal authority to sign for the LLC.
- Apps, reviews, TestFlight and certificates all stay. The seller name on the store changes to the LLC.
- Your future non-Gather apps would then go in a *new* individual or organization account.

**Path B: Transfer the app to a new organization account (if this individual account keeps your other apps)**
1. Enroll the LLC as a new Organization account ($99/year, D-U-N-S required).
2. In the new account, accept the agreements. If you ever add paid features, also set up tax and banking.
3. In this account: App Store Connect → Gather → **App Information → Transfer App**. Requirements: at least one version has been released, no app version is in review, and both accounts are in good standing. Check Apple's "App transfer criteria" page for the current list. TestFlight builds don't move with the app.
4. Reviews, ratings, users and the bundle ID move with the app. Users don't need to reinstall.
5. In EAS, run `eas credentials` and point the project at the new team. The next build is signed by the LLC.

### After either path, update
- `apps/web/lib/legal.ts` → `OPERATOR` (Privacy, Terms and the DPA all read from it), and bump `LEGAL_EFFECTIVE`
- App Store copyright line; Stripe account business details; Brevo sender name; Sentry org name (cosmetic)
- The bundle ID `com.bernadelstudios.gather` **can stay**. Users never see it, and changing it would create a new app.

---

## Part 3: Google Play

### The decision that matters: personal vs organization developer account
- **Personal accounts** (new since late 2023) must run a **closed test with at least 12 testers who stay opted in for 14 days in a row** before Google lets you apply for production. Testers must opt in through the Play link with their Google accounts.
- **Organization accounts** skip that requirement, but need a D-U-N-S number, the same one you'll get for Apple.
- **Recommendation:** if the LLC is weeks away, open the Play account as the **organization** once you have the D-U-N-S, and skip the 12-tester wait. If you want Android out sooner, open a personal account now and start the 14-day test immediately. Grace Community's real members are the natural testers.

### Steps
1. **Create the account:** play.google.com/console, $25 one time, identity verification. You'll also verify an Android phone through the Play Console app.
2. **Create app:** name *Gather*, App, Free.
3. **Main store listing:** title (30), short description (80), full description (4000), **icon 512×512**, **feature graphic 1024×500**, 2–8 phone screenshots.
4. **App content** section (all required):
   - Privacy policy: `https://gatherministry.online/privacy`
   - App access: "Some functionality is restricted", with the demo account and the same notes as Apple
   - Ads: **No**
   - Content rating: IARC questionnaire (declare that users can interact and that profiles are visible)
   - Target audience: **13+ only.** Don't include under-13 age groups, or the Families policy applies.
   - **Data safety:** see [store-privacy-answers.md](store-privacy-answers.md); deletion URL `https://gatherministry.online/delete-account`
   - Government / financial / health apps: No
5. **Build:**
   ```bash
   eas build --platform android --profile production
   ```
   This produces an `.aab`. Google requires the **very first upload to be done by hand** in the console (Testing → Closed testing → Create release → upload). After that, `eas submit -p android` works with a Google service-account key.
6. **Play App Signing:** accept it. Google holds the release key, and EAS keeps the upload key.
7. **Closed test** (personal accounts): add testers by email or Google Group, share the opt-in link, and wait 14 days.
8. **Apply for production:** answer Google's short questions about your testing, then roll out. A staged rollout at 20% is wise for the first release.

### Transferring Play to the LLC later
Play Console → help → **"Transfer apps to a different developer account"** request form. You'll need both account IDs and the transaction ID of each $25 registration. Users, ratings and the package name move with the app.

---

## Part 4: Order of operations (suggested)
1. Deploy web, check the support inbox, run a TestFlight internal build, and test on your iPhone.
2. Submit to Apple as Individual. Launch.
3. Form the LLC and request a D-U-N-S in parallel. They take about 1–3 weeks in total.
4. Google Play: either personal now with the 14-day test, or organization once the D-U-N-S arrives.
5. Convert or transfer Apple to the LLC and update `legal.ts`.
6. Have an attorney review Privacy, Terms and the DPA before your first paying church, or right after. A fixed-fee review is common.
