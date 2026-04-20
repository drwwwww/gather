"use client";

import { useEffect, useState } from "react";
import { PageGrid, PageGridFull } from "../../../../components/layout/PageGrid";

function getTokenValues() {
  const root = document.documentElement;
  return {
    bg: getComputedStyle(root).getPropertyValue("--bg"),
    surface: getComputedStyle(root).getPropertyValue("--surface"),
    surface2: getComputedStyle(root).getPropertyValue("--surface-2"),
    border: getComputedStyle(root).getPropertyValue("--border"),
    ink: getComputedStyle(root).getPropertyValue("--ink"),
    muted: getComputedStyle(root).getPropertyValue("--muted"),
    primary: getComputedStyle(root).getPropertyValue("--primary"),
  };
}

export default function TokenDebugPage() {
  const [tokens, setTokens] = useState<Record<string, string>>({});
  useEffect(() => {
    setTokens(getTokenValues());
  }, []);
  return (
    <PageGrid>
      <PageGridFull>
    <div className="max-w-lg mx-auto w-full p-8 rounded-xl shadow-lg bg-[var(--surface)]">
      <h2 className="text-xl font-bold mb-4 text-[var(--ink)]">Theme Token Debug</h2>
      <div className="mb-6">
        <button
          className="px-4 py-2 rounded-lg font-semibold bg-[var(--primary)] text-[var(--surface)] shadow"
          onClick={() => setTokens(getTokenValues())}
        >
          Refresh Token Values
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left py-2 text-[var(--muted)]">Token</th>
            <th className="text-left py-2 text-[var(--muted)]">Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(tokens).map(([key, value]) => (
            <tr key={key} className="border-b border-[var(--border)]">
              <td className="py-2 text-[var(--ink)] font-mono">--{key}</td>
              <td className="py-2 text-[var(--ink)] font-mono">{value.trim() || <span className="text-red-600">(empty)</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
      </PageGridFull>
    </PageGrid>
  );
}
