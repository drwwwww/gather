"use client";

import { useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import SelectMenu from "../ui/SelectMenu";
import { downloadCsv } from "../../lib/csv";

/**
 * Import people from a spreadsheet: CSV from Excel, Google Sheets, Planning
 * Center, Breeze, Church Community Builder… Columns are matched by header name,
 * so the export doesn't need reshaping. Rows go to /api/people/import in chunks.
 */
type Row = { full_name: string; email: string; phone: string; role: "MEMBER" | "SERVICE" };
type Result = { email: string; outcome: "added" | "already_here" | "has_account" | "invalid" | "failed"; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHUNK = 50;

/** RFC 4180-ish: quoted fields, escaped quotes, commas/newlines inside quotes, ; or tab separators. */
function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const sep = [",", ";", "\t"].reduce((best, s) => (firstLine.split(s).length > firstLine.split(best).length ? s : best), ",");
  const out: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim())) out.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) out.push(row);
  return out;
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");

function toRows(table: string[][], defaultRole: Row["role"]): Row[] {
  if (table.length < 2) return [];
  const head = table[0].map(norm);
  const find = (...names: string[]) => head.findIndex((h) => names.includes(h));
  const iName = find("name", "fullname", "displayname", "membername", "person");
  const iFirst = find("firstname", "first", "givenname", "preferredname", "nickname");
  const iLast = find("lastname", "last", "surname", "familyname");
  const iEmail = find("email", "emailaddress", "primaryemail", "homeemail", "personalemail", "email1");
  const iPhone = find("phone", "mobile", "mobilephone", "cell", "cellphone", "phonenumber", "primaryphone", "homephone");
  const iRole = find("role", "team", "serving", "volunteer", "servicetea");
  return table.slice(1).map((r) => {
    const get = (i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
    const name = get(iName) || [get(iFirst), get(iLast)].filter(Boolean).join(" ");
    const roleCell = norm(get(iRole));
    const role: Row["role"] = !roleCell
      ? defaultRole
      : /service|volunteer|team|yes|true|serving/.test(roleCell) ? "SERVICE" : "MEMBER";
    return { full_name: name, email: get(iEmail).toLowerCase(), phone: get(iPhone), role };
  });
}

const OUTCOME_LABEL: Record<Result["outcome"], string> = {
  added: "Added",
  already_here: "Already in your church",
  has_account: "Has a Gather account",
  invalid: "Invalid email",
  failed: "Couldn't add",
};

export default function ImportPeopleCard({ onImported }: { onImported?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [table, setTable] = useState<string[][]>([]);
  const [defaultRole, setDefaultRole] = useState<Row["role"]>("MEMBER");
  const [sendInvites, setSendInvites] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => toRows(table, defaultRole), [table, defaultRole]);
  const unique = useMemo(() => {
    const seen = new Set<string>();
    return rows.filter((r) => EMAIL_RE.test(r.email) && !seen.has(r.email) && seen.add(r.email));
  }, [rows]);
  const skipped = rows.length - unique.length;
  const hasEmailColumn = rows.some((r) => r.email);

  const reset = () => {
    setTable([]); setFileName(""); setResults(null); setError(null); setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    reset();
    setFileName(file.name);
    if (!/\.(csv|txt|tsv)$/i.test(file.name)) {
      setError("Save the spreadsheet as CSV first (File → Download → CSV in Google Sheets, or Save As → CSV in Excel).");
      return;
    }
    setTable(parseCsv(await file.text()));
  };

  const runImport = async () => {
    setBusy(true); setError(null); setProgress(0);
    const all: Result[] = [];
    try {
      for (let i = 0; i < unique.length; i += CHUNK) {
        const res = await fetch("/api/people/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: unique.slice(i, i + CHUNK), sendInvites }),
        });
        const data = (await res.json().catch(() => ({}))) as { results?: Result[]; error?: string };
        if (!res.ok) throw new Error(data.error || "The import stopped. Try again.");
        all.push(...(data.results ?? []));
        setProgress(Math.min(unique.length, i + CHUNK));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "The import stopped. Try again.");
    } finally {
      setResults(all);
      setBusy(false);
      if (all.some((r) => r.outcome === "added")) onImported?.();
    }
  };

  const added = results?.filter((r) => r.outcome === "added").length ?? 0;
  const notAdded = results?.filter((r) => r.outcome !== "added") ?? [];

  return (
    <div className="stitch-section-card space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--area-blue-tint)]">
          <FileSpreadsheet className="h-5 w-5 text-[var(--area-blue-ink)]" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Import from a spreadsheet</h2>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            Bring your whole church in at once from Excel, Google Sheets, Planning Center, Breeze or any CSV. We match
            the columns for you: name (or first + last), email, phone, and optionally role.
          </p>
        </div>
      </div>

      {results ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <b>{added}</b> {added === 1 ? "person" : "people"} added{sendInvites && added > 0 ? " and emailed a link to set their password" : ""}.
          </div>
          {notAdded.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">{notAdded.length} not added</p>
              <ul className="max-h-56 list-none space-y-1 overflow-auto rounded-xl border border-[var(--border)] p-2">
                {notAdded.map((r) => (
                  <li key={r.email} className="flex justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--surface-2)]">
                    <span className="truncate text-[var(--text-primary)]">{r.email || "(no email)"}</span>
                    <span className="shrink-0 text-[var(--text-muted)]">{r.message || OUTCOME_LABEL[r.outcome]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="button" onClick={reset} className="btn btn-secondary">Import another file</button>
        </div>
      ) : (
        <>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); void onFile(e.dataTransfer.files?.[0]); }}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--outline-variant)] bg-[var(--surface-2)] px-4 py-8 text-center transition-colors hover:border-[var(--text-muted)] hover:bg-[var(--surface)]"
          >
            <Upload className="h-5 w-5 text-[var(--text-muted)]" aria-hidden />
            <span className="text-sm font-medium text-[var(--text-primary)]">{fileName || "Drop a CSV here, or click to choose"}</span>
            <span className="text-xs text-[var(--text-muted)]">Up to 2,000 people per file</span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.txt,text/csv"
              className="sr-only"
              aria-label="Choose a CSV file to import"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </label>
          <button
            type="button"
            onClick={() => downloadCsv("gather-import-template.csv", [["Name", "Email", "Phone", "Role"], ["Jane Smith", "jane@example.com", "(555) 123-4567", "Service team"], ["Sam Lee", "sam@example.com", "", "Member"]])}
            className="text-xs font-medium text-[var(--text-secondary)] underline underline-offset-4 transition-colors hover:text-[var(--text-primary)]"
          >
            Download a template
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {table.length > 0 && !hasEmailColumn && (
            <p className="text-sm text-red-600">We couldn&apos;t find an email column. Make sure the first row has a header called “Email”.</p>
          )}

          {unique.length > 0 && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--surface-2)] text-xs text-[var(--text-muted)]">
                    <tr><th className="px-3 py-2 font-medium">Name</th><th className="px-3 py-2 font-medium">Email</th><th className="hidden px-3 py-2 font-medium sm:table-cell">Role</th></tr>
                  </thead>
                  <tbody>
                    {unique.slice(0, 5).map((r) => (
                      <tr key={r.email} className="border-t border-[var(--divider)]">
                        <td className="px-3 py-2 text-[var(--text-primary)]">{r.full_name || "—"}</td>
                        <td className="truncate px-3 py-2 text-[var(--text-secondary)]">{r.email}</td>
                        <td className="hidden px-3 py-2 text-[var(--text-secondary)] sm:table-cell">{r.role === "SERVICE" ? "Service team" : "Member"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-[var(--divider)] px-3 py-2 text-xs text-[var(--text-muted)]">
                  {unique.length} {unique.length === 1 ? "person" : "people"} ready{unique.length > 5 ? ` · showing 5` : ""}
                  {skipped > 0 ? ` · ${skipped} skipped (no valid email or a duplicate)` : ""}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SelectMenu
                  value={defaultRole}
                  onChange={(v) => setDefaultRole(v as Row["role"])}
                  ariaLabel="Role for rows without one"
                  prefix="No role column →"
                  options={[
                    { value: "MEMBER", label: "Member" },
                    { value: "SERVICE", label: "Service team" },
                  ]}
                />
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]">
                  <input type="checkbox" checked={sendInvites} onChange={(e) => setSendInvites(e.target.checked)} className="h-4 w-4 accent-amber-500" />
                  Email each person a link to set their password
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button type="button" disabled={busy || unique.length > 2000} onClick={runImport} className="btn btn-primary inline-flex items-center gap-2">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {busy ? `Adding ${progress} of ${unique.length}…` : `Add ${unique.length} ${unique.length === 1 ? "person" : "people"}`}
                </button>
                <button type="button" onClick={reset} disabled={busy} className="btn btn-ghost inline-flex items-center gap-1.5">
                  <X className="h-4 w-4" /> Clear
                </button>
              </div>
              {unique.length > 2000 && <p className="text-sm text-red-600">That&apos;s more than 2,000 people — split the file in two.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
