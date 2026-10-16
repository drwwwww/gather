# Security incident response (one page)

Gather holds names, emails, phone numbers and photos for whole congregations. The DPA promises churches notice **within 72 hours of confirming** an incident that affects their data. Every US state has its own breach-notification law; most require notice "without unreasonable delay" when names are exposed alongside sensitive data. Contact info alone often isn't legally reportable, but tell churches anyway.

## 1. Contain (first hour)
- **Leaked service-role key or Supabase compromise:** rotate the key in Supabase → Settings → API, then update `SUPABASE_SERVICE_ROLE_KEY` in Vercel and redeploy.
- **Leaked third-party key** (Brevo, Stripe, Sentry, Expo): rotate it in that dashboard, then in Vercel env and EAS (`eas env:update`).
- **Abused account:** set `profiles.disabled = true`, or delete the auth user.
- **Bad RLS policy:** fix it with a migration applied via `npx supabase db query --linked -f …` (not `db push`, because migration history is out of sync).

## 2. Assess (same day)
- Which churches and which data? Supabase logs (Auth, API, Postgres) and Vercel function logs.
- Write a timeline: when it started, when you found it, and what you've done.

## 3. Notify (within 72 hours of confirming)
- Email every affected church's admins: what happened, what data, what you did, what they should do. Offer to help them tell members.
- If passwords may be affected: force a password reset (Supabase Auth → users).
- If an attorney or insurer is involved, call them **before** notifying, so the wording is right.

## 4. Afterwards
- Fix the root cause, and add a test or check that would have caught it.
- Keep a short written record of the incident for at least 3 years.

## Contacts
- Supabase support: dashboard → Support
- Vercel support: vercel.com/help
- Your cyber-liability insurer (once you have one; see the to-do list)
