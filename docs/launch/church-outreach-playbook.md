# Church outreach playbook — getting the first 10 churches

Your first churches won't come from the website. They'll come from people who met you, or someone who works for you, and trusted them. The website's job is to close what a conversation started. This playbook is the conversation.

**Goal for the first 60 days:** 10 paying churches. At ~10–15% conversion from a real conversation to a paid plan, that's roughly 100 real conversations. That's about 400 doors, calls and emails, because most attempts never become a conversation. That's 7 a day per person: very doable.

---

## 1. Who to go after (in order)

1. **Churches you or your family already know.** Your own church, your parents' church, friends' pastors. Warm intros convert 5–10× better than cold. Start here this week.
2. **Churches of 75–300 people within an hour's drive.** Big enough to feel the scheduling pain (several services, a worship team, kids' ministry), small enough that the pastor or one admin decides alone. Too small (<50) often run on a group text and don't feel the pain; too big (>800) have Planning Center, a committee and a budget cycle.
3. **Church plants (1–5 years old).** No tools yet, a founder-pastor who decides on the spot, and an identity built around doing things well. Offer the reduced price.
4. **Student organizations** — campus ministries, college fellowships, Christian student groups. Weekly gatherings, rotating volunteer teams, new leaders every year who need something with zero training. They get the student discount.
5. **Churches using spreadsheets + group texts, or that say Planning Center is "too much."** That's the exact gap Gather fills.

**Skip for now:** megachurches, denominational HQs, anyone who needs a procurement process, and churches happily on Planning Center with a full-time admin who loves it.

### Building the list
- Google Maps search "church" around each ZIP code. Note name, website, phone, service times, and roughly how big (number of reviews and building size are a decent proxy).
- The church website's "Staff" or "About" page gives you the **executive pastor, church administrator or worship director**. These are your buyers. The senior pastor approves, but the admin feels the pain.
- Facebook groups for local pastors, ministerial associations, and denominational district directories.
- Tools if you go to volume: an Apify "Google Maps scraper" run per ZIP (a few dollars for thousands of rows) gives you a starting sheet; then someone verifies the staff names by hand.

---

## 2. The offer (say it the same way every time)

> "Gather is one place to plan your services, schedule volunteers and talk to your church — your team confirms where they're serving from their phone, and you stop texting people on Saturday night. **Try everything free for 14 days, no card.** If you keep it and change your mind within 14 days of paying, **we refund it, no questions.**"

What you can offer in the room:
- **Founding church:** the first 10 churches to choose a plan keep today's price for life and get a free setup session. The pricing page shows the real spots left — use it ("there are only N founding spots left") because it's true.
- **Free 14-day trial**, Gather AI included, no card.
- **14-day money-back guarantee** after the first payment.
- **Yearly = 2 months free.**
- **Reduced pricing** for church plants, churches under 50 people, and tight budgets; **student organizations always get a discount.** Decide the numbers before you go out and give every rep the same ones. Suggested: student orgs 50% off Community; church plants and churches under 50, 30% off for the first year. Create them as Stripe promotion codes (checkout already accepts codes) so reps hand out a code instead of negotiating.
- **Free setup help:** "I'll sit with your admin for 30 minutes and we'll build next Sunday together." This is the most persuasive thing you have. Use it.
- **Pay by invoice, ACH or check** for churches whose treasurer won't put software on a card.

Never promise features that don't exist (multi-campus, text-message confirmations, integrations). It's the fastest way to lose a church after they've paid.

---

## 3. Tracking who brought each church (already built)

Every rep gets a code. Their links:

- Website: `https://gatherministry.online/?ref=CODE`
- Straight to sign-up: `https://gatherministry.online/auth?tab=signup&ref=CODE`

The browser remembers the code and sign-up saves it on the account (`signup_source` in the user's metadata). Put the sign-up link on a **QR code** printed on a leave-behind card (any free QR generator), one card design per rep.

Campaign links work the same way: `?utm_source=facebook&utm_campaign=pastors-group`.

**Trials and paid churches per rep** (run with `npx supabase db query --linked`):

```sql
select coalesce(u.raw_user_meta_data->'signup_source'->>'ref',
                u.raw_user_meta_data->'signup_source'->>'utm_source', 'direct') as source,
       count(distinct c.id) as churches,
       count(distinct c.id) filter (where c.stripe_subscription_id is not null) as paid
from auth.users u
join profiles p on p.id = u.id and p.role = 'ADMIN'
join churches c on c.id = p.church_id
group by 1 order by 2 desc;
```

Page views, referrers and countries for the public site are in **Vercel → your project → Analytics** (turn on Web Analytics there once; it's cookieless, so no banner).

Also keep one shared spreadsheet (Google Sheets is fine) with: Church · City · Size estimate · Contact name · Role · Phone · Email · Rep · Channel (door/call/email/warm) · Date of each touch · Outcome (no answer / not now / demo booked / trial / paid / no) · Next step + date · Notes. If it isn't in the sheet, it didn't happen.

---

## 4. In person (the highest-converting channel)

### When to go
- **Tuesday–Thursday, 10am–3pm.** Church offices are staffed then. Monday is the pastor's day off; Friday is sermon prep; weekends are the worst possible time.
- **Never on a Sunday morning** to sell. It's fine to attend a service to learn a church, but don't pitch in the lobby.

### What to bring
- Leave-behind card with the QR code, the 14-day trial and the guarantee.
- A phone or tablet with Gather signed in to a demo church, so you can show it in 60 seconds.
- A notebook. Writing down what they say tells them you're listening.

### At the door / front office
> "Hi, I'm ___. I'm not here to sell anything today. I work with Gather, a tool that helps churches like yours plan services and schedule volunteers without the group texts. Who here handles the volunteer schedule each week?"

You're looking for the person who feels the pain. When you get them:

> "Can I ask you two quick questions? How do you build the Sunday schedule right now? And what's the most annoying part of it?"

Then **stop talking.** Let them describe the Saturday-night texts, the no-shows, the spreadsheet only one person understands. Repeat it back in their words. Only then:

> "That's exactly what Gather fixes. Can I show you in one minute?"

Show three things, no more:
1. The **Service Board**: next Sunday's order of service with real times, and the team with green (confirmed), amber (waiting), red (can't make it).
2. **A volunteer's phone**: the request card with "I'll be there / Can't make it", and the confirmation celebration.
3. **Fill with AI**: one tap staffs the open spots with reasons.

Close for a **small, specific next step**, not a sale:

> "Would it help if I set it up with you? It takes about 30 minutes. We'd put in your service times and build next Sunday together, and you'd have 14 days free to see if your team uses it. Does Tuesday or Thursday work?"

If they say "I need to ask the pastor": "Of course. Would it help if I came back when they're in, or should I leave this card for them? It has a link that starts the free trial."

### Follow-up after a visit
- Same day: a short personal email ("Great to meet you, ___. Here's the link we talked about…") with their rep link.
- Day 3: a text or call: "Did you get a chance to try it?"
- Day 7: offer the setup session again.
- Then monthly, with something useful (a new feature, a short tip). Never more than 4 follow-ups without a reply.

---

## 5. Phone

**Goal of a cold call:** book a 20-minute screen-share demo or a setup visit. Not to sell.

> "Hi, is this ___? This is ___ with Gather. I'll be quick — I work with churches around [city] on volunteer scheduling. Are you the person who puts together the Sunday team each week?
>
> [If yes] How are you doing it right now — spreadsheet, group text, Planning Center?
>
> [Listen. Ask what's annoying about it.]
>
> That's what we built Gather for. Your team gets a tap-to-confirm request on their phone, and you see who's in at a glance. It's free for 14 days. Could I show you on a 20-minute screen share this week — would Wednesday or Thursday afternoon be better?"

Voicemail (under 20 seconds):

> "Hi ___, this is ___ with Gather — we help churches schedule volunteers without the Saturday-night texts. I'll send you a short email too. My number is ___. Thanks!"

Rules: call the **church office line** (listed publicly); don't auto-dial or text personal cell phones you scraped. US churches calling hours: 9am–5pm their time. Log every call.

---

## 6. Email

### Set up first (once)
- **Don't send cold email from your main domain.** Register a second domain (e.g. `gather-church.com` or `trygather.online`), set up Google Workspace on it, add SPF, DKIM and DMARC, and **warm it up for 2–3 weeks** (Instantly, Smartlead or Lemlist have warm-up built in) before sending more than ~20/day. A burned main domain means your reminder emails to real churches land in spam.
- Until it's warm, send **personal emails from your own inbox, by hand, ~20/day.** These convert better anyway.
- Every cold email must include your **physical mailing address** and a way to opt out ("Just reply 'no thanks' and I won't email again") — US CAN-SPAM rules.

### Sequence (4 touches over 2 weeks)

**Email 1 (day 0)** — Subject: `Sunday volunteers at {Church}`
> Hi {First name},
>
> Quick question: how does {Church} build the volunteer schedule each week?
>
> Most churches we talk to are juggling a spreadsheet and a group text, and someone spends Saturday night chasing who's actually coming. Gather replaces that: your team confirms from their phone with one tap, and you see who's in at a glance.
>
> Worth a 20-minute look? Or try it free for 14 days, no card: {rep link}
>
> {Name}

**Email 2 (day 3)** — reply to the same thread:
> One thing pastors tell us they like: when someone can't make it, their backup is asked automatically and you get a heads-up. No more finding out at 8:45 on Sunday.
>
> Happy to set it up with you; it takes about 30 minutes.

**Email 3 (day 7)** — Subject: `What a worship leader said`
> "Our worship director used to spend two hours every week on scheduling. It's twenty minutes now, and nobody is surprised the morning of." — Michael Kim, Lead Pastor
>
> If {Church} is a church plant or a student organization, we have reduced pricing too.

**Email 4 (day 14)** — the breakup email (often gets the most replies):
> I'll stop here. If volunteer scheduling ever becomes a headache, the free trial is at {rep link}, and there's a 14-day money-back guarantee if you sign up and it isn't right. Blessings on Sunday.

Personalize the first line of email 1 whenever you can ("Saw you just launched a second service…"). One true personal line beats any template.

---

## 7. Objections

| They say | You say |
|---|---|
| "We use Planning Center." | "Lots of churches do. What do you like about it? … Gather is for teams that find it's more than they need: one screen for the service and the team, nothing to train. If you're happy, great; if your volunteers find it confusing, try ours side by side for 14 days." |
| "We don't have the budget." | "Totally understand. Most churches pay for it out of the time the admin saves. But if budget's tight, we have reduced pricing for church plants and smaller churches, and the first 14 days are free. Want me to check what you'd qualify for?" |
| "Our volunteers won't download an app." | "They don't have to for it to help. You still plan everything in one place, and they get reminder emails. In practice, once they see 'tap to confirm' most of them do." |
| "We're too small." | "How many people serve on a typical Sunday? … Even with 10 volunteers, the Saturday texting is the same. That's who the Community plan is for." |
| "Send me some information." | "Happy to. So I send the right thing: what's the one part of Sunday prep you'd most like to stop doing?" Then send exactly that, with the link. |
| "I need to talk to the board / elders." | "Of course. Would it help to start the free trial so you have something real to show them? Nothing is charged, and there's a money-back guarantee if they say no after you pay." |
| "Is our data safe?" | "Yes. It's private to your church, you can export all of it any time, and we never sell or share it. The privacy policy is on the site in plain words." |

---

## 8. Hiring people to help

See [hiring-outreach-help.md](hiring-outreach-help.md): what to ask for in field reps, Upwork/Fiverr search terms for cold callers and emailers, interview questions and pay.

---

## 9. Your week

| Day | Do |
|---|---|
| Mon | Build the list for the week (50 churches), pick the 10 to visit. Prep cards and links. |
| Tue–Thu | Visits 10am–3pm (aim for 10–15 doors/day); calls in between; send follow-up emails each evening. |
| Fri | Setup sessions and demos booked earlier in the week. Review the sheet: what objections came up most? Fix the pitch. |
| Daily | 20 personal emails until the cold domain is warmed up. |

Every Friday, look at three numbers: **conversations**, **trials started**, **paid churches**. If conversations are low, do more outreach. If trials are low, the pitch needs work. If paid is low, the trial experience or the price needs work (and the trial emails at days 1, 7, 12 and 14 are already doing their part).
