/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "export" OLIB TASHLANDI.
  // Vercel Next.js'ni o'zi optimallashtiradi va statik sahifalarni
  // avtomatik aniqlaydi. "export" bilan birga ishlatilsa deploy
  // muvaffaqiyatsiz bo'ladi (sitemap/robots route'lari uchun).
  //
  // Agar boshqa hostingga (Nginx, GitHub Pages) chiqarish kerak bo'lsa:
  //   1. output: "export" ni yoqing
  //   2. quyidagi headers() blokini o'chiring (export'da ishlamaydi)
  //   3. force-static src/app/{robots,sitemap}.ts da saqlansin

  images: {
    unoptimized: true,
  },
  // trailingSlash: true OLIB TASHLANDI.
  // U bilan lokma.uz → lokma.uz/ ga 308 yo'naltirish bo'lardi.
  // Telegram va ba'zi ijtimoiy tarmoq botlari yo'naltirishni
  // kuzatmaydi — havola yalang'och URL bo'lib ketardi, karta
  // ko'rinmasdi.

  // Xavfsizlik sarlavhalari
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
