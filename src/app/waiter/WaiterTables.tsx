"use client";

import { useState, useEffect, useCallback } from "react";
import { waiterApi, type WaiterTable, type Dish, type DishOption, ApiError } from "@/lib/dinein/api";
import { som, num } from "@/lib/dinein/format";
import { cached } from "@/lib/dinein/cache";
import { DishSheet } from "@/components/dinein/DishSheet";
import { TableSheet } from "@/components/dinein/TableSheet";
import { FullscreenButton } from "@/components/dinein/Fullscreen";
import {
  Armchair, ClipboardList, BarChart3, Users, Clock, Search,
  SlidersHorizontal, Receipt, Timer, CircleX, LogOut,
  MoreVertical, ChevronRight, Plus,
} from "lucide-react";

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

/* ═══════════════════════════════════════════
   Stol holatlari

   Bazadagi status (available/occupied/ordering/waiting/closed)
   ofitsiant uchun tushunarli beshta holatga keltiriladi.
   "Hisob so'ralgan" alohida: u stol statusi emas, mijozning
   so'rovi (TableRequest type='bill').
   ═══════════════════════════════════════════ */
type LucideIcon = typeof Armchair;

type State = "free" | "pending" | "busy" | "bill" | "closed";

const STATE: Record<State, {
  label: string; color: string; Icon: LucideIcon; action: string;
}> = {
  free:    { label: "Bo'sh",           color: "#34C759", Icon: Armchair, action: "Stolni ochish" },
  pending: { label: "Kutilmoqda",      color: "#F5A524", Icon: Timer,    action: "Buyurtmani ko'rish" },
  busy:    { label: "Band",            color: "#E14B42", Icon: Users,    action: "Buyurtmani ko'rish" },
  bill:    { label: "Hisob so'ralgan", color: "#3B82F6", Icon: Receipt,  action: "Hisob chiqarish" },
  closed:  { label: "Yopilgan",        color: "#8E8E93", Icon: CircleX,  action: "Yopiq" },
};

const ORDER: State[] = ["free", "pending", "busy", "bill", "closed"];

function stateOf(t: WaiterTable, billTables: Set<string>): State {
  if (billTables.has(t._id)) return "bill";
  if (t.status === "closed") return "closed";
  if (t.status === "ordering" || t.status === "waiting") return "pending";
  if (t.isBusy || t.status === "occupied" || (t.guestCount || 0) > 0) return "busy";
  return "free";
}

/** Stol qachon ochilgani — "18:42". */
function openedAt(t: WaiterTable) {
  const iso = t.session?.createdAt;
  if (!iso) return "\u2013";
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit", minute: "2-digit",
  });
}

export function WaiterTables({
  me, tables, onRefresh, onLogout, extraTabs, subtitle, hideLogout, compact,
}: {
  me: Me;
  tables: WaiterTable[];
  onRefresh: () => void;
  onLogout: () => void;
  /*
   * Kiosk rejimi uchun (2026-08).
   *
   * Kiosk ham SHU ekranni ko'radi — stollar, stol varag'i,
   * taom tanlash bir xil. Farqi pastki menyuda: kioskda
   * "Buyurtmalar" va "Hisobotlar" O'RNIGA "Menyu" va
   * "Stop List" turadi. Hisobotlar — ofitsiantning shaxsiy
   * daromadi, kiosk esa shaxsga bog'lanmagan, shuning uchun
   * u yerda ko'rsatadigan narsa yo'q.
   *
   * Ekranni nusxalash o'rniga tashqi yorliqlar prop bilan
   * uzatiladi: stol mantig'i bitta joyda qoladi.
   */
  compact?: boolean;
  extraTabs?: Array<{
    key: string;
    label: string;
    Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
    render: () => React.ReactNode;
  }>;
  subtitle?: string;
  hideLogout?: boolean;
}) {
  const [active, setActive] = useState<WaiterTable | null>(null);
  const [tab, setTab] = useState<string>("tables");
  const [sheet, setSheet] = useState<WaiterTable | null>(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<State | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);

  // Hisob so'ragan stollar — TableRequest'dan
  const [billTables, setBillTables] = useState<Set<string>>(new Set());

  const loadRequests = useCallback(async () => {
    try {
      const list = await waiterApi.requests();
      const ids = list
        .filter((r) => r.type === "bill" && r.status !== "done")
        .map((r) => (r.tableId as unknown as { _id?: string })?._id)
        .filter(Boolean) as string[];
      setBillTables(new Set(ids));
    } catch {
      /* so'rovlar yuklanmasa ham stollar ko'rinadi */
    }
  }, []);

  // Stollar holati — 30 soniyada yangilanadi
  useEffect(() => {
    loadRequests();
    const timer = setInterval(() => { onRefresh(); loadRequests(); }, 30000);
    return () => clearInterval(timer);
  }, [onRefresh, loadRequests]);

  const counts = ORDER.reduce((acc, k) => {
    acc[k] = tables.filter((t) => stateOf(t, billTables) === k).length;
    return acc;
  }, {} as Record<State, number>);

  const visible = tables.filter((t) => {
    if (filter !== "all" && stateOf(t, billTables) !== filter) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return `${t.tableNumber} ${t.tableName || ""}`.toLowerCase().includes(q);
  });

  if (active) {
    return (
      <WaiterOrder
        table={active}
        restaurantId={me.restaurantId}
        onBack={() => { setActive(null); onRefresh(); }}
      />
    );
  }

  const openTable = (t: WaiterTable) => {
    if (stateOf(t, billTables) === "free") setActive(t);
    else setSheet(t);
  };

  return (
    <div className="di-page wt-app">
      <header className="di-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="di-header__rest">{me.restaurant.name}</div>
          <div className="di-header__table">
            {subtitle ?? `${me.firstName} ${me.lastName}`}
          </div>
        </div>
        <FullscreenButton />
        {!hideLogout && (
          <button onClick={onLogout} className="wt-logout">
            Chiqish <LogOut size={15} strokeWidth={2.2} />
          </button>
        )}
      </header>

      {tab === "tables" && (
        <>
          {/* Holat bo'yicha jamlanma — bosilsa filtrlaydi */}
          <div className="wt-stats">
            {ORDER.map((k) => {
              const st = STATE[k];
              const on = filter === k;
              return (
                <button
                  key={k}
                  onClick={() => setFilter(on ? "all" : k)}
                  className={`wt-stat ${on ? "is-on" : ""}`}
                  style={on ? { borderColor: st.color } : undefined}
                >
                  <span className="wt-stat__dot" style={{ background: `${st.color}22`, color: st.color }}>
                    <st.Icon size={15} strokeWidth={2.2} />
                  </span>
                  <span className="wt-stat__body">
                    <b>{counts[k]}</b>
                    <small style={{ color: st.color }}>{st.label}</small>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Ko'rinish, qidiruv, filtr */}
          <div className="wt-toolbar">
            <label className="wt-search">
              <Search size={16} strokeWidth={2.2} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Stol qidirish..."
                inputMode="search"
              />
            </label>

            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`wt-filter ${filter !== "all" ? "is-on" : ""}`}
              aria-label="Filtr"
            >
              <SlidersHorizontal size={17} strokeWidth={2.2} />
            </button>
          </div>

          {filterOpen && (
            <div className="wt-chips">
              <button
                onClick={() => { setFilter("all"); setFilterOpen(false); }}
                className={filter === "all" ? "is-on" : ""}
              >
                Hammasi
              </button>
              {ORDER.map((k) => (
                <button
                  key={k}
                  onClick={() => { setFilter(k); setFilterOpen(false); }}
                  className={filter === k ? "is-on" : ""}
                  style={filter === k ? { background: STATE[k].color, color: "#0F0C0A" } : undefined}
                >
                  {STATE[k].label}
                </button>
              ))}
            </div>
          )}

          {/* Chaqiruvlar */}
          <WaiterRequests onDone={() => { onRefresh(); loadRequests(); }} />

          <main className="di-list">
            {visible.length === 0 ? (
              <div className="di-empty">
                <div className="di-empty__icon"><Armchair size={34} strokeWidth={1.6} /></div>
                <p>{tables.length === 0 ? "Stol biriktirilmagan" : "Topilmadi"}</p>
              </div>
            ) : (
              <div className="wt-grid">
                {visible.map((t) => (
                  <TableCard
                    key={t._id}
                    table={t}
                    state={stateOf(t, billTables)}
                    onOpen={() => openTable(t)}
                    onMenu={() => setSheet(t)}
                    compact={compact}
                  />
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {!extraTabs && tab === "orders" && <MyWaiterOrders />}
      {!extraTabs && tab === "reports" && <WaiterReports me={me} />}

      {extraTabs?.map((t) => (
        tab === t.key ? <div key={t.key}>{t.render()}</div> : null
      ))}

      {/* Pastki menyu — Stollar o'rtada, ko'tarilgan doirada.
          U eng ko'p ishlatiladigan bo'lim, shuning uchun barmoq
          uchun eng qulay joyda turadi. */}
      <nav className="wt-nav">
        {extraTabs ? (
          <NavItem
            t={extraTabs[0]}
            active={tab === extraTabs[0]?.key}
            onClick={() => setTab(extraTabs[0].key)}
          />
        ) : (
          <button
            onClick={() => setTab("orders")}
            className={`wt-nav__item ${tab === "orders" ? "is-on" : ""}`}
          >
            <ClipboardList size={21} strokeWidth={2} />
            <span>Buyurtmalar</span>
          </button>
        )}

        <button
          onClick={() => setTab("tables")}
          className={`wt-nav__center ${tab === "tables" ? "is-on" : ""}`}
          aria-label="Stollar"
        >
          <span className="wt-nav__disc">
            <Armchair size={24} strokeWidth={2} />
          </span>
          <span>Stollar</span>
        </button>

        {extraTabs ? (
          extraTabs[1] ? (
            <NavItem
              t={extraTabs[1]}
              active={tab === extraTabs[1].key}
              onClick={() => setTab(extraTabs[1].key)}
            />
          ) : <span className="wt-nav__item" aria-hidden />
        ) : (
          <button
            onClick={() => setTab("reports")}
            className={`wt-nav__item ${tab === "reports" ? "is-on" : ""}`}
          >
            <BarChart3 size={21} strokeWidth={2} />
            <span>Hisobotlar</span>
          </button>
        )}
      </nav>

      {sheet && (
        <TableSheet
          table={sheet}
          onClose={() => setSheet(null)}
          onRefresh={() => { onRefresh(); loadRequests(); }}
          onNewOrder={() => {
            const t = sheet;
            setSheet(null);
            setActive(t);
          }}
        />
      )}
    </div>
  );
}

/** Pastki menyu yorlig'i — kiosk uzatgan bo'limlar uchun. */
function NavItem({
  t, active, onClick,
}: {
  t: { label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={`wt-nav__item ${active ? "is-on" : ""}`}>
      <t.Icon size={21} strokeWidth={2} />
      <span>{t.label}</span>
    </button>
  );
}

/** Stol kartasi — ro'yxat ko'rinishida. */
function TableCard({
  table: t, state, onOpen, onMenu, compact,
}: {
  table: WaiterTable;
  state: State;
  onOpen: () => void;
  onMenu: () => void;
  compact?: boolean;
}) {
  const st = STATE[state];
  const capacity = t.capacity || 4;
  const guests = t.guestCount || 0;
  // Sig'imdan ko'p mehmon kelsa stul qo'shiladi
  const seats = Math.min(14, Math.max(2, capacity, guests));

  /*
   * O'rindiqlar markazdan qancha uzoqda turishi.
   *
   * Ilgari bu qiymat shu yerda 44px qilib qotirilgan edi.
   * Kartani kichraytirganda disk 96 -> 62px bo'ldi-yu, o'rindiqlar
   * o'sha 44px da qolib, stoldan ajralib uchib yurdi.
   * Endi radius CSS'dan (--seat-r) olinadi va disk bilan birga
   * kichrayadi — chizma har o'lchamda butun ko'rinadi.
   */
  const plan = (
    <div className="wt-card__seats">
      {Array.from({ length: seats }).map((_, i) => (
        <span
          key={i}
          className={`wt-seat ${i < guests ? "is-taken" : ""}`}
          style={{
            transform: `rotate(${(i / seats) * 360 - 90}deg) translateY(calc(var(--seat-r) * -1))`,
          }}
        />
      ))}
      <span className="wt-card__disc">{t.tableNumber}</span>
    </div>
  );

  /*
   * IXCHAM KARTA (kiosk).
   *
   * Tepadagi "⋮" va pastdagi katta tugma olib tashlandi:
   * kartaning O'ZI tugma. Zalda ofitsiant yugurib yuradi —
   * 24px li nishonga tegishdan ko'ra butun kartaga urish
   * osonroq va xato bosish kamayadi.
   *
   * Holat rangi chap chekkadagi ingichka chiziq va disk
   * halqasi orqali beriladi — matnli nishon joy yegan edi.
   *
   * Uzoq bosish -> stol varag'i (mehmon soni, hisob, yopish).
   */
  if (compact) {
    return (
      <article
        className="wt-card wt-card--mini"
        style={{ ["--c" as string]: st.color }}
        onClick={onOpen}
        onContextMenu={(e) => { e.preventDefault(); onMenu(); }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          const id = setTimeout(onMenu, 480);
          const cancel = () => {
            clearTimeout(id);
            window.removeEventListener("pointerup", cancel);
            window.removeEventListener("pointercancel", cancel);
            window.removeEventListener("pointermove", cancel);
          };
          window.addEventListener("pointerup", cancel);
          window.addEventListener("pointercancel", cancel);
          window.addEventListener("pointermove", cancel);
        }}
        role="button"
        tabIndex={0}
        aria-label={`${t.tableName || `Stol ${t.tableNumber}`} — ${st.label}`}
      >
        <div className="wt-card__plan">{plan}</div>

        <div className="wt-mini__name">{t.tableName || `Stol ${t.tableNumber}`}</div>

        <div className="wt-mini__row">
          <span><Users size={11} strokeWidth={2.4} />{guests}/{capacity}</span>
          {openedAt(t) !== "–" && (
            <span><Clock size={11} strokeWidth={2.4} />{openedAt(t)}</span>
          )}
        </div>

        {(t.orderTotal || 0) > 0 && (
          <div className="wt-mini__sum">{som(t.orderTotal || 0)}</div>
        )}
      </article>
    );
  }

  return (
    <article className="wt-card" style={{ ["--c" as string]: st.color }}>
      <div className="wt-card__top">
        <span className="wt-card__badge">
          <i /> {st.label.toUpperCase()}
        </span>
        <button onClick={onMenu} className="wt-card__more" aria-label="Batafsil">
          <MoreVertical size={16} strokeWidth={2.2} />
        </button>
      </div>

      {/* Stol chizmasi */}
      <div className="wt-card__plan">{plan}</div>

      <div className="wt-card__name">{t.tableName || `Stol ${t.tableNumber}`}</div>

      <div className="wt-card__meta">
        <span><Users size={13} strokeWidth={2.2} /> {guests} / {capacity}</span>
        <span><Clock size={13} strokeWidth={2.2} /> {openedAt(t)}</span>
      </div>

      <div className="wt-card__sum">{som(t.orderTotal || 0)}</div>

      <button onClick={onOpen} className="wt-card__cta" disabled={state === "closed"}>
        <span>{st.action}</span>
        {state === "free"
          ? <Plus size={15} strokeWidth={2.6} />
          : <ChevronRight size={15} strokeWidth={2.6} />}
      </button>
    </article>
  );
}

/** Hisobotlar — bugungi va umumiy natija. */
function WaiterReports({ me }: { me: Me }) {
  const [data, setData] = useState<{
    today: { orders: number; sales: number; serviceFee: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    waiterApi.orders()
      .then((d) => setData({ today: d.today }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="di-loading"><div className="di-spinner" /></div>;
  }

  const rows: Array<[string, string]> = [
    ["Bugungi buyurtmalar", String(data?.today.orders ?? 0)],
    ["Bugungi savdo", som(data?.today.sales ?? 0)],
    ["Bugungi xizmat haqi", som(data?.today.serviceFee ?? 0)],
  ];

  return (
    <main className="di-list">
      <div className="wt-report">
        <div className="wt-report__big">
          <small>Jami daromadingiz</small>
          <b>{som(me.earnings?.total ?? 0)}</b>
          <span>{me.earnings?.orders ?? 0} buyurtma</span>
        </div>

        <div className="wt-report__rows">
          {rows.map(([k, v]) => (
            <div key={k} className="wt-report__row">
              <span>{k}</span><b>{v}</b>
            </div>
          ))}
        </div>

        <p className="wt-report__note">
          Xizmat haqi faqat ofitsiant qabul qilgan buyurtmalarga
          qo&apos;llanadi. To&apos;lov restoran tomonidan amalga oshiriladi.
        </p>
      </div>
    </main>
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

  /** Shu taomdan savatda nechta bor (barcha variantlari bilan). */
  const qtyOf = (dish: Dish) =>
    lines.reduce((n, l) => (l.dish._id === dish._id ? n + l.quantity : n), 0);

  /**
   * Taom bosilganda darhol savatga qo'shiladi — alohida sahifa
   * ochilmaydi. Faqat majburiy variant bo'lsa oyna ochiladi,
   * chunki tanlovsiz narxni aniqlab bo'lmaydi.
   */
  const tapDish = (dish: Dish) => {
    const mustChoose = (dish.optionGroups || []).some((g) => g.required);
    if (mustChoose) { setOpenDish(dish); return; }
    addLine(dish, 1, []);
  };

  /** Ro'yxatdagi +/− tugmalari. */
  const stepDish = (dish: Dish, delta: number) => {
    if (delta > 0) { tapDish(dish); return; }
    setLines((prev) => {
      // Oxirgi qo'shilgan variantdan kamaytiramiz
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].dish._id !== dish._id) continue;
        const line = prev[i];
        if (line.quantity <= 1) return prev.filter((_, k) => k !== i);
        return prev.map((l, k) => (k === i ? { ...l, quantity: l.quantity - 1 } : l));
      }
      return prev;
    });
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
          visible.map((d) => {
            const qty = qtyOf(d);
            const mustChoose = (d.optionGroups || []).some((g) => g.required);
            const hasOptions = (d.optionGroups || []).length > 0;

            return (
              <div
                key={d._id}
                role="button"
                tabIndex={0}
                onClick={() => tapDish(d)}
                onKeyDown={(e) => { if (e.key === "Enter") tapDish(d); }}
                className={`di-dish ${qty > 0 ? "is-picked" : ""}`}
              >
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
                    {hasOptions && !mustChoose && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDish(d); }}
                        className="di-dish__opts"
                      >
                        Variantlar
                      </button>
                    )}
                  </div>
                </div>

                {qty > 0 ? (
                  <div className="di-qty di-qty--sm" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => stepDish(d, -1)} aria-label="Kamaytirish">−</button>
                    <span>{qty}</span>
                    <button onClick={() => stepDish(d, 1)} aria-label="Ko'paytirish">+</button>
                  </div>
                ) : (
                  <span className="di-dish__add">+</span>
                )}
              </div>
            );
          })
        )}
      </main>

      {/* Xato savat tugmasi tepasida — avval sahifa oxirida edi,
          uzun menyu ostida qolib ofitsiantga ko'rinmasdi */}
      {error && (
        <div className="wt-error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Yopish">✕</button>
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
