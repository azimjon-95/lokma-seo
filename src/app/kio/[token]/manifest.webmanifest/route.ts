import { NextResponse } from "next/server";

/**
 * Har bir kiosk uchun ALOHIDA manifest.
 *
 * NEGA KERAK: iPhone Safari'da `requestFullscreen` umuman yo'q —
 * bu Apple cheklovi va JS bilan aylanib o'tib bo'lmaydi. Ekranni
 * to'liq egallashning YAGONA yo'li — sahifani "Bosh ekranga
 * qo'shish", ya'ni PWA sifatida ochish.
 *
 * Umumiy /manifest.json bunga yaramaydi: uning `start_url` i "/"
 * bo'lgani uchun bosh ekrandan ochilgan ilova kiosk emas,
 * marketing sahifasini ochardi. Shuning uchun manifest tokenga
 * bog'lab beriladi.
 *
 * `display: fullscreen` — Android'da tizim panellari ham
 * yashiriladi; iOS `standalone` gacha tushiradi (Safari paneli
 * yo'q, bu bizga yetarli).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  return NextResponse.json(
    {
      name: "LokmaGo Kiosk",
      short_name: "Kiosk",
      description: "Zal boshqaruvi — stollar, menyu, stop list",
      start_url: `/kio/${token}`,
      scope: `/kio/${token}`,
      display: "fullscreen",
      display_override: ["fullscreen", "standalone", "minimal-ui"],
      orientation: "any",
      background_color: "#F6F3EF",
      theme_color: "#F6F3EF",
      lang: "uz",
      icons: [
        { src: "/logo-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/logo-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        // Token maxfiy — oraliq keshlarda qolmasin
        "Cache-Control": "private, no-store",
      },
    },
  );
}
