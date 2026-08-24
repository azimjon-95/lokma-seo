"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Ban, BookOpen } from "lucide-react";
import { waiterApi, type Dish } from "@/lib/dinein/api";
import { som } from "@/lib/dinein/format";

/**
 * Menyu — ko'rish uchun.
 *
 * Buyurtma BU YERDAN berilmaydi: taom har doim stolga
 * yoziladi, stolsiz buyurtma ma'nosiz. Ofitsiant stolni
 * bosib buyurtma oynasini ochadi.
 *
 * Bu bo'lim narx aytish uchun: mijoz "bu qancha?" deb
 * so'raganda oshxonaga bormasdan javob berish uchun.
 */
export function KioskMenu({ restaurantId }: { restaurantId: string }) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");

  useEffect(() => {
    waiterApi.menu(restaurantId)
      .then(setDishes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const cats = useMemo(() => {
    const set = new Map<string, number>();
    dishes.forEach((d) => {
      const key = d.category || "boshqa";
      set.set(key, (set.get(key) || 0) + 1);
    });
    return [...set.entries()].sort((a, b) => b[1] - a[1]);
  }, [dishes]);

  const q = query.trim().toLowerCase();
  const visible = dishes.filter((d) => {
    if (cat !== "all" && (d.category || "boshqa") !== cat) return false;
    return !q || d.name.toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="kio-loading"><div className="di-spinner" /></div>;
  }

  return (
    <div className="kio-menu">
      <label className="wt-search kio-menu__search">
        <Search size={16} strokeWidth={2.2} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Taom qidirish..."
          inputMode="search"
        />
      </label>

      {cats.length > 1 && (
        <div className="kio-menu__cats">
          <button onClick={() => setCat("all")} className={cat === "all" ? "is-on" : ""}>
            Hammasi
          </button>
          {cats.map(([c, n]) => (
            <button key={c} onClick={() => setCat(c)} className={cat === c ? "is-on" : ""}>
              {c} <small>{n}</small>
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="di-empty">
          <div className="di-empty__icon"><BookOpen size={34} strokeWidth={1.6} /></div>
          <p>{dishes.length === 0 ? "Menyu bo‘sh" : "Topilmadi"}</p>
        </div>
      ) : (
        <div className="kio-menu__list">
          {visible.map((d) => (
            <div key={d._id} className={`kio-menu__row ${d.isAvailable === false ? "is-off" : ""}`}>
              <div className="kio-menu__info">
                <div className="kio-menu__name">{d.name}</div>
                {d.description && (
                  <div className="kio-menu__desc">{d.description}</div>
                )}
              </div>

              <div className="kio-menu__right">
                <div className="kio-menu__price">{som(d.price)}</div>
                {d.isAvailable === false && (
                  <span className="kio-menu__stop">
                    <Ban size={12} strokeWidth={2.4} /> Stopda
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
