/**
 * SEO sahifalari uchun ma'lumot manbai.
 *
 * MAQSAD: Google/Yandex'da restoran yoki taom nomi qidirilganda
 * LokmaGo sahifasi chiqishi. Buning uchun har bir restoran uchun
 * ALOHIDA, indekslanadigan sahifa kerak — bitta bosh sahifa
 * yetarli emas (qidiruv tizimi "Vegos restorani" so'roviga
 * javob beradigan aniq sahifani izlaydi).
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.lokma.uz/api";

export type SeoRestaurant = {
  id: string;
  name: string;
  cuisine?: string;
  category?: string;
  imageUrl?: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  deliveryMin?: number;
  deliveryMax?: number;
  deliveryFee?: number;
  openTime?: string;
  closeTime?: string;
  address?: string;
  lat?: number;
  lng?: number;
};

export type SeoDish = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
};

/**
 * Tarmoq xatosi SAHIFANI YIQITMASLIGI kerak.
 *
 * Build paytida (SSG) API vaqtincha ishlamasa, butun deploy
 * to'xtab qolardi. Shuning uchun har bir so'rov xatoni yutadi
 * va bo'sh natija qaytaradi — sahifa shunchaki kamroq
 * ma'lumot bilan chiqadi.
 */
async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      // Har soatda yangilanadi — restoran ma'lumoti tez-tez
      // o'zgarmaydi, lekin butunlay qotib ham qolmasin
      next: { revalidate: 3600 },
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

/** Barcha restoranlar — sitemap va ro'yxat sahifasi uchun. */
export async function getRestaurants(): Promise<SeoRestaurant[]> {
  const data = await safeFetch<{ items?: SeoRestaurant[] } | SeoRestaurant[]>(
    "/restaurants?limit=100",
    [],
  );
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

/** Bitta restoran. */
export async function getRestaurant(id: string): Promise<SeoRestaurant | null> {
  return safeFetch<SeoRestaurant | null>(`/restaurants/${id}`, null);
}

/** Restoran menyusi. */
export async function getRestaurantDishes(id: string): Promise<SeoDish[]> {
  const data = await safeFetch<{ items?: SeoDish[] } | SeoDish[]>(
    `/restaurants/${id}/dishes`,
    [],
  );
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

/**
 * URL uchun xavfsiz "slug" — restoran nomidan.
 *
 * Masalan "Korner Kafe 2" -> "korner-kafe-2"
 * Bu qidiruv tizimlari uchun muhim: URL ichidagi nom
 * reyting omili hisoblanadi (/restoran/korner-kafe-2-<id>
 * ko'rinishi /restoran/<id> dan ancha yaxshi).
 */
export function slugify(text: string): string {
  const map: Record<string, string> = {
    // Turli apostrof shakllari (o'zbek lotin alifbosida ko'p uchraydi)
    "ʻ": "", "‘": "", "’": "", "`": "", "'": "",
    à: "a", á: "a", ä: "a", â: "a",
    è: "e", é: "e", ë: "e", ê: "e",
    ì: "i", í: "i", ï: "i", î: "i",
    ò: "o", ó: "o", ö: "o", ô: "o",
    ù: "u", ú: "u", ü: "u", û: "u",
    ç: "c", ñ: "n", ş: "s", ğ: "g",
  };
  return (text || "")
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")   // lotin bo'lmagan belgilar olib tashlanadi
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/** Slug + ID birlashtirilgan URL bo'lagi. */
export function restaurantSlug(r: SeoRestaurant): string {
  const s = slugify(r.name);
  return s ? `${s}-${r.id}` : r.id;
}

/** URL bo'lagidan ID ni ajratib olish (oxirgi "-" dan keyingi qism). */
export function idFromSlug(slug: string): string {
  const parts = slug.split("-");
  return parts[parts.length - 1] || slug;
}
