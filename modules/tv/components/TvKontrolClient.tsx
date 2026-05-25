"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Save,
  ChevronRight,
  ChevronLeft,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/lib/utils";
import type { KurbanKesimDurumu } from "@/modules/tv/lib/asama-akisi";
import {
  ASAMA_GRUBU_SIRASI,
  GRUP_ETIKETLERI,
  GRUP_KISA_ETIKET,
  GRUP_RENKLERI,
  durumuGrupla,
  gruptanIlkDuruma,
  sonrakiGrup,
  oncekiGrup,
  type AsamaGrubu,
} from "@/modules/tv/lib/asama-grup";

export interface KontrolKurbanSatir {
  id: string;
  kesimSirasi: number;
  kupeNo: string | null;
  hisseGrubu: string | null;
  kesimDurumu: KurbanKesimDurumu;
  operasyonSira: number | null;
  asama: string | null;
  ilerlemeYuzde: number;
  kalanSureDk: number | null;
  kesimBaslama: string | null;
  hisseDolu: number;
  hisseToplam: number;
  vekaletAlinan: number;
}

interface Props {
  kurbanlar: KontrolKurbanSatir[];
}

export function TvKontrolClient({ kurbanlar }: Props) {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [filtreGrup, setFiltreGrup] = useState<AsamaGrubu | "tum">("tum");
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [bekleniyor, startTransition] = useTransition();

  const [editGrup, setEditGrup] = useState<AsamaGrubu>("beklemede");
  const [editSira, setEditSira] = useState<string>("");
  const [editIlerleme, setEditIlerleme] = useState<number>(0);
  const [editKalanDk, setEditKalanDk] = useState<string>("");

  const filtreli = useMemo(() => {
    const q = arama.trim().toLowerCase();
    return kurbanlar.filter((k) => {
      const grup = durumuGrupla(k.kesimDurumu);
      if (filtreGrup !== "tum" && grup !== filtreGrup) return false;
      if (q.length === 0) return true;
      return (
        k.kesimSirasi.toString().includes(q) ||
        (k.kupeNo?.toLowerCase().includes(q) ?? false) ||
        (k.operasyonSira?.toString().includes(q) ?? false)
      );
    });
  }, [kurbanlar, arama, filtreGrup]);

  const grupSayim = useMemo(() => {
    const sayim: Record<AsamaGrubu, number> = {
      beklemede: 0,
      vekalet: 0,
      kesim: 0,
      parcalama: 0,
      tartim: 0,
      teslim: 0,
      tamamlandi: 0,
      iptal: 0,
    };
    kurbanlar.forEach((k) => {
      sayim[durumuGrupla(k.kesimDurumu)]++;
    });
    return sayim;
  }, [kurbanlar]);

  function secVeYukle(k: KontrolKurbanSatir) {
    setSeciliId(k.id);
    setEditGrup(durumuGrupla(k.kesimDurumu));
    setEditSira(k.operasyonSira?.toString() ?? "");
    setEditIlerleme(k.ilerlemeYuzde);
    setEditKalanDk(k.kalanSureDk?.toString() ?? "");
  }

  async function asamaGuncelle(kurbanId: string, hedefGrup: AsamaGrubu) {
    const yeniDurum = gruptanIlkDuruma(hedefGrup);
    try {
      const yanit = await fetch("/api/tv/kurban-asama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kurbanId, yeniDurum }),
      });
      const sonuc = await yanit.json();
      if (!yanit.ok || !sonuc.basarili) {
        throw new Error(sonuc.hata ?? "Güncelleme başarısız");
      }
      toast.success(`${GRUP_KISA_ETIKET[hedefGrup]} aşamasına geçti`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    }
  }

  function ilerlet(k: KontrolKurbanSatir) {
    const mevcutGrup = durumuGrupla(k.kesimDurumu);
    const sonraki = sonrakiGrup(mevcutGrup);
    if (!sonraki) {
      toast.info("Son aşamada");
      return;
    }
    startTransition(() => {
      void asamaGuncelle(k.id, sonraki);
    });
  }

  function geriAl(k: KontrolKurbanSatir) {
    const mevcutGrup = durumuGrupla(k.kesimDurumu);
    const onceki = oncekiGrup(mevcutGrup);
    if (!onceki) {
      toast.info("İlk aşamada");
      return;
    }
    if (
      !confirm(
        `${k.kesimSirasi} numaralı kurbanı bir önceki aşamaya (${GRUP_KISA_ETIKET[onceki]}) geri almak istiyor musunuz?`,
      )
    ) {
      return;
    }
    startTransition(() => {
      void asamaGuncelle(k.id, onceki);
    });
  }

  function durumKaydet() {
    if (!seciliId) return;
    startTransition(() => {
      void asamaGuncelle(seciliId, editGrup);
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
            kurbanId: seciliId,
            ilerlemeYuzde: editIlerleme,
            kalanSureDk: editKalanDk ? Number(editKalanDk) : null,
          }),
        });
        const sonuc = await yanit.json();
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

  const secili = kurbanlar.find((k) => k.id === seciliId);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              Kurban Listesi · {filtreli.length} / {kurbanlar.length}
            </CardTitle>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFiltreGrup("tum")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filtreGrup === "tum"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
              )}
            >
              Tümü ({kurbanlar.length})
            </button>
            {ASAMA_GRUBU_SIRASI.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setFiltreGrup(g)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filtreGrup === g
                    ? GRUP_RENKLERI[g] + " border-current"
                    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                )}
              >
                {GRUP_KISA_ETIKET[g]} ({grupSayim[g]})
              </button>
            ))}
          </div>

          <div className="relative mt-2">
            <Search
              size={14}
              className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2"
            />
            <Input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Kurban no, küpe no, sıra ile ara"
              className="h-9 pl-8 text-sm"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 sticky top-0 z-10">
                <tr className="border-b text-left text-[11px] font-semibold tracking-wider uppercase">
                  <th className="px-3 py-2">Kurban No</th>
                  <th className="px-3 py-2">Küpe No</th>
                  <th className="px-3 py-2">Durum</th>
                  <th className="px-3 py-2 text-center">Hisse</th>
                  <th className="px-3 py-2 text-center">Sıra</th>
                  <th className="px-3 py-2 text-center">%</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtreli.map((k) => {
                  const grup = durumuGrupla(k.kesimDurumu);
                  const sonraki = sonrakiGrup(grup);
                  return (
                    <tr
                      key={k.id}
                      className={cn(
                        "cursor-pointer border-b transition-colors hover:bg-stone-50",
                        seciliId === k.id && "bg-orange-50",
                      )}
                      onClick={() => secVeYukle(k)}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-base font-bold text-stone-900">
                            {k.kesimSirasi}
                          </div>
                          {k.hisseGrubu && (
                            <span className="text-[10px] font-medium text-orange-700">
                              {k.hisseGrubu}KG
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-stone-600">
                        {k.kupeNo ?? (
                          <span className="text-stone-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            GRUP_RENKLERI[grup],
                          )}
                        >
                          {GRUP_KISA_ETIKET[grup]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Users size={11} className="text-stone-400" />
                          {k.hisseDolu}/{k.hisseToplam}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-xs">
                        {k.operasyonSira ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs">
                        {k.ilerlemeYuzde > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="block h-1.5 w-12 overflow-hidden rounded-full bg-stone-200">
                              <span
                                className="block h-full bg-orange-500"
                                style={{ width: `${k.ilerlemeYuzde}%` }}
                              />
                            </span>
                            <span className="font-mono">
                              %{k.ilerlemeYuzde}
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {grup !== "tamamlandi" && grup !== "iptal" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => geriAl(k)}
                              disabled={bekleniyor || oncekiGrup(grup) === null}
                              className="h-7 w-7 p-0"
                              title="Geri al"
                              aria-label="Geri al"
                            >
                              <ChevronLeft size={14} />
                            </Button>
                          )}
                          {sonraki && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => ilerlet(k)}
                              disabled={bekleniyor}
                              className="h-7 gap-1 px-2 text-[11px]"
                            >
                              {GRUP_KISA_ETIKET[sonraki]}
                              <ChevronRight size={12} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtreli.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
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

      <Card className="lg:sticky lg:top-4 lg:h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {secili ? (
              <>
                Kurban{" "}
                <span className="font-mono text-orange-600">
                  #{secili.kesimSirasi}
                </span>
              </>
            ) : (
              "Düzenleme Paneli"
            )}
          </CardTitle>
          {secili && secili.kupeNo && (
            <p className="text-muted-foreground font-mono text-xs">
              Küpe: {secili.kupeNo}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!secili ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
              Soldan bir kurban seçin
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-stone-50 p-2">
                  <div className="text-[10px] font-semibold text-stone-500 uppercase">
                    Dolu Hisse
                  </div>
                  <div className="font-mono font-bold text-stone-900">
                    {secili.hisseDolu}/{secili.hisseToplam}
                  </div>
                </div>
                <div className="rounded-md bg-stone-50 p-2">
                  <div className="text-[10px] font-semibold text-stone-500 uppercase">
                    Vekalet
                  </div>
                  <div className="font-mono font-bold text-stone-900">
                    {secili.vekaletAlinan}/{secili.hisseDolu}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Aşama</Label>
                <select
                  value={editGrup}
                  onChange={(e) => setEditGrup(e.target.value as AsamaGrubu)}
                  className="border-input bg-background h-10 rounded-md border px-2 text-sm"
                >
                  {ASAMA_GRUBU_SIRASI.map((g) => (
                    <option key={g} value={g}>
                      {GRUP_ETIKETLERI[g]}
                    </option>
                  ))}
                  <option value="iptal">İptal</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Operasyon Sırası</Label>
                <Input
                  inputMode="numeric"
                  value={editSira}
                  onChange={(e) => setEditSira(e.target.value)}
                  placeholder="örn. 5"
                  className="h-10 text-sm"
                />
                <p className="text-muted-foreground text-[10px]">
                  Bu kurbanın kesim sırasındaki konumu
                </p>
              </div>

              <Button
                type="button"
                onClick={durumKaydet}
                disabled={bekleniyor}
                className="h-11 w-full gap-1.5"
              >
                <Save size={14} />
                Aşamayı Kaydet
              </Button>

              <div className="border-t pt-3" />

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  İlerleme:{" "}
                  <strong className="font-mono text-orange-600">
                    %{editIlerleme}
                  </strong>
                </Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={editIlerleme}
                  onChange={(e) => setEditIlerleme(Number(e.target.value))}
                  className="w-full accent-orange-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Kalan Süre (dakika)</Label>
                <Input
                  inputMode="numeric"
                  value={editKalanDk}
                  onChange={(e) => setEditKalanDk(e.target.value)}
                  placeholder="örn. 8"
                  className="h-10 text-sm"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={ilerlemeKaydet}
                disabled={bekleniyor}
                className="h-11 w-full gap-1.5"
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
