import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/profile", "/referral", "/admin"],
      },
    ],
    sitemap: "https://coffeemaniavpn.ru/sitemap.xml",
    host: "https://coffeemaniavpn.ru",
  };
}
