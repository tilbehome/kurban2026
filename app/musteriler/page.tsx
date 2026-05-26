import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { musterileriListele } from "@/modules/musteriler/lib/musteri.service";
import { musteriIstatistik } from "@/modules/musteriler/lib/istatistik";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatPara } from "@/shared/lib/para";
import { UserPlus, Search, Wallet, Phone, MessageCircle } from "lucide-react";
import { MusteriAramaInput } from "./MusteriAramaInput";
import { MusteriAvatar } from "@/modules/musteriler/components/MusteriAvatar";
import { MusteriRozetler } from "@/modules/musteriler/components/MusteriRozetler";
import { MusteriStatBar } from "@/modules/musteriler/components/MusteriStatBar";
import { AlfabeSeridi } from "@/modules/musteriler/components/AlfabeSeridi";

export const dynamic = "force-dynamic";

const SAYFA_BASINA = 50;

interface PageProps {
  searchParams: Promise<{
    arama?: string;
    durum?: "hepsi" | "borclu" | "odendi" | "kismi";
    harf?: string;
    sayfa?: string;
  }>;
}

export default async function MusterilerPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const sayfa = Math.max(1, Number.parseInt(sp.sayfa ?? "1", 10) || 1);
  const offset = (sayfa - 1) * SAYFA_BASINA;

  const [{ liste, toplam, doluHarfler }, ist] = await Promise.all([
    musterileriListele({
      arama: sp.arama,
      durum: sp.durum ?? "hepsi",
      harf: sp.harf,
      limit: SAYFA_BASINA,
      offset,
    }),
    musteriIstatistik(),
  ]);

  const guncelYil = new Date().getFullYear();

  const toplamSayfa = Math.max(1, Math.ceil(toplam / SAYFA_BASINA));

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Müşteriler"
        altBaslik={`${toplam.toLocaleString("tr-TR")} müşteri · Sayfa ${sayfa}/${toplamSayfa}`}
        aksiyonlar={
          <Link
            href="/musteriler/yeni"
            className={buttonVariants({ size: "lg" })}
          >
            <UserPlus size={18} className="mr-1.5" />
            Yeni Müşteri
          </Link>
        }
      />

      <div className="p-6 sm:p-8">
        {/* KPI Stat Bar */}
        <div className="mb-6">
          <MusteriStatBar veri={ist} aktifDurum={sp.durum ?? "hepsi"} />
        </div>

        {/* Arama + durum filtreleri */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <MusteriAramaInput baslangic={sp.arama ?? ""} />
          <DurumFiltresi
            mevcut={sp.durum ?? "hepsi"}
            arama={sp.arama}
            harf={sp.harf}
          />
        </div>

        {/* Alfabe şeridi — kart içinde */}
        <Card className="mb-4">
          <div className="p-4">
            <AlfabeSeridi
              doluHarfler={doluHarfler}
              aktif={sp.harf ?? null}
              digerQuery={{ arama: sp.arama, durum: sp.durum }}
            />
          </div>
        </Card>

        <Card>
          <table className="w-full">
            <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
              <tr>
                <th className="px-4 py-2 font-medium">Müşteri</th>
                <th className="px-4 py-2 font-medium">Telefon</th>
                <th className="px-4 py-2 font-medium text-right">Hisse</th>
                <th className="px-4 py-2 font-medium text-right">Bedel</th>
                <th className="px-4 py-2 font-medium text-right">Ödenen</th>
                <th className="px-4 py-2 font-medium text-right">Kalan</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {liste.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Search
                      size={28}
                      className="text-muted-foreground/40 mx-auto mb-2"
                    />
                    <p className="text-muted-foreground">Müşteri bulunamadı.</p>
                  </td>
                </tr>
              ) : (
                liste.map((m) => {
                  const kayitYil = guncelYil - m.kayitTarihi.getFullYear();
                  return (
                    <tr key={m.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <MusteriAvatar
                            musteriId={m.id}
                            adSoyad={m.adSoyad}
                            boyut="sm"
                          />
                          <div className="flex flex-col">
                            <Link
                              href={`/musteriler/${m.id}`}
                              className="font-medium hover:underline"
                            >
                              {m.adSoyad}
                            </Link>
                            <MusteriRozetler
                              veri={{
                                telefon: m.telefon,
                                hisseSayisi: m.hisseSayisi,
                                kayitYil,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs">
                        {m.telefon ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${m.telefon}`}
                              className="text-muted-foreground font-mono hover:underline"
                            >
                              <Phone size={11} className="inline" /> {m.telefon}
                            </a>
                            <a
                              href={`https://wa.me/${m.telefon.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-green-600"
                              title="WhatsApp"
                            >
                              <MessageCircle size={12} />
                            </a>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-tabular">
                        {m.hisseSayisi > 0 ? (
                          <span className="text-xs">
                            {m.hisseSayisi}{" "}
                            {m.ilkKurbanNo != null && (
                              <span className="text-muted-foreground font-mono">
                                #{m.ilkKurbanNo}.{m.ilkHisseNo}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-tabular">
                        {formatPara(m.toplamBedel)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-tabular text-green-600">
                        {formatPara(m.toplamOdenen)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold font-tabular">
                        <span
                          className={
                            m.kalan > 0
                              ? "text-amber-600"
                              : m.hisseSayisi > 0
                                ? "text-green-600"
                                : "text-muted-foreground"
                          }
                        >
                          {formatPara(m.kalan)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          {m.kalan > 0 && (
                            <Link
                              href={`/tahsilat/musteri/${m.id}`}
                              className={buttonVariants({
                                size: "sm",
                                variant: "outline",
                              })}
                              title="Hızlı tahsilat"
                            >
                              <Wallet size={12} />
                            </Link>
                          )}
                          <Link
                            href={`/musteriler/${m.id}`}
                            className={buttonVariants({
                              size: "sm",
                              variant: "outline",
                            })}
                          >
                            Detay
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Card>

        {/* Sayfalama */}
        {toplamSayfa > 1 && (
          <Sayfalama
            mevcutSayfa={sayfa}
            toplamSayfa={toplamSayfa}
            arama={sp.arama}
            durum={sp.durum}
            harf={sp.harf}
          />
        )}
      </div>
    </AppShell>
  );
}

function DurumFiltresi({
  mevcut,
  arama,
  harf,
}: {
  mevcut: "hepsi" | "borclu" | "odendi" | "kismi";
  arama?: string;
  harf?: string;
}) {
  const filtreler: { deger: typeof mevcut; ad: string }[] = [
    { deger: "hepsi", ad: "Hepsi" },
    { deger: "borclu", ad: "Borçlu" },
    { deger: "kismi", ad: "Kısmi" },
    { deger: "odendi", ad: "Ödenmiş" },
  ];

  return (
    <div className="flex gap-1 rounded-md border p-1">
      {filtreler.map((f) => {
        const qs = new URLSearchParams();
        if (arama) qs.set("arama", arama);
        if (harf) qs.set("harf", harf);
        if (f.deger !== "hepsi") qs.set("durum", f.deger);
        const yol = "/musteriler" + (qs.toString() ? `?${qs}` : "");
        const aktif = f.deger === mevcut;
        return (
          <Link
            key={f.deger}
            href={yol}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              aktif
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.ad}
          </Link>
        );
      })}
    </div>
  );
}

function Sayfalama({
  mevcutSayfa,
  toplamSayfa,
  arama,
  durum,
  harf,
}: {
  mevcutSayfa: number;
  toplamSayfa: number;
  arama?: string;
  durum?: string;
  harf?: string;
}) {
  function url(sayfa: number): string {
    const qs = new URLSearchParams();
    if (arama) qs.set("arama", arama);
    if (durum && durum !== "hepsi") qs.set("durum", durum);
    if (harf) qs.set("harf", harf);
    if (sayfa > 1) qs.set("sayfa", String(sayfa));
    return `/musteriler${qs.toString() ? `?${qs}` : ""}`;
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      {mevcutSayfa > 1 ? (
        <Link
          href={url(mevcutSayfa - 1)}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          ← Önceki
        </Link>
      ) : (
        <span className="text-muted-foreground text-sm">←</span>
      )}
      <span className="text-muted-foreground text-sm">
        {mevcutSayfa} / {toplamSayfa}
      </span>
      {mevcutSayfa < toplamSayfa ? (
        <Link
          href={url(mevcutSayfa + 1)}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Sonraki →
        </Link>
      ) : (
        <span className="text-muted-foreground text-sm">→</span>
      )}
    </div>
  );
}
