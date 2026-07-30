"use client";

import { useEffect, useState, useCallback } from "react";
import Splash from "@/components/Splash";
import RedirectButton from "@/components/RedirectButton";
import { TELEGRAM_APP_URL, BOT_USERNAME } from "@/lib/site";

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
        <h1>
          Lokma (LokmaGo) — Namangan va Popda ovqat yetkazib berish
        </h1>
      
        <p>
          <strong>Lokma</strong> — bu <strong>LokmaGo</strong> ovqat yetkazib
          berish xizmati. Sayt manzili: <strong>lokma.uz</strong>. Namangan shahri
          va Pop tumanidagi restoran, kafe va choyxonalardan taom buyurtma qiling.
          Buyurtmangizni qulay tarzda yetkazib berish yoki o'zingiz olib ketish
          xizmatidan foydalaning.
        </p>
      
        <h2>Lokma nima?</h2>
        <p>
          Lokma (LokmaGo) — O'zbekistonda ovqat buyurtma qilish platformasi.
          Telegram ilovasi orqali ishlaydi: alohida dastur o'rnatish shart emas.
          Namangan va Popdagi restoranlar menyusini ko'rasiz, taom tanlaysiz,
          manzil kiritasiz va buyurtmangizni kuzatib borasiz.
        </p>
      
        <h2>Namanganda ovqat buyurtma qilish</h2>
        <p>
          Namangan shahrida Lokma orqali restoran, kafe va choyxonalardan turli
          xil taomlarga buyurtma berishingiz mumkin. Milliy taomlar, fast food,
          pitsa, sushi, shirinliklar va ichimliklarni tanlang va buyurtmangizni
          qulay tarzda qabul qiling.
        </p>
      
        <h2>Popda ovqat buyurtma qilish</h2>
        <p>
          Pop tumanida ham Lokma orqali ovqat buyurtma qilish imkoniyati mavjud.
          Popdagi restoran va ovqatlanish joylaridan menyuni ko'rib, kerakli
          taomlarni tanlang va mavjud yetkazib berish xizmatidan foydalaning.
        </p>
      
        <h2>Qanday buyurtma beriladi?</h2>
        <ol>
          <li>lokma.uz saytiga kiring yoki Telegram'da LokmaGo botini oching</li>
          <li>Namangan yoki Popdagi restoran va taomlarni tanlang</li>
          <li>Yetkazib berish manzilini kiriting yoki o'zingiz olib ketishni belgilang</li>
          <li>To'lov usulini tanlang — naqd yoki karta</li>
          <li>Buyurtma holatini kuzatib boring</li>
        </ol>
      
        <h2>Lokma xizmatlari</h2>
        <ul>
          <li>
            <strong>Yetkazib berish</strong> — buyurtmangizni kuryer ko'rsatilgan
            manzilga olib boradi
          </li>
          <li>
            <strong>O'zim olib ketaman</strong> — buyurtmani restoran tayyorlagach,
            o'zingiz borib olib ketishingiz mumkin
          </li>
          <li>
            <strong>Stol bron qilish</strong> — restoranda joyni oldindan band qiling
          </li>
          <li>
            <strong>Belgilangan vaqtga buyurtma</strong> — taomni kerakli vaqtga
            oldindan buyurtma qiling
          </li>
          <li>
            <strong>Bonus tizimi</strong> — do'stlaringizni taklif qiling va
            bonuslardan foydalaning
          </li>
        </ul>
      
        <h2>Lokmada qanday taomlar bor?</h2>
        <p>
          Milliy taomlar: osh (palov), shashlik, lag'mon, manti, somsa, sho'rva,
          norin. Fast food: lavash, shaurma, burger, hot-dog, kartoshka fri.
          Xorijiy oshxonalar: pitsa, sushi va rollar, yevropa taomlari,
          turk taomlari. Shirinliklar: tort, chizkeyk, muzqaymoq.
          Ichimliklar: qahva, choy, sharbat va salqin ichimliklar.
        </p>
      
        <h2>Lokma qayerda ishlaydi?</h2>
        <p>
          Lokma hozirda Namangan shahri va Pop tumanida xizmat ko'rsatishga
          yo'naltirilgan. Platformaga yangi restoran, kafe, choyxona va boshqa
          ovqatlanish joylari muntazam qo'shib boriladi.
        </p>
      
        <h2>To'lov usullari</h2>
        <p>
          Buyurtma uchun naqd pul yoki plastik karta orqali to'lash mumkin.
          UzCard, Humo, Visa va Mastercard kabi to'lov usullaridan foydalanish
          imkoniyati mavjud.
        </p>
      
        <h2>Restoranlar uchun Lokma</h2>
        <p>
          Namangan yoki Popda restoran, kafe, choyxona yoki oziq-ovqat do'koni
          egasimisiz? Lokma platformasiga qo'shiling va yangi mijozlarga
          chiqish imkoniyatiga ega bo'ling. Menyu, buyurtmalar va bronlarni
          boshqarish uchun qulay panel taqdim etiladi.
        </p>
      
        <h2>Aloqa</h2>
        <p>
          Sayt: lokma.uz · Telegram: @{BOT_USERNAME} · LokmaGo ilovasidagi
          qo'llab-quvvatlash chati orqali biz bilan bog'lanishingiz mumkin.
        </p>
      
        <nav>
          <a href={TELEGRAM_APP_URL}>
            LokmaGo ilovasini Telegram orqali ochish
          </a>
        </nav>
      </div>
    </main>
  );
}
