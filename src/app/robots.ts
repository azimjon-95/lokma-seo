// Statik eksport uchun majburiy (output: "export")
export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// robots.txt avtomatik yaratiladi — domen bitta joydan olinadi
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Dine-in sahifalari indekslanmaydi — har stol uchun
      // alohida havola, ular ochiq bo'lmasligi kerak
      disallow: ["/d/", "/waiter"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
