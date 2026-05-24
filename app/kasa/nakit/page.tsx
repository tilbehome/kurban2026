import { YakindaSayfasi } from "@/shared/components/YakindaSayfasi";

export const dynamic = "force-dynamic";

export default function NakitKasaPage() {
  return (
    <YakindaSayfasi
      baslik="Nakit Kasası"
      aciklama="Sadece nakit hareketleri için ayrı dashboard. Şimdilik /kasa ekranında nakit toplamını görebilirsiniz."
    />
  );
}
