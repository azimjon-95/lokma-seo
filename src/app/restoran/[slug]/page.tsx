import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getRestaurant,
  getRestaurantDishes,
  getRestaurants,
  restaurantSlug,
  idFromSlug,
  type SeoRestaurant,
} from "@/lib/catalog";
import { SITE_URL, SITE_NAME, TELEGRAM_APP_URL, OG_IMAGE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

/**
 * Barcha restoranlar uchun sahifalar OLDINDAN yaratiladi (SSG).
 *
 * Bu qidiruv tizimlari uchun muhim: sahifa tayyor HTML sifatida
 * beriladi, JavaScript kutilmaydi — Google/Yandex uni darhol
 * to'liq o'qiy oladi va tezroq indekslaydi.
 */
export async function generateStaticParams() {
  const list = await getRestaurants();
  return list.map((r) => ({ slug: restaurantSlug(r) }));
}

/** Yangi restoran qo'shilsa ham sahifa ishlasin (build'dan keyin). */
export const dynamicParams = true;
export const revalidate = 3600;

function priceRange(r: SeoRestaurant): string {
  if (!r.deliveryFee) return "$$";
  return r.deliveryFee > 20000 ? "$$$" : "$$";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRestaurant(idFromSlug(slug));
  if (!r) return { title: "Restoran topilmadi" };

  const cuisine = r.cuisine || r.category || "restoran";
  /*
   * Sarlavha qidiruv so'roviga MOS bo'lishi kerak. Odam
   * Google'da odatda "<restoran nomi>" yoki "<nom> yetkazib
   * berish" deb yozadi — ikkalasi ham shu sarlavhada bor.
   */
  const title = `${r.name} — ${cuisine} · yetkazib berish`;
  const description =
    `${r.name} dan onlayn buyurtma bering. ${cuisine} taomlari, `
    + `${r.deliveryMin ?? 25}–${r.deliveryMax ?? 45} daqiqada yetkazib berish. `
    + `${SITE_NAME} orqali tez va qulay.`;

  const url = `${SITE_URL}/restoran/${slug}`;
  const image = r.imageUrl || r.images?.[0] || OG_IMAGE;

  return {
    title,
    description,
    keywords: [
      r.name,
      `${r.name} yetkazib berish`,
      `${r.name} menyu`,
      `${r.name} buyurtma`,
      `${r.name} Toshkent`,
      cuisine,
      `${cuisine} yetkazib berish`,
      "ovqat yetkazib berish",
      SITE_NAME,
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: r.name }],
      locale: "uz_UZ",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params;
  const id = idFromSlug(slug);
  const [r, dishes] = await Promise.all([
    getRestaurant(id),
    getRestaurantDishes(id),
  ]);

  if (!r) notFound();

  const cuisine = r.cuisine || r.category || "Restoran";
  const url = `${SITE_URL}/restoran/${slug}`;

  /*
   * Schema.org tuzilgan ma'lumoti — Google buni o'qib
   * qidiruv natijasida YULDUZCHA REYTING, ish vaqti va menyu
   * ko'rsatishi mumkin ("rich result"). Bu bosilish darajasini
   * sezilarli oshiradi.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: r.name,
    url,
    image: r.imageUrl || r.images?.[0] || OG_IMAGE,
    servesCuisine: cuisine,
    priceRange: priceRange(r),
    ...(r.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: r.address,
        addressLocality: "Toshkent",
        addressCountry: "UZ",
      },
    }),
    ...(r.lat && r.lng && {
      geo: { "@type": "GeoCoordinates", latitude: r.lat, longitude: r.lng },
    }),
    ...(r.rating && r.reviewCount ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: r.rating,
        reviewCount: r.reviewCount,
        bestRating: 5,
      },
    } : {}),
    ...(r.openTime && r.closeTime && {
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday",
                    "Friday", "Saturday", "Sunday"],
        opens: r.openTime,
        closes: r.closeTime,
      },
    }),
    potentialAction: {
      "@type": "OrderAction",
      target: TELEGRAM_APP_URL,
      deliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet",
    },
    ...(dishes.length > 0 && {
      hasMenu: {
        "@type": "Menu",
        name: `${r.name} menyusi`,
        hasMenuSection: {
          "@type": "MenuSection",
          name: "Taomlar",
          hasMenuItem: dishes.slice(0, 30).map((d) => ({
            "@type": "MenuItem",
            name: d.name,
            ...(d.description && { description: d.description }),
            ...(d.price && {
              offers: {
                "@type": "Offer",
                price: d.price,
                priceCurrency: "UZS",
              },
            }),
          })),
        },
      },
    }),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Bosh sahifa", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Restoranlar", item: `${SITE_URL}/restoranlar` },
      { "@type": "ListItem", position: 3, name: r.name, item: url },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <nav className="mb-6 text-sm text-neutral-500">
        <Link href="/" className="hover:underline">Bosh sahifa</Link>
        {" / "}
        <Link href="/restoranlar" className="hover:underline">Restoranlar</Link>
        {" / "}
        <span className="text-neutral-800">{r.name}</span>
      </nav>

      <h1 className="text-3xl font-bold text-neutral-900">{r.name}</h1>
      <p className="mt-2 text-neutral-600">
        {cuisine}
        {r.deliveryMin && ` · ${r.deliveryMin}–${r.deliveryMax ?? r.deliveryMin + 20} daqiqa`}
        {r.rating ? ` · ★ ${r.rating}` : ""}
      </p>

      {r.openTime && r.closeTime && (
        <p className="mt-1 text-sm text-neutral-500">
          Ish vaqti: {r.openTime} – {r.closeTime}
        </p>
      )}

      <a
        href={TELEGRAM_APP_URL}
        className="mt-6 inline-block rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white"
      >
        {r.name} dan buyurtma berish
      </a>

      {dishes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-neutral-900">
            {r.name} menyusi
          </h2>
          <ul className="mt-4 divide-y divide-neutral-200">
            {dishes.slice(0, 40).map((d) => (
              <li key={d.id} className="flex justify-between gap-4 py-3">
                <div>
                  <h3 className="font-medium text-neutral-900">{d.name}</h3>
                  {d.description && (
                    <p className="mt-0.5 text-sm text-neutral-500">{d.description}</p>
                  )}
                </div>
                {d.price ? (
                  <span className="shrink-0 font-semibold text-neutral-900">
                    {d.price.toLocaleString("ru-RU")} so&apos;m
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 text-sm leading-relaxed text-neutral-600">
        <h2 className="mb-2 text-base font-semibold text-neutral-900">
          {r.name} — yetkazib berish
        </h2>
        <p>
          {r.name} ({cuisine}) taomlarini {SITE_NAME} orqali onlayn buyurtma
          qilishingiz mumkin. Buyurtma Telegram ilovasi orqali bir necha
          bosqichda rasmiylashtiriladi va{" "}
          {r.deliveryMin ?? 25}–{r.deliveryMax ?? 45} daqiqada manzilingizga
          yetkaziladi.
        </p>
      </section>
    </main>
  );
}
