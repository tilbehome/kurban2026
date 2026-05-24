"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPara } from "@/shared/lib/para";
import { formatTarihSaat, formatTarih } from "@/shared/lib/tarih";
import { Receipt, ExternalLink, MessageCircle, Printer } from "lucide-react";

interface TahsilatSatir {
  id: string;
  tkrNo: string;
  tarih: Date;
  tutar: number;
  yontem: string; // nakit | havale | kart | karisik
  nakit: number;
  havale: number;
  kart: number;
  kasiyerAdi: string;
  iptalMi: boolean;
  iptalSebep: string | null;
  hisseEtiket: string; // #18.5
}

interface TahsilatlarTabProps {
  musteriId: string;
  musteriTel: string | null;
  tahsilatlar: TahsilatSatir[];
  ozet: {
    toplam: number;
    islemSayisi: number;
    sonOdeme: Date | null;
    iptalSayisi: number;
  };
}

export function TahsilatlarTab({
  musteriId: _musteriId,
  musteriTel,
  tahsilatlar,
  ozet,
}: TahsilatlarTabProps) {
  const [yontemFiltre, setYontemFiltre] = useState<string>("hepsi");
  const [arama, setArama] = useState("");
  const [iptalDahil, setIptalDahil] = useState(false);

  const filtreli = useMemo(() => {
    return tahsilatlar.filter((t) => {
      if (!iptalDahil && t.iptalMi) return false;
      if (yontemFiltre !== "hepsi" && t.yontem !== yontemFiltre) return false;
      if (arama.trim()) {
        const q = arama.trim().toLowerCase();
        if (
          !t.tkrNo.toLowerCase().includes(q) &&
          !t.hisseEtiket.toLowerCase().includes(q) &&
          !t.kasiyerAdi.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [tahsilatlar, yontemFiltre, arama, iptalDahil]);

  return (
    <div className="space-y-4">
      {/* Üst özet */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiBox
          ad="Toplam Tahsilat"
          deger={formatPara(ozet.toplam)}
          renk="text-green-600"
        />
        <KpiBox ad="İşlem Sayısı" deger={String(ozet.islemSayisi)} />
        <KpiBox
          ad="Son Ödeme"
          deger={ozet.sonOdeme ? formatTarih(ozet.sonOdeme) : "—"}
        />
        <KpiBox
          ad="İptal"
          deger={String(ozet.iptalSayisi)}
          renk={ozet.iptalSayisi > 0 ? "text-red-600" : "text-foreground"}
        />
      </div>

      {/* Filtre */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Dekont no, hisse, kasiyer ara..."
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={yontemFiltre}
              onValueChange={(v) => v && setYontemFiltre(v)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hepsi">Tüm yöntemler</SelectItem>
                <SelectItem value="nakit">Nakit</SelectItem>
                <SelectItem value="havale">Havale</SelectItem>
                <SelectItem value="kart">Kart</SelectItem>
                <SelectItem value="karisik">Karışık</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={iptalDahil}
                onChange={(e) => setIptalDahil(e.target.checked)}
                className="size-4"
              />
              İptaller dahil
            </label>
            <span className="text-muted-foreground ml-auto text-xs">
              {filtreli.length} / {tahsilatlar.length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tablo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt size={16} />
            Tahsilat Geçmişi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtreli.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Tahsilat yok.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
                <tr>
                  <th className="px-4 py-2 font-medium">Tarih</th>
                  <th className="px-4 py-2 font-medium">Dekont</th>
                  <th className="px-4 py-2 font-medium">Hisse</th>
                  <th className="px-4 py-2 font-medium">Yöntem</th>
                  <th className="px-4 py-2 text-right font-medium">Tutar</th>
                  <th className="px-4 py-2 font-medium">Kasiyer</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtreli.map((t) => (
                  <tr
                    key={t.id}
                    className={t.iptalMi ? "opacity-60 line-through" : ""}
                  >
                    <td className="px-4 py-2 text-xs">
                      {formatTarihSaat(t.tarih)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{t.tkrNo}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {t.hisseEtiket}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary">{t.yontem}</Badge>
                    </td>
                    <td className="font-tabular px-4 py-2 text-right font-semibold">
                      {formatPara(t.tutar)}
                    </td>
                    <td className="text-muted-foreground px-4 py-2 text-xs">
                      {t.kasiyerAdi}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/api/tahsilat/dekont/${t.id}`}
                          target="_blank"
                          className={buttonVariants({
                            size: "sm",
                            variant: "ghost",
                          })}
                          title="Dekontu aç"
                        >
                          <ExternalLink size={12} />
                        </Link>
                        <Link
                          href={`/api/tahsilat/dekont/${t.id}?yazdir=1`}
                          target="_blank"
                          className={buttonVariants({
                            size: "sm",
                            variant: "ghost",
                          })}
                          title="Yazdır"
                        >
                          <Printer size={12} />
                        </Link>
                        {musteriTel && (
                          <a
                            href={`https://wa.me/${musteriTel.replace(/\D/g, "")}?text=${encodeURIComponent(
                              `Dekontunuz: ${t.tkrNo} · ${formatPara(t.tutar)} · ${formatTarih(t.tarih)}`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className={buttonVariants({
                              size: "sm",
                              variant: "ghost",
                            })}
                            title="WhatsApp gönder"
                          >
                            <MessageCircle size={12} className="text-green-600" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiBox({
  ad,
  deger,
  renk = "text-foreground",
}: {
  ad: string;
  deger: string;
  renk?: string;
}) {
  return (
    <div className="rounded-md border bg-white p-3">
      <p className="text-muted-foreground text-[11px]">{ad}</p>
      <p className={`font-tabular text-lg font-bold ${renk}`}>{deger}</p>
    </div>
  );
}
