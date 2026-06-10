import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Page not found
      </h1>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        The page you requested does not exist.
      </p>
      <Link href="/admin" className="btn btn-primary-gradient btn-sm">
        Back to dashboard
      </Link>
    </div>
  );
}
