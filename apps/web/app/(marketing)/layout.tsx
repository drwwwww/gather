import type { ReactNode } from "react";
import MarketingFooter from "../../components/marketing/MarketingFooter";
import SiteAnalytics from "../../components/marketing/SiteAnalytics";

/**
 * Marketing shell. The root layout already renders a <main>, so this uses
 * plain elements to avoid nesting landmarks. The nav is rendered per-page
 * because the landing page needs it transparent over the hero video while
 * inner pages need it solid from the start.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mk min-h-dvh">
      {children}
      <MarketingFooter />
      <SiteAnalytics />
    </div>
  );
}
