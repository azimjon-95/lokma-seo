import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getRestaurants, restaurantSlug } from "@/lib/catalog";

/**
 * Sitemap — qidiruv tizimlariga qaysi sahifalar borligini aytadi.
 *
 * MUHIM (2026-08): avval FAQAT bosh sahifa bor edi. Ya'ni
 * Google/Yandex restoran sahifalari mavjudligini bilmasdi va
 * "Vegos restorani" kabi so'rovlarga LokmaGo chiqmasdi.
 * Endi har bir restoran sahifasi ro'yxatga kiradi.
 *
 * force-static OLIB TASHLANDI: sitemap endi ma'lumot bazasidan
 * o'qiydi, shuning uchun u dinamik bo'lishi kerak. Har soatda
 * qayta hisoblanadi (revalidate) — yangi restoran qo'shilsa
 * bir soat ichida sitemap'ga tushadi.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/restoranlar`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Tarmoq xatosi butun sitemap'ni buzmasin — getRestaurants
  // o'zi xatoni yutadi va bo'sh ro'yxat qaytaradi
  const restaurants = await getRestaurants();

  const restaurantPages: MetadataRoute.Sitemap = restaurants.map((r) => ({
    url: `${SITE_URL}/restoran/${restaurantSlug(r)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...restaurantPages];
}
