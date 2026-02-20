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
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
    <div>
      <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--ink)' }}>{title}</h1>
      {subtitle && <p className="text-base" style={{ color: 'var(--muted)' }}>{subtitle}</p>}
    </div>
    {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
