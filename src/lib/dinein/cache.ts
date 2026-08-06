/**
 * Oddiy so'rov keshi.
 *
 * React Query o'rniga — bu hajm uchun kutubxona ortiqcha.
 * Menyu bir marta yuklanadi, keyin keshdan olinadi.
 */

interface Entry<T> {
  data: T;
  at: number;
}

const store = new Map<string, Entry<unknown>>();

// Menyu kamdan-kam o'zgaradi — 2 daqiqa yetarli
const DEFAULT_TTL = 120_000;

/**
 * Keshdan oladi yoki so'rov yuboradi.
 * Bir vaqtda bir nechta chaqiruv bo'lsa bitta so'rov ketadi.
 */
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL,
): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && Date.now() - hit.at < ttl) return hit.data;

  // Shu kalit uchun so'rov ketayaptimi
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = fetcher()
    .then((data) => {
      store.set(key, { data, at: Date.now() });
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

/** Keshni tozalaydi — menyu o'zgarganda. */
export function invalidate(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
