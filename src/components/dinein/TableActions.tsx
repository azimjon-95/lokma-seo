"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { dineInApi, ApiError } from "@/lib/dinein/api";

type Req = {
  _id: string;
  type: string;
  status: string;
  acceptedByName?: string;
  createdAt: string;
};

/** Server bilan bir xil — 3 daqiqa. */
const COOLDOWN_MS = 3 * 60_000;

/**
 * Ofitsiant chaqirish va hisob so'rash.
 *
 * Yuborilgach 3 daqiqa davomida tugma o'chiq turadi va ichida
 * qolgan vaqt sanaladi — xodim javob berdimi yoki yo'qmi, bunga
 * qaramasdan. 3 daqiqa o'tgach tugma o'zi qayta yoqiladi: xodim
 * kelmagan bo'lsa mijoz yana chaqira oladi. Avval tugma xodim
 * so'rovni "done" deb belgilashigacha CHEKSIZ o'chiq turardi —
 * shu sabab kutib qolgan mijoz qayta chaqira olmasdi.
 */
export function TableActions({ sessionId }: { sessionId: string }) {
  const [requests, setRequests] = useState<Req[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Har turdagi so'rov uchun qachon qayta ruxsat berilishi (ms, epoch)
  const [unlockAt, setUnlockAt] = useState<Record<string, number>>({});
  // Sekundlik chizishni majburlash uchun
  const [, tick] = useState(0);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await dineInApi.myRequests(sessionId);
      setRequests(list);
      // Har turdagi eng so'nggi so'rovdan qulf vaqtini hisoblaymiz
      setUnlockAt((prev) => {
        const next = { ...prev };
        for (const type of ["waiter", "bill"]) {
          const latest = list.find((r) => r.type === type);
          if (!latest) continue;
          const at = new Date(latest.createdAt).getTime() + COOLDOWN_MS;
          // Faqat o'zimiz hali bilmagan (yangiroq) qulfni yozamiz
          if (!next[type] || at > next[type]) next[type] = at;
        }
        return next;
      });
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  // Sanoq — har soniyada ekranni yangilaydi, lekin qolgan vaqtni
  // doim haqiqiy vaqtdan hisoblaydi (drift bo'lmasin)
  useEffect(() => {
    tickTimer.current = setInterval(() => tick((n) => n + 1), 1000);
    return () => { if (tickTimer.current) clearInterval(tickTimer.current); };
  }, []);

  const remainingSec = (type: string) => {
    const until = unlockAt[type];
    if (!until) return 0;
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  };

  const send = async (type: "waiter" | "bill") => {
    setBusy(type);
    try {
      const created = await dineInApi.createRequest(sessionId, type);
      setUnlockAt((prev) => ({
        ...prev,
        [type]: new Date(created.createdAt).getTime() + COOLDOWN_MS,
      }));
      setToast(type === "waiter" ? "Ofitsiant chaqirildi" : "Hisob so'raldi");
      load();
    } catch (e) {
      const err = e as ApiError;
      setToast(err.message);
      // Server ham cooldown deb rad etsa — mavjud so'rovdan qulfni tiklaymiz
      if (err.code === "COOLDOWN") {
        const req = (err.data as { request?: Req } | undefined)?.request;
        if (req?.createdAt) {
          setUnlockAt((prev) => ({
            ...prev,
            [type]: new Date(req.createdAt).getTime() + COOLDOWN_MS,
          }));
        }
        load();
      }
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const active = (type: string) =>
    requests.find((r) => r.type === type && r.status !== "done");

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  function renderButton(type: "waiter" | "bill") {
    const req = active(type);
    const left = remainingSec(type);
    const locked = left > 0;
    const icon = type === "waiter" ? "🛎" : "🧾";
    const idleLabel = type === "waiter" ? "Ofitsiant" : "Hisob";

    /*
     * Sanoq paytida matn qisqa bo'lishi kerak — yarim kenglikdagi
     * tugmada uzun so'z bilan vaqt ikki qatorga yorilib ketardi.
     * "Yuborildi" so'zi ortiqcha edi: rang (is-sent) allaqachon
     * "yuborilgan" holatni bildiradi. Xodim qabul qilgan holat
     * esa alohida ma'noli, shuning uchun saqlanadi.
     */
    let label: string;
    if (locked) {
      label = req?.status === "accepted"
        ? `${type === "waiter" ? "Keladi" : "Tayyor"} · ${fmt(left)}`
        : fmt(left);
    } else {
      label = idleLabel;
    }

    return (
      <button
        onClick={() => send(type)}
        disabled={busy === type || locked}
        className={`di-action ${locked ? "is-sent" : ""}`}
      >
        <span className="di-action__icon">{icon}</span>
        <span className="di-action__label">{label}</span>
        {locked && (
          <span className="di-action__ring" aria-hidden>
            <svg viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15.5"
                strokeDasharray={2 * Math.PI * 15.5}
                strokeDashoffset={2 * Math.PI * 15.5 * (1 - left / (COOLDOWN_MS / 1000))}
              />
            </svg>
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      <div className="di-actions">
        {renderButton("waiter")}
        {renderButton("bill")}
      </div>

      {toast && <div className="di-toast">{toast}</div>}
    </>
  );
}
