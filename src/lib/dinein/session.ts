/**
 * Qurilma va sessiya identifikatorlari.
 *
 * MUHIM: IMEI, seriya raqami yoki boshqa qurilma identifikatori
 * OLINMAYDI. Bu brauzerda yaratiladigan tasodifiy qiymat.
 */

const DEVICE_KEY = "lokma_device_id";
const SESSION_KEY = "lokma_dinein";

function randomId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = randomId("dev");
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    // localStorage yopiq bo'lsa ham menyu ochilishi kerak
    return randomId("tmp");
  }
}

/** Brauzer nomi — ofitsiant panelida qurilmani tanish uchun. */
export function getDeviceLabel(): string {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent;

  const os = /iPhone|iPad/.test(ua) ? "iPhone"
    : /Android/.test(ua) ? "Android"
    : /Mac/.test(ua) ? "Mac"
    : /Windows/.test(ua) ? "Windows"
    : "Qurilma";

  const browser = /CriOS|Chrome/.test(ua) ? "Chrome"
    : /FxiOS|Firefox/.test(ua) ? "Firefox"
    : /Safari/.test(ua) ? "Safari"
    : "Brauzer";

  return `${os} · ${browser}`;
}

export interface StoredSession {
  sessionId: string;
  tableId: string;
  tableNumber: string;
  tableName?: string;
  restaurantId: string;
  restaurantName: string;
  token: string;
  startedAt: number;
}

export function saveSession(data: StoredSession) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
