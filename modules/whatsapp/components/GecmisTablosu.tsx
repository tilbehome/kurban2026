"use client";

import { useMemo, useState } from "react";
import { Search, Eye, CheckCircle2, SkipForward, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import { formatTarihSaat } from "@/shared/lib/tarih";
import {
  KATEGORI_ETIKETLERI,
  type GecmisHedefSatir,
  type GonderimKisa,
  type GonderimDetay,
} from "@/modules/whatsapp/types";

interface GecmisTablosuProps {
  gonderimler: GonderimKisa[];
}

export function GecmisTablosu({ gonderimler }: GecmisTablosuProps) {
  const [arama, setArama] = useState("");
  const [detay, setDetay] = useState<GonderimDetay | null>(null);
  const [detayYukleniyor, setDetayYukleniyor] = useState(false);

  const filtreli = useMemo(() => {
    const q = arama.trim().toLowerCase();
    if (!q) return gonderimler;
    return gonderimler.filter(
      (g) =>
        g.sablonAd.toLowerCase().includes(q) ||
        g.kullaniciAdSoyad.toLowerCase().includes(q),
    );
  }, [gonderimler, arama]);

  async function detayAc(id: string) {
    setDetayYukleniyor(true);
    try {
      const r = await fetch(`/api/whatsapp/gonderimler/${id}`);
      const j = (await r.json()) as {
        basarili: boolean;
        veri?: GonderimDetay;
      };
      if (j.basarili && j.veri) {
        setDetay(j.veri);
      }
    } finally {
      setDetayYukleniyor(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="relative max-w-md">
            <Search
              size={14}
              className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2"
            />
            <Input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Şablon veya kullanıcıya göre ara"
              className="h-9 pl-8 text-sm"
            />
          </div>

          {filtreli.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              Henüz toplu gönderim yapılmamış
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-stone-50 text-left">
                    <th className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase">
                      Tarih
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase">
                      Şablon
                    </th>
                    <th className="px-3 py-2 text-center text-[11px] font-semibold tracking-wider uppercase">
                      Hedef
                    </th>
                    <th className="px-3 py-2 text-center text-[11px] font-semibold tracking-wider uppercase">
                      Açılan
                    </th>
                    <th className="px-3 py-2 text-center text-[11px] font-semibold tracking-wider uppercase">
                      Atlanan
                    </th>
                    <th className="px-3 py-2 text-center text-[11px] font-semibold tracking-wider uppercase">
                      Hata
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase">
                      Kullanıcı
                    </th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtreli.map((g) => {
                    const kat = KATEGORI_ETIKETLERI[g.sablonKategorisi];
                    const basariOrani =
                      g.hedefSayisi > 0
                        ? Math.round((g.acilanSayisi / g.hedefSayisi) * 100)
                        : 0;
                    return (
                      <tr
                        key={g.id}
                        className="border-b hover:bg-stone-50"
                      >
                        <td className="font-tabular px-3 py-2 text-xs">
                          {formatTarihSaat(new Date(g.baslamaTarihi))}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1",
                                kat.renk,
                              )}
                            >
                              {kat.emoji}
                            </span>
                            <span className="font-semibold">
                              {g.sablonAd}
                            </span>
                          </div>
                        </td>
                        <td className="font-tabular px-3 py-2 text-center">
                          {g.hedefSayisi}
                        </td>
                        <td className="font-tabular px-3 py-2 text-center">
                          <span className="text-green-700 font-semibold">
                            {g.acilanSayisi}
                          </span>
                          <span className="text-muted-foreground ml-1 text-[10px]">
                            (%{basariOrani})
                          </span>
                        </td>
                        <td className="font-tabular px-3 py-2 text-center text-stone-600">
                          {g.atlananSayisi}
                        </td>
                        <td className="font-tabular px-3 py-2 text-center text-red-700">
                          {g.hataSayisi}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {g.kullaniciAdSoyad}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => detayAc(g.id)}
                            className="text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 text-xs font-medium"
                          >
                            <Eye size={12} />
                            Detay
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detay Modal */}
      <Dialog open={!!detay} onOpenChange={(v) => !v && setDetay(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detay?.sablonAd ?? "Detay"}</DialogTitle>
          </DialogHeader>
          {detayYukleniyor && (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Yükleniyor...
            </p>
          )}
          {detay && (
            <div className="flex flex-col gap-3">
              <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div>
                  Başlama: <strong>{formatTarihSaat(new Date(detay.baslamaTarihi))}</strong>
                </div>
                <div>
                  Bitiş:{" "}
                  <strong>
                    {detay.bitisTarihi
                      ? formatTarihSaat(new Date(detay.bitisTarihi))
                      : "—"}
                  </strong>
                </div>
                <div>
                  Kullanıcı: <strong>{detay.kullaniciAdSoyad}</strong>
                </div>
                <div>
                  Toplam: <strong>{detay.hedefSayisi}</strong>
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-stone-50">
                      <th className="px-2 py-1.5 text-left">Müşteri</th>
                      <th className="px-2 py-1.5 text-left">Telefon</th>
                      <th className="px-2 py-1.5 text-left">Durum</th>
                      <th className="px-2 py-1.5 text-left">Açılma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detay.hedefler.map((h: GecmisHedefSatir, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="px-2 py-1.5 font-medium">
                          {h.musteriAdSoyad}
                        </td>
                        <td className="text-muted-foreground px-2 py-1.5">
                          {h.telefon}
                        </td>
                        <td className="px-2 py-1.5">
                          <DurumRozeti durum={h.durum} />
                        </td>
                        <td className="font-tabular text-muted-foreground px-2 py-1.5">
                          {h.acilmaZamani
                            ? new Date(h.acilmaZamani).toLocaleTimeString(
                                "tr-TR",
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DurumRozeti({ durum }: { durum: GecmisHedefSatir["durum"] }) {
  if (durum === "acildi")
    return (
      <span className="bg-green-100 text-green-800 inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold">
        <CheckCircle2 size={10} />
        Açıldı
      </span>
    );
  if (durum === "atlandi")
    return (
      <span className="bg-stone-100 text-stone-700 inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold">
        <SkipForward size={10} />
        Atlandı
      </span>
    );
  if (durum === "hata")
    return (
      <span className="bg-red-100 text-red-800 inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold">
        <XCircle size={10} />
        Hata
      </span>
    );
  return (
    <span className="bg-amber-100 text-amber-800 inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold">
      Bekliyor
    </span>
  );
}
