import { API_URL } from "../site";

/**
 * Dine-in API klienti.
 *
 * Mijoz uchun login talab qilinmaydi.
 * Ofitsiant uchun token localStorage'da saqlanadi.
 */

export class ApiError extends Error {
  code?: string;
  status: number;
  // Server javobining o'zi — masalan COOLDOWN xatosida
  // mavjud so'rov obyekti shu yerda keladi
  data?: unknown;

  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

type FetchOpts = RequestInit & { auth?: boolean };

async function request<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { auth, ...init } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (auth) {
    const token = getWaiterToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* JSON emas */
  }

  if (!res.ok) {
    const err = data as { error?: string; code?: string; message?: string } | null;

    // Server 500 da qisqa "Server xatosi" beradi, haqiqiy sabab
    // esa `message` da keladi. Ofitsiant nosozlikni ayta olishi
    // uchun ikkalasini birga ko'rsatamiz.
    const base = err?.error || "Xatolik yuz berdi";
    const detail = err?.message && err.message !== base ? ` — ${err.message}` : "";

    throw new ApiError(base + detail, res.status, err?.code, data);
  }

  return data as T;
}

// ═══ Turlar ═══
export interface ScanResult {
  session: { id: string; deviceSessionId: string; status: string; createdAt: string };
  table: { id: string; name: string; number: string; capacity: number };
  restaurant: {
    id: string; name: string; imageUrl?: string; cuisine?: string;
    tint?: string; icon?: string; openTime?: string; closeTime?: string;
    address?: string;
  };
}

export interface DishOption {
  name: string;
  price: number;
}

export interface OptionGroup {
  name: string;
  required?: boolean;
  multiple?: boolean;
  options: DishOption[];
}

export interface Dish {
  _id: string;
  name: string;
  description?: string;
  category: string;
  section?: string;
  imageUrl?: string;
  images?: string[];
  price: number;          // Zal narxi — delivery narxi kelmaydi
  oldPrice?: number;
  optionGroups?: OptionGroup[];
  weight?: string;
  volume?: string;
  calories?: number;
  prepMinutes?: number;
  isAvailable?: boolean;
  tint?: string;
  icon?: string;
}

export interface OrderItem {
  dishId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  selectedOptions?: DishOption[];
  note?: string;
}

export interface DineInOrder {
  _id: string;
  dineInNumber: string;
  items: OrderItem[];
  subtotal: number;
  serviceFee: number;
  total: number;
  status: string;
  orderSource: "qr" | "waiter";
  promotionName?: string;
  promotionDiscount?: number;
  bonusUsed?: number;
  createdAt: string;
}

export interface WaiterTable {
  _id: string;
  tableNumber: string;
  tableName?: string;
  capacity: number;
  status: string;
  guestCount?: number;
  orderTotal?: number;
  isBusy?: boolean;
  shape?: string;
  x?: number;
  y?: number;
  session?: { _id: string; createdAt?: string; guestCount?: number } | null;
  activeOrders?: Array<{ _id: string; total: number; status: string; dineInNumber: string }>;
}

// ═══ Mijoz ═══
export const dineInApi = {
  scan: (token: string, deviceSessionId: string) =>
    request<ScanResult>("/dine-in/scan", {
      method: "POST",
      body: JSON.stringify({ token, deviceSessionId }),
    }),

  menu: (restaurantId: string) =>
    request<Dish[]>(`/dine-in/menu/${restaurantId}`),

  createOrder: (sessionId: string, items: unknown[], note?: string) =>
    request<DineInOrder>("/dine-in/orders", {
      method: "POST",
      body: JSON.stringify({ sessionId, items, note }),
    }),

  createRequest: (sessionId: string, type: "waiter" | "bill") =>
    request<{ _id: string; type: string; status: string; createdAt: string }>(
      "/dine-in/request",
      { method: "POST", body: JSON.stringify({ sessionId, type }) },
    ),

  myRequests: (sessionId: string) =>
    request<Array<{
      _id: string; type: string; status: string;
      acceptedByName?: string; createdAt: string;
    }>>(`/dine-in/requests/${sessionId}`),

  receipt: (sessionId: string) =>
    request<{
      restaurant: { name: string; address?: string };
      table: { tableNumber: string; tableName?: string };
      lines: Array<{ name: string; quantity: number; total: number }>;
      subtotal: number; serviceFee: number; discount: number; total: number;
      serviceFeeLabel: string;
    }>(`/dine-in/receipt/${sessionId}`),

  sessionOrders: (sessionId: string) =>
    request<{ orders: DineInOrder[]; total: number; sessionStatus: string }>(
      `/dine-in/orders/${sessionId}`,
    ),
};

// ═══ Ofitsiant ═══
const WAITER_TOKEN_KEY = "lokma_waiter_token";

export function getWaiterToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(WAITER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setWaiterToken(token: string) {
  try {
    localStorage.setItem(WAITER_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearWaiterToken() {
  try {
    localStorage.removeItem(WAITER_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export const waiterApi = {
  login: (login: string, password: string, deviceId: string, deviceLabel: string) =>
    request<{
      token: string;
      waiter: { id: string; firstName: string; lastName: string; fullName: string };
      restaurant: { _id: string; name: string; imageUrl?: string };
    }>("/waiter/login", {
      method: "POST",
      body: JSON.stringify({ login, password, deviceId, deviceLabel }),
    }),

  me: () =>
    request<{
      _id: string; firstName: string; lastName: string;
      restaurantId: string;
      restaurant: { name: string; imageUrl?: string };
      earnings?: { total: number; orders: number };
    }>("/waiter/me", { auth: true }),

  tables: () => request<WaiterTable[]>("/waiter/tables", { auth: true }),

  menu: (restaurantId: string) =>
    request<Dish[]>(`/waiter/menu/${restaurantId}`, { auth: true }),

  setOrderStatus: (orderId: string, status: string) =>
    request(`/waiter/orders/${orderId}/status`, {
      method: "PATCH", auth: true,
      body: JSON.stringify({ status }),
    }),

  closeTable: (tableId: string, force?: boolean) =>
    request(`/waiter/tables/${tableId}/close`, {
      method: "POST", auth: true,
      body: JSON.stringify({ force }),
    }),

  tableDetail: (id: string) =>
    request<{
      table: WaiterTable & { guestCount: number; capacity: number; shape?: string };
      session: { _id: string; guestCount?: number } | null;
      orders: Array<DineInOrder & { note?: string }>;
      summary: { orders: number; subtotal: number; serviceFee: number; total: number };
    }>(`/waiter/tables/${id}`, { auth: true }),

  setGuests: (id: string, count: number) =>
    request<{ guestCount: number; status: string }>(`/waiter/tables/${id}/guests`, {
      method: "PATCH", auth: true,
      body: JSON.stringify({ count }),
    }),

  orders: (active?: boolean) =>
    request<{
      orders: Array<DineInOrder & {
        tableId?: { tableNumber: string; tableName?: string };
      }>;
      today: { orders: number; sales: number; serviceFee: number };
    }>(`/waiter/orders${active ? "?active=1" : ""}`, { auth: true }),

  requests: () =>
    request<Array<{
      _id: string; type: string; status: string;
      tableId?: { tableNumber: string; tableName?: string };
      createdAt: string;
    }>>("/waiter/requests", { auth: true }),

  updateRequest: (id: string, status: "accepted" | "done") =>
    request(`/waiter/requests/${id}`, {
      method: "PATCH", auth: true,
      body: JSON.stringify({ status }),
    }),

  createOrder: (tableId: string, items: unknown[], note?: string) =>
    request<DineInOrder>("/waiter/orders", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ tableId, items, note }),
    }),
};
