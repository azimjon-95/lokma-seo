import { FullscreenGate } from "@/components/dinein/Fullscreen";

/** QR orqali ochilgan menyu ham to'liq ekranda. */
export default function DineInLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FullscreenGate />
      {children}
    </>
  );
}
