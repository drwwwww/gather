# Store privacy answers

These must stay consistent with three things: the privacy policy (`apps/web/app/(marketing)/privacy/page.tsx`), the iOS privacy manifest (`apps/mobile/app.json` → `ios.privacyManifests`), and Sentry settings (`apps/mobile/App.tsx`: `sendDefaultPii: false`, replay only on error, fully masked). **If one changes, change all of them.**

## Apple: App Privacy

**Do you or your third-party partners collect data from this app?** Yes.
**Tracking?** No. There are no ads, no data brokers and no cross-app tracking. `NSPrivacyTracking: false`.

| Data type | Collected | Linked to user | Tracking | Purpose |
|---|---|---|---|---|
| Contact Info → Name | Yes | Yes | No | App Functionality |
| Contact Info → Email Address | Yes | Yes | No | App Functionality |
| Contact Info → Phone Number | Yes (if they sign in with phone) | Yes | No | App Functionality |
| User Content → Photos or Videos | Yes (profile photo) | Yes | No | App Functionality |
| User Content → Other User Content | Yes (favorite verse, reports) | Yes | No | App Functionality |
| Identifiers → User ID | Yes | Yes | No | App Functionality |
| Identifiers → Device ID | Yes (push token) | Yes | No | App Functionality |
| Diagnostics → Crash Data | Yes | **No** | No | App Functionality |
| Diagnostics → Performance Data | Yes | **No** | No | App Functionality |
| Diagnostics → Other Diagnostic Data | Yes | **No** | No | App Functionality |
| Location | **Not collected.** It's used on-device only to sort nearby churches and never transmitted. | | | |
| Usage Data, Browsing History, Search History, Contacts, Financial Info, Health, Sensitive Info | Not collected | | | |

> Diagnostics are "not linked" only because `sendDefaultPii` is `false` and Sentry receives no user ID or email. If you ever call `Sentry.setUser(...)`, change these answers to "Linked".

## Google Play: Data safety

**Does your app collect or share any of the required user data types?** Yes.
**Is all user data encrypted in transit?** Yes.
**Do you provide a way for users to request that their data is deleted?** Yes. In-app (Profile → Delete account) and at `https://gatherministry.online/delete-account`.

| Category → type | Collected | Shared* | Optional? | Purpose |
|---|---|---|---|---|
| Personal info → Name | Yes | No | Required | App functionality, Account management |
| Personal info → Email address | Yes | No | Required (unless phone) | App functionality, Account management |
| Personal info → Phone number | Yes | No | Optional | App functionality, Account management |
| Personal info → User IDs | Yes | No | Required | App functionality |
| Photos and videos → Photos | Yes | No | Optional | App functionality |
| Messages → Other in-app messages | No | | | |
| App activity → Other user-generated content | Yes | No | Optional | App functionality |
| App info and performance → Crash logs | Yes | No | Required | Analytics (diagnostics) |
| App info and performance → Diagnostics | Yes | No | Required | Analytics (diagnostics) |
| Device or other IDs | Yes (push token) | No | Optional (they can deny notifications) | App functionality |
| Location | **No.** On-device processing only, which Google doesn't count as collection | | | |

\* Under Google's definitions, sending data to a service provider that processes it on your behalf (Supabase, Sentry, Expo, Brevo) is **not** "sharing". Members of the same church seeing a directory card is the app working as intended, also not "sharing".

## Account-deletion URL (Google requires this; Apple links it too)
`https://gatherministry.online/delete-account`. It names the app and developer, shows the three ways to delete (in-app, web, email), and explains what's deleted, what's kept, and the 30-day backup window.
