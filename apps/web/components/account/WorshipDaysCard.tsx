"use client";

import { useState } from "react";

const DAYS = [
  { short: "Sun", full: "Sunday",    index: 0 },
  { short: "Mon", full: "Monday",    index: 1 },
  { short: "Tue", full: "Tuesday",   index: 2 },
  { short: "Wed", full: "Wednesday", index: 3 },
  { short: "Thu", full: "Thursday",  index: 4 },
  { short: "Fri", full: "Friday",    index: 5 },
  { short: "Sat", full: "Saturday",  index: 6 },
];

export default function WorshipDaysCard({
  worshipDays,
  onSave,
}: {
  worshipDays: number[];
  onSave: (days: number[]) => void;
}) {
  const [draft, setDraft] = useState<number[]>(worshipDays);
  const changed = JSON.stringify([...draft].sort()) !== JSON.stringify([...worshipDays].sort());

  const toggle = (day: number) => {
    setDraft((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const selectedLabels = DAYS.filter((d) => draft.includes(d.index)).map((d) => d.full);

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Worship days</h2>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">
          Which days of the week does your church hold services?
        </p>
      </div>

      {/* Day toggles */}
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map(({ short, full, index }) => {
          const active = draft.includes(index);
          return (
            <button
              key={index}
              type="button"
              title={full}
              onClick={() => toggle(index)}
              className={`flex flex-col items-center rounded-xl border py-2.5 text-xs font-bold transition-colors ${
                active
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-amber-200 hover:bg-amber-50/50 hover:text-amber-700"
              }`}
            >
              {short}
            </button>
          );
        })}
      </div>

      {/* Summary + save */}
      <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
        <p className="text-xs text-[var(--text-muted)]">
          {selectedLabels.length > 0
            ? selectedLabels.join(", ")
            : "No days selected"}
        </p>
        <button
          type="button"
          disabled={!changed}
          onClick={() => onSave(draft)}
          className="btn btn-primary-gradient btn-sm"
        >
          Save
        </button>
      </div>
    </div>
  );
}
