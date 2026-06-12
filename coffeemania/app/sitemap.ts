import type { MetadataRoute } from "next";
import { PUBLIC_SITEMAP_ROUTES, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_SITEMAP_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path === "/" ? "/" : route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
