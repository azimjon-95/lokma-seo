"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { WaiterTable } from "@/lib/dinein/api";
import { num } from "@/lib/dinein/format";

/**
 * Zalning 3D xaritasi.
 *
 * Three.js EMAS — CSS 3D transform ishlatilgan.
 *
 * Sabab: Three.js ~150 KB qo'shadi va mobil qurilmada
 * batareyani tez yeydi. CSS transform brauzer tomonidan
 * GPU'da bajariladi — bir xil natija, nol qo'shimcha hajm,
 * eski telefonlarda ham silliq.
 */

interface Props {
  tables: WaiterTable[];
  onSelect: (table: WaiterTable) => void;
}

// Zal katakchasi o'lchami
const CELL = 96;

export function TableMap3D({ tables, onSelect }: Props) {
  // Ko'rish burchagi va masshtab
  const [tilt, setTilt] = useState(52);      // gorizontga nisbatan
  const [spin, setSpin] = useState(0);       // aylantirish
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const drag = useRef<{ x: number; y: number; mode: "spin" | "pan" } | null>(null);
  const pinch = useRef<number | null>(null);

  // Stollarni gridga joylashtiramiz (x/y berilmagan bo'lsa)
  const placed = tables.map((t, i) => ({
    ...t,
    gx: t.x ?? (i % 4),
    gy: t.y ?? Math.floor(i / 4),
  }));

  const cols = Math.max(4, ...placed.map((t) => t.gx + 1));
  const rows = Math.max(3, ...placed.map((t) => t.gy + 1));

  // ─── Harakat ───
  const onPointerDown = (e: React.PointerEvent) => {
    if (pinch.current !== null) return;
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      mode: e.shiftKey ? "pan" : "spin",
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;

    if (drag.current.mode === "spin") {
      setSpin((s) => s + dx * 0.35);
      setTilt((t) => Math.max(20, Math.min(80, t - dy * 0.25)));
    } else {
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    }

    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  // ─── Ikki barmoq bilan kattalashtirish ───
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      drag.current = null;
      pinch.current = dist(e.touches);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current !== null) {
      const d = dist(e.touches);
      const scale = d / pinch.current;
      setZoom((z) => Math.max(0.5, Math.min(2.2, z * scale)));
      pinch.current = d;
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinch.current = null;
  };

  const reset = useCallback(() => {
    setTilt(52);
    setSpin(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <div className="map3d">
      {/* Boshqaruv */}
      <div className="map3d__controls">
        <button onClick={() => setZoom((z) => Math.min(2.2, z + 0.2))}>+</button>
        <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}>−</button>
        <button onClick={reset} title="Qayta tiklash">⟲</button>
      </div>

      {/* Sahna */}
      <div
        className="map3d__stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="map3d__world"
          style={{
            transform: `
              translate(${pan.x}px, ${pan.y}px)
              scale(${zoom})
              rotateX(${tilt}deg)
              rotateZ(${spin}deg)
            `,
          }}
        >
          {/* Pol */}
          <div
            className="map3d__floor"
            style={{
              width: cols * CELL + 60,
              height: rows * CELL + 60,
              marginLeft: -(cols * CELL + 60) / 2,
              marginTop: -(rows * CELL + 60) / 2,
            }}
          />

          {/* Stollar */}
          {placed.map((t) => (
            <Table3D
              key={t._id}
              table={t}
              x={(t.gx - (cols - 1) / 2) * CELL}
              y={(t.gy - (rows - 1) / 2) * CELL}
              spin={spin}
              tilt={tilt}
              onClick={() => onSelect(t)}
            />
          ))}
        </div>
      </div>

      {/* Izoh */}
      <div className="map3d__legend">
        <span><i className="dot is-free" /> Bo&apos;sh</span>
        <span><i className="dot is-busy" /> Band</span>
        <span className="map3d__hint">Surib aylantiring</span>
      </div>
    </div>
  );
}

/** Bitta stol — yumaloq yoki to'rtburchak. */
function Table3D({
  table, x, y, spin, tilt, onClick,
}: {
  table: WaiterTable & { gx: number; gy: number };
  x: number;
  y: number;
  spin: number;
  tilt: number;
  onClick: () => void;
}) {
  const busy = Boolean(table.isBusy || table.guestCount);
  const guests = table.guestCount || 0;
  const round = table.shape !== "square" && table.shape !== "rect";

  const size = round ? 60 : 64;
  const height = 16;   // stol balandligi

  return (
    <div
      className="t3d"
      style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
      onClick={onClick}
    >
      {/* Soya */}
      <div
        className="t3d__shadow"
        style={{ width: size + 10, height: size + 10 }}
      />

      {/* Oyoq */}
      <div
        className={`t3d__leg ${busy ? "is-busy" : ""}`}
        style={{
          width: size - 22,
          height,
          borderRadius: round ? "50% / 30%" : 4,
          transform: `translateZ(${height / 2}px) rotateX(-${tilt}deg)`,
        }}
      />

      {/* Stol usti */}
      <div
        className={`t3d__top ${busy ? "is-busy" : "is-free"} ${round ? "is-round" : ""}`}
        style={{ width: size, height: size, transform: `translateZ(${height}px)` }}
      >
        {/* Yorliq — doim tik turadi */}
        <div
          className="t3d__label"
          style={{ transform: `rotateZ(${-spin}deg) rotateX(-${tilt}deg)` }}
        >
          <span className="t3d__num">{table.tableNumber}</span>
          {busy && (
            <span className="t3d__guests">
              {guests}/{table.capacity}
            </span>
          )}
        </div>
      </div>

      {/* Kursilar */}
      {round
        ? Array.from({ length: Math.min(8, table.capacity) }).map((_, i, arr) => {
            const angle = (i / arr.length) * Math.PI * 2;
            const r = size / 2 + 15;
            return (
              <div
                key={i}
                className={`t3d__chair ${i < guests ? "is-taken" : ""}`}
                style={{
                  transform: `translate3d(${Math.cos(angle) * r - 7}px, ${Math.sin(angle) * r - 7}px, 5px)`,
                }}
              />
            );
          })
        : null}

      {/* Buyurtma summasi */}
      {busy && table.orderTotal ? (
        <div
          className="t3d__total"
          style={{ transform: `translateZ(${height + 4}px) rotateZ(${-spin}deg) rotateX(-${tilt}deg)` }}
        >
          {num(table.orderTotal)}
        </div>
      ) : null}
    </div>
  );
}

function dist(touches: React.TouchList): number {
  const [a, b] = [touches[0], touches[1]];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}
