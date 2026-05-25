import { getTumVeriler } from "@/modules/tv/lib/tv.service";
import { TvClient } from "@/modules/tv/components/TvClient";

export const dynamic = "force-dynamic";

/**
 * TV Kesim Takip Ekranı — FAZ 9
 *
 * - AppShell KULLANMAZ (fullscreen mode)
 * - Auth opsiyonel (public display: müşteri ve personel ortak görür)
 * - PII korunmuş: müşteri tam adı yerine kısaltma ("M. Yılmaz")
 * - SSE ile 3 saniyede bir canlı güncelleme
 * - Light/Dark tema toggle
 */
export default async function TvSayfasi() {
  // Auth ZORUNLU değil — public display
  const ilkVeri = await getTumVeriler();
  return <TvClient ilkVeri={ilkVeri} />;
}
