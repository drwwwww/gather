"use client";

// DaisyUI migration: use className markup for all UI

type JoinQrCodeCardProps = {
  joinLink: string;
  qrUrl: string;
  onCopyLink: () => void;
};

export default function JoinQrCodeCard({ joinLink, qrUrl, onCopyLink }: JoinQrCodeCardProps) {
  return (
    <div className="card shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="card-title">Join QR Code</div>
        <span className="text-xs text-base-content/60">Scan to join</span>
      </div>
      <div className="mt-4 space-y-3">
        {qrUrl ? (
          <div className="flex items-center justify-center rounded-xl bg-[var(--surface)] p-4">
            <img src={qrUrl} alt="Join code QR" className="h-40 w-40" />
          </div>
        ) : null}
        <input className="input input-bordered w-full" value={joinLink} readOnly />
        <button className="btn btn-outline" onClick={onCopyLink}>Copy Join Link</button>
      </div>
    </div>
  );
}
