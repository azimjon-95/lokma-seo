"use client";

import { useState, useEffect, useCallback } from "react";
import { waiterApi, type WaiterTable, ApiError } from "@/lib/dinein/api";
import { som } from "@/lib/dinein/format";

const STATUS: Record<string, { label: string; next?: string; nextLabel?: string }> = {
  pending: { label: "Yangi", next: "accepted", nextLabel: "Qabul qilish" },
  accepted: { label: "Qabul qilindi", next: "preparing", nextLabel: "Oshxonaga" },
  preparing: { label: "Tayyorlanmoqda", next: "ready", nextLabel: "Tayyor" },
  ready: { label: "Tayyor", next: "served", nextLabel: "Berildi" },
  served: { label: "Berildi", next: "completed", nextLabel: "Yakunlash" },
  completed: { label: "Yakunlandi" },
  cancelled: { label: "Bekor qilingan" },
};

/** Stol paneli — bosilganda pastdan chiqadi. */
export function TableSheet({
  table, onClose, onNewOrder, onRefresh,
}: {
  table: WaiterTable;
  onClose: () => void;
  onNewOrder: () => void;
  onRefresh: () => void;
}) {
  const [data, setData] = useState<Awaited<ReturnType<typeof waiterApi.tableDetail>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [guests, setGuests] = useState(table.guestCount || 0);

  const load = useCallback(async () => {
    try {
      const d = await waiterApi.tableDetail(table._id);
      setData(d);
      setGuests(d.table.guestCount || 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [table._id]);

  useEffect(() => {
    load();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [load]);

  const setGuestCount = async (n: number) => {
    const count = Math.max(0, Math.min(table.capacity + 4, n));
    setGuests(count);
    try {
      await waiterApi.setGuests(table._id, count);
      onRefresh();
    } catch {
      setGuests(data?.table.guestCount || 0);
    }
  };

  const advance = async (orderId: string, status: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await waiterApi.setOrderStatus(orderId, status);
      await load();
      onRefresh();
    } catch (e) {
      alert((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  const closeTable = async () => {
    if (!confirm(`Stol ${table.tableNumber} yopilsinmi?\n\nHisob yakunlanadi.`)) return;
    setBusy(true);
    try {
      await waiterApi.closeTable(table._id);
      onRefresh();
      onClose();
    } catch (e) {
      const err = e as ApiError;
      if (err.code === "OPEN_ORDERS" && confirm(`${err.message}\n\nBaribir yopilsinmi?`)) {
        await waiterApi.closeTable(table._id, true);
        onRefresh();
        onClose();
      } else {
        alert(err.message);
      }
      setBusy(false);
    }
  };

  const active = data?.orders.filter((o) => o.status !== "cancelled") || [];

  return (
    <div className="di-sheet" onClick={onClose}>
      <div className="di-sheet__box" onClick={(e) => e.stopPropagation()}>
        <div className="di-sheet__handle" />

        {/* Sarlavha */}
        <div className="ts-head">
          <div>
            <div className="ts-head__num">
              {table.tableName || `Stol ${table.tableNumber}`}
            </div>
            <div className="ts-head__sub">
              {data?.summary.orders
                ? `${data.summary.orders} buyurtma`
                : "Buyurtma yo'q"}
            </div>
          </div>
          <button onClick={onClose} className="di-sheet__close">✕</button>
        </div>

        {/* Mijozlar soni */}
        <div className="ts-guests">
          <span className="ts-guests__label">Mijozlar</span>
          <div className="di-qty di-qty--sm">
            <button onClick={() => setGuestCount(guests - 1)}>−</button>
            <span>{guests}</span>
            <button onClick={() => setGuestCount(guests + 1)}>+</button>
          </div>
          <span className="ts-guests__cap">/ {table.capacity} joy</span>
        </div>

        {/* Buyurtmalar */}
        <div className="di-sheet__body">
          {loading ? (
            <div className="di-loading"><div className="di-spinner" /></div>
          ) : active.length === 0 ? (
            <div className="ts-empty">
              <div className="ts-empty__icon">🍽</div>
              <p>Hali buyurtma berilmagan</p>
            </div>
          ) : (
            active.map((o) => {
              const st = STATUS[o.status] || STATUS.pending;
              return (
                <div key={o._id} className="ts-order">
                  <div className="ts-order__head">
                    <span className="ts-order__num">#{o.dineInNumber}</span>
                    <span className="ts-order__status">{st.label}</span>
                  </div>

                  <div className="ts-order__items">
                    {o.items.map((it, i) => (
                      <div key={i} className="ts-order__item">
                        <span>{it.name} ×{it.quantity}</span>
                        <span>{som(it.unitPrice * it.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {o.note && <div className="ts-order__note">{o.note}</div>}

                  <div className="ts-order__foot">
                    <b>{som(o.total)}</b>
                    {st.next && (
                      <button
                        onClick={() => advance(o._id, st.next!)}
                        disabled={busy}
                        className="ts-order__btn"
                      >
                        {st.nextLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Hisob va amallar */}
        <div className="ts-foot">
          {data && data.summary.total > 0 && (
            <div className="ts-total">
              <div className="ts-total__row">
                <span>Taomlar</span>
                <span>{som(data.summary.subtotal)}</span>
              </div>
              {data.summary.serviceFee > 0 && (
                <div className="ts-total__row">
                  <span>Xizmat haqi</span>
                  <span>{som(data.summary.serviceFee)}</span>
                </div>
              )}
              <div className="ts-total__row ts-total__row--sum">
                <span>Jami</span>
                <b>{som(data.summary.total)}</b>
              </div>
            </div>
          )}

          <div className="ts-actions">
            <button onClick={onNewOrder} className="di-btn di-btn--primary">
              + Buyurtma
            </button>
            {data && data.summary.total > 0 && (
              <button onClick={closeTable} disabled={busy} className="ts-close-btn">
                Hisobni yopish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
