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
          Lokma (LokmaGo) — Namangan va Toshkentda ovqat yetkazib berish
        </h1>

        <p>
          <strong>Lokma</strong> — bu <strong>LokmaGo</strong> ovqat yetkazib
          berish xizmati. Sayt manzili: <strong>lokma.uz</strong>. Namangan va
          Toshkent shahridagi eng yaxshi restoran, kafe va choyxonalardan taom
          buyurtma qiling. Buyurtmangiz 25–40 daqiqada yetkaziladi.
        </p>

        <h2>Lokma nima?</h2>
        <p>
          Lokma (LokmaGo) — O&apos;zbekistondagi onlayn ovqat buyurtma
          platformasi. Telegram ilovasi orqali ishlaydi: alohida dastur
          o&apos;rnatish shart emas. Restoranlar menyusini ko&apos;rasiz,
          taom tanlaysiz, manzil kiritasiz — kuryer olib keladi.
        </p>

        <h2>Qanday buyurtma beriladi</h2>
        <ol>
          <li>lokma.uz saytiga kiring yoki Telegram&apos;da botni oching</li>
          <li>Restoran va taomlarni tanlang</li>
          <li>Manzilni kiriting yoki o&apos;zingiz olib ketishni belgilang</li>
          <li>To&apos;lov usulini tanlang — naqd yoki karta</li>
          <li>Buyurtmani real vaqtda kuzatib boring</li>
        </ol>

        <h2>Xizmat imkoniyatlari</h2>
        <ul>
          <li>
            <strong>Yetkazib berish</strong> — kuryer eshigingizgacha olib
            keladi, ko&apos;p restoranlarda bepul
          </li>
          <li>
            <strong>O&apos;zim olib ketaman</strong> — yetkazish haqi
            olinmaydi, taom tayyor bo&apos;lganda borasiz
          </li>
          <li>
            <strong>Stol bron qilish</strong> — restoranda joyni oldindan
            band qiling, kelishingizga tayyor bo&apos;ladi
          </li>
          <li>
            <strong>Belgilangan vaqtga</strong> — kerakli soatga buyurtma
            bering, o&apos;shanda tayyorlanadi
          </li>
          <li>
            <strong>Bonus tizimi</strong> — do&apos;stlarni taklif qiling,
            ikkalangiz bonus olasiz
          </li>
        </ul>

        <h2>Qanday taomlar bor</h2>
        <p>
          Milliy taomlar: osh (palov), shashlik, lag&apos;mon, manti, somsa,
          sho&apos;rva, norin. Fast food: lavash, shaurma, burger, hot-dog,
          kartoshka fri. Xorijiy oshxona: pitsa, sushi va rollar, yevropa
          taomlari, turk taomlari. Shirinliklar: tort, chizkeyk, muzqaymoq.
          Ichimliklar: qahva, choy, sharbat, salqin ichimliklar.
        </p>

        <h2>Qayerda ishlaydi</h2>
        <p>
          Hozircha Namangan shahri va Toshkent shahrida xizmat
          ko&apos;rsatamiz. Restoranlar ro&apos;yxati doimiy kengaymoqda —
          yangi muassasalar har hafta qo&apos;shilib bormoqda.
        </p>

        <h2>To&apos;lov usullari</h2>
        <p>
          Naqd pul (kuryerga yetkazilganda) yoki plastik karta orqali:
          UzCard, Humo, Visa, Mastercard. Karta ma&apos;lumotlari xavfsiz
          saqlanadi — to&apos;liq raqam bazada saqlanmaydi.
        </p>

        <h2>Restoranlar uchun</h2>
        <p>
          Restoran, kafe, choyxona yoki oziq-ovqat do&apos;koni egasimisiz?
          Lokma platformasiga qo&apos;shiling — yangi mijozlar oling.
          Menyu, buyurtmalar va bronlarni boshqarish uchun alohida panel
          beriladi.
        </p>

        <h2>Aloqa</h2>
        <p>
          Sayt: lokma.uz · Telegram: @{BOT_USERNAME} · Ilovadagi
          qo&apos;llab-quvvatlash chati orqali istalgan vaqt yozing.
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
