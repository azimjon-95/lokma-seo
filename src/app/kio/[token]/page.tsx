import type { Metadata, Viewport } from "next";
import { KioskApp } from "@/components/kiosk/KioskApp";

/**
 * /kio/{token} — zaldagi planshet.
 *
 * noindex MAJBURIY: bu sahifa manzilining o'zi kredensial.
 * Qidiruv tizimiga tushib qolsa har kim zal panelini ocha oladi.
 */
export const metadata: Metadata = {
  title: "LokmaGo — Kiosk",
  robots: { index: false, follow: false, nocache: true },
  // iPhone'da to'liq ekranning yagona yo'li — bosh ekranga
  // qo'shish. Bu meta'lar bo'lmasa PWA Safari panelini
  // saqlab qoladi.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kiosk",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F3EF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Ekranning eng chetigacha — "tirnoq" atrofida oq
  // chiziq qolmasin
  viewportFit: "cover",
};

// Har bir token alohida — oldindan generatsiya qilinmaydi
export const dynamic = "force-dynamic";

export default async function KioskPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <KioskApp token={token} />;
}
