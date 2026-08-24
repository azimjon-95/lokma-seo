import { NextResponse, type NextRequest } from "next/server";

/**
 * Domen bo'yicha yo'naltirish.
 *
 * waiter.lokma.uz → /waiter, /kio/{token}
 * lokma.uz        → oddiy sayt
 *
 * Ikkala interfeys bitta repoda — alohida deploy kerak emas.
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const isWaiter = host.startsWith("waiter.");

  if (!isWaiter) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Ofitsiant domenida faqat /waiter ochiladi
  if (pathname === "/" || pathname === "") {
    return NextResponse.rewrite(new URL("/waiter", req.url));
  }

  // Statik fayllar va API o'tadi
  if (
    pathname.startsWith("/waiter")
    // Kiosk — zaldagi planshet. Havolaning o'zi kredensial,
    // shuning uchun bosh sahifaga yo'naltirilmasligi kerak:
    // aks holda planshet har yangilanganda login ekraniga
    // tushib qolardi.
    || pathname.startsWith("/kio")
    || pathname.startsWith("/_next")
    || pathname.startsWith("/favicon")
    || /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Qolgani ofitsiant paneliga
  return NextResponse.redirect(new URL("/", req.url));
}

export const config = {
  matcher: [
    // Statik fayllardan tashqari hamma yo'l
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|txt|xml)$).*)",
  ],
};
