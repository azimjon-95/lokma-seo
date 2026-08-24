"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BookOpen, Ban, Utensils, TriangleAlert } from "lucide-react";
import {
  kioskApi, waiterApi, setApiMode, setKioskToken, clearKioskToken,
  type WaiterTable, type KioskConfig, ApiError,
} from "@/lib/dinein/api";
import { getDeviceId, getDeviceLabel } from "@/lib/dinein/session";
import { useWakeLock } from "@/lib/kiosk/wakeLock";
import { WaiterTables } from "@/app/waiter/WaiterTables";
import { KioskLock } from "./KioskLock";
import { KioskStopList } from "./KioskStopList";
import { KioskMenu } from "./KioskMenu";

/**
 * Kiosk — zaldagi planshet.
 *
 * OFITSIANT PANELIDAN FARQI:
 *   Login yo'q. Havolaning o'zi kredensial. Buyurtma restoran
 *   nomidan yoziladi — xizmat haqi hech kimga biriktirilmaydi.
 *   Daromad/hisobot bo'limlari yo'q, chunki ko'rsatadigan
 *   shaxsiy raqam yo'q.
 *
 * Ekranlar ATAYLAB nusxalanmagan: stollar va buyurtma oqimi
 * `WaiterTables` dan keladi, faqat pastki menyu boshqa.
 */

type Phase = "loading" | "ready" | "error";

export function KioskApp({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [cfg, setCfg] = useState<KioskConfig | null>(null);
  const [tables, setTables] = useState<WaiterTable[]>([]);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  // Rejim eng boshida qo'yiladi: waiterApi shundan keyin
  // /kiosk/* ga boradi va kiosk tokenini ishlatadi
  const modeSet = useRef(false);
  if (!modeSet.current) {
    setApiMode("kiosk");
    modeSet.current = true;
  }

  useWakeLock(phase === "ready");

  /* Kiosk oq mavzuda va ixcham kartalar bilan ishlaydi.
     Sinf <html> ga qo'yiladi — TableSheet/DishSheet/qulf
     `position: fixed` bilan DOM'ning boshqa joyida chiziladi,
     o'rovchi div'ga qo'ysak ular qora qolib ketardi. */
  useEffect(() => {
    document.documentElement.classList.add("kio-ui");
    return () => document.documentElement.classList.remove("kio-ui");
  }, []);

  const loadTables = useCallback(async () => {
    try {
      setTables(await waiterApi.tables());
    } catch (e) {
      const err = e as ApiError;
      // Link o'chirilgan/muddati tugagan — ishlashni to'xtatamiz
      if (["EXPIRED", "DISABLED", "NOT_FOUND", "DEVICE_REVOKED"].includes(err.code || "")) {
        setError({ message: err.message, code: err.code });
        setPhase("error");
      }
    }
  }, []);

  /* ═══ Kirish ═══ */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // 1) Link yaroqlimi — sir ma'lumot qaytarmaydigan tekshiruv
        await kioskApi.validate(token);

        // 2) Qurilmani bog'lab ish tokenini olamiz
        const res = await kioskApi.session(token, getDeviceId(), getDeviceLabel());
        if (!alive) return;

        setKioskToken(res.token);
        setCfg(res);

        // 3) Stollar
        if (res.sections.includes("tables")) {
          setTables(await waiterApi.tables());
        }
        if (!alive) return;

        setPhase("ready");
      } catch (e) {
        if (!alive) return;
        const err = e as ApiError;
        clearKioskToken();
        setError({ message: err.message || "Ulanib bo\u2018lmadi", code: err.code });
        setPhase("error");
      }
    })();

    return () => { alive = false; };
  }, [token]);

  /* ═══ To'liq ekran ═══
     Brauzer fullscreen'ni FAQAT foydalanuvchi harakatidan keyin
     beradi — sahifa ochilishida so'rov jim rad etiladi. Shuning
     uchun birinchi tegishda so'raymiz. */
  useEffect(() => {
    if (phase !== "ready" || !cfg?.autoFullscreen) return undefined;

    const request = () => {
      if (document.fullscreenElement) return;
      document.documentElement.requestFullscreen?.({ navigationUI: "hide" })
        .catch(() => { /* rad etilsa sahifa baribir ishlaydi */ });
    };

    const once = () => {
      request();
      window.removeEventListener("pointerdown", once);
    };
    window.addEventListener("pointerdown", once);
    return () => window.removeEventListener("pointerdown", once);
  }, [phase, cfg?.autoFullscreen]);

  /* ═══ Link hali tirikmi ═══
     Admin tokenni o'chirsa planshet buni o'zi bilib qulflanishi
     kerak — aks holda ekranda eski ma'lumot turib qolardi. */
  useEffect(() => {
    if (phase !== "ready") return undefined;

    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        await kioskApi.me();
      } catch (e) {
        const err = e as ApiError;
        if (["EXPIRED", "DISABLED", "NOT_FOUND", "DEVICE_REVOKED"].includes(err.code || "")) {
          setError({ message: err.message, code: err.code });
          setPhase("error");
        }
      }
    };

    const id = setInterval(check, 120_000);
    return () => clearInterval(id);
  }, [phase]);

  if (phase === "loading") {
    return (
      <div className="kio-boot">
        <div className="di-spinner" />
        <p>Ulanmoqda...</p>
      </div>
    );
  }

  if (phase === "error" || !cfg) {
    return <KioskError message={error?.message} code={error?.code} />;
  }

  /* Pastki menyu — TZ 3.2: Menyu va Stop List.
     Ofitsiant, Daromad, Xizmat haqi bo'limlari YO'Q. */
  const extraTabs = [
    ...(cfg.sections.includes("menu") ? [{
      key: "menu",
      label: "Menyu",
      Icon: BookOpen,
      render: () => <KioskMenu restaurantId={cfg.restaurant.id} />,
    }] : []),
    ...(cfg.sections.includes("stoplist") ? [{
      key: "stoplist",
      label: "Stop List",
      Icon: Ban,
      render: () => <KioskStopList />,
    }] : []),
  ];

  return (
    <>
      <WaiterTables
        me={{
          firstName: "",
          lastName: "",
          restaurantId: cfg.restaurant.id,
          restaurant: { name: cfg.restaurant.name },
        }}
        tables={tables}
        onRefresh={loadTables}
        onLogout={() => {}}
        hideLogout
        subtitle={cfg.label || "Kiosk"}
        extraTabs={extraTabs.length > 0 ? extraTabs : undefined}
      />

      <KioskLock
        inactivitySec={cfg.inactivitySec}
        restaurantName={cfg.restaurant.name}
        label={cfg.label}
        onExpired={(message) => {
          setError({ message });
          setPhase("error");
        }}
      />
    </>
  );
}

/* ═══ Xato ekrani ═══ */
function KioskError({ message, code }: { message?: string; code?: string }) {
  const hint = code === "DEVICE_LIMIT"
    ? "Administrator panelda “Qurilmalarni uzish” tugmasini bosishi kerak."
    : code === "DEVICE_REVOKED"
      ? "Sahifani yangilasangiz qayta ulanadi."
      : "Administratordan yangi havola so‘rang.";

  return (
    <div className="kio-boot kio-boot--error">
      <div className="kio-boot__icon">
        <TriangleAlert size={38} strokeWidth={1.8} />
      </div>

      <h1>{message || "Havola ishlamayapti"}</h1>
      <p>{hint}</p>

      <button onClick={() => window.location.reload()} className="kio-boot__retry">
        Qayta urinish
      </button>

      <div className="kio-boot__brand">
        <Utensils size={15} strokeWidth={2.2} /> LokmaGo
      </div>
    </div>
  );
}
