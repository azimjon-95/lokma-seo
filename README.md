# LokmaGo — SEO shlyuz

`lokma.uz` domeni uchun landing sahifa. Ikki vazifasi bor:

1. **Foydalanuvchini** Telegram Mini App'ga yo'naltiradi
2. **Qidiruv tizimlariga** indekslash uchun kontent beradi

Botlar yo'naltirilmaydi — ular sahifani o'qiydi va indekslaydi.

## Ishga tushirish

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # ishlab chiqarish
```

## Sozlash

Domen, bot nomi va matnlar bitta joyda:

```
src/lib/site.ts
```

O'zgartirish kerak bo'lsa faqat shu faylni tahrirlang — qolgan
hamma joyda avtomatik yangilanadi (metadata, structured data,
sitemap, robots).

## Muhit o'zgaruvchilari

`.env.example` dan nusxa oling:

```bash
cp .env.example .env.local
```

| O'zgaruvchi | Nima uchun |
|---|---|
| `NEXT_PUBLIC_GOOGLE_VERIFICATION` | Google Search Console tasdiqlash |
| `NEXT_PUBLIC_YANDEX_VERIFICATION` | Yandex Webmaster tasdiqlash |

Bo'sh qoldirilsa meta teg umuman chiqmaydi.

## Rasm fayllari

`public/` papkasiga qo'shilishi kerak — batafsil:
[`public/RASMLAR-KERAK.md`](public/RASMLAR-KERAK.md)

Eng muhimi `og-image.png` (1200×630) — Telegram va ijtimoiy
tarmoqlarda ulashganda ko'rinadi.

## Tuzilishi

```
src/
  app/
    layout.tsx      metadata, structured data
    page.tsx        yo'naltirish + SEO kontent
    sitemap.ts      avtomatik sitemap
    robots.ts       avtomatik robots.txt
  components/
    Splash.tsx      yuklanish ekrani
    RedirectButton  qo'lda o'tish tugmasi
  lib/
    site.ts         ⚙️ sozlamalar (domen, bot, matnlar)
```

## Deploy

Vercel'ga ulangan — `main` ga push qilinsa avtomatik chiqadi.

Boshqa hostingga chiqarish kerak bo'lsa `next.config.js` dagi
izohga qarang (statik eksport rejimi).
