import { YakindaSayfasi } from "@/shared/components/YakindaSayfasi";

export const dynamic = "force-dynamic";

export default function PosKasaPage() {
  return (
    <YakindaSayfasi
      baslik="POS (Kart)"
      aciklama="Kart tahsilatları için detay sayfası. /kasa ekranında kart toplamını görebilirsiniz."
    />
  );
}
