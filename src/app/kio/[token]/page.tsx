import type { Metadata } from "next";
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
