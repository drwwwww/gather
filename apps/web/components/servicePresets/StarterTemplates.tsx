import { Sparkles } from "lucide-react";
import { presetTemplates, type PresetTemplate } from "../../lib/presets";

export default function StarterTemplates({ onSelect }: { onSelect: (template: PresetTemplate) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Start from a template</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {presetTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className="group flex flex-col items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-all duration-150 hover:border-amber-300 hover:bg-amber-50 motion-safe:hover:-translate-y-0.5 active:translate-y-0"
          >
            <p className="text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-amber-800">
              {template.name}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {template.steps.length} {template.steps.length === 1 ? "step" : "steps"}
              {template.steps.length > 0 ? ` · ${template.steps.slice(0, 2).map((s) => s.title).join(", ")}${template.steps.length > 2 ? "…" : ""}` : ""}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
