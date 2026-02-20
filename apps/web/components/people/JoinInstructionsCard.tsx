"use client";

import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";

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
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Join Instructions</CardTitle>
        <span className="text-xs text-[var(--gather-muted)]">Share with members</span>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <p className="text-[var(--gather-muted)]">
          Share this church code with members, then have them enter it in the Gather app.
        </p>
        <div className="rounded-xl bg-base-100 p-3 text-center text-lg font-semibold">
          {churchSlug}
        </div>
        <Button variant="outline" onClick={onOpenPrintable}>Open printable page</Button>
        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>
    </Card>
  );
}
