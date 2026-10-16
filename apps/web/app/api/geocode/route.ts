import { NextResponse } from "next/server";
import { getRequestUser } from "../../../lib/apiAuth";

/**
 * Geocodes a free-text address to lat/lng via OpenStreetMap's Nominatim
 * (no API key required). Used only when an admin saves a church address, to
 * back the "nearby churches" event search on mobile. Best-effort: on any
 * failure we return nulls rather than blocking the save.
 */
export async function POST(req: Request) {
  // Signed-in callers only, so this isn't an open proxy that gets our
  // Nominatim User-Agent rate-limited or banned.
  if (!(await getRequestUser(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { address } = (await req.json().catch(() => ({}))) as { address?: string };
  const trimmed = address?.trim();
  if (!trimmed) {
    return NextResponse.json({ latitude: null, longitude: null });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "GatherChurchApp/1.0 (support@gatherministry.online)" },
    });
    if (!res.ok) return NextResponse.json({ latitude: null, longitude: null });
    const results = (await res.json()) as { lat: string; lon: string }[];
    const first = results[0];
    if (!first) return NextResponse.json({ latitude: null, longitude: null });
    return NextResponse.json({ latitude: parseFloat(first.lat), longitude: parseFloat(first.lon) });
  } catch {
    return NextResponse.json({ latitude: null, longitude: null });
  }
}
