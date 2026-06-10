import type { ReactNode } from "react";
import AdminShell from "../../components/admin/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <div className="mx-auto box-border w-full max-w-7xl space-y-12 px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
        {children}
      </div>
    </AdminShell>
  );
}
