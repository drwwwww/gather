import { presetTemplates, type PresetTemplate } from "../../lib/presets";

export default function StarterTemplates({
  onSelect
}: {
  onSelect: (template: PresetTemplate) => void;
}) {
  return (
    <div className="card p-4 border border-dashed">
      <div className="space-y-4 text-center">
        <div>
          <p className="text-sm text-[var(--gather-muted)]">No service presets yet.</p>
          <p className="text-xs text-[var(--gather-muted)] mt-1">Create your first run-of-show template.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {presetTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className="btn btn-outline btn-sm min-w-[180px]"
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
