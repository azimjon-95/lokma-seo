# Kerakli rasm fayllari

Bu papkaga quyidagi fayllarni qo'shing. Ular yo'q bo'lsa
ulashganda bo'sh kvadrat chiqadi va PWA ikonlari ko'rinmaydi.

## Majburiy

| Fayl | O'lcham | Nima uchun |
|---|---|---|
| `og-image.png` | 1200×630 | Telegram/Facebook/Twitter'da ulashganda ko'rinadi |
| `logo.png` | 512×512 | PWA ikoni, Organization logotipi |
| `logo-192.png` | 192×192 | PWA kichik ikoni |
| `favicon.ico` | 32×32 | Brauzer tab ikoni |
| `apple-touch-icon.png` | 180×180 | iPhone "Bosh ekranga qo'shish" |

## Tavsiya etiladi

| Fayl | O'lcham | Nima uchun |
|---|---|---|
| `logo-maskable.png` | 512×512 | Android adaptiv ikon (chetlarida 10% bo'shliq) |

## Talablar

**og-image.png** — eng muhimi:
- Aniq 1200×630 px
- 1 MB dan kichik
- Logotip va qisqa matn markazda
- Chetlarida muhim narsa bo'lmasin (turli platformalar turlicha qirqadi)

**logo.png:**
- Kvadrat, shaffof fon
- Markazda logotip, atrofida biroz bo'shliq

## Tekshirish

Rasmlarni qo'shib deploy qilgach:

```
Telegram:  https://t.me/webpagebot  ← havolani yuboring, keshni yangilaydi
Facebook:  https://developers.facebook.com/tools/debug/
Twitter:   https://cards-dev.twitter.com/validator
```
