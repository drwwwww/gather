import type { ReactNode } from "react";
import AdminShell from "../../components/admin/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <div className="mx-auto box-border w-full max-w-[min(100%,90rem)] px-4 py-8 sm:px-8 md:py-10">
        {children}
      </div>
    </AdminShell>
  );
}
