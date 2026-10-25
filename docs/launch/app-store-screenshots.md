# App Store screenshots — framework

What goes on each App Store image, how it looks, and what to capture on the phone.
Built with the `aso-appstore-screenshots` skill (scaffold step only — no AI repaint,
so every screen shown is the real app, per App Store guideline 2.3.3) and the
`ux-writing` skill for the headlines.

## Who is looking

Most people who open Gather's App Store page were **sent there by their church**
("download Gather to see your serving schedule"). They already intend to install;
the screenshots have to reassure them it's warm, simple and worth it. A smaller
group are pastors/admins checking the app before rolling it out — the set should
also show them the volunteer experience is good.

So the story is: **your church, in your pocket → answering is easy → on the day
you know what's happening → nothing gets missed → stepping back is okay.**

Only the iPhone app can be shown (no web admin screens).

## Visual system (same on every image)

| Element | Spec |
|---|---|
| Size | **1320 × 2868** (6.9" slot). One set is enough — App Store Connect scales it down for smaller iPhones. |
| Background | Flat amber **#F59E0B** — the brand colour, nothing else on the canvas. No gradients. |
| Text colour | Dark brown **#3A2600** (≈6:1 on amber). Never white on amber — same rule as the Dawn sign-in. |
| Font | Rubik Bold (700). |
| Line 1 | One verb, ALL CAPS, very large (auto-fits the width). |
| Line 2 | The rest of the headline in sentence case, ≤ 28 characters, curly apostrophes (’). |
| Device | Black iPhone frame, centered, top at ~25% of the canvas, bottom bleeding off the edge. |
| Screen | Real TestFlight screenshot, light mode, status bar replaced with a clean one (9:41, full battery). |
| Copy rules | Never say "Sunday" (some churches worship on Saturday). No "free", "#1", prices, or claims we can't back. |

## The set (in order — the first three show in search results)

| # | Headline | Screen to capture | Data it needs | Why it's here |
|---|---|---|---|---|
| 1 | **STAY** close to your church | **Home** — "Next up" hero, "Awaiting your reply", Browse tiles, Latest news | Signed in as a volunteer with an upcoming service and one assignment awaiting reply; recent announcements with photos | The #1 reason to download: everything from your church in one place |
| 2 | **SAY YES** to serving in one tap | **Serve** ("Your schedule") | 3–4 upcoming assignments across different dates: one *awaiting reply* at the top, the rest confirmed, service names visible ("9:00 Service · 9:00 AM") | The core volunteer job, shown as effortless |
| 3 | **KNOW** when you’re up next | **Plan** tab on a service day, mid-service | A plan dated today with the first 2–3 steps done, "Now" on the next step, and the personal line "You’re up next" | Unique — no other church app shows the service live |
| 4 | **NEVER MISS** what’s happening | **Events** list | 4+ upcoming events with real photos, at least one "You’re going" | Members use this every week |
| 5 | **CATCH UP** on church news | **News** (announcements) | A featured announcement with a photo plus 3–4 more below | Shows the app is alive and personal |
| 6 | **TAKE** a week off, guilt-free | **Serve** scrolled to "Can’t make it?" away days | 1–2 away days selected | Volunteers' biggest worry is letting people down — this says stepping back is easy |
| 7 *(optional)* | **CELEBRATE** every yes | The confirmation celebration | Captured right after tapping Confirm | Delight closer; only if the capture looks clean |

Not used: sign-in, profile, settings, tour, empty states, nearby churches (empty until
other real churches are discoverable), anything admin-only.

## Capturing the screens (on your iPhone, from the TestFlight build)

1. Phone in **light mode**, text size default, Wi-Fi on, battery charged, no
   Focus/Do Not Disturb. (The status bar gets replaced anyway, but keep it clean.)
2. Sign in to the demo church **Hillside Community Church** as `pastor@hillside.test`
   (an admin who is also on the serving schedule: one request awaiting reply, a backup
   spot, a confirmed spot). Password: `.seed-tmp/seed_hillside.mjs`. #3 needs a service
   under way, so capture it during a service or ask Claude to stage one.
   Any iPhone works (an iPhone 17's 1206 × 2622 is fine): the screenshot goes inside the
   frame and the finished image is resized to 1320 × 2868.
3. Take each screenshot with **side button + volume up**. Scroll so the part named
   in the table sits in the top two-thirds of the screen — the bottom gets cropped by
   the frame.
4. Put them in `screenshots/source/` (AirDrop or iCloud Photos → download), named
   `01-home.png`, `02-serve.png`, …

## Building the images

```bash
python "$HOME/.claude/skills/aso-appstore-screenshots/compose.py" --bg "#F59E0B" --fg "#3A2600" --keep-case --verb "STAY" --desc "close to your church" --screenshot screenshots/source/01-home.png --output screenshots/01-stay/scaffold.png
python "$HOME/.claude/skills/aso-appstore-screenshots/resize.py" --width 1320 --height 2868 screenshots/01-stay/scaffold.png
```

Approved images go to `screenshots/final/01-stay.png` … and are uploaded to
App Store Connect → the app → 1.0 → **iPhone 6.9" Display**.

## Open decisions

- Headline wording and order (above is the recommendation).
- Whether to include #7.
- Whether to add a Google Play set later (1080 × 1920, same headlines).
