import { presetTemplates, type PresetTemplate } from "../../lib/presets";

export default function StarterTemplates({
  onSelect
}: {
  onSelect: (template: PresetTemplate) => void;
}) {
  return (
    <div className="w-full">
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
  );
}
