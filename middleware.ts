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
    // PWA public: manifest, sw, push handler (cache'lenebilir)
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/workbox-sw.js" ||
    pathname.startsWith("/workbox-") ||
    pathname === "/push-handler.js" ||
    pathname === "/offline" ||
    // TV public display: ana ekran + SSE + REST fallback auth GEREKTİRMEZ
    // (/tv/kontrol ve /tv/ayarlar AppShell içinde kendi auth kontrolünü yapar)
    pathname === "/tv" ||
    pathname.startsWith("/tv/m") ||
    pathname === "/api/tv/yayin" ||
    pathname === "/api/tv/veriler" ||
    pathname === "/api/tv/operasyon-istatistik" ||
    pathname === "/api/tv/musteri-bul" ||
    pathname === "/api/tv/push-abonelik" ||
    pathname.startsWith("/api/tv/push-gonder") ||
    pathname === "/api/tv/acil-durum" ||
    pathname === "/api/audit/pwa-yukleme" ||
    // Müşteri dekont doğrulama — public erişim
    pathname === "/dogrula" ||
    pathname === "/api/dekont/dogrula"
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("tilbe-kurban-session");
  if (!cookie) {
    // PWA?pwa=1 ile açılan anonim oturum → müşteri ekranına yönlendir
    if (req.nextUrl.searchParams.get("pwa") === "1" && pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/tv/m";
      url.searchParams.delete("pwa");
      return NextResponse.redirect(url);
    }
    const url = req.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // PWA ?pwa=1 yönlendirmesi (oturum var) — kasiyer rolünü middleware'de
  // bilemediğimiz için role-aware yönlendirmeyi server component'e bırakıyoruz.
  // Burada sadece pwa=1 parametresini temizleyip akış devam eder.
  // (Gerçek rol-yönlendirme app/page.tsx içinde olabilir)

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
