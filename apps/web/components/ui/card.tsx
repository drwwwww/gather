import type { ReactNode } from "react";
import clsx from "clsx";


export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={clsx("card rounded-xl shadow border", className)}
      style={{ background: 'var(--gather-surface)', borderColor: 'var(--gather-border)', color: 'var(--gather-ink)' }}
    >
      <div className="p-6">{children}</div>
    </div>
  );
}


export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="card-title text-lg font-semibold" style={{ color: 'var(--gather-ink)' }}>{children}</h3>;
}

export function CardValue({ children }: { children: ReactNode }) {
  return <p className="text-2xl font-semibold">{children}</p>;
}
