import React from "react";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell: Provides the main layout wrapper for the admin dashboard.
 * - Uses bg-base-100 (white canvas)
 * - Optional gentle gradient
 * - Centers content with max-w and responsive padding
 */
const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--gather-bg)' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8">
        {children}
      </div>
    </div>
  );
};

export default AppShell;
