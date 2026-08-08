"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * To'liq ekran rejimi (F11 kabi).
 *
 * Platformalar bo'yicha haqiqat:
 *   • Desktop (Chrome, Firefox, Edge) — ishlaydi
 *   • Android Chrome/Samsung — ishlaydi, brauzer paneli yashiriladi
 *   • iPhone Safari — Element.requestFullscreen UMUMAN YO'Q.
 *     Bu Apple cheklovi, JS bilan aylanib o'tib bo'lmaydi.
 *     Yagona yo'l — sahifani "Bosh ekranga qo'shish" (PWA),
 *     shunda Safari paneli chiqmaydi. IosHint shuni aytadi.
 *
 * Brauzer qoidasi: fullscreen faqat foydalanuvchi harakatidan
 * keyin so'ralishi mumkin — sahifa ochilishida emas. Shuning
 * uchun har bosishda tekshiramiz va kerak bo'lsa qaytaramiz.
 *
 * Foydalanuvchi tugma orqali chiqsa — majburlamaymiz.
 */

const OPT_OUT = "lokma_fs_off";

interface FsDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}
interface FsElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

function isFullscreen() {
  const d = document as FsDocument;
  return Boolean(d.fullscreenElement || d.webkitFullscreenElement);
}

export function useFullscreen() {
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const el = document.documentElement as FsElement;
    setSupported(Boolean(el.requestFullscreen || el.webkitRequestFullscreen));

    const sync = () => setActive(isFullscreen());
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
    if (active) {
      // Ataylab chiqdi — qaytarib turmaymiz
      sessionStorage.setItem(OPT_OUT, "1");
      exit();
    } else {
      sessionStorage.removeItem(OPT_OUT);
      enter();
    }
  }, [active, enter, exit]);

  return { active, supported, toggle, enter };
}

/**
 * Ilova sahifalariga qo'yiladi — to'liq ekranni ushlab turadi.
 * Ko'rinadigan hech narsa chizmaydi.
 */
export function FullscreenGate() {
  const { supported, enter } = useFullscreen();

  // Sahifa emas, ichki maydon surilsin — iOS'da "rezina"
  // effekti sarlavhani surib yuborardi va tepada oq chiziq
  // chiqarardi. Marketing sahifasiga tegmaydi.
  useEffect(() => {
    document.documentElement.classList.add("app-locked");
    return () => document.documentElement.classList.remove("app-locked");
  }, []);

  useEffect(() => {
    if (!supported) return;

    const onTap = () => {
      if (sessionStorage.getItem(OPT_OUT)) return;
      if (isFullscreen()) return;
      enter();
    };

    // Har bosishda tekshiriladi: sahifalar orasida yurganda yoki
    // Esc bosilganda rejim tushib qoladi, keyingi tegishda qaytadi
    window.addEventListener("pointerdown", onTap);
    return () => window.removeEventListener("pointerdown", onTap);
  }, [supported, enter]);

  return <IosHint blocked={!supported} />;
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

/**
 * iPhone'da to'liq ekran API yo'q. Yagona yo'l — bosh ekranga
 * qo'shish. Bir marta ko'rsatiladi, yopilsa qaytmaydi.
 */
function IosHint({ blocked }: { blocked: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!blocked) return;

    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua)
      // iPadOS o'zini Mac deb ko'rsatadi
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isIos) return;

    // Allaqachon bosh ekrandan ochilgan bo'lsa kerak emas
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone) return;

    if (localStorage.getItem("lokma_ios_hint")) return;
    const timer = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(timer);
  }, [blocked]);

  if (!show) return null;

  const close = () => {
    localStorage.setItem("lokma_ios_hint", "1");
    setShow(false);
  };

  return (
    <div className="fs-hint" role="note">
      <div className="fs-hint__body">
        <b>To&apos;liq ekranda ishlatish</b>
        <span>
          Pastdagi <b>Ulashish</b> tugmasi → <b>Bosh ekranga qo&apos;shish</b>.
          Shunda ilova Safari panelisiz ochiladi.
        </span>
      </div>
      <button onClick={close} aria-label="Yopish">✕</button>
    </div>
  );
}
