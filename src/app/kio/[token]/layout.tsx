import { FullscreenGate } from "@/components/dinein/Fullscreen";

/**
 * Kiosk to'liq ekranda ishlaydi.
 *
 * `FullscreenGate` /waiter layout'ida bor edi, lekin /kio unga
 * kirmaydi — shuning uchun kioskda to'liq ekran faqat bir marta
 * so'ralib, Esc bosilsa yoki sahifa qayta yuklansa qaytmasdi.
 * Gate har tegishda tekshiradi va iPhone uchun "Bosh ekranga
 * qo'shish" maslahatini chiqaradi.
 */
export default async function KioskLayout({
  children, params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <>
      {/* Tokenga bog'langan manifest — "Bosh ekranga qo'shish"
          marketing sahifasini emas, aynan shu kioskni ochadi */}
      <link rel="manifest" href={`/kio/${token}/manifest.webmanifest`} />
      <FullscreenGate />
      {children}
    </>
  );
}
