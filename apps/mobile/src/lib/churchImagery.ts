/**
 * Shared church photography used as fallback art wherever real content
 * (an event or announcement) has no `image_url` of its own.
 *
 * Every image here is deliberately **landscape** (1400x800, ~1.75:1) and
 * subject-filling. An earlier set used portrait sources, which looked fine as
 * square thumbnails but collapsed into a thin band of blank wall or sky once
 * cropped into the wide, short cards these are actually used in — so new art
 * added here must be landscape and must read at a glance when cropped short.
 *
 * Unsplash licensed (free commercial use); see apps/web/public/images/CREDITS.md
 * for the wider set. Photo ids:
 *   worship-hands         photo-1582213782179-e0d53f98f2ca
 *   congregation-service  photo-1491438590914-bc09fcaaf77a
 *   welcome-embrace       photo-1565813086292-604790c8a97b
 *   sanctuary-pews        photo-1525104171570-308e54169ae1
 *
 * worship-hands and congregation-service were replaced (2026-09) — the
 * originals were technically landscape but not actually subject-filling:
 * worship-hands had a large near-black dead zone on one side, and
 * congregation-service was a wide fisheye interior shot whose "interesting"
 * content (the congregation) was a thin band dwarfed by ceiling/aisle space.
 * Both loaded fine but rendered as a near-solid tile or a stray architectural
 * detail once cropped into the Browse tiles. Caught by actually rendering the
 * app (via `expo start --web`) and looking, not by re-reading the source
 * files — file-level checks (dimensions, orientation) can't catch "technically
 * landscape but has nothing worth cropping to."
 *
 * Fallbacks are picked deterministically from the record's id, so a given
 * event or announcement always shows the same image rather than a new random
 * one on every re-render.
 */

export const WORSHIP_HANDS = require("../../assets/tiles/worship-hands.jpg");
export const CONGREGATION_SERVICE = require("../../assets/tiles/congregation-service.jpg");
export const WELCOME_EMBRACE = require("../../assets/tiles/welcome-embrace.jpg");
export const SANCTUARY_PEWS = require("../../assets/tiles/sanctuary-pews.jpg");

export const EVENT_FALLBACKS = [
  WORSHIP_HANDS,
  CONGREGATION_SERVICE,
  SANCTUARY_PEWS,
  WELCOME_EMBRACE,
] as const;

export const NEWS_FALLBACKS = [
  CONGREGATION_SERVICE,
  WELCOME_EMBRACE,
  WORSHIP_HANDS,
  SANCTUARY_PEWS,
] as const;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function eventFallback(id: string) {
  return EVENT_FALLBACKS[hashId(id) % EVENT_FALLBACKS.length];
}

export function newsFallback(id: string) {
  return NEWS_FALLBACKS[hashId(id) % NEWS_FALLBACKS.length];
}
