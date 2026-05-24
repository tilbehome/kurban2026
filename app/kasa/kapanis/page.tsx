import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/shared/lib/prisma";
import { gunlukRapor } from "@/modules/kasa/lib/kasa.service";
import { formatPara, topla, yuvarla } from "@/shared/lib/para";
import { formatTarihSaat } from "@/shared/lib/tarih";
import { KasaKapanisForm } from "./KasaKapanisForm";

export const dynamic = "force-dynamic";

export default async function KasaKapanisPage() {
  const baslangic = new Date();
  baslangic.setHours(0, 0, 0, 0);

  const [acilis, rapor, bugunkuGider, bugunkuKapanis] = await Promise.all([
    prisma.kasaHareketi.findFirst({
      where: { tip: "acilis", tarih: { gte: baslangic } },
      orderBy: { tarih: "desc" },
    }),
    gunlukRapor(),
    prisma.kasaHareketi.findMany({
      where: { tip: "gider", tarih: { gte: baslangic } },
    }),
    prisma.kasaHareketi.findFirst({
      where: { tip: "kapanis", tarih: { gte: baslangic } },
      orderBy: { tarih: "desc" },
      include: { kullanici: { select: { adSoyad: true } } },
    }),
  ]);

  const acilisTutar = acilis?.tutar ?? 0;
  const giderTutar = yuvarla(topla(...bugunkuGider.map((g) => g.tutar)));
  const beklenenNakit = yuvarla(acilisTutar + rapor.nakit - giderTutar);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Kasa Kapanış (Gün Sonu)"
        altBaslik="Gün sonu nakit sayımı ve fark kontrolü"
      />

      <div className="grid grid-cols-1 gap-4 p-6 sm:p-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gün Özeti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Satir ad="Açılış Nakit" deger={formatPara(acilisTutar)} />
            <Satir
              ad="Bugünkü Nakit Tahsilat"
              deger={`+ ${formatPara(rapor.nakit)}`}
              renk="text-green-600"
            />
            <Satir
              ad="Bugünkü Gider (Nakit)"
              deger={`- ${formatPara(giderTutar)}`}
              renk="text-red-600"
            />
            <div className="border-t pt-3">
              <Satir
                ad="Beklenen Nakit"
                deger={formatPara(beklenenNakit)}
                vurgu
              />
            </div>
            <div className="text-muted-foreground mt-4 text-xs">
              + Havale: {formatPara(rapor.havale)} · Kart: {formatPara(rapor.kart)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {bugunkuKapanis ? "Tekrar Kapat" : "Kasayı Kapat"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bugunkuKapanis && (
              <div className="mb-4 rounded-md border bg-amber-50 p-3 text-sm">
                <p className="font-medium">Bugün zaten kapanış yapılmış:</p>
                <p className="font-tabular mt-1 text-amber-700">
                  {formatPara(bugunkuKapanis.tutar)} ·{" "}
                  {formatTarihSaat(bugunkuKapanis.tarih)} ·{" "}
                  {bugunkuKapanis.kullanici.adSoyad}
                </p>
              </div>
            )}
            <KasaKapanisForm beklenenNakit={beklenenNakit} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Satir({
  ad,
  deger,
  renk,
  vurgu = false,
}: {
  ad: string;
  deger: string;
  renk?: string;
  vurgu?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={vurgu ? "font-semibold" : "text-muted-foreground"}>
        {ad}
      </span>
      <span
        className={`font-tabular ${vurgu ? "text-lg font-bold" : "font-medium"} ${renk ?? ""}`}
      >
        {deger}
      </span>
    </div>
  );
}
