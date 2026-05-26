"use client";

/**
 * Personel görev kartı — telefondan sahada hızlı aşama geçişi.
 *
 * SPRINT-PERSONEL-PANEL: yanlışlık önlemek için sade arayüz.
 *  - Üstte: DANA-X + sayaç + hissedar isimleri + KG + sıra rozetı
 *  - Ortada: BÜYÜK mevcut aşama rozeti (görsel netlik)
 *  - Altta: 2 EŞİT buton (GERİ AL | İLERLET) — her birinde hedef aşama yazılı
 *  - En altta: Sorun Bildir tam genişlik
 *  - Onay diyalogu: "Tamamlandı" geçişi + her "Geri Al"
 *  - Swipe ve "+%10" butonu KALDIRILDI (yanlışlık önleme)
 */

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Loader2,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ASAMA_ETIKETLERI,
  oncekiAsama,
  sonrakiAsama,
  type KurbanKesimDurumu,
} from "@/modules/tv/lib/asama-akisi";
import type { PersonelKurbanVeri } from "@/app/tv/personel/page";
import { AsamaSayaci } from "@/modules/tv/components/shared/AsamaSayaci";

interface AsamaRengi {
  bg: string;
  text: string;
  border: string;
}

const ASAMA_RENGI: Record<string, AsamaRengi> = {
  vekalet_bekliyor: {
    bg: "bg-amber-100",
    text: "text-amber-900",
    border: "border-amber-300",
  },
  siradaki: {
    bg: "bg-purple-100",
    text: "text-purple-900",
    border: "border-purple-300",
  },
  hazirlik: {
    bg: "bg-blue-100",
    text: "text-blue-900",
    border: "border-blue-300",
  },
  kesimde: {
    bg: "bg-red-100",
    text: "text-red-900",
    border: "border-red-300",
  },
  deri_yuzme: {
    bg: "bg-orange-100",
    text: "text-orange-900",
    border: "border-orange-300",
  },
  parcalama: {
    bg: "bg-amber-100",
    text: "text-amber-900",
    border: "border-amber-300",
  },
  tartimda: {
    bg: "bg-indigo-100",
    text: "text-indigo-900",
    border: "border-indigo-300",
  },
  paketleme: {
    bg: "bg-cyan-100",
    text: "text-cyan-900",
    border: "border-cyan-300",
  },
  teslime_hazir: {
    bg: "bg-emerald-100",
    text: "text-emerald-900",
    border: "border-emerald-300",
  },
  tamamlandi: {
    bg: "bg-green-100",
    text: "text-green-900",
    border: "border-green-300",
  },
};

interface Props {
  kurban: PersonelKurbanVeri & { hisseGrubu?: string | null };
  aktif: boolean;
  isiAl: () => void;
  sorunBildir: () => void;
  yenile: () => void;
}

export function PersonelGorevKart({
  kurban,
  isiAl,
  sorunBildir,
  yenile,
}: Props) {
  const [yukleniyor, setYukleniyor] = useState(false);

  const sonraki = sonrakiAsama(kurban.kesimDurumu as KurbanKesimDurumu);
  const onceki = oncekiAsama(kurban.kesimDurumu as KurbanKesimDurumu);

  const mevcutRenk = ASAMA_RENGI[kurban.kesimDurumu] ?? {
    bg: "bg-slate-100",
    text: "text-slate-900",
    border: "border-slate-300",
  };
  const mevcutEtiket =
    ASAMA_ETIKETLERI[kurban.kesimDurumu as KurbanKesimDurumu] ??
    kurban.kesimDurumu;

  async function asamaDegistir(
    yeniDurum: KurbanKesimDurumu,
    yon: "ileri" | "geri",
  ) {
    setYukleniyor(true);
    try {
      const yanit = await fetch("/api/tv/kurban-asama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kurbanId: kurban.id,
          yeniDurum,
        }),
      });
      if (!yanit.ok) {
        const veri = (await yanit.json().catch(() => ({}))) as {
          hata?: string;
        };
        toast.error(veri.hata ?? "Aşama değiştirilemedi");
        return;
      }
      toast.success(
        yon === "ileri"
          ? `✓ ${ASAMA_ETIKETLERI[yeniDurum]} — DANA-${kurban.kesimSirasi}`
          : `↶ Geri alındı: ${ASAMA_ETIKETLERI[yeniDurum]}`,
      );
      if (navigator.vibrate) navigator.vibrate(yon === "ileri" ? 40 : 25);
      yenile();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setYukleniyor(false);
    }
  }

  function ilerletKlik() {
    if (!sonraki || yukleniyor) return;
    // Yalnız kritik geçişte onay — diğerleri tek tıkla geçer.
    if (sonraki === "tamamlandi") {
      const onay = window.confirm(
        `DANA-${kurban.kesimSirasi} tamamlandı olarak işaretlensin mi?`,
      );
      if (!onay) return;
    }
    asamaDegistir(sonraki, "ileri");
  }

  function geriAlKlik() {
    if (!onceki || yukleniyor) return;
    const onay = window.confirm(
      `DANA-${kurban.kesimSirasi} bir önceki aşamaya (${ASAMA_ETIKETLERI[onceki]}) geri alınsın mı?`,
    );
    if (!onay) return;
    asamaDegistir(onceki, "geri");
  }

  const bosHisseSayisi = kurban.hisseler.filter((h) => !h.musteriAdi).length;
  const doluHisseler = kurban.hisseler.filter((h) => h.musteriAdi);

  return (
    <Card>
      <CardContent className="p-3">
        {/* ÜST: DANA-NO + Sayaç + Hissedarlar */}
        <div className="mb-3 flex items-start gap-3">
          <div className="border-primary bg-primary/10 flex h-20 min-w-20 flex-col items-center justify-center gap-0.5 rounded-2xl border-2">
            <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
              Dana
            </span>
            <span className="text-primary text-3xl leading-none font-bold">
              {kurban.kesimSirasi}
            </span>
            <AsamaSayaci
              baslangic={kurban.asamaBaslangic}
              boyut="kompakt"
              tema="acik"
              ikonsuz
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              {kurban.hisseGrubu && (
                <Badge variant="outline" className="text-[10px]">
                  ⚖️ {kurban.hisseGrubu} KG
                </Badge>
              )}
              {kurban.operasyonSira !== null && (
                <Badge variant="outline" className="text-[10px]">
                  Sıra: {kurban.operasyonSira}
                </Badge>
              )}
            </div>

            {/* SPRINT-PERSONEL-PANEL-EK: Tüm hissedarlar görünür (wrap edilir,
                "+N daha" kısaltması yok). Hover'da tam ad title attribute'da. */}
            <div className="mb-1 flex flex-wrap items-center gap-1">
              {doluHisseler.length === 0 ? (
                <span className="text-muted-foreground text-[10px] italic">
                  Hissedar yok
                </span>
              ) : (
                doluHisseler.map((h) => {
                  const ad = h.musteriAdi ?? "";
                  const baslangic = ad.charAt(0);
                  const soyad = ad.split(" ").pop() ?? "";
                  return (
                    <span
                      key={h.id}
                      title={ad}
                      className="bg-muted inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
                    >
                      {baslangic}. {soyad}
                    </span>
                  );
                })
              )}
            </div>

            {bosHisseSayisi > 0 && (
              <div className="text-amber-600 inline-flex items-center gap-1 text-[10px]">
                <CircleDot className="h-2.5 w-2.5" />
                {bosHisseSayisi} boş hisse
              </div>
            )}
          </div>
        </div>

        {/* ORTA: BÜYÜK MEVCUT AŞAMA ROZETİ */}
        <div className="mb-3 flex flex-col items-center gap-1.5">
          <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
            Şu Anki Aşama
          </span>
          <div
            className={`flex w-full items-center justify-center rounded-xl border-2 px-3 py-3 ${mevcutRenk.bg} ${mevcutRenk.border}`}
          >
            <span className={`text-lg font-bold ${mevcutRenk.text}`}>
              {mevcutEtiket}
            </span>
          </div>
        </div>

        {/* İlerleme barı */}
        <div className="bg-muted mb-3 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${kurban.ilerlemeYuzde}%` }}
          />
        </div>

        {/* ALT: 2 EŞİT BUTON — GERİ AL + İLERLET */}
        <div className="mb-2 grid grid-cols-2 gap-2">
          {/* GERİ AL */}
          {onceki ? (
            <Button
              variant="outline"
              onClick={geriAlKlik}
              disabled={yukleniyor}
              className="flex h-auto min-h-16 flex-col items-center justify-center gap-0.5 touch-manipulation py-2"
            >
              <span className="flex items-center gap-1 text-sm font-bold">
                <ChevronLeft className="h-4 w-4" />
                GERİ AL
              </span>
              <span className="text-muted-foreground text-[10px] leading-tight">
                {ASAMA_ETIKETLERI[onceki]}
              </span>
            </Button>
          ) : (
            <div className="bg-muted/40 text-muted-foreground flex min-h-16 items-center justify-center rounded-lg text-xs italic">
              İlk Aşama
            </div>
          )}

          {/* İLERLET */}
          {sonraki ? (
            <Button
              onClick={ilerletKlik}
              disabled={yukleniyor}
              className="flex h-auto min-h-16 flex-col items-center justify-center gap-0.5 touch-manipulation py-2 font-semibold"
            >
              {yukleniyor ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span className="flex items-center gap-1 text-sm font-bold">
                    İLERLET
                    <ChevronRight className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] leading-tight opacity-90">
                    {ASAMA_ETIKETLERI[sonraki]}
                  </span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={isiAl}
              disabled={yukleniyor}
              variant="outline"
              className="flex h-auto min-h-16 flex-col items-center justify-center gap-0.5 touch-manipulation py-2 font-semibold"
            >
              <Zap className="h-4 w-4" />
              <span className="text-xs">Bu İşi Al</span>
            </Button>
          )}
        </div>

        {/* Sorun bildir — tam genişlik */}
        <Button
          variant="ghost"
          onClick={sorunBildir}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full touch-manipulation"
        >
          <AlertTriangle className="mr-1 h-4 w-4" />
          Sorun Bildir
        </Button>
      </CardContent>
    </Card>
  );
}

