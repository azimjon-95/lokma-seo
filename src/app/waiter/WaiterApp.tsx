"use client";

import { useState, useEffect, useCallback } from "react";
import {
  waiterApi, getWaiterToken, setWaiterToken, clearWaiterToken,
  type WaiterTable, ApiError,
} from "@/lib/dinein/api";
import { getDeviceId, getDeviceLabel } from "@/lib/dinein/session";
import { getWaiterSocket } from "@/lib/dinein/socket";
import { WaiterLogin } from "./WaiterLogin";
import { WaiterTables } from "./WaiterTables";

interface Me {
  _id: string;
  firstName: string;
  lastName: string;
  restaurantId: string;
  restaurant: { name: string };
  earnings?: { total: number; orders: number };
}

export function WaiterApp() {
  const [me, setMe] = useState<Me | null>(null);
  const [tables, setTables] = useState<WaiterTable[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTables = useCallback(async () => {
    try {
      setTables(await waiterApi.tables());
    } catch {
      /* ignore */
    }
  }, []);

  const boot = useCallback(async () => {
    if (!getWaiterToken()) {
      setLoading(false);
      return;
    }
    try {
      const data = await waiterApi.me();
      setMe(data as Me);
      await loadTables();
    } catch (e) {
      // Qurilma o'zgargan yoki sessiya tugagan
      const err = e as ApiError;
      if (err.status === 401 || err.code === "DEVICE_MISMATCH") {
        clearWaiterToken();
      }
    } finally {
      setLoading(false);
    }
  }, [loadTables]);

  useEffect(() => {
    boot();
  }, [boot]);

  /*
   * Oq mavzu — kiosk bilan bir xil palitra.
   * Sinf <html> ga qo'yiladi, chunki sheet va modallar
   * `position: fixed` bilan DOM'ning boshqa joyida chiziladi.
   */
  useEffect(() => {
    document.documentElement.classList.add("wt-ui");
    return () => document.documentElement.classList.remove("wt-ui");
  }, []);

  // Real vaqt: stol holati, yangi buyurtma, chaqiruv
  useEffect(() => {
    if (!me) return undefined;

    const s = getWaiterSocket();
    s.emit("join:restaurant", me.restaurantId);

    /*
     * ═══ STOL HOLATI DARHOL O'ZGARSIN ═══
     *
     * MUAMMO: har socket hodisasida loadTables() chaqirilardi,
     * ya'ni butun ro'yxat serverdan qayta so'ralardi. Ofitsiant
     * stolni yopgach ranggi o'zgarishi uchun to'liq yo'l-yo'lakay
     * (so'rov -> javob -> qayta chizish) kutilardi. Sekin
     * internetda bu 1-2 soniya, zalda esa bu juda uzoq —
     * xodim tugmani yana bosardi.
     *
     * SERVER YANGI HOLATNI HODISA ICHIDA YUBORADI:
     *   { tableId, status }
     * Shuning uchun uni SO'ROVSIZ, joyida qo'llash mumkin.
     *
     * To'liq so'rov zaxira sifatida qoladi, lekin 400 ms
     * kechiktirib: bir necha hodisa ketma-ket kelsa (stol
     * yopilishi bir vaqtda bir necha hodisa yuboradi) bitta
     * so'rov ketadi, beshta emas.
     */
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refreshSoon = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => loadTables(), 400);
    };

    const onTableUpdate = (p: { tableId?: string; status?: string }) => {
      if (p?.tableId && p?.status) {
        // Darhol — kutmasdan
        setTables((prev) => prev.map((t) => (
          t._id === p.tableId
            ? {
              ...t,
              status: p.status!,
              // isBusy stateOf() da ishlatiladi: status 'free'
              // bo'lsa-yu isBusy true qolsa stol band ko'rinardi
              isBusy: p.status === "occupied",
              ...(p.status === "free" ? { guestCount: 0, orderTotal: 0 } : {}),
            }
            : t
        )));
      }
      // Qolgan maydonlar (summa, mehmon soni) uchun zaxira
      refreshSoon();
    };

    s.on("table:update", onTableUpdate);
    s.on("dinein:new", refreshSoon);
    s.on("dinein:order", refreshSoon);
    s.on("dinein:request", refreshSoon);

    const onConnect = () => {
      s.emit("join:restaurant", me.restaurantId);
      // Uzilib qolgan vaqtdagi o'zgarishlarni qo'lga kiritamiz
      loadTables();
    };
    s.on("connect", onConnect);

    return () => {
      if (timer) clearTimeout(timer);
      s.off("table:update", onTableUpdate);
      s.off("dinein:new", refreshSoon);
      s.off("dinein:order", refreshSoon);
      s.off("dinein:request", refreshSoon);
      s.off("connect", onConnect);
    };
  }, [me, loadTables]);

  const onLogin = async (login: string, password: string) => {
    const data = await waiterApi.login(
      login, password, getDeviceId(), getDeviceLabel(),
    );
    setWaiterToken(data.token);
    await boot();
  };

  const logout = () => {
    clearWaiterToken();
    setMe(null);
    setTables([]);
  };

  if (loading) {
    return (
      <div className="di-state">
        <div className="di-state__box">
          <div className="di-spinner" />
        </div>
      </div>
    );
  }

  if (!me) return <WaiterLogin onLogin={onLogin} />;

  return (
    <WaiterTables
      me={me}
      tables={tables}
      onRefresh={loadTables}
      onLogout={logout}
      /*
        Ixcham kartalar — kiosk bilan bir xil.
        Ofitsiant telefonda ishlaydi: katta kartada ekranga
        2 ta stol sig'ardi va zalni ko'rish uchun uzoq
        aylantirish kerak edi. Endi kartaning O'ZI tugma,
        ichidagi mayda tugmalar yo'q.
      */
      compact
    />
  );
}
