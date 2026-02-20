"use client";

import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

type JoinQrCodeCardProps = {
  joinLink: string;
  qrUrl: string;
  onCopyLink: () => void;
};

export default function JoinQrCodeCard({ joinLink, qrUrl, onCopyLink }: JoinQrCodeCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Join QR Code</CardTitle>
        <span className="text-xs text-[var(--gather-muted)]">Scan to join</span>
      </div>
      <div className="mt-4 space-y-3">
        {qrUrl ? (
          <div className="flex items-center justify-center rounded-xl bg-base-100 p-4">
            <img src={qrUrl} alt="Join code QR" className="h-40 w-40" />
          </div>
        ) : null}
        <Input value={joinLink} readOnly />
        <Button variant="outline" onClick={onCopyLink}>Copy Join Link</Button>
      </div>
    </Card>
  );
}
