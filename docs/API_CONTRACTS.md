# API Contracts

## Supabase Tables
- churches
- profiles
- ministries
- service_times
- volunteer_roles
- volunteer_assignments
- announcements
- events
- event_rsvps
- notification_log

## Shared Schemas
See packages/lib/src/schemas for zod validation schemas.

## Notification Dispatcher
POST /api/notifications/dispatch
- Body (optional): { lookaheadHours?: number }
- Returns: { dispatched: number }

