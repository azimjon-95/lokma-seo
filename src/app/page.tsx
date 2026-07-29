"use client";

import { useEffect, useState, useCallback } from "react";
import Splash from "@/components/Splash";
import RedirectButton from "@/components/RedirectButton";
import { TELEGRAM_APP_URL, SITE_NAME } from "@/lib/site";

// Window.Telegram turi src/types/telegram.d.ts da e'lon qilingan

const REDIRECT_DELAY = 5000; // 5 soniya

export default function Home() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);

  const redirectToTelegram = useCallback(() => {
    setIsRedirecting(true);
    if (typeof window !== "undefined") {
      window.location.replace(TELEGRAM_APP_URL);
    }
  }, []);

  useEffect(() => {
    // Qidiruv botlarini yo'naltirmaymiz — ular sahifani indekslashi kerak
    const ua = navigator.userAgent;
    const isBot = /bot|crawler|spider|crawling|googlebot|yandex|bingbot|facebookexternalhit|telegrambot/i.test(ua);
    if (isBot) {
      setShowButton(true);
      return;
    }

    const isTelegramWebView =
      window.Telegram?.WebApp != null || /Telegram|TGWebView/i.test(ua);

    setIsTelegram(isTelegramWebView);

    if (isTelegramWebView) {
      redirectToTelegram();
      return;
    }

    const timer = setTimeout(redirectToTelegram, REDIRECT_DELAY);
    const buttonTimer = setTimeout(() => setShowButton(true), REDIRECT_DELAY + 500);

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

      {/* Qidiruv tizimlari uchun kontent — ekranda ko'rinmaydi */}
      <div className="sr-only">
        <h1>{SITE_NAME} — restoran va kafelardan ovqat yetkazib berish</h1>

        <p>
          Namangan va Toshkentdagi eng yaxshi restoran, kafe va choyxonalardan
          taom buyurtma qiling. Buyurtmangiz 25–40 daqiqada yetkaziladi,
          ko&apos;p restoranlarda yetkazish bepul.
        </p>

        <h2>Qanday ishlaydi</h2>
        <ol>
          <li>Telegram orqali ilovani oching</li>
          <li>Restoran va taomlarni tanlang</li>
          <li>Manzil kiriting yoki o&apos;zingiz olib ketishni tanlang</li>
          <li>Buyurtmani real vaqtda kuzatib boring</li>
        </ol>

        <h2>Imkoniyatlar</h2>
        <ul>
          <li>Ovqat yetkazib berish — kuryer eshigingizgacha</li>
          <li>O&apos;zingiz olib ketish — yetkazish haqisiz</li>
          <li>Stol bron qilish — restoranda joy oldindan band qilinadi</li>
          <li>Belgilangan vaqtga buyurtma — kerakli soatga tayyorlanadi</li>
          <li>Naqd yoki karta orqali to&apos;lov</li>
          <li>Do&apos;stlarni taklif qilib bonus olish</li>
        </ul>

        <h2>Taom turlari</h2>
        <p>
          Milliy taomlar (osh, shashlik, lag&apos;mon, manti, sho&apos;rva),
          fast food (lavash, burger, hot-dog), pitsa, sushi va rollar,
          nonushta taomlari, shirinliklar, ichimliklar.
        </p>

        <h2>Xizmat ko&apos;rsatiladigan hududlar</h2>
        <p>
          Namangan shahri, Toshkent shahri va atrofdagi tumanlar.
          Restoranlar ro&apos;yxati doimiy kengayib bormoqda.
        </p>

        <nav>
          <a href={TELEGRAM_APP_URL}>
            {SITE_NAME} ilovasini Telegram orqali ochish
          </a>
        </nav>
      </div>
    </main>
  );
}
