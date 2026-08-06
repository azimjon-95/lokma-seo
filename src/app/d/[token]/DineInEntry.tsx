"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { dineInApi, ApiError } from "@/lib/dinein/api";
import { getDeviceId, saveSession } from "@/lib/dinein/session";

/**
 * QR skanerlangandan keyingi kirish nuqtasi.
 *
 * Oqim: token → validatsiya → sessiya → menyu
 * Login TALAB QILINMAYDI.
 */
export function DineInEntry({ token }: { token: string }) {
  const router = useRouter();
  const done = useRef(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    dineInApi
      .scan(token, getDeviceId())
      .then((data) => {
        saveSession({
          sessionId: data.session.id,
          tableId: data.table.id,
          tableNumber: data.table.number,
          tableName: data.table.name,
          restaurantId: data.restaurant.id,
          restaurantName: data.restaurant.name,
          token,
          startedAt: Date.now(),
        });
        router.replace(`/d/${token}/menu`);
      })
      .catch((e: ApiError) => {
        setError({ message: e.message, code: e.code });
      });
  }, [token, router]);

  if (error) {
    return (
      <div className="di-state">
        <div className="di-state__box">
          <div className="di-state__icon di-state__icon--error">⚠️</div>
          <h1 className="di-state__title">
            {error.code === "DINEIN_INACTIVE"
              ? "Xizmat mavjud emas"
              : "QR kod ishlamadi"}
          </h1>
          <p className="di-state__text">{error.message}</p>
          <p className="di-state__hint">
            Ofitsiantdan yordam so&apos;rang yoki QR kodni qayta
            skanerlab ko&apos;ring.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="di-state">
      <div className="di-state__box">
        <div className="di-spinner" />
        <p className="di-state__text">Menyu ochilmoqda...</p>
      </div>
    </div>
  );
}
