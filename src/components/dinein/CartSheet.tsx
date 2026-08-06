"use client";

import { useState, useEffect } from "react";
import { dineInApi, ApiError } from "@/lib/dinein/api";
import { useCart, toOrderItems } from "@/lib/dinein/cart";
import type { StoredSession } from "@/lib/dinein/session";
import { som } from "@/lib/dinein/format";

/** Savat — buyurtma berish. */
export function CartSheet({
  session,
  onClose,
  onOrdered,
}: {
  session: StoredSession;
  onClose: () => void;
  onOrdered: () => void;
}) {
  const cart = useCart();
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const submit = async () => {
    if (cart.items.length === 0) return;
    setSending(true);
    setError(null);

    try {
      await dineInApi.createOrder(
        session.sessionId,
        toOrderItems(cart.items),
        note,
      );
      cart.clear();
      onOrdered();
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);

      // Sessiya yopilgan — QR ni qayta skanerlash kerak
      if (err.code === "SESSION_CLOSED") {
        setTimeout(() => {
          window.location.href = `/d/${session.token}`;
        }, 2500);
      }
      setSending(false);
    }
  };

  return (
    <div className="di-sheet" onClick={onClose}>
      <div className="di-sheet__box" onClick={(e) => e.stopPropagation()}>
        <div className="di-sheet__handle" />

        <div className="di-sheet__head">
          <h2 className="di-sheet__name">Savat</h2>
          <button onClick={onClose} className="di-sheet__close">✕</button>
        </div>

        <div className="di-sheet__body">
          {cart.items.length === 0 ? (
            <p className="di-cart__empty">Savat bo&apos;sh</p>
          ) : (
            cart.items.map((item) => (
              <div key={item.key} className="di-cart-item">
                <div className="di-cart-item__body">
                  <div className="di-cart-item__name">{item.dish.name}</div>
                  {item.selectedOptions.length > 0 && (
                    <div className="di-cart-item__opts">
                      {item.selectedOptions.map((o) => o.name).join(", ")}
                    </div>
                  )}
                  <div className="di-cart-item__price">
                    {som(item.unitPrice * item.quantity)}
                  </div>
                </div>

                <div className="di-qty di-qty--sm">
                  <button onClick={() => cart.setQuantity(item.key, item.quantity - 1)}>
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => cart.setQuantity(item.key, item.quantity + 1)}>
                    +
                  </button>
                </div>
              </div>
            ))
          )}

          {cart.items.length > 0 && (
            <div className="di-hint">
              Chegirma va xizmat haqi buyurtma berilganda hisoblanadi
            </div>
          )}

          {cart.items.length > 0 && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Izoh (ixtiyoriy)"
              rows={2}
              className="di-note"
            />
          )}
        </div>

        {cart.items.length > 0 && (
          <div className="di-sheet__footer di-sheet__footer--col">
            <div className="di-total">
              <span>Jami</span>
              <b>{som(cart.subtotal)}</b>
            </div>

            {error && <div className="di-error">{error}</div>}

            <button
              onClick={submit}
              disabled={sending}
              className="di-btn di-btn--primary di-btn--block"
            >
              {sending ? "Yuborilmoqda..." : "Buyurtma berish"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
