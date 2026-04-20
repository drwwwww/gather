# Gather Dashboard — UI Dossier for Exact Replica
_Generated for base44. Everything needed to reproduce the dashboard pixel-for-pixel._

---

## 1. Typography

| Token | Value |
|-------|-------|
| Font family | `'Rubik', Arial, sans-serif` (Google Fonts) |
| Base font size | 16px |
| Page title | `20px / 600 / tracking-tight` |
| Card title | `16px / 600` |
| Body | `14–15px / 400` |
| Small / meta | `12–13px / 400` |
| Caps label | `11px / 500 / letter-spacing 0.2em / uppercase` |

---

## 2. Color Tokens

All colors are CSS custom properties on `:root`.

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `oklch(98.6% 0.002 67.8)` ≈ `#FAFAF9` | Page background |
| `--surface` | `oklch(96% 0.002 17.2)` ≈ `#F4F3F1` | Subtle surface (empty states, rows) |
| `--surface-2` | `oklch(92.2% 0.005 34.3)` ≈ `#ECEAE6` | Hover state, deeper surface |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#111827` | Headings, bold values |
| `--text-secondary` | `#4b5563` | Body text, labels |
| `--text-muted` | `#9ca3af` | Placeholders, meta, subtitles |

### Brand / Accent
| Token | Value | Hex approx | Usage |
|-------|-------|------------|-------|
| `--primary` | `oklch(82.8% 0.189 84.429)` | `#F59E0B` amber | Primary buttons, highlights |
| `--primary-hover` | `oklch(76.9% 0.188 70.08)` | `#D97706` | Button hover |
| `--primary-soft` | `oklch(96.2% 0.059 95.617)` | `#FEF3C7` | Soft amber background |

### Status
| Token | Value | Hex approx | Usage |
|-------|-------|------------|-------|
| `--success` | `oklch(72.3% 0.219 149.579)` | `#4ADE80` green | Confirmed badge bg |
| `--warning` | `oklch(70.5% 0.213 47.604)` | `#FB923C` orange | Assigned/awaiting badge |
| `--danger` | `oklch(57.7% 0.245 27.325)` | `#EF4444` red | Declined badge |
| `--info` | `oklch(62.3% 0.214 259.815)` | `#3B82F6` blue | Info badge |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `--border` | `#e5e7eb` | Card borders, table lines |
| `--divider` | `#f1f5f9` | Subtle row dividers |

---

## 3. Shared Component Specs

### Card
```
background:    var(--bg)          ← #FAFAF9
border-radius: 25px               ← var(--radius-box)
border:        1px solid #e5e7eb  ← var(--border)
overflow:      visible
```
Cards typically add `shadow-sm` (Tailwind: `box-shadow: 0 1px 2px rgba(0,0,0,0.05)`) and `p-6` (24px padding).

**Card title** inside cards:
```
font-size:   16px
font-weight: 600
color:       #111827
```

### Badge
```
display:       inline-flex
align-items:   center
height:        24px
padding:       0 12px
border-radius: 9999px (pill)
font-size:     12px
font-weight:   600
```
Variant colors:
| Variant | Text | Background |
|---------|------|------------|
| `neutral` | `--text-secondary` (#4b5563) | `--surface-2` (#ECEAE6) |
| `success` | `--success` (~#4ADE80) | `color-mix(in srgb, --success 16%, transparent)` |
| `warning` | `--warning` (~#FB923C) | `color-mix(in srgb, --warning 16%, transparent)` |
| `danger` | `--danger` (~#EF4444) | `color-mix(in srgb, --danger 16%, transparent)` |
| `info` | `--info` (~#3B82F6) | `color-mix(in srgb, --info 16%, transparent)` |

### Button
```
height:        40px  (sm: 34px)
padding:       0 16px (sm: 0 12px)
border-radius: 12px  (sm: 10px)
font-size:     14px  (sm: 13px)
font-weight:   600
```
| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| `btn-primary` | `--primary` amber | `#ffffff` | none |
| `btn-secondary` | `#ffffff` | `--text-primary` | `1px solid --border` |
| `btn-ghost` | transparent | `--text-secondary` | none |
| `btn-danger` | `#dc2626` | `#ffffff` | none |

### Empty State (reused across all cards)
```
Container:  rounded-2xl (16px), border-2 border-dashed, border-color --border,
            background --surface, px-24 py-32, text-center, flex-col items-center, gap-12
Icon circle: h-40 w-40, rounded-full, background --surface-2
Icon:        h-20 w-20, color --text-muted
Title:       14px / 500, color --text-primary
Subtitle:    14px / 400, margin-top 4px, color --text-muted
CTA button:  btn-primary btn-sm, margin-top 8px
```

### Table (inside cards)
```
Container:  overflow-hidden, rounded-2xl (16px), border 1px solid --border
<th>:       text-xs (11px), font-medium, uppercase, letter-spacing 0.05em,
            color --text-muted, padding 12px 16px
<td>:       font-size 14px, padding 12px 16px, color --text-primary
<tr> hover: background --surface-2, transition 160ms
```

### Row item (list-style cards in Pending / Activity / Announcements)
```
Container:  rounded-xl (12px), border 1px solid --border,
            background --surface, padding 12px (p-3)
Title:      14px / 500, color --text-primary
Subtitle:   12px / 400, color --text-muted
```

---

## 4. Dashboard Page Layout

### Grid system
The page uses a two-column responsive grid:

```
<PageGrid>                      ← max-w-7xl, mx-auto, px-4–6, gap-y-4–5
  <PageGridFull>                ← col-span-full (100%)
    Header, Hero card, VenusAccentStrip (3 image cards)
  </PageGridFull>

  <PageGridRowTwoOne>           ← 2/3 + 1/3 split on md+
    main (left 2/3):
      NextServiceTeamCard
      PendingConfirmationsCard
      2-col sub-row:
        RecentActivityCard
        UpcomingEventsCard

    side (right 1/3):
      RosterDonutCard
      LatestAnnouncementsCard
  </PageGridRowTwoOne>
</PageGrid>
```

---

## 5. Component Descriptions

### A. Header
```
"Welcome back, [Name]"   — 20px / 600 / tracking-tight / --text-primary
"Weekly operations overview"  — 14px / 400 / --text-muted
```

---

### B. Hero Card — Next Service
Full-width card. White background, 25px radius, shadow-sm.

```
Top label:   "NEXT SERVICE"  11px / 500 / uppercase / letter-spacing 0.2em / --text-muted
Main text:   Next service date/time  24–30px / 600 / tracking-tight / --text-primary
             e.g. "Sunday, Apr 13 · 10:00 AM"
Meta row:    Clock icon + countdown text + MapPin icon + church address
             14px / --text-muted, icons 16×16
Status line: "N open slots · N pending confirmations"  14px / --text-secondary
Actions:     [View plan] btn-secondary btn-sm   [Volunteers] btn-primary btn-sm
             Right-aligned on desktop, stacked on mobile
```

---

### C. Venus Accent Strip — 3 Image Cards
Three equal-width clickable cards in a row (stack on mobile).

Each card:
```
Image area:  170px tall, object-cover, rounded-top 25px, overflow-hidden
             Hover: image scales to 1.02
Text area:   background --bg, border-top 1px --border, padding 16px,
             rounded-bottom 25px
Card title:  14px / 600 / --text-primary
Description: 14px / 400 / --text-muted, margin-top 4px
Card hover:  scale(1.02), border-color stays --border
```
Three entries: "Volunteer schedule" → /volunteers, "Events calendar" → /events, "People" → /people

---

### D. Next Service Team Card
Left column, first card.

```
Card header row:
  Title: "Next Service Team"  16px / 600
  Date label: e.g. "Sunday, Apr 13"  12px / 500 / --text-muted  (right-aligned)

Table columns: ROLE | ASSIGNED | STATUS
Status badge variants: CONFIRMED→success, ASSIGNED→warning, OPEN/other→neutral

Empty state: Users icon, "No team assigned", "Generate this week's schedule.", [Schedule volunteers] btn-primary
```

---

### E. Pending Responses Card
Left column, second card.

```
Card header row:
  Title: "Pending Responses"  16px / 600
  [Resolve assignments] btn-primary btn-sm  (only shown when items exist)

Each item row (rounded-xl surface border):
  Left:  Role name (14px / 500 / --text-primary)
         Assignee name (12px / 400 / --text-muted)
  Right: Badge  DECLINED→danger, ASSIGNED→neutral

Empty state: UserCheck icon, "All caught up", "No pending responses for this service."
```

---

### F. Recent Activity Card  (bottom-left of 2-col sub-row)
```
Title: "Recent Activity"  16px / 600, mb-4
Each item: rounded-xl surface-bg border card, 14px / 500 / --text-primary, p-3
Empty state: Activity icon, "No recent activity", "Actions will show here as your team responds."
```

---

### G. Upcoming Events Card  (bottom-right of 2-col sub-row)
```
Header:  Title "Upcoming Events" + [View all events] btn-secondary btn-sm
Table columns: NAME | DATE | STATUS
Date format: "Apr 13" (short)
Status badge: always neutral, shows "N RSVP"
Empty state: Calendar icon, "No upcoming events", "Get started by creating a new event.", [Create event] btn-primary
```

---

### H. Roster Donut Card  (right sidebar, first)
SVG donut chart, 240×240px.

**Ring geometry:**
```
Outer radius:  106px
Inner radius:  58px
Ring width:    48px  (≈ 45% of outer — thick like Chart 1)
Cap radius:    24px  (semicircular rounded ends on each segment)
Gap:           9°    (angular gap between segments)
```

**Segment colours (radial gradient, light→dark):**
| Segment | Light | Dark |
|---------|-------|------|
| Confirmed | `#bbf7d0` | `#22c55e` |
| Awaiting reply | `#bae6fd` | `#0ea5e9` |
| Open slots | `#fef3c7` | `#f59e0b` |
| Declined | `#fecaca` | `#ef4444` |

Gradient: `radialGradient`, `gradientUnits="userSpaceOnUse"`, focal point at upper-left `(54, 54)`, radius `148px`. All segments share the same light source.

**Centre text:**
```
Count:  32px / 600 / #454459
Label:  "roles"  11px / 400 / #9ca3af
```

**Inner disc:**
```
White fill circle, radius 52px
Stroke circle: 1.5px / #e8e8e8 at radius 53px
```

**Legend below ring:**
Coloured dot (10×10 rounded-full, dark shade) · label (14px --text-secondary) · count (14px / 600 / right-aligned).
Order: Confirmed, Awaiting reply, Open slots, Declined.

**Segment sizing:** proportional to data — `(value / total) × 360°`.

---

### I. Latest Announcements Card  (right sidebar, second)
```
Title: "Latest Announcements"  16px / 600, mb-4
Each item row (rounded-xl surface border p-3):
  Left:  Announcement title (14px / 500 / --text-primary)
         Date/time or "Draft" (12px / 400 / --text-muted)
  Right: Badge  Published→success, else→neutral
Empty state: Megaphone icon, "No announcements", "Keep everyone in sync.", [Post announcement]
```

---

## 6. Animations

| Class | Effect |
|-------|--------|
| `animate-fade-in-up` | `opacity 0→1 + translateY(8px→0)`, 400ms ease |
| `[animation-delay:100ms]` | staggered fade for second section |
| `[animation-delay:200ms]` | staggered fade for third section |
| `animate-pulse-subtle` | skeleton loading: opacity 0.6→1→0.6, 1.8s |

---

## 7. Icon Library
**Lucide React** — icons used on dashboard:
`Users`, `UserCheck`, `Calendar`, `Megaphone`, `Activity`, `Clock`, `MapPin`

---

## 8. Sample Data Shape

```jsonc
// Hero
{ nextServiceLabel: "Sunday, Apr 13 · 10:00 AM", openSlots: 2, pendingConfirmations: 3 }

// Next Service Team rows
[{ id: "1", role: "Usher", assignee: "Jim Miller", status: "ASSIGNED" }]

// Pending Responses rows
[{ id: "1", role: "Worship Leader", assignee: "John H.", status: "DECLINED" }]

// Roster donut
{ confirmed: 2, assigned: 4, open: 0, declined: 1 }

// Upcoming Events rows
[{ id: "1", name: "Easter Service", date: "2026-04-19T10:00:00Z", status: "12 RSVP" }]

// Announcements
[{ id: "1", title: "Volunteer Meeting", status: "Scheduled", publishAt: "Apr 12, 10:00 AM" }]

// Recent Activity
["4 volunteers pending confirmation", "1 assignment declined", "2 new members joined this week"]
```

---

## 9. Full Page Hierarchy (text outline)

```
Page  bg: #FAFAF9  font: Rubik
├── Header
│   ├── "Welcome back, [Name]"
│   └── "Weekly operations overview"
│
├── Hero Card (full-width, white, shadow-sm, radius-25)
│   ├── "NEXT SERVICE" label
│   ├── Date + time  (large)
│   ├── Clock + countdown · MapPin + address
│   ├── "N open slots · N pending confirmations"
│   └── [View plan] [Volunteers]
│
├── Venus Strip (3 equal image cards)
│   ├── Volunteer schedule  → /volunteers
│   ├── Events calendar     → /events
│   └── People              → /people
│
├── Main column (left, ~66%)
│   ├── Next Service Team Card
│   │   ├── Title + date label (right)
│   │   └── Table: ROLE | ASSIGNED | STATUS (badges)
│   │
│   ├── Pending Responses Card
│   │   ├── Title + [Resolve assignments]
│   │   └── List rows: role / assignee / badge
│   │
│   └── 2-col row
│       ├── Recent Activity Card  (list of plain-text items)
│       └── Upcoming Events Card  (table: NAME | DATE | STATUS)
│
└── Side column (right, ~33%)
    ├── Roster Donut Card
    │   ├── "Next service roster"
    │   ├── SVG donut ring (240px, thick segments, rounded caps)
    │   │   └── Centre: count + "roles"
    │   └── Legend: ● Confirmed N  ● Awaiting N  ● Open N  ● Declined N
    │
    └── Latest Announcements Card
        └── List rows: title / date / badge
```
