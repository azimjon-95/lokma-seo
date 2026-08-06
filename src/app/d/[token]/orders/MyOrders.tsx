"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { dineInApi, type DineInOrder } from "@/lib/dinein/api";
import { loadSession, type StoredSession } from "@/lib/dinein/session";
import { som } from "@/lib/dinein/format";
import { TableActions } from "@/components/dinein/TableActions";
import { useSessionSocket } from "@/lib/dinein/socket";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Yuborildi", cls: "is-new" },
  accepted: { label: "Qabul qilindi", cls: "is-accepted" },
  preparing: { label: "Tayyorlanmoqda", cls: "is-preparing" },
  ready: { label: "Tayyor", cls: "is-ready" },
  served: { label: "Berildi", cls: "is-served" },
  completed: { label: "Yakunlandi", cls: "is-done" },
  cancelled: { label: "Bekor qilindi", cls: "is-cancelled" },
};

export function MyOrders({ token }: { token: string }) {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [orders, setOrders] = useState<DineInOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s: StoredSession) => {
    try {
      const data = await dineInApi.sessionOrders(s.sessionId);
      setOrders(data.orders);
      setTotal(data.total);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const s = loadSession();
    if (!s || s.token !== token) {
      router.replace(`/d/${token}`);
      return;
    }
    setSession(s);
    load(s);

    // Socket ulanmasa ham yangilanadi — zaxira
    const timer = setInterval(() => load(s), 30000);
    return () => clearInterval(timer);
  }, [token, router, load]);

  // Real vaqtda holat yangilanishi
  useSessionSocket(session?.sessionId, {
    onStatus: () => { if (session) load(session); },
    onSessionClosed: () => {
      alert("Stol yopildi. Rahmat!");
      router.replace(`/d/${token}`);
    },
  });

  if (!session) return null;

  return (
    <div className="di-page">
      <header className="di-header">
        <button onClick={() => router.push(`/d/${token}/menu`)} className="di-header__back">
          ←
        </button>
        <div>
          <div className="di-header__rest">Buyurtmalarim</div>
          <div className="di-header__table">
            {session.tableName
              ? `${session.tableName} · ${session.tableNumber}`
              : `Stol ${session.tableNumber}`}
          </div>
        </div>
      </header>

      {/* Ofitsiant chaqirish va hisob */}
      <TableActions sessionId={session.sessionId} />

      <main className="di-list">
        {loading ? (
          <div className="di-loading"><div className="di-spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="di-empty">
            <div className="di-empty__icon">📦</div>
            <p>Hali buyurtma bermadingiz</p>
            <button
              onClick={() => router.push(`/d/${token}/menu`)}
              className="di-btn di-btn--primary"
            >
              Menyuni ochish
            </button>
          </div>
        ) : (
          <>
            {orders.map((o) => {
              const st = STATUS[o.status] || STATUS.pending;
              return (
                <div key={o._id} className="di-order">
                  <div className="di-order__head">
                    <span className="di-order__num">#{o.dineInNumber}</span>
                    <span className={`di-order__status ${st.cls}`}>{st.label}</span>
                  </div>

                  <div className="di-order__items">
                    {o.items.map((it, i) => (
                      <div key={i} className="di-order__item">
                        <span>{it.name} ×{it.quantity}</span>
                        <span>{som(it.unitPrice * it.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {o.serviceFee > 0 && (
                    <div className="di-order__fee">
                      <span>Xizmat haqi</span>
                      <span>{som(o.serviceFee)}</span>
                    </div>
                  )}

                  <div className="di-order__total">
                    <span>Jami</span>
                    <b>{som(o.total)}</b>
                  </div>
                </div>
              );
            })}

            <div className="di-grand">
              <span>Umumiy hisob</span>
              <b>{som(total)}</b>
            </div>

            <button
              onClick={() => router.push(`/d/${token}/menu`)}
              className="di-btn di-btn--outline di-btn--block"
            >
              + Yana buyurtma berish
            </button>
          </>
        )}
      </main>
    </div>
  );
}
