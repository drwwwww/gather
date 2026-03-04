import Link from "next/link";

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
    <div className="card bg-base-100 shadow-md p-4 rounded-xl border-dashed">
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
          <button className="btn btn-primary" onClick={onGenerate} disabled={generateDisabled}>
            Generate from preset
          </button>
          <button className="btn btn-outline" onClick={onCopyLast} disabled={copyDisabled}>
            Copy last plan
          </button>
        </div>
        <Link className="btn btn-ghost btn-sm text-primary" href="/admin/service-presets">
          Manage presets
        </Link>
      </div>
    </div>
  );
}
