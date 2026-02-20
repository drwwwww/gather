import Link from "next/link";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export default function ServicePlanEmptyState({
  friendlyDate,
  onGenerate,
  onCopyLast,
  generateDisabled,
  copyDisabled
}: {
  friendlyDate: string;
  onGenerate: () => void;
  onCopyLast: () => void;
  generateDisabled?: boolean;
  copyDisabled?: boolean;
}) {
  return (
    <Card
      className="border-dashed"
      style={{
        background: 'var(--gather-surface)',
        borderColor: 'var(--gather-border)',
        color: 'var(--gather-ink)'
      }}
    >
      <div className="space-y-4 text-center">
        <div>
          <p className="text-sm" style={{ color: 'var(--gather-muted)' }}>
            No plan created for {friendlyDate}.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--gather-muted)' }}>
            Start with a preset or reuse last week.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={onGenerate} disabled={generateDisabled}>
            Generate from preset
          </Button>
          <Button variant="outline" onClick={onCopyLast} disabled={copyDisabled}>
            Copy last plan
          </Button>
        </div>
        <Link
          className="btn btn-ghost btn-sm"
          href="/admin/service-presets"
          style={{ color: 'var(--gather-accent)' }}
        >
          Manage presets
        </Link>
      </div>
    </Card>
  );
}
