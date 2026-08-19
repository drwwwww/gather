import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/**
 * PageHeader: Consistent page header layout for admin pages.
 * - Title (h1), subtitle, right-aligned actions
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
    <div>
      <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{title}</h1>
      {subtitle && <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
    </div>
    {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
