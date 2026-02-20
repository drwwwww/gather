# Gather Architecture

## Overview
Gather is a role-based church coordination platform with a single Supabase backend and two client apps:
- Admin web app (Next.js)
- Mobile app (Expo)

## Monorepo Layout
- apps/web: Admin-first web app
- apps/mobile: Member + service team app
- packages/lib: Shared types, zod schemas, Supabase clients
- packages/ui: Shared UI primitives (optional)
- packages/config: Shared TS/ESLint config
- supabase: SQL migrations and seed data

## Data & Security
- Supabase Postgres stores all data, scoped by church_id.
- Auth via Supabase Auth.
- RLS ensures role-based access per church.
- Helper SQL functions provide role checks and church scoping.

## Notifications
- A server-side dispatcher (Next.js API route) queries upcoming volunteer assignments and writes to notification_log.
- Future integrations: Resend email + Expo push.

## Payments
- Stripe integration placeholder in packages/lib/services/stripe.ts

