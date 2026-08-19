import type { ReactNode } from "react";
import AdminShell from "../../components/admin/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      {/* Dashboard density: sections at 1.5rem rather than 3rem, and a wider
          ceiling so large monitors show more content instead of more margin. */}
      <div className="mx-auto box-border w-full max-w-[1600px] space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {children}
      </div>
    </AdminShell>
  );
}
