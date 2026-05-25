"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Save, Play, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/lib/utils";
import type { KesimDurumu } from "@/modules/tv/types";

export interface KontrolHisseSatir {
  id: string;
  hisseEtiket: string; // "#1.3" (kurban kesim sırası + hisse no)
  musteriAdSoyad: string | null;
  kesimDurumu: KesimDurumu;
  siraNo: number | null;
  asama: string | null;
  ilerlemeYuzde: number;
  kalanSureDk: number | null;
  teslimNoktasi: string | null;
}

interface TvKontrolClientProps {
  hisseler: KontrolHisseSatir[];
}

const DURUM_ETIKETLERI: Record<KesimDurumu, string> = {
  beklemede: "Beklemede",
  vekalet_onay: "Vekalet Onay",
  siradaki: "Sıradaki",
  kesimde: "Kesimde",
  parcalama: "Parçalama",
  tartimda: "Tartımda",
  teslime_hazir: "Teslime Hazır",
  teslim_edildi: "Teslim Edildi",
  iptal: "İptal",
};

const DURUM_RENKLERI: Record<KesimDurumu, string> = {
  beklemede: "bg-slate-100 text-slate-700",
  vekalet_onay: "bg-amber-100 text-amber-700",
  siradaki: "bg-purple-100 text-purple-700",
  kesimde: "bg-orange-100 text-orange-700",
  parcalama: "bg-pink-100 text-pink-700",
  tartimda: "bg-blue-100 text-blue-700",
  teslime_hazir: "bg-green-100 text-green-700",
  teslim_edildi: "bg-emerald-100 text-emerald-700",
  iptal: "bg-red-100 text-red-700",
};

export function TvKontrolClient({ hisseler }: TvKontrolClientProps) {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [filtreDurum, setFiltreDurum] = useState<KesimDurumu | "tum">("tum");
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [bekleniyor, startTransition] = useTransition();

  // Düzenlenen değerler (sadece seçili satır için)
  const [editDurum, setEditDurum] = useState<KesimDurumu>("beklemede");
  const [editSiraNo, setEditSiraNo] = useState<string>("");
  const [editAsama, setEditAsama] = useState<string>("");
  const [editIlerleme, setEditIlerleme] = useState<number>(0);
  const [editKalanDk, setEditKalanDk] = useState<string>("");
  const [editTeslimNoktasi, setEditTeslimNoktasi] = useState<string>("");

  const filtreli = useMemo(() => {
    const q = arama.trim().toLowerCase();
    return hisseler.filter((h) => {
      if (filtreDurum !== "tum" && h.kesimDurumu !== filtreDurum) return false;
      if (q.length === 0) return true;
      return (
        h.hisseEtiket.toLowerCase().includes(q) ||
        h.musteriAdSoyad?.toLowerCase().includes(q) ||
        h.siraNo?.toString().includes(q)
      );
    });
  }, [hisseler, arama, filtreDurum]);

  function secVeYukle(h: KontrolHisseSatir) {
    setSeciliId(h.id);
    setEditDurum(h.kesimDurumu);
    setEditSiraNo(h.siraNo?.toString() ?? "");
    setEditAsama(h.asama ?? "");
    setEditIlerleme(h.ilerlemeYuzde);
    setEditKalanDk(h.kalanSureDk?.toString() ?? "");
    setEditTeslimNoktasi(h.teslimNoktasi ?? "");
  }

  function durumKaydet() {
    if (!seciliId) return;
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/tv/kesim-durum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hisseId: seciliId,
            yeniDurum: editDurum,
            siraNo: editSiraNo ? Number(editSiraNo) : null,
            asama: editAsama || null,
            teslimNoktasi: editTeslimNoktasi || null,
          }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Güncelleme başarısız");
        }
        toast.success("Durum güncellendi");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  function ilerlemeKaydet() {
    if (!seciliId) return;
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/tv/ilerleme", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hisseId: seciliId,
            ilerlemeYuzde: editIlerleme,
            kalanSureDk: editKalanDk ? Number(editKalanDk) : null,
            asama: editAsama || null,
          }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Güncelleme başarısız");
        }
        toast.success("İlerleme güncellendi");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  function hizliKesimeAl(id: string) {
    setSeciliId(id);
    setEditDurum("kesimde");
    setEditAsama("Kesim");
    setEditIlerleme(0);
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/tv/kesim-durum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hisseId: id,
            yeniDurum: "kesimde",
            asama: "Kesim",
          }),
        });
        if (!yanit.ok) throw new Error("Başarısız");
        toast.success("Kesime alındı");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  function hizliTamamla(id: string) {
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/tv/kesim-durum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hisseId: id,
            yeniDurum: "teslime_hazir",
            asama: "Teslim",
            teslimNoktasi: "Teslim Noktası 1",
          }),
        });
        if (!yanit.ok) throw new Error("Başarısız");
        toast.success("Teslime hazır işaretlendi");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  const secili = hisseler.find((h) => h.id === seciliId);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Sol: Filtre + Liste */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              Hisse Listesi · {filtreli.length} kayıt
            </CardTitle>
            <div className="flex gap-2">
              <select
                value={filtreDurum}
                onChange={(e) =>
                  setFiltreDurum(e.target.value as KesimDurumu | "tum")
                }
                className="border-input bg-background h-9 rounded-md border px-2 text-xs"
              >
                <option value="tum">Tüm Durumlar</option>
                {(Object.keys(DURUM_ETIKETLERI) as KesimDurumu[]).map((d) => (
                  <option key={d} value={d}>
                    {DURUM_ETIKETLERI[d]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="relative mt-2">
            <Search
              size={14}
              className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2"
            />
            <Input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Ara (hisse, müşteri, sıra no)"
              className="h-9 pl-8 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 sticky top-0">
                <tr className="border-b text-left text-[11px] font-semibold tracking-wider uppercase">
                  <th className="px-3 py-2">Hisse</th>
                  <th className="px-3 py-2">Müşteri</th>
                  <th className="px-3 py-2">Durum</th>
                  <th className="px-3 py-2 text-center">Sıra</th>
                  <th className="px-3 py-2 text-center">%</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtreli.map((h) => (
                  <tr
                    key={h.id}
                    className={cn(
                      "hover:bg-stone-50 border-b transition-colors",
                      seciliId === h.id && "bg-orange-50",
                    )}
                  >
                    <td className="px-3 py-2 font-mono font-semibold">
                      {h.hisseEtiket}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {h.musteriAdSoyad ?? (
                        <span className="text-muted-foreground italic">
                          (boş)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          DURUM_RENKLERI[h.kesimDurumu],
                        )}
                      >
                        {DURUM_ETIKETLERI[h.kesimDurumu]}
                      </span>
                    </td>
                    <td className="font-tabular px-3 py-2 text-center text-xs">
                      {h.siraNo ?? "—"}
                    </td>
                    <td className="font-tabular px-3 py-2 text-center text-xs">
                      {h.ilerlemeYuzde > 0 ? `%${h.ilerlemeYuzde}` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1.5">
                        {h.kesimDurumu === "siradaki" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => hizliKesimeAl(h.id)}
                            disabled={bekleniyor}
                            className="h-7 px-2 text-[11px]"
                          >
                            <Play size={11} />
                            Kesime Al
                          </Button>
                        )}
                        {(h.kesimDurumu === "kesimde" ||
                          h.kesimDurumu === "parcalama" ||
                          h.kesimDurumu === "tartimda") && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => hizliTamamla(h.id)}
                            disabled={bekleniyor}
                            className="h-7 px-2 text-[11px] text-green-700"
                          >
                            <CheckCircle2 size={11} />
                            Bitti
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => secVeYukle(h)}
                          className="h-7 px-2 text-[11px]"
                        >
                          Düzenle
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtreli.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-muted-foreground py-12 text-center text-xs"
                    >
                      Sonuç yok
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sağ: Düzenleme paneli */}
      <Card className="lg:sticky lg:top-4 lg:h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {secili ? `Düzenle: ${secili.hisseEtiket}` : "Düzenleme Paneli"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!secili ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
              Soldan bir hisse seçin
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Durum</Label>
                <select
                  value={editDurum}
                  onChange={(e) =>
                    setEditDurum(e.target.value as KesimDurumu)
                  }
                  className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                >
                  {(Object.keys(DURUM_ETIKETLERI) as KesimDurumu[]).map((d) => (
                    <option key={d} value={d}>
                      {DURUM_ETIKETLERI[d]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Sıra Numarası</Label>
                <Input
                  inputMode="numeric"
                  value={editSiraNo}
                  onChange={(e) => setEditSiraNo(e.target.value)}
                  placeholder="örn. 41"
                  className="h-9 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Aşama</Label>
                <select
                  value={editAsama}
                  onChange={(e) => setEditAsama(e.target.value)}
                  className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                >
                  <option value="">— Otomatik —</option>
                  {[
                    "Kesim",
                    "Deri Yüzme",
                    "Parçalama Hazırlık",
                    "Parçalama",
                    "Tartım",
                    "Paketleme",
                    "Teslim",
                  ].map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {editDurum === "teslime_hazir" && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Teslim Noktası</Label>
                  <Input
                    value={editTeslimNoktasi}
                    onChange={(e) => setEditTeslimNoktasi(e.target.value)}
                    placeholder="Teslim Noktası 1"
                    className="h-9 text-sm"
                  />
                </div>
              )}

              <Button
                type="button"
                size="sm"
                onClick={durumKaydet}
                disabled={bekleniyor}
                className="w-full"
              >
                <Save size={13} />
                Durum + Sıra Kaydet
              </Button>

              <div className="border-t pt-3" />

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  İlerleme: <strong>%{editIlerleme}</strong>
                </Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editIlerleme}
                  onChange={(e) => setEditIlerleme(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Kalan Süre (dk)</Label>
                <Input
                  inputMode="numeric"
                  value={editKalanDk}
                  onChange={(e) => setEditKalanDk(e.target.value)}
                  placeholder="örn. 8"
                  className="h-9 text-sm"
                />
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={ilerlemeKaydet}
                disabled={bekleniyor}
                className="w-full"
              >
                <Save size={13} />
                İlerleme Kaydet
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
