import Link from "next/link";
import { Button } from "../ui/button";

export default function ServicePlanEmptyState({
  friendlyDate,
  onGenerate,
  generateDisabled,
  onCopyLast,
  copyDisabled
}: {
  friendlyDate: string;
  onGenerate: () => void;
  generateDisabled?: boolean;
  onCopyLast: () => void;
  copyDisabled?: boolean;
}) {
  return (
    <div className="card p-4 border border-dashed">
      <div className="space-y-4 text-center">
        <div>
          <p className="text-sm text-base-content/60">
            No plan created for {friendlyDate}.
          </p>
          <p className="text-xs mt-1 text-base-content/60">
            Start with a preset or reuse last week.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="primary" onClick={onGenerate} disabled={generateDisabled}>
            Generate from preset
          </Button>
          <Button variant="secondary" onClick={onCopyLast} disabled={copyDisabled}>
            Copy last plan
          </Button>
        </div>
        <Link href="/admin/service-presets" className="inline-flex items-center justify-center h-[34px] px-3 rounded-xl font-medium text-sm bg-transparent text-[var(--primary)] border-0 hover:bg-[var(--surface-2)] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2">
          Manage presets
        </Link>
      </div>
    </div>
  );
}
