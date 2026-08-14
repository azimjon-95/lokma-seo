/**
 * QR orqali ochilgan mijoz menyusi.
 *
 * Avval bu yerda FullscreenGate ishlatilardi (ofitsiant paneli
 * bilan bir xil) — u to'liq ekranga o'tishga urinar va iOS'da
 * "Bosh ekranga qo'shish" degan pastdan chiquvchi maslahatni
 * ko'rsatardi. Mijoz uchun bu noo'rin: u kunlik ishlatadigan
 * xodim emas, bir martalik tashrif uchun kelgan — hint taom
 * ro'yxati ustiga tushib, uni yopish kerak bo'lardi. Ofitsiant
 * bo'limida (kunlik qurilma) esa hali ham ishlatiladi.
 */
export default function DineInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
