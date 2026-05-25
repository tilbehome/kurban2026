import { notFound } from "next/navigation";
import { prisma } from "@/shared/lib/prisma";
import { ayarOku } from "@/modules/_core/ayarlar/ayar.service";
import { KurbanTakipClient } from "@/modules/tv/components/musteri/KurbanTakipClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ kesimSirasi: string }>;
}

/**
 * Müşteri DANA-X takip sayfası (mobile).
 * Auth ZORUNLU değil (public — DANA-X üzerinden takip).
 */
export default async function KurbanTakipPage({ params }: PageProps) {
  const { kesimSirasi: paramSira } = await params;
  const sira = parseInt(paramSira, 10);
  if (Number.isNaN(sira) || sira <= 0) notFound();

  const kurban = await prisma.kurban.findUnique({
    where: { kesimSirasi: sira },
    select: {
      id: true,
      kesimSirasi: true,
      kupeNo: true,
      hisseSayisi: true,
      silindiMi: true,
    },
  });
  if (!kurban || kurban.silindiMi) notFound();

  const whatsappTelAyar = await prisma.tvAyari.findUnique({
    where: { anahtarKey: "whatsapp_tel" },
  });
  const whatsappTel =
    whatsappTelAyar?.deger ??
    (await ayarOku("firma_telefon", "")) ??
    "";

  return (
    <KurbanTakipClient
      kurbanId={kurban.id}
      kesimSirasi={kurban.kesimSirasi}
      kupeNo={kurban.kupeNo}
      hisseSayisi={kurban.hisseSayisi}
      whatsappTel={whatsappTel}
    />
  );
}
