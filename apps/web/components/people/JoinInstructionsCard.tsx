"use client";

// DaisyUI migration: use className markup for all UI

type JoinInstructionsCardProps = {
  churchSlug: string;
  onOpenPrintable: () => void;
  error?: string | null;
};

export default function JoinInstructionsCard({
  churchSlug,
  onOpenPrintable,
  error
}: JoinInstructionsCardProps) {
    return (
      <div className="card bg-base-100 shadow-md p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="card-title text-lg font-semibold">Join Instructions</div>
          <span className="text-xs text-base-content/60">Share with members</span>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <p className="text-base-content/60">
            Share this church code with members, then have them enter it in the Gather app.
          </p>
          <div className="rounded-xl bg-base-100 p-3 text-center text-lg font-semibold">
            {churchSlug}
          </div>
          <button className="btn btn-outline" onClick={onOpenPrintable}>Open printable page</button>
          {error ? <p className="text-sm text-error">{error}</p> : null}
        </div>
      </div>
    );
}
