"use client";

import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { toast } from "sonner";
import {
  Zap,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Loader2,
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

const ASAMA_RENGI: Record<string, string> = {
  vekalet_bekliyor: "bg-amber-100 text-amber-700",
  siradaki: "bg-purple-100 text-purple-700",
  hazirlik: "bg-blue-100 text-blue-700",
  kesimde: "bg-red-100 text-red-700",
  deri_yuzme: "bg-orange-100 text-orange-700",
  parcalama: "bg-amber-100 text-amber-700",
  tartimda: "bg-indigo-100 text-indigo-700",
  paketleme: "bg-cyan-100 text-cyan-700",
  teslime_hazir: "bg-emerald-100 text-emerald-700",
  tamamlandi: "bg-green-100 text-green-700",
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
        const veri = await yanit.json().catch(() => ({}));
        toast.error(veri.hata ?? "Aşama değiştirilemedi");
        return;
      }
      toast.success(
        yon === "ileri"
          ? `${ASAMA_ETIKETLERI[yeniDurum]} — DANA-${kurban.kesimSirasi}`
          : `Geri alındı: ${ASAMA_ETIKETLERI[yeniDurum]}`,
      );
      if (navigator.vibrate) navigator.vibrate(yon === "ileri" ? 40 : 25);
      yenile();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setYukleniyor(false);
    }
  }

  async function ilerlemeArtir() {
    setYukleniyor(true);
    try {
      const yeni = Math.min(100, kurban.ilerlemeYuzde + 10);
      const yanit = await fetch("/api/tv/kurban-asama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kurbanId: kurban.id,
          yeniDurum: kurban.kesimDurumu,
          ilerlemeYuzde: yeni,
        }),
      });
      if (!yanit.ok) {
        toast.error("İlerleme güncellenemedi");
        return;
      }
      if (navigator.vibrate) navigator.vibrate(15);
      yenile();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setYukleniyor(false);
    }
  }

  const swipe = useSwipeable({
    onSwipedLeft: () => {
      if (sonraki && !yukleniyor) asamaDegistir(sonraki, "ileri");
    },
    onSwipedRight: () => {
      if (onceki && !yukleniyor) asamaDegistir(onceki, "geri");
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
    delta: 50,
  });

  const renk =
    ASAMA_RENGI[kurban.kesimDurumu] ?? "bg-slate-100 text-slate-700";
  const etiket =
    ASAMA_ETIKETLERI[kurban.kesimDurumu as KurbanKesimDurumu] ??
    kurban.kesimDurumu;
  const bosHisseSayisi = kurban.hisseler.filter((h) => !h.musteriAdi).length;
  const doluHisseler = kurban.hisseler.filter((h) => h.musteriAdi);

  return (
    <Card>
      <CardContent {...swipe} className="p-3 touch-pan-y">
        <div className="mb-3 flex items-start gap-3">
          {/* Sol: BÜYÜK DANA-NO + sayaç */}
          <div className="border-primary bg-primary/10 flex h-20 min-w-20 flex-col items-center justify-center rounded-2xl border-2 gap-0.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
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

          {/* Sağ: Detaylar */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              {kurban.hisseGrubu && (
                <Badge variant="outline" className="text-[10px]">
                  ⚖️ {kurban.hisseGrubu} KG
                </Badge>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${renk}`}
              >
                {etiket}
              </span>
            </div>

            {/* Hissedar isimleri (max 3) */}
            <div className="mb-1 flex flex-wrap items-center gap-1">
              {doluHisseler.slice(0, 3).map((h) => {
                const ad = h.musteriAdi ?? "";
                const baslangic = ad.charAt(0);
                const soyad = ad.split(" ").pop() ?? "";
                return (
                  <span
                    key={h.id}
                    className="bg-muted inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
                  >
                    {baslangic}. {soyad}
                  </span>
                );
              })}
              {doluHisseler.length > 3 && (
                <span className="text-muted-foreground text-[10px]">
                  +{doluHisseler.length - 3} daha
                </span>
              )}
              {doluHisseler.length === 0 && (
                <span className="text-muted-foreground text-[10px] italic">
                  Hissedar yok
                </span>
              )}
            </div>

            {/* Boş hisse uyarısı */}
            {bosHisseSayisi > 0 && (
              <div className="text-amber-600 inline-flex items-center gap-1 text-[10px]">
                <CircleDot className="h-2.5 w-2.5" />
                {bosHisseSayisi} boş hisse
              </div>
            )}

            {/* Operasyon sıra */}
            {kurban.operasyonSira !== null && (
              <div className="text-muted-foreground mt-0.5 text-[10px]">
                Sıra: {kurban.operasyonSira}
              </div>
            )}
          </div>
        </div>

        {/* İlerleme bar */}
        <div className="bg-muted mb-3 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${kurban.ilerlemeYuzde}%` }}
          />
        </div>

        {/* Aksiyon butonları — yatay scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {onceki && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => asamaDegistir(onceki, "geri")}
              disabled={yukleniyor}
              className="h-12 min-w-11 shrink-0 touch-manipulation"
              title={`Geri: ${ASAMA_ETIKETLERI[onceki]}`}
              aria-label={`Geri: ${ASAMA_ETIKETLERI[onceki]}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={ilerlemeArtir}
            disabled={yukleniyor || kurban.ilerlemeYuzde >= 100}
            className="h-12 shrink-0 touch-manipulation px-3 text-xs font-semibold"
            aria-label="İlerleme +%10"
          >
            +%10
          </Button>

          {sonraki ? (
            <Button
              onClick={() => asamaDegistir(sonraki, "ileri")}
              disabled={yukleniyor}
              className="h-12 min-h-12 flex-1 touch-manipulation font-semibold"
            >
              {yukleniyor ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <ChevronRight className="mr-1 h-5 w-5" />
              )}
              {ASAMA_ETIKETLERI[sonraki]}
            </Button>
          ) : (
            <Button
              onClick={isiAl}
              disabled={yukleniyor}
              variant="outline"
              className="h-12 min-h-12 flex-1 touch-manipulation font-semibold"
            >
              <Zap className="mr-1 h-4 w-4" />
              Bu İşi Al
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={sorunBildir}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-12 min-w-11 shrink-0 touch-manipulation"
            aria-label="Sorun bildir"
          >
            <AlertTriangle className="h-5 w-5" />
          </Button>
        </div>

        <div className="text-muted-foreground mt-1 text-center text-[9px]">
          ← Sağa kaydır geri al · Sola kaydır ileri →
        </div>
      </CardContent>
    </Card>
  );
}
