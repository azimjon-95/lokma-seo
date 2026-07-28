import type { Metadata, Viewport } from "next";
import "./globals.css";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_DESCRIPTION_SHORT,
  TELEGRAM_APP_URL,
  TELEGRAM_BOT_URL,
  OG_IMAGE,
  LOGO_IMAGE,
} from "@/lib/site";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5A524",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    // Brend
    "LokmaGo", "Lokma Go", "lokma.uz",
    // Asosiy xizmat
    "ovqat yetkazib berish", "taom buyurtma", "yetkazib berish xizmati",
    "restoran buyurtma", "onlayn ovqat buyurtma",
    // Muassasa turlari
    "restoran", "kafe", "choyxona", "fast food", "pitseriya",
    // Taomlar
    "osh", "shashlik", "lavash", "burger", "pitsa", "sushi",
    "milliy taomlar", "sho'rva",
    // Joylashuv
    "Namangan restoran", "Toshkent restoran", "O'zbekiston yetkazib berish",
    // Platforma
    "Telegram Mini App", "stol bron qilish",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    alternateLocale: ["ru_RU"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION_SHORT,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ovqat yetkazib berish xizmati`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION_SHORT,
    images: [OG_IMAGE],
  },
  // Qidiruv konsollari tasdiqlash kodlari.
  // .env.local ga qo'shing, bo'sh bo'lsa meta teg chiqmaydi
  // (noto'g'ri placeholder chiqishidan ko'ra yaxshiroq).
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION && {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    }),
    ...(process.env.NEXT_PUBLIC_YANDEX_VERIFICATION && {
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    }),
  },
  category: "food",
  other: {
    "telegram:channel": "@lokmaGo",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": SITE_NAME,
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "application-name": SITE_NAME,
    "msapplication-TileColor": "#F5A524",
  },
};

// Structured data — Google boy natijalar uchun
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "uz-UZ",
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: LOGO_IMAGE,
        width: 512,
        height: 512,
      },
      sameAs: [TELEGRAM_BOT_URL],
    },
    {
      "@type": "FoodDeliveryService",
      "@id": `${SITE_URL}/#service`,
      name: `${SITE_NAME} — ovqat yetkazib berish`,
      url: SITE_URL,
      image: OG_IMAGE,
      description: SITE_DESCRIPTION,
      provider: { "@id": `${SITE_URL}/#organization` },
      serviceType: "Food Delivery",
      areaServed: [
        { "@type": "City", name: "Namangan" },
        { "@type": "City", name: "Toshkent" },
      ],
      availableChannel: {
        "@type": "ServiceChannel",
        serviceUrl: TELEGRAM_APP_URL,
        serviceType: "Telegram Mini App",
        availableLanguage: ["uz", "ru"],
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Taom turlari",
        itemListElement: [
          "Milliy taomlar", "Fast food", "Pitsa",
          "Sushi", "Shashlik", "Shirinliklar",
        ].map((name) => ({
          "@type": "OfferCatalog",
          name,
        })),
      },
    },
    {
      "@type": "MobileApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      applicationCategory: "FoodAndDrinkApplication",
      operatingSystem: "Android, iOS, Web",
      url: TELEGRAM_APP_URL,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "UZS",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* Telegram serveriga oldindan ulanish — yo'naltirish tezroq */}
        <link rel="preconnect" href="https://t.me" />
        <link rel="dns-prefetch" href="https://t.me" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
