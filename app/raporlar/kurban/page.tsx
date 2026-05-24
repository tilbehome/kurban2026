import { YakindaSayfasi } from "@/shared/components/YakindaSayfasi";

export const dynamic = "force-dynamic";

export default function KurbanBazliRaporPage() {
  return (
    <YakindaSayfasi
      baslik="Kurban Bazlı Rapor"
      aciklama="Kurban detay raporu. Şimdilik /raporlar > Kurbanlar sekmesinde özet bilgi var."
    />
  );
}
