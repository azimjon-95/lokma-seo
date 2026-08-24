"use client";

import { useEffect, useRef } from "react";

/**
 * Ekran o'chmasligi — Screen Wake Lock API.
 *
 * Platformalar bo'yicha haqiqat:
 *   • Android Chrome / Edge — ishlaydi
 *   • iOS Safari 16.4+ — ishlaydi
 *   • Eski iOS va ba'zi brauzerlar — API YO'Q. Aylanib
 *     o'tish yo'li yo'q (video loop hiylasi batareyani yeydi
 *     va iOS'da baribir ishonchsiz). Bunday qurilmada
 *     planshet sozlamalaridan "Ekran o'chishi: hech qachon"
 *     qo'yilishi kerak — buni kod hal qila olmaydi.
 *
 * MUHIM: qulf sahifa fonga o'tganda (boshqa ilovaga
 * o'tilganda) brauzer tomonidan AVTOMATIK bekor qilinadi.
 * Shuning uchun `visibilitychange` da qayta so'raymiz —
 * aks holda planshet bir marta boshqa ilovaga o'tgach
 * ekran o'chib qolaverardi.
 */

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener: (t: string, cb: () => void) => void;
}

/*
 * `extends Navigator` ishlatilmaydi: TS'ning o'z lib.dom
 * ta'rifida `wakeLock` MAJBURIY maydon, biznikida esa ixtiyoriy
 * (eski brauzerlarda umuman yo'q) — ular to'qnashadi.
 */
type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

export function useWakeLock(enabled: boolean) {
  const ref = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const nav = navigator as NavigatorWithWakeLock;
    if (!nav.wakeLock) return undefined;

    let cancelled = false;

    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      if (ref.current) return;

      try {
        const sentinel = await nav.wakeLock!.request("screen");
        if (cancelled) {
          sentinel.release().catch(() => {});
          return;
        }
        ref.current = sentinel;
        sentinel.addEventListener("release", () => {
          ref.current = null;
        });
      } catch {
        /* Batareya kam bo'lsa brauzer rad etadi — jim o'tamiz */
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") acquire();
    };

    /*
     * Foydalanuvchi harakatida ham qayta so'raymiz.
     *
     * SABAB: brauzer qulfni jimgina bekor qilishi mumkin —
     * batareya kamayganda, tizim quvvat tejash rejimiga
     * o'tganda yoki tab fonga tushib qaytganda. `release`
     * hodisasi har doim ham kelmaydi, shuning uchun faqat
     * visibilitychange ga tayanish yetarli emas edi:
     * planshet bir necha soatdan keyin ekranni o'chirib
     * qo'yardi. Har tegishda tekshirish arzon — qulf
     * allaqachon bor bo'lsa `acquire` darhol qaytadi.
     */
    const onActivity = () => acquire();

    acquire();
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("fullscreenchange", onActivity);
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("focus", onActivity);

    // Har 30 soniyada tekshirib turamiz — yuqoridagi hodisalarning
    // birortasi ham kelmagan holat uchun oxirgi to'siq
    const guard = setInterval(acquire, 30_000);

    return () => {
      cancelled = true;
      clearInterval(guard);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("fullscreenchange", onActivity);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("focus", onActivity);
      ref.current?.release().catch(() => {});
      ref.current = null;
    };
  }, [enabled]);
}
