import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            // The API, and pages behind a sign-in (they're also marked noindex).
            disallow: ["/api/", "/*/auth/", "/*/account", "/*/protected", "/*/panel", "/*/reviews"],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
