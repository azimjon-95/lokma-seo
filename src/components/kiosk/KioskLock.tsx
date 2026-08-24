"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Utensils, Delete } from "lucide-react";
import { kioskApi, ApiError } from "@/lib/dinein/api";

/**
 * Qulf — uzoq tegilmasa tushadi.
 *
 * Ikki bosqich (TZ 3.4):
 *   1) Animatsiya: logo + "Ekranga teginib PIN kiriting"
 *   2) Tegilsa → 4 xonali PIN klaviaturasi
 *
 * NEGA BU FAQAT "PARDA" EMAS:
 *   PIN SERVERDA tekshiriladi va xato hisobi ham serverda
 *   yuritiladi. Brauzer konsolидan React holatini o'zgartirib
 *   qulfni ochib bo'lmaydi — u yopiq turganda ham ma'lumot
 *   allaqachon ekranda bo'lgani uchun bu mutlaq himoya emas,
 *   lekin planshetni tasodifan bosib yuborishdan va begona
 *   odam kelib ishlatib ketishidan saqlaydi.
 */

const IDLE_EVENTS = [
  "pointerdown", "pointermove", "keydown", "wheel", "touchstart",
] as const;

export function KioskLock({
  inactivitySec,
  restaurantName,
  label,
  onExpired,
}: {
  inactivitySec: number;
  restaurantName: string;
  label?: string;
  onExpired: (message: string) => void;
}) {
  const [locked, setLocked] = useState(false);
  const [pad, setPad] = useState(false);      // PIN klaviaturasi ochiqmi
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lock = useCallback(() => {
    setLocked(true);
    setPad(false);
  }, []);

  /* ═══ Harakatsizlik hisoblagichi ═══ */
  useEffect(() => {
    if (locked) return undefined;   // qulf tushgan — sanashning hojati yo'q

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(lock, inactivitySec * 1000);
    };

    reset();
    IDLE_EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    // Sahifa fonga o'tib qaytsa ham qulf tushsin — planshet
    // cho'ntakda yotgan vaqt "faollik" hisoblanmasligi kerak
    const onVisible = () => {
      if (document.visibilityState === "visible") reset();
      else if (timer.current) clearTimeout(timer.current);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      IDLE_EVENTS.forEach((e) => window.removeEventListener(e, reset));
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [locked, inactivitySec, lock]);

  if (!locked) return null;

  return pad ? (
    <PinPad
      restaurantName={restaurantName}
      onUnlock={() => setLocked(false)}
      onExpired={onExpired}
      onBack={() => setPad(false)}
    />
  ) : (
    <Screensaver
      restaurantName={restaurantName}
      label={label}
      onWake={() => setPad(true)}
    />
  );
}

/* ═══ 1-bosqich: animatsiya ═══ */
function Screensaver({
  restaurantName, label, onWake,
}: {
  restaurantName: string;
  label?: string;
  onWake: () => void;
}) {
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString("uz-UZ", {
      hour: "2-digit", minute: "2-digit",
    }));
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="kio-lock" onPointerDown={onWake} role="button" tabIndex={0}>
      <div className="kio-lock__pulse">
        <span className="kio-lock__ring" />
        <span className="kio-lock__ring kio-lock__ring--2" />
        <span className="kio-lock__disc">
          <Utensils size={44} strokeWidth={1.8} />
        </span>
      </div>

      <div className="kio-lock__clock">{now}</div>
      <div className="kio-lock__rest">{restaurantName}</div>
      {label && <div className="kio-lock__label">{label}</div>}

      <div className="kio-lock__hint">Ekranga teginib PIN kiriting</div>
    </div>
  );
}

/* ═══ 2-bosqich: PIN ═══ */
function PinPad({
  restaurantName, onUnlock, onExpired, onBack,
}: {
  restaurantName: string;
  onUnlock: () => void;
  onExpired: (message: string) => void;
  onBack: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [blockedFor, setBlockedFor] = useState(0);

  /* Blok hisoblagichi */
  useEffect(() => {
    if (blockedFor <= 0) return undefined;
    const id = setInterval(() => setBlockedFor((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [blockedFor]);

  const submit = useCallback(async (value: string) => {
    setBusy(true);
    setError(null);

    try {
      await kioskApi.verifyPin(value);
      onUnlock();
    } catch (e) {
      const err = e as ApiError;
      const data = err.data as { retryAfter?: number } | undefined;

      // Link o'chirilgan yoki muddati tugagan — qulfni ochishning
      // ma'nosi yo'q, butun sahifa to'xtashi kerak
      if (err.code === "EXPIRED" || err.code === "DISABLED" || err.code === "NOT_FOUND") {
        onExpired(err.message);
        return;
      }

      if (data?.retryAfter) setBlockedFor(data.retryAfter);
      setError(err.message);
      setPin("");
      setBusy(false);
    }
  }, [onUnlock, onExpired]);

  const press = (digit: string) => {
    if (busy || blockedFor > 0) return;
    const next = (pin + digit).slice(0, 4);
    setPin(next);
    setError(null);
    if (next.length === 4) submit(next);
  };

  const back = () => {
    if (busy || blockedFor > 0) return;
    setPin((p) => p.slice(0, -1));
    setError(null);
  };

  /* Fizik klaviatura — kompyuterda planshetdagidek qulay bo'lsin */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") back();
      else if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="kio-lock kio-lock--pad">
      <button className="kio-pin__back" onClick={onBack} aria-label="Orqaga">
        ✕
      </button>

      <div className="kio-pin__rest">{restaurantName}</div>
      <div className="kio-pin__title">PIN kodni kiriting</div>

      <div className={`kio-pin__dots ${error ? "is-error" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < pin.length ? "is-on" : ""} />
        ))}
      </div>

      <div className="kio-pin__msg">
        {blockedFor > 0
          ? `Bloklandi — ${blockedFor} soniya`
          : error || (busy ? "Tekshirilmoqda..." : "\u00A0")}
      </div>

      <div className="kio-pin__grid">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} onClick={() => press(d)} disabled={busy || blockedFor > 0}>
            {d}
          </button>
        ))}
        <span />
        <button onClick={() => press("0")} disabled={busy || blockedFor > 0}>0</button>
        <button onClick={back} disabled={busy || blockedFor > 0} aria-label="O'chirish">
          <Delete size={22} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
