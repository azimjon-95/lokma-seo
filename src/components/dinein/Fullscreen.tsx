"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * To'liq ekran rejimi — faqat ofitsiant bo'limi uchun.
 *
 * Brauzer qoidasi: fullscreen'ni faqat foydalanuvchi harakatidan
 * keyin so'rash mumkin. Shuning uchun sahifa ochilganda emas,
 * birinchi bosishda so'raladi.
 *
 * iOS Safari'da Element.requestFullscreen yo'q — u yerda tugma
 * ko'rsatilmaydi va rejim oddiy holicha qoladi.
 */

interface FsDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}
interface FsElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

export function useFullscreen() {
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const el = document.documentElement as FsElement;
    setSupported(Boolean(el.requestFullscreen || el.webkitRequestFullscreen));

    const sync = () => {
      const d = document as FsDocument;
      setActive(Boolean(d.fullscreenElement || d.webkitFullscreenElement));
    };
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const enter = useCallback(async () => {
    const el = document.documentElement as FsElement;
    try {
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {
      /* Brauzer rad etdi — ilova oddiy rejimda ishlayveradi */
    }
  }, []);

  const exit = useCallback(async () => {
    const d = document as FsDocument;
    try {
      if (d.exitFullscreen) await d.exitFullscreen();
      else if (d.webkitExitFullscreen) await d.webkitExitFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    if (active) exit(); else enter();
  }, [active, enter, exit]);

  // Birinchi bosishda avtomatik — brauzer harakatsiz ruxsat bermaydi
  useEffect(() => {
    if (!supported) return;
    if (sessionStorage.getItem("wt_fs_asked")) return;

    const once = () => {
      sessionStorage.setItem("wt_fs_asked", "1");
      enter();
    };
    window.addEventListener("pointerdown", once, { once: true });
    return () => window.removeEventListener("pointerdown", once);
  }, [supported, enter]);

  return { active, supported, toggle };
}

/** Sarlavhadagi kichik tugma. */
export function FullscreenButton() {
  const { active, supported, toggle } = useFullscreen();
  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      className="wt-fs"
      title={active ? "To'liq ekrandan chiqish" : "To'liq ekran"}
      aria-label={active ? "To'liq ekrandan chiqish" : "To'liq ekran"}
    >
      {active ? "⤡" : "⤢"}
    </button>
  );
}
