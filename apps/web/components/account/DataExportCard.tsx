"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadBlob } from "../../lib/csv";

/** Everything the church has in Gather, as one JSON file. */
export default function DataExportCard() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportAll = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/export");
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Export failed. Try again.");
      setBusy(false);
      return;
    }
    const name = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "gather-export.json";
    downloadBlob(name, await res.blob());
    setBusy(false);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Export your data</h2>
      <p className="mt-0.5 text-pretty text-xs text-[var(--text-muted)]">
        People, schedules, service plans, announcements, events and RSVPs in one file. It&apos;s your church&apos;s data — take it anywhere.
      </p>
      <div className="mt-auto pt-4">
        <button type="button" onClick={exportAll} disabled={busy} className="btn btn-secondary inline-flex h-9 items-center gap-1.5 px-3 text-sm">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {busy ? "Preparing…" : "Download export"}
        </button>
        {error && <p role="status" className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
