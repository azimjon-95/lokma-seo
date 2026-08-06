"use client";

import { useState, useEffect, useCallback } from "react";
import type { Dish, DishOption } from "./api";

/**
 * Zal savati.
 *
 * Kutubxonasiz — oddiy hook va sessionStorage. Sahifa
 * yangilansa savat qoladi.
 */

export interface CartItem {
  key: string;
  dish: Dish;
  quantity: number;
  selectedOptions: DishOption[];
  unitPrice: number;
  note?: string;
}

const CART_KEY = "lokma_dinein_cart";

function itemKey(dishId: string, options: DishOption[]): string {
  const opts = options.map((o) => o.name).sort().join("|");
  return `${dishId}__${opts}`;
}

function load(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function persist(items: CartItem[]) {
  try {
    sessionStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

// Barcha komponentlar bitta holatni ko'radi
let listeners: Array<() => void> = [];
let cache: CartItem[] | null = null;

function getItems(): CartItem[] {
  if (cache === null) cache = load();
  return cache;
}

function setItems(items: CartItem[]) {
  cache = items;
  persist(items);
  listeners.forEach((fn) => fn());
}

export function useCart() {
  const [, force] = useState(0);

  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  }, []);

  const items = getItems();

  const add = useCallback((dish: Dish, quantity = 1, options: DishOption[] = []) => {
    const key = itemKey(dish._id, options);
    const current = getItems();
    const existing = current.find((i) => i.key === key);

    if (existing) {
      setItems(current.map((i) =>
        i.key === key ? { ...i, quantity: i.quantity + quantity } : i,
      ));
    } else {
      const optionsPrice = options.reduce((s, o) => s + (o.price || 0), 0);
      setItems([...current, {
        key,
        dish,
        quantity,
        selectedOptions: options,
        unitPrice: dish.price + optionsPrice,
      }]);
    }
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    const current = getItems();
    if (quantity <= 0) {
      setItems(current.filter((i) => i.key !== key));
    } else {
      setItems(current.map((i) => (i.key === key ? { ...i, quantity } : i)));
    }
  }, []);

  const remove = useCallback((key: string) => {
    setItems(getItems().filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const quantityOf = useCallback((dishId: string) => {
    return getItems()
      .filter((i) => i.dish._id === dishId)
      .reduce((s, i) => s + i.quantity, 0);
  }, []);

  return { items, count, subtotal, add, setQuantity, remove, clear, quantityOf };
}

/** Server uchun tayyorlangan ro'yxat. */
export function toOrderItems(items: CartItem[]) {
  return items.map((i) => ({
    dishId: i.dish._id,
    quantity: i.quantity,
    selectedOptions: i.selectedOptions.map((o) => ({ name: o.name })),
    note: i.note,
  }));
}
