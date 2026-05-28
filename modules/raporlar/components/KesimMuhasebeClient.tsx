"use client";

/**
 * Kesim sırası detaylı muhasebe — accordion liste + arama + filtre + KPI özet.
 *
 * Sadece OKUMA — server'dan gelen veriyi gösterir. Yazdırma için ayrı sayfa
 * (/raporlar/kesim-muhasebe/yazdir). Kullanılan ikonlar lucide-react'in
 * temel set'inden — versiyon uyumluluğu için yeni ikon yok.
 */

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Printer,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { formatPara } from "@/shared/lib/para";
import { formatTarih } from "@/shared/lib/tarih";
import type { KesimMuhasebeKurban } from "@/modules/raporlar/lib/rapor.service";

interface Props {
  veri: KesimMuhasebeKurban[];
}

type Filtre = "hepsi" | "borclu" | "odenmis";

const FILTRE_BUTONLARI: { value: Filtre; label: string }[] = [
  { value: "hepsi", label: "Hepsi" },
  { value: "borclu", label: "Borçlu" },
  { value: "odenmis", label: "Ödenmiş" },
];

export function KesimMuhasebeClient({ veri }: Props) {
  const [arama, setArama] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("hepsi");
  const [acikKurbanlar, setAcikKurbanlar] = useState<Set<number>>(new Set());

  const ozet = useMemo(() => {
    return {
      toplamBedel: veri.reduce((s, k) => s + k.satisBedeli, 0),
      toplamOdenen: veri.reduce((s, k) => s + k.toplamOdenen, 0),
      toplamKalan: veri.reduce((s, k) => s + k.kalan, 0),
      toplamNakit: veri.reduce((s, k) => s + k.toplamNakit, 0),
      toplamHavale: veri.reduce((s, k) => s + k.toplamHavale, 0),
      toplamKart: veri.reduce((s, k) => s + k.toplamKart, 0),
    };
  }, [veri]);

  const filtreli = useMemo(() => {
    let liste = [...veri];
    const q = arama.trim().toLocaleLowerCase("tr-TR");
    if (q) {
      liste = liste.filter(
        (k) =>
          `dana-${k.kesimSirasi}`.includes(q) ||
          String(k.kesimSirasi) === q ||
          k.kupeNo?.toLocaleLowerCase("tr-TR").includes(q) ||
          k.hisseler.some((h) =>
            h.musteriAdi?.toLocaleLowerCase("tr-TR").includes(q),
          ),
      );
    }
    if (filtre === "borclu") {
      liste = liste.filter((k) => k.kalan > 0);
    } else if (filtre === "odenmis") {
      liste = liste.filter((k) => k.kalan <= 0);
    }
    return liste;
  }, [veri, arama, filtre]);

  function toggleKurban(no: number) {
    setAcikKurbanlar((eski) => {
      const yeni = new Set(eski);
      if (yeni.has(no)) yeni.delete(no);
      else yeni.add(no);
      return yeni;
    });
  }

  function hepsiniAc() {
    setAcikKurbanlar(new Set(filtreli.map((k) => k.kesimSirasi)));
  }

  function hepsiniKapat() {
    setAcikKurbanlar(new Set());
  }

  return (
    <div className="space-y-4">
      {/* KPI ÖZET */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <OzetKart label="Toplam Bedel" deger={formatPara(ozet.toplamBedel)} />
          <OzetKart
            label="Tahsil Edilen"
            deger={formatPara(ozet.toplamOdenen)}
            renk="text-green-600"
          />
          <OzetKart
            label="Kalan"
            deger={formatPara(ozet.toplamKalan)}
            renk="text-red-600"
          />
          <OzetKart label="Nakit" deger={formatPara(ozet.toplamNakit)} />
          <OzetKart label="Havale" deger={formatPara(ozet.toplamHavale)} />
          <OzetKart label="Kart" deger={formatPara(ozet.toplamKart)} />
        </div>
      </Card>

      {/* ARAÇ ÇUBUĞU */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Kesim no, küpe veya hissedar ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1">
          {FILTRE_BUTONLARI.map((f) => (
            <Button
              key={f.value}
              variant={filtre === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltre(f.value)}
              className={
                filtre === f.value
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : ""
              }
            >
              {f.label}
            </Button>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={hepsiniAc}>
          Tümünü Aç
        </Button>
        <Button variant="outline" size="sm" onClick={hepsiniKapat}>
          Tümünü Kapat
        </Button>

        <a
          href="/raporlar/kesim-muhasebe/yazdir"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants(),
            "bg-orange-500 text-white hover:bg-orange-600",
          )}
        >
          <Printer className="mr-2 h-4 w-4" />
          Yazdır
        </a>
      </div>

      {/* KURBAN LİSTESİ */}
      {filtreli.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Aramaya uyan kurban yok.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtreli.map((k) => {
            const acik = acikKurbanlar.has(k.kesimSirasi);
            return (
              <Card key={k.kesimSirasi} className="overflow-hidden">
                <button
                  onClick={() => toggleKurban(k.kesimSirasi)}
                  className="hover:bg-muted/30 flex w-full items-center gap-3 p-4 text-left transition-colors"
                >
                  {acik ? (
                    <ChevronDown className="h-5 w-5 shrink-0" />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0" />
                  )}

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-lg font-bold text-orange-700">
                    {k.kesimSirasi}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">DANA-{k.kesimSirasi}</span>
                      {k.kupeNo && (
                        <Badge variant="outline" className="text-xs">
                          {k.kupeNo}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {k.hisseSayisi} hisse
                      </Badge>
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      Bedel: {formatPara(k.satisBedeli)} · Ödenen:{" "}
                      <span className="text-green-600">
                        {formatPara(k.toplamOdenen)}
                      </span>{" "}
                      ·{" "}
                      <span
                        className={
                          k.kalan > 0
                            ? "font-medium text-red-600"
                            : "text-green-600"
                        }
                      >
                        Kalan: {formatPara(k.kalan)}
                      </span>
                    </div>
                  </div>

                  {/* Yöntem özetleri (desktop) */}
                  <div className="hidden gap-3 text-xs md:flex">
                    <div className="text-center">
                      <div className="text-muted-foreground">Nakit</div>
                      <div className="font-medium tabular-nums">
                        {formatPara(k.toplamNakit)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Havale</div>
                      <div className="font-medium tabular-nums">
                        {formatPara(k.toplamHavale)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Kart</div>
                      <div className="font-medium tabular-nums">
                        {formatPara(k.toplamKart)}
                      </div>
                    </div>
                  </div>
                </button>

                {acik && (
                  <div className="bg-muted/10 space-y-3 border-t p-4">
                    {k.hisseler.map((h) => (
                      <div
                        key={h.hisseNo}
                        className="rounded-lg border bg-white p-3"
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="text-muted-foreground font-mono text-xs">
                              {k.kesimSirasi}.{h.hisseNo}
                            </span>
                            <span className="truncate font-medium">
                              {h.musteriAdi ?? (
                                <span className="text-muted-foreground italic">
                                  Boş hisse
                                </span>
                              )}
                            </span>
                            {h.telefon && (
                              <span className="text-muted-foreground text-xs">
                                {h.telefon}
                              </span>
                            )}
                            {h.vekaletAlindi && (
                              <Badge
                                variant="outline"
                                className="border-green-300 bg-green-50 text-xs text-green-700"
                              >
                                Vekalet alındı
                              </Badge>
                            )}
                          </div>
                          <div className="shrink-0 text-right text-sm">
                            <span className="text-muted-foreground">
                              Fiyat:{" "}
                            </span>
                            <span className="font-medium tabular-nums">
                              {formatPara(h.hisseFiyati)}
                            </span>
                            {h.kalan > 0 ? (
                              <span className="ml-2 text-red-600 tabular-nums">
                                Kalan: {formatPara(h.kalan)}
                              </span>
                            ) : (
                              <span className="ml-2 text-green-600">
                                Ödendi
                              </span>
                            )}
                          </div>
                        </div>

                        {h.odemeler.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-muted-foreground border-b">
                                  <th className="px-2 py-1 text-left">
                                    Tarih
                                  </th>
                                  <th className="px-2 py-1 text-left">
                                    Dekont
                                  </th>
                                  <th className="px-2 py-1 text-right">
                                    Nakit
                                  </th>
                                  <th className="px-2 py-1 text-right">
                                    Havale
                                  </th>
                                  <th className="px-2 py-1 text-right">
                                    Kart
                                  </th>
                                  <th className="px-2 py-1 text-right">
                                    Toplam
                                  </th>
                                  <th className="px-2 py-1 text-center">
                                    Durum
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {h.odemeler.map((o, i) => (
                                  <tr
                                    key={`${o.dekontNo}-${i}`}
                                    className={cn(
                                      "border-b last:border-0",
                                      o.iptal && "opacity-40 line-through",
                                    )}
                                  >
                                    <td className="px-2 py-1">
                                      {formatTarih(new Date(o.tarih))}
                                    </td>
                                    <td className="px-2 py-1 font-mono">
                                      {o.dekontNo}
                                    </td>
                                    <td className="px-2 py-1 text-right tabular-nums">
                                      {o.nakit > 0 ? formatPara(o.nakit) : "—"}
                                    </td>
                                    <td className="px-2 py-1 text-right tabular-nums">
                                      {o.havale > 0
                                        ? formatPara(o.havale)
                                        : "—"}
                                    </td>
                                    <td className="px-2 py-1 text-right tabular-nums">
                                      {o.kart > 0 ? formatPara(o.kart) : "—"}
                                    </td>
                                    <td className="px-2 py-1 text-right font-medium tabular-nums">
                                      {formatPara(o.toplamTutar)}
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                      {o.iptal ? (
                                        <span className="text-xs text-red-500">
                                          İPTAL
                                        </span>
                                      ) : (
                                        ""
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-xs italic">
                            Henüz ödeme yok
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OzetKart({
  label,
  deger,
  renk,
}: {
  label: string;
  deger: string;
  renk?: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </p>
      <p className={cn("text-lg font-bold tabular-nums", renk)}>{deger}</p>
    </div>
  );
}
