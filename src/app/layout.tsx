import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF8C00",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://lokmago.uz"),
  title: "LokmaGo — Sevimli restoran va kafelaringiz bir joyda",
  description:
    "Sizning sevimli restoran va kafelaringiz endi bir joyda. Mazali taomlarni tez va qulay buyurtma qiling. Ovqat yetkazib berish, restoran bron qilish, kafe va choyxonalar — barchasi LokmaGo'da.",
  keywords: [
    "LokmaGo",
    "Lokma Go",
    "ovqat buyurtma",
    "restoran",
    "kafe",
    "choyxona",
    "food delivery",
    "Telegram Mini App",
    "ovqat yetkazib berish",
    "taom buyurtma",
    "oziq-ovqat",
    "Toshkent restoran",
    "fast food",
    "milliy taomlar",
  ],
  authors: [{ name: "LokmaGo Team" }],
  creator: "LokmaGo",
  publisher: "LokmaGo",
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
    canonical: "https://lokmago.uz",
  },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: "https://lokmago.uz",
    siteName: "LokmaGo",
    title: "🍔 LokmaGo — Sevimli restoranlaringiz bir joyda",
    description:
      "Sizning sevimli restoran va kafelaringiz endi bir joyda. Mazali taomlarni tez va qulay buyurtma qiling.",
    images: [
      {
        url: "https://lokmago.uz/lokmago-preview.jpg",
        width: 1200,
        height: 630,
        alt: "LokmaGo — Food Delivery & Restaurant Booking",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LokmaGo — Food Delivery",
    description:
      "Sizning sevimli restoran va kafelaringiz endi bir joyda. Mazali taomlarni tez va qulay buyurtma qiling.",
    images: ["https://lokmago.uz/lokmago-preview.jpg"],
    creator: "@lokmago",
  },
  verification: {
    google: "google-site-verification-code",
    yandex: "yandex-verification-code",
  },
  category: "food",
  classification: "Food Delivery, Restaurant, Cafe",
  other: {
    "telegram:channel": "@lokmaGo",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "LokmaGo",
    "application-name": "LokmaGo",
    "msapplication-TileColor": "#FF8C00",
    "msapplication-config": "/browserconfig.xml",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://lokmago.uz/#website",
      url: "https://lokmago.uz",
      name: "LokmaGo",
      description: "Sevimli restoran va kafelaringiz bir joyda. Ovqat yetkazib berish xizmati.",
      publisher: { "@id": "https://lokmago.uz/#organization" },
      inLanguage: "uz-UZ",
    },
    {
      "@type": "Organization",
      "@id": "https://lokmago.uz/#organization",
      name: "LokmaGo",
      url: "https://lokmago.uz",
      logo: {
        "@type": "ImageObject",
        url: "https://lokmago.uz/logo.jpg",
        width: 512,
        height: 512,
      },
      sameAs: ["https://t.me/lokmaGobot"],
    },
    {
      "@type": "FoodDeliveryService",
      "@id": "https://lokmago.uz/#fooddelivery",
      name: "LokmaGo Food Delivery",
      url: "https://lokmago.uz",
      areaServed: {
        "@type": "City",
        name: "Toshkent",
        containedInPlace: {
          "@type": "Country",
          name: "O'zbekiston",
        },
      },
      provider: { "@id": "https://lokmago.uz/#organization" },
      serviceType: "Food Delivery",
      availableChannel: {
        "@type": "ServiceChannel",
        serviceUrl: "https://t.me/lokmaGobot?startapp",
        serviceType: "Telegram Mini App",
      },
    },
    {
      "@type": "MobileApplication",
      name: "LokmaGo",
      applicationCategory: "FoodDelivery",
      operatingSystem: "Any",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "UZS",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "1250",
      },
    },
    {
      "@type": "Restaurant",
      name: "LokmaGo Partner Restaurants",
      url: "https://lokmago.uz",
      image: "https://lokmago.uz/lokmago-preview.jpg",
      servesCuisine: ["O'zbek milliy taomlari", "Fast Food", "Evropa taomlari", "Osiyo taomlari"],
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        addressCountry: "UZ",
        addressLocality: "Toshkent",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <head>
        <link rel="icon" href="/logo.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}