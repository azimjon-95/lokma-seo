"use client";

import { useState, useEffect, useCallback } from "react";
import { waiterApi, type WaiterTable, type Dish, type DishOption, ApiError } from "@/lib/dinein/api";
import { som, num } from "@/lib/dinein/format";
import { cached } from "@/lib/dinein/cache";
import { DishSheet } from "@/components/dinein/DishSheet";
import { TableMap3D } from "@/components/dinein/TableMap3D";
import { TableSheet } from "@/components/dinein/TableSheet";

interface Me {
  firstName: string;
  lastName: string;
  restaurantId: string;
  restaurant: { name: string };
  earnings?: { total: number; orders: number };
}

interface OrderLine {
  key: string;
  dish: Dish;
  quantity: number;
  options: DishOption[];
  unitPrice: number;
}

const TABLE_STATUS: Record<string, string> = {
  available: "Bo'sh",
  occupied: "Band",
  ordering: "Buyurtma",
  waiting: "Kutmoqda",
  closed: "Yopiq",
};

export function WaiterTables({
  me, tables, onRefresh, onLogout,
}: {
  me: Me;
  tables: WaiterTable[];
  onRefresh: () => void;
  onLogout: () => void;
}) {
  const [active, setActive] = useState<WaiterTable | null>(null);
  const [view, setView] = useState<"tables" | "orders">("tables");
  const [map3d, setMap3d] = useState(true);
  const [sheet, setSheet] = useState<WaiterTable | null>(null);

  // Stollar holati — 30 soniyada yangilanadi
  useEffect(() => {
    const timer = setInterval(onRefresh, 30000);
    return () => clearInterval(timer);
  }, [onRefresh]);

  if (active) {
    return (
      <WaiterOrder
        table={active}
        restaurantId={me.restaurantId}
        onBack={() => { setActive(null); onRefresh(); }}
      />
    );
  }

  return (
    <div className="di-page">
      <header className="di-header">
        <div style={{ flex: 1 }}>
          <div className="di-header__rest">{me.restaurant.name}</div>
          <div className="di-header__table">
            {me.firstName} {me.lastName}
          </div>
        </div>
        <button onClick={onLogout} className="wt-logout">Chiqish</button>
      </header>

      {/* Bo'limlar */}
      <div className="wt-tabs">
        <button onClick={() => setView("tables")}
          className={`wt-tab ${view === "tables" ? "is-active" : ""}`}>
          Stollar
        </button>
        <button onClick={() => setView("orders")}
          className={`wt-tab ${view === "orders" ? "is-active" : ""}`}>
          Buyurtmalarim
        </button>
      </div>

      {view === "orders" ? (
        <MyWaiterOrders />
      ) : (
        <>
      {/* Chaqiruvlar */}
      <WaiterRequests onDone={onRefresh} />

      {me.earnings && me.earnings.total > 0 && (
        <div className="wt-earnings">
          <span>Daromadingiz</span>
          <b>{som(me.earnings.total)}</b>
          <span className="wt-earnings__sub">{me.earnings.orders} buyurtma</span>
        </div>
      )}

      {/* Ko'rinish tanlash */}
      {tables.length > 0 && (
        <div className="wt-viewmode">
          <button onClick={() => setMap3d(true)}
            className={map3d ? "is-active" : ""}>
            Zal xaritasi
          </button>
          <button onClick={() => setMap3d(false)}
            className={!map3d ? "is-active" : ""}>
            Ro&apos;yxat
          </button>
        </div>
      )}

      {map3d && tables.length > 0 ? (
        <TableMap3D tables={tables} onSelect={setSheet} />
      ) : (
      <main className="di-list">
        {tables.length === 0 ? (
          <div className="di-empty">
            <div className="di-empty__icon">🪑</div>
            <p>Stol biriktirilmagan</p>
          </div>
        ) : (
          <div className="wt-grid">
            {tables.map((t) => {
              const orders = t.activeOrders || [];
              const total = orders.reduce((s, o) => s + (o.total || 0), 0);

              return (
                <button
                  key={t._id}
                  onClick={() => setActive(t)}
                  className={`wt-table ${t.session ? "is-busy" : ""}`}
                >
                  <div className="wt-table__num">{t.tableNumber}</div>
                  {t.tableName && (
                    <div className="wt-table__name">{t.tableName}</div>
                  )}
                  <div className="wt-table__status">
                    {TABLE_STATUS[t.status] || t.status}
                  </div>
                  {orders.length > 0 && (
                    <div className="wt-table__orders">
                      {orders.length} buyurtma · {num(total)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>
      )}

      {sheet && (
        <TableSheet
          table={sheet}
          onClose={() => setSheet(null)}
          onRefresh={onRefresh}
          onNewOrder={() => {
            const t = sheet;
            setSheet(null);
            setActive(t);
          }}
        />
      )}
        </>
      )}
    </div>
  );
}

/** Stol uchun buyurtma yaratish. */
function WaiterOrder({
  table, restaurantId, onBack,
}: {
  table: WaiterTable;
  restaurantId: string;
  onBack: () => void;
}) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [openDish, setOpenDish] = useState<Dish | null>(null);
  const [section, setSection] = useState("all");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cached(`menu:${restaurantId}`, () => waiterApi.menu(restaurantId))
      .then(setDishes)
      .catch(() => setDishes([]))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const sections = Array.from(
    new Set(dishes.map((d) => d.section || d.category || "Menyu")),
  );

  const visible = section === "all"
    ? dishes
    : dishes.filter((d) => (d.section || d.category) === section);

  const addLine = useCallback((dish: Dish, quantity: number, options: DishOption[]) => {
    const key = `${dish._id}__${options.map((o) => o.name).sort().join("|")}`;
    setLines((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + quantity } : l));
      }
      const optPrice = options.reduce((s, o) => s + (o.price || 0), 0);
      return [...prev, { key, dish, quantity, options, unitPrice: dish.price + optPrice }];
    });
  }, []);

  const setQty = (key: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, quantity: qty } : l)),
    );
  };

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  const submit = async () => {
    if (lines.length === 0) return;
    setSending(true);
    setError(null);
    try {
      await waiterApi.createOrder(
        table._id,
        lines.map((l) => ({
          dishId: l.dish._id,
          quantity: l.quantity,
          selectedOptions: l.options.map((o) => ({ name: o.name })),
        })),
      );
      onBack();
    } catch (e) {
      setError((e as ApiError).message);
      setSending(false);
    }
  };

  return (
    <div className="di-page">
      <header className="di-header">
        <button onClick={onBack} className="di-header__back">←</button>
        <div>
          <div className="di-header__rest">
            {table.tableName || `Stol ${table.tableNumber}`}
          </div>
          <div className="di-header__table">Yangi buyurtma</div>
        </div>
      </header>

      {/* Tanlanganlar */}
      {lines.length > 0 && (
        <div className="wt-selected">
          {lines.map((l) => (
            <div key={l.key} className="wt-selected__row">
              <span className="wt-selected__name">{l.dish.name}</span>
              <div className="di-qty di-qty--sm">
                <button onClick={() => setQty(l.key, l.quantity - 1)}>−</button>
                <span>{l.quantity}</span>
                <button onClick={() => setQty(l.key, l.quantity + 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}

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

      <main className="di-list">
        {loading ? (
          <div className="di-loading"><div className="di-spinner" /></div>
        ) : (
          visible.map((d) => (
            <button key={d._id} onClick={() => setOpenDish(d)} className="di-dish">
              {d.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.imageUrl} alt="" className="di-dish__img" loading="lazy" />
              ) : (
                <div className="di-dish__img di-dish__img--empty">🍽</div>
              )}
              <div className="di-dish__body">
                <div className="di-dish__name">{d.name}</div>
                <div className="di-dish__bottom">
                  <span className="di-dish__price">{som(d.price)}</span>
                </div>
              </div>
              <span className="di-dish__add">+</span>
            </button>
          ))
        )}
      </main>

      {error && (
        <div style={{ padding: "0 16px 12px" }}>
          <div className="di-error">{error}</div>
        </div>
      )}

      {count > 0 && (
        <button onClick={submit} disabled={sending} className="di-cartbar">
          <span className="di-cartbar__count">{count}</span>
          <span className="di-cartbar__label">
            {sending ? "Yuborilmoqda..." : "Buyurtma berish"}
          </span>
          <span className="di-cartbar__total">{num(subtotal)}</span>
        </button>
      )}

      {openDish && (
        <DishSheet
          dish={openDish}
          onClose={() => setOpenDish(null)}
          onAdd={(qty, options) => {
            addLine(openDish, qty, options);
            setOpenDish(null);
          }}
        />
      )}
    </div>
  );
}


/** Ofitsiant chaqiruvlari — stol so'rovlari. */
function WaiterRequests({ onDone }: { onDone: () => void }) {
  const [items, setItems] = useState<Array<{
    _id: string; type: string; status: string;
    tableId?: { tableNumber: string; tableName?: string };
    createdAt: string;
  }>>([]);

  const load = useCallback(async () => {
    try {
      setItems(await waiterApi.requests());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const act = async (id: string, status: "accepted" | "done") => {
    try {
      await waiterApi.updateRequest(id, status);
      load();
      onDone();
    } catch {
      /* ignore */
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="wt-requests">
      {items.map((r) => (
        <div key={r._id} className={`wt-request ${r.type === "bill" ? "is-bill" : ""}`}>
          <span className="wt-request__icon">
            {r.type === "bill" ? "🧾" : "🛎"}
          </span>
          <div className="wt-request__body">
            <div className="wt-request__title">
              {r.type === "bill" ? "Hisob so'ralmoqda" : "Chaqirmoqda"}
            </div>
            <div className="wt-request__table">
              Stol {r.tableId?.tableNumber}
            </div>
          </div>
          <button
            onClick={() => act(r._id, r.status === "pending" ? "accepted" : "done")}
            className="wt-request__btn"
          >
            {r.status === "pending" ? "Qabul" : "Bajarildi"}
          </button>
        </div>
      ))}
    </div>
  );
}

/** Ofitsiant o'z buyurtmalari va bugungi natijasi. */
function MyWaiterOrders() {
  const [data, setData] = useState<{
    orders: Array<{
      _id: string; dineInNumber: string; total: number; status: string;
      serviceFee: number; createdAt: string;
      items: Array<{ name: string; quantity: number }>;
      tableId?: { tableNumber: string; tableName?: string };
    }>;
    today: { orders: number; sales: number; serviceFee: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setData(await waiterApi.orders());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const LABEL: Record<string, string> = {
    pending: "Yangi", accepted: "Qabul", preparing: "Tayyorlanmoqda",
    ready: "Tayyor", served: "Berildi", completed: "Yakunlandi",
    cancelled: "Bekor",
  };

  if (loading) {
    return <div className="di-loading"><div className="di-spinner" /></div>;
  }

  return (
    <>
      {data?.today && (
        <div className="wt-today">
          <div>
            <div className="wt-today__label">Bugungi savdo</div>
            <div className="wt-today__value">{num(data.today.sales)}</div>
          </div>
          <div>
            <div className="wt-today__label">Xizmat haqi</div>
            <div className="wt-today__value is-accent">{num(data.today.serviceFee)}</div>
          </div>
          <div>
            <div className="wt-today__label">Buyurtma</div>
            <div className="wt-today__value">{data.today.orders}</div>
          </div>
        </div>
      )}

      <main className="di-list">
        {!data?.orders?.length ? (
          <div className="di-empty">
            <div className="di-empty__icon">📋</div>
            <p>Buyurtma yo&apos;q</p>
          </div>
        ) : (
          data.orders.map((o) => (
            <div key={o._id} className="di-order">
              <div className="di-order__head">
                <span className="di-order__num">#{o.dineInNumber}</span>
                <span className="di-order__status is-new">
                  {LABEL[o.status] || o.status}
                </span>
              </div>

              <div className="di-order__items">
                <div className="di-order__item">
                  <span>
                    {o.tableId?.tableName || `Stol ${o.tableId?.tableNumber}`}
                    {" · "}
                    {new Date(o.createdAt).toLocaleTimeString("ru-RU", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                {o.items?.slice(0, 3).map((it, i) => (
                  <div key={i} className="di-order__item">
                    <span>{it.name} ×{it.quantity}</span>
                  </div>
                ))}
                {o.items && o.items.length > 3 && (
                  <div className="di-order__item">
                    <span>+{o.items.length - 3} ta</span>
                  </div>
                )}
              </div>

              {o.serviceFee > 0 && (
                <div className="di-order__fee">
                  <span>Sizning ulushingiz</span>
                  <span style={{ color: "var(--di-brand)" }}>{som(o.serviceFee)}</span>
                </div>
              )}

              <div className="di-order__total">
                <span>Jami</span>
                <b>{som(o.total)}</b>
              </div>
            </div>
          ))
        )}
      </main>
    </>
  );
}
