"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { dineInApi, type Dish, type DishOption } from "@/lib/dinein/api";
import { loadSession, type StoredSession } from "@/lib/dinein/session";
import { useCart } from "@/lib/dinein/cart";
import { DishSheet } from "@/components/dinein/DishSheet";
import { CartSheet } from "@/components/dinein/CartSheet";
import { som } from "@/lib/dinein/format";
import { cached } from "@/lib/dinein/cache";
import { TableActions } from "@/components/dinein/TableActions";

export function DineInMenu({ token }: { token: string }) {
  const router = useRouter();

  const [session, setSession] = useState<StoredSession | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<string>("all");
  const [openDish, setOpenDish] = useState<Dish | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const cart = useCart();

  // Sessiya — bo'lmasa QR sahifasiga qaytamiz
  useEffect(() => {
    const s = loadSession();
    if (!s || s.token !== token) {
      router.replace(`/d/${token}`);
      return;
    }
    setSession(s);

    // Keshdan — QR qayta skanerlanganda tez ochiladi
    cached(`menu:${s.restaurantId}`, () => dineInApi.menu(s.restaurantId))
      .then(setDishes)
      .catch(() => setDishes([]))
      .finally(() => setLoading(false));
  }, [token, router]);

  // Bo'limlar
  const sections = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of dishes) {
      const key = d.section || d.category || "Menyu";
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.keys());
  }, [dishes]);

  const visible = useMemo(() => {
    if (section === "all") return dishes;
    return dishes.filter((d) => (d.section || d.category) === section);
  }, [dishes, section]);

  const quickAdd = useCallback((dish: Dish) => {
    if (dish.optionGroups?.length) {
      setOpenDish(dish);
    } else {
      cart.add(dish, 1, []);
    }
  }, [cart]);

  if (!session) return null;

  return (
    <div className="di-page">
      {/* Sarlavha */}
      <header className="di-header">
        <div className="di-header__rest">{session.restaurantName}</div>
        <div className="di-header__table">
          {session.tableName
            ? `${session.tableName} · ${session.tableNumber}`
            : `Stol ${session.tableNumber}`}
        </div>
        <button
          onClick={() => router.push(`/d/${token}/orders`)}
          className="di-header__orders"
        >
          📦
        </button>
      </header>

      {/* Ofitsiant chaqirish */}
      <TableActions sessionId={session.sessionId} />

      {/* Bo'limlar */}
      {sections.length > 1 && (
        <nav className="di-sections">
          <button
            onClick={() => setSection("all")}
            className={`di-chip ${section === "all" ? "is-active" : ""}`}
          >
            Hammasi
          </button>
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`di-chip ${section === s ? "is-active" : ""}`}
            >
              {s}
            </button>
          ))}
        </nav>
      )}

      {/* Taomlar */}
      <main className="di-list">
        {loading ? (
          <div className="di-loading">
            <div className="di-spinner" />
          </div>
        ) : visible.length === 0 ? (
          <div className="di-empty">
            <div className="di-empty__icon">🍽</div>
            <p>Menyu hozircha bo&apos;sh</p>
          </div>
        ) : (
          visible.map((d) => {
            const inCart = cart.quantityOf(d._id);
            return (
              <button
                key={d._id}
                onClick={() => setOpenDish(d)}
                className="di-dish"
              >
                {d.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.imageUrl} alt="" className="di-dish__img" loading="lazy" />
                ) : (
                  <div className="di-dish__img di-dish__img--empty">🍽</div>
                )}

                <div className="di-dish__body">
                  <div className="di-dish__name">{d.name}</div>
                  {d.description && (
                    <div className="di-dish__desc">{d.description}</div>
                  )}
                  <div className="di-dish__bottom">
                    <span className="di-dish__price">{som(d.price)}</span>
                    {inCart > 0 && (
                      <span className="di-dish__badge">{inCart}</span>
                    )}
                  </div>
                </div>

                <span
                  className="di-dish__add"
                  onClick={(e) => {
                    e.stopPropagation();
                    quickAdd(d);
                  }}
                >
                  +
                </span>
              </button>
            );
          })
        )}
      </main>

      {/* Savat paneli */}
      {cart.count > 0 && (
        <button onClick={() => setCartOpen(true)} className="di-cartbar">
          <span className="di-cartbar__count">{cart.count}</span>
          <span className="di-cartbar__label">Savatni ko&apos;rish</span>
          <span className="di-cartbar__total">{som(cart.subtotal)}</span>
        </button>
      )}

      {openDish && (
        <DishSheet
          dish={openDish}
          onClose={() => setOpenDish(null)}
          onAdd={(qty: number, options: DishOption[]) => {
            cart.add(openDish, qty, options);
            setOpenDish(null);
          }}
        />
      )}

      {cartOpen && session && (
        <CartSheet
          session={session}
          onClose={() => setCartOpen(false)}
          onOrdered={() => {
            setCartOpen(false);
            router.push(`/d/${token}/orders`);
          }}
        />
      )}
    </div>
  );
}
