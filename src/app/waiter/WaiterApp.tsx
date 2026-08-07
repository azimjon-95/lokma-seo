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

  // Real vaqt: stol holati, yangi buyurtma, chaqiruv
  useEffect(() => {
    if (!me) return undefined;

    const s = getWaiterSocket();
    s.emit("join:restaurant", me.restaurantId);

    const refresh = () => loadTables();
    s.on("table:update", refresh);
    s.on("dinein:new", refresh);
    s.on("dinein:order", refresh);
    s.on("dinein:request", refresh);

    const onConnect = () => s.emit("join:restaurant", me.restaurantId);
    s.on("connect", onConnect);

    return () => {
      s.off("table:update", refresh);
      s.off("dinein:new", refresh);
      s.off("dinein:order", refresh);
      s.off("dinein:request", refresh);
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
    />
  );
}
