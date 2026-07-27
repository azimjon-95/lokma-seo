"use client";

import { useEffect, useState, useCallback } from "react";
import Splash from "@/components/Splash";
import RedirectButton from "@/components/RedirectButton";

// ⬇️ BU QISIMNI QO'SHING
declare global {
  interface Window {
    Telegram?: {
      WebApp?: unknown;
    };
  }
}

const TELEGRAM_BOT_URL = "https://t.me/lokmaGobot?startapp";
const REDIRECT_DELAY = 1200;

export default function Home() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);

  const redirectToTelegram = useCallback(() => {
    setIsRedirecting(true);
    if (typeof window !== "undefined") {
      window.location.replace(TELEGRAM_BOT_URL);
    }
  }, []);

  useEffect(() => {
    const isTelegramWebView =
      typeof window !== "undefined" &&
      (window.Telegram?.WebApp != null ||
        /Telegram/i.test(navigator.userAgent) ||
        /TGWebView/i.test(navigator.userAgent));

    setIsTelegram(isTelegramWebView);

    if (isTelegramWebView) {
      redirectToTelegram();
      return;
    }

    const timer = setTimeout(() => {
      redirectToTelegram();
    }, REDIRECT_DELAY);

    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, REDIRECT_DELAY + 500);

    return () => {
      clearTimeout(timer);
      clearTimeout(buttonTimer);
    };
  }, [redirectToTelegram]);

  return (
    <main className="min-h-screen bg-lokma-black">
      <Splash isRedirecting={isRedirecting} />

      {showButton && !isTelegram && (
        <div className="fixed bottom-12 left-0 right-0 z-50 flex justify-center px-6">
          <RedirectButton onClick={redirectToTelegram} />
        </div>
      )}

      <div className="sr-only">
        <h1>LokmaGo — Sevimli restoran va kafelaringiz bir joyda</h1>
        <p>
          Sizning sevimli restoran va kafelaringiz endi bir joyda. Mazali
          taomlarni tez va qulay buyurtma qiling. Ovqat yetkazib berish,
          restoran bron qilish, kafe va choyxonalar — barchasi LokmaGo'da.
        </p>
        <p>
          LokmaGo orqali Toshkent va boshqa shaharlardagi eng yaxshi
          restoranlardan taom buyurtma qiling. Milliy taomlar, fast food,
          evropa va osiyo mutfaklari.
        </p>
        <nav>
          <a href={TELEGRAM_BOT_URL}>LokmaGo Telegram Mini App</a>
        </nav>
      </div>
    </main>
  );
}