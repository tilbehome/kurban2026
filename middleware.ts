import { NextResponse, type NextRequest } from "next/server";

/**
 * Hafif middleware: cookie var mı kontrol et.
 * Gerçek oturum doğrulama sunucu bileşenlerinde (AppShell) yapılır.
 *
 * Sadece statik dosyaları, /giris ve /api/auth/* yollarını dışarıda tutar.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/giris" ||
    pathname === "/favicon.ico" ||
    pathname.includes(".") ||
    // TV public display: ana ekran + SSE + REST fallback auth GEREKTİRMEZ
    // (/tv/kontrol ve /tv/ayarlar AppShell içinde kendi auth kontrolünü yapar)
    pathname === "/tv" ||
    pathname === "/api/tv/yayin" ||
    pathname === "/api/tv/veriler" ||
    pathname === "/api/tv/operasyon-istatistik"
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("tilbe-kurban-session");
  if (!cookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Tüm yolları eşle, sadece şunları hariç tut:
     *  - _next/static (statik dosyalar)
     *  - _next/image (resim optimizasyonu)
     *  - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
