import { MusteriGirisClient } from "@/modules/tv/components/musteri/MusteriGirisClient";

export const dynamic = "force-dynamic";

/**
 * Müşteri telefon ana sayfası — giriş ekranı.
 * Auth ZORUNLU değil (public display, DANA-X üzerinden takip).
 */
export default function TvMusteriAnaSayfa() {
  return <MusteriGirisClient />;
}
