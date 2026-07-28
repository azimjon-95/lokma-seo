// Statik eksport uchun majburiy (output: "export")
export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Sitemap avtomatik yaratiladi — sana har build'da yangilanadi.
 * Avval public/sitemap.xml qattiq yozilgan edi va eskirardi.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
