# Landing page background videos

The marketing pages look for these three files. They are **optional** — if a
file is absent, `MediaBackdrop` keeps showing the poster image with a slow
drift, so the page never breaks.

| File | Used by | Poster fallback |
|---|---|---|
| `worship-hero.mp4` | Landing hero | `/people.jpg` |
| `worship-wide.mp4` | "How it works" band | `/green-liu-…unsplash.jpg` |
| `worship-close.mp4` | Final call to action | `/events.jpg` |

## Encoding targets

Background video is decoration, not content — it is muted, looped, and sits
under a dark scrim, so it can be compressed hard.

- **Resolution:** 1920×1080 (not 4K — it is scaled down and scrimmed anyway)
- **Length:** 8–15 seconds, cut so the loop point is not jarring
- **Bitrate:** aim for **2–4 MB per file**, and never above 6 MB
- **Codec:** H.264 High profile, `-movflags +faststart` so it streams
- **Audio:** strip it entirely (`-an`) — the element is muted regardless

```bash
ffmpeg -i source.mov \
  -vf "scale=1920:-2,fps=30" \
  -c:v libx264 -profile:v high -crf 30 -preset slow \
  -movflags +faststart -an \
  worship-hero.mp4
```

## Why not the existing 4K clip

`public/12470263_3840_2160_30fps.mp4` is **85 MB**. Loading that in a hero
would dominate the page weight and wreck Largest Contentful Paint. Compress it
to the targets above before using it, or leave it out — the posters carry the
page on their own.

## How loading is gated

`components/marketing/MediaBackdrop.tsx` only attaches a video source when all
of these hold, so phones and metered connections download nothing:

- viewport is 768px or wider
- `prefers-reduced-motion` is not set
- the browser does not report `saveData` or a 2G connection
