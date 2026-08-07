"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "../site";

/**
 * Mavjud Socket.IO serveriga ulanish.
 *
 * Bitta ulanish barcha komponentlar uchun — qayta-qayta
 * ulanish resurs isrof qiladi.
 */
let socket: Socket | null = null;

/** Ofitsiant paneli uchun — restoran xonasiga ulanadi. */
export function getWaiterSocket(): Socket {
  return getSocket();
}

function getSocket(): Socket {
  if (!socket) {
    // API_URL "/api" bilan tugaydi — socket ildizga ulanadi
    const base = API_URL.replace(/\/api\/?$/, "");
    socket = io(base, {
      transports: ["websocket", "polling"],
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

/**
 * Sessiya xonasiga ulanadi va hodisalarni tinglaydi.
 *
 * Socket ulanmasa ham sahifa ishlaydi — bu qo'shimcha
 * qulaylik, majburiy emas.
 */
export function useSessionSocket(
  sessionId: string | undefined,
  handlers: {
    onStatus?: (data: { orderId: string; status: string; dineInNumber: string }) => void;
    onRequestUpdate?: (data: { id: string; type: string; status: string }) => void;
    onSessionClosed?: () => void;
  },
) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!sessionId) return undefined;

    const s = getSocket();
    s.emit("join:session", sessionId);

    const onStatus = (d: Parameters<NonNullable<typeof handlers.onStatus>>[0]) =>
      ref.current.onStatus?.(d);
    const onReq = (d: Parameters<NonNullable<typeof handlers.onRequestUpdate>>[0]) =>
      ref.current.onRequestUpdate?.(d);
    const onClosed = () => ref.current.onSessionClosed?.();

    s.on("dinein:status", onStatus);
    s.on("dinein:request-update", onReq);
    s.on("dinein:session-closed", onClosed);

    // Qayta ulanganda xonaga qaytamiz
    const onConnect = () => s.emit("join:session", sessionId);
    s.on("connect", onConnect);

    return () => {
      s.off("dinein:status", onStatus);
      s.off("dinein:request-update", onReq);
      s.off("dinein:session-closed", onClosed);
      s.off("connect", onConnect);
    };
  }, [sessionId]);
}
