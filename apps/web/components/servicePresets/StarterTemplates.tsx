import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { presetTemplates, type PresetTemplate } from "../../lib/presets";

export default function StarterTemplates({
  onSelect
}: {
  onSelect: (template: PresetTemplate) => void;
}) {
  return (
    <Card className="border-dashed">
      <div className="space-y-4 text-center">
        <div>
          <p className="text-sm text-[var(--gather-muted)]">No service presets yet.</p>
          <p className="text-xs text-[var(--gather-muted)] mt-1">Create your first run-of-show template.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {presetTemplates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              size="sm"
              onClick={() => onSelect(template)}
            >
              {template.name}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
