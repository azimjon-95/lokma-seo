/**
 * Sayt konfiguratsiyasi — bitta manba.
 * Domen yoki bot nomi o'zgarsa faqat shu faylni tahrirlaysiz.
 */

// Ishlab chiqarish domeni (https, oxirida slash yo'q)
export const SITE_URL = "https://lokma.uz";  // oxirida slash YO'Q

// Telegram bot username (@ belgisisiz)
export const BOT_USERNAME = "lokmaGobot";

// Mini App havolasi — bosilganda ilova ochiladi
export const TELEGRAM_APP_URL = `https://t.me/${BOT_USERNAME}?startapp`;

// Bot profili (Organization sameAs uchun)
export const TELEGRAM_BOT_URL = `https://t.me/${BOT_USERNAME}`;

// Rasm yo'llari
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
export const LOGO_IMAGE = `${SITE_URL}/logo.png`;

// Sayt nomi va tavsiflar
export const SITE_NAME = "LokmaGo";

// Sarlavhada brend nomining barcha yozilishi bor:
// "Lokma", "LokmaGo", "lokma.uz" — qaysi biri qidirilsa ham topiladi
export const SITE_TITLE =
  "Lokma — LokmaGo | Ovqat yetkazib berish xizmati | lokma.uz";

export const SITE_DESCRIPTION =
  "Lokma (LokmaGo) — Namangan va Toshkentdagi restoran, kafe va " +
  "choyxonalardan ovqat yetkazib berish xizmati. Osh, shashlik, lavash, " +
  "burger, pitsa va boshqa taomlarni 25-40 daqiqada yetkazib beramiz. " +
  "Stol bron qilish, o'zingiz olib ketish, naqd va karta orqali to'lov. " +
  "lokma.uz saytida yoki Telegram ilovasida buyurtma bering.";

// Qisqa tavsif (Twitter, OG uchun)
export const SITE_DESCRIPTION_SHORT =
  "Namangan va Toshkentdagi restoran va kafelardan ovqat yetkazib berish. " +
  "Osh, shashlik, lavash, pitsa — 25-40 daqiqada eshigingizgacha.";

// Backend API manzili
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://apilokma.poppolizol.uz/api";

// Ofitsiant paneli domeni
export const WAITER_HOST = "waiter.lokma.uz";
