import Link from "next/link";
import { ListPlus } from "lucide-react";
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
        <ListPlus className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No plan created for {friendlyDate}</p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Start with a preset or reuse last week.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        <Button variant="primaryGradient" onClick={onGenerate} disabled={generateDisabled}>
          Generate from preset
        </Button>
        <Button variant="secondary" onClick={onCopyLast} disabled={copyDisabled}>
          Copy last plan
        </Button>
      </div>
      <Link href="/admin/service-presets" className="inline-flex items-center justify-center h-[34px] px-3 rounded-xl font-medium text-sm bg-transparent text-[var(--primary)] border-0 hover:bg-[var(--surface-2)] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 mt-2">
        Manage presets
      </Link>
    </div>
  );
}
