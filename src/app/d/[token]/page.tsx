import type { Metadata } from "next";
import { DineInEntry } from "./DineInEntry";

/**
 * QR kirish: lokma.uz/d/TOKEN
 *
 * Bu sahifa qidiruv tizimlariga indekslanmaydi — har stol
 * uchun alohida havola, ular ochiq bo'lmasligi kerak.
 */
export const metadata: Metadata = {
  title: "Menyu — LokmaGo",
  robots: { index: false, follow: false },
};

export default async function DineInPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <DineInEntry token={token} />;
}
