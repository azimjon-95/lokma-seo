import type { Metadata } from "next";
import Link from "next/link";
import { getRestaurants, restaurantSlug } from "@/lib/catalog";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Restoranlar — Toshkentda ovqat yetkazib berish",
  description:
    `${SITE_NAME} hamkor restoranlari ro'yxati. Milliy, Yevropa, fast food va `
    + "boshqa taomlarni onlayn buyurtma qiling — tez yetkazib berish.",
  keywords: [
    "restoranlar", "Toshkent restoranlari", "kafelar",
    "ovqat yetkazib berish", "restoran ro'yxati", SITE_NAME,
  ],
  alternates: { canonical: `${SITE_URL}/restoranlar` },
  openGraph: {
    title: `Restoranlar — ${SITE_NAME}`,
    description: "Hamkor restoranlar va ularning menyulari",
    url: `${SITE_URL}/restoranlar`,
    type: "website",
  },
};

/**
 * Restoranlar ro'yxati.
 *
 * SEO ROLI: bu sahifa "havolalar markazi" (linking hub) —
 * qidiruv roboti bosh sahifadan kelib, bu yerdan BARCHA
 * restoran sahifalariga o'tadi. Ichki havolalarsiz alohida
 * sahifalar "yetim" qolib, indekslanmasligi mumkin.
 */
export default async function RestaurantsPage() {
  const list = await getRestaurants();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} restoranlari`,
    numberOfItems: list.length,
    itemListElement: list.slice(0, 100).map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: r.name,
      url: `${SITE_URL}/restoran/${restaurantSlug(r)}`,
    })),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 className="text-3xl font-bold text-neutral-900">Restoranlar</h1>
      <p className="mt-2 text-neutral-600">
        {SITE_NAME} hamkor muassasalari — menyu va yetkazib berish
      </p>

      {list.length === 0 ? (
        <p className="mt-8 text-neutral-500">Ro&apos;yxat vaqtincha mavjud emas.</p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200">
          {list.map((r) => (
            <li key={r.id}>
              <Link
                href={`/restoran/${restaurantSlug(r)}`}
                className="flex items-center justify-between gap-4 py-4 hover:bg-neutral-50"
              >
                <div>
                  <h2 className="font-semibold text-neutral-900">{r.name}</h2>
                  <p className="text-sm text-neutral-500">
                    {r.cuisine || r.category || "Restoran"}
                    {r.deliveryMin ? ` · ${r.deliveryMin}–${r.deliveryMax ?? r.deliveryMin + 20} daq` : ""}
                  </p>
                </div>
                {r.rating ? (
                  <span className="shrink-0 text-sm text-neutral-600">★ {r.rating}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
