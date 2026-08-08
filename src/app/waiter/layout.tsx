import { FullscreenGate } from "@/components/dinein/Fullscreen";

/**
 * Ofitsiant bo'limi to'liq ekranda ishlaydi.
 * Marketing sahifasiga (/) tegmaydi — u qidiruv tizimlari uchun
 * oddiy sahifa bo'lib qolishi kerak.
 */
export default function WaiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FullscreenGate />
      {children}
    </>
  );
}
