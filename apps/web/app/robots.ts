import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gatherministry.online";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/demo"],
        disallow: ["/admin", "/account", "/member", "/people", "/volunteers", "/announcements", "/events", "/notifications", "/api", "/auth", "/login", "/signup", "/onboarding", "/join"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
