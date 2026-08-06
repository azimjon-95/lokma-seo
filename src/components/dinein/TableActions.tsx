"use client";

import { useState, useEffect, useCallback } from "react";
import { dineInApi, ApiError } from "@/lib/dinein/api";

type Req = { _id: string; type: string; status: string; acceptedByName?: string };

/**
 * Ofitsiant chaqirish va hisob so'rash.
 *
 * Spam oldini olish serverda — 90 soniya ichida qayta
 * yuborib bo'lmaydi.
 */
export function TableActions({ sessionId }: { sessionId: string }) {
  const [requests, setRequests] = useState<Req[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRequests(await dineInApi.myRequests(sessionId));
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const send = async (type: "waiter" | "bill") => {
    setBusy(type);
    try {
      await dineInApi.createRequest(sessionId, type);
      setToast(
        type === "waiter"
          ? "Ofitsiant chaqirildi"
          : "Hisob so'raldi",
      );
      load();
    } catch (e) {
      const err = e as ApiError;
      setToast(err.message);
      if (err.code === "COOLDOWN") load();
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const active = (type: string) =>
    requests.find((r) => r.type === type && r.status !== "done");

  const waiterReq = active("waiter");
  const billReq = active("bill");

  return (
    <>
      <div className="di-actions">
        <button
          onClick={() => send("waiter")}
          disabled={busy === "waiter" || Boolean(waiterReq)}
          className={`di-action ${waiterReq ? "is-sent" : ""}`}
        >
          <span className="di-action__icon">🛎</span>
          <span className="di-action__label">
            {waiterReq
              ? waiterReq.status === "accepted"
                ? "Ofitsiant keladi"
                : "Chaqirildi"
              : "Ofitsiant"}
          </span>
        </button>

        <button
          onClick={() => send("bill")}
          disabled={busy === "bill" || Boolean(billReq)}
          className={`di-action ${billReq ? "is-sent" : ""}`}
        >
          <span className="di-action__icon">🧾</span>
          <span className="di-action__label">
            {billReq
              ? billReq.status === "accepted"
                ? "Hisob tayyorlanmoqda"
                : "So'raldi"
              : "Hisob"}
          </span>
        </button>
      </div>

      {toast && <div className="di-toast">{toast}</div>}
    </>
  );
}
