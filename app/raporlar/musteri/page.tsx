import { YakindaSayfasi } from "@/shared/components/YakindaSayfasi";

export const dynamic = "force-dynamic";

export default function MusteriBazliRaporPage() {
  return (
    <YakindaSayfasi
      baslik="Müşteri Bazlı Rapor"
      aciklama="Müşteri detay raporu. Şimdilik /musteriler/[id] sayfasından müşteri detayını görebilirsiniz."
    />
  );
}
