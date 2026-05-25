"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Zap, X, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PersonelKurbanVeri } from "@/app/tv/personel/page";
import { AsamaSayaci } from "@/modules/tv/components/shared/AsamaSayaci";

interface Props {
  kurban: PersonelKurbanVeri;
  birak: () => void;
  sorunBildir: () => void;
  yenile: () => void;
}

const SONRAKI_ASAMA: Record<string, { etiket: string; durum: string }> = {
  vekalet_bekliyor: { etiket: "Sıraya Al", durum: "siradaki" },
  siradaki: { etiket: "Hazırlığa Geç", durum: "hazirlik" },
  hazirlik: { etiket: "Kesime Geç", durum: "kesimde" },
  kesimde: { etiket: "Deri Yüzmeye Geç", durum: "deri_yuzme" },
  deri_yuzme: { etiket: "Parçalamaya Geç", durum: "parcalama" },
  parcalama: { etiket: "Tartıma Geç", durum: "tartimda" },
  tartimda: { etiket: "Paketlemeye Geç", durum: "paketleme" },
  paketleme: { etiket: "Teslime Hazır Yap", durum: "teslime_hazir" },
  teslime_hazir: { etiket: "Tamamla", durum: "tamamlandi" },
};

export function PersonelAktifIs({ kurban, birak, sorunBildir, yenile }: Props) {
  const [yukleniyor, setYukleniyor] = useState(false);

  const sonraki = SONRAKI_ASAMA[kurban.kesimDurumu];

  async function sonrakiAsama() {
    if (!sonraki) return;
    setYukleniyor(true);
    try {
      const yanit = await fetch("/api/tv/kurban-asama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kurbanId: kurban.id,
          yeniDurum: sonraki.durum,
        }),
      });
      if (!yanit.ok) {
        const veri = await yanit.json().catch(() => ({}));
        toast.error(veri.hata ?? "Aşama değiştirilemedi");
        return;
      }
      toast.success(`${sonraki.etiket} — DANA-${kurban.kesimSirasi}`);
      if (navigator.vibrate) navigator.vibrate(40);
      yenile();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <Card className="border-primary sticky top-[60px] z-10 border-2 shadow-md">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <span className="text-primary text-[10px] font-bold tracking-wider uppercase">
              Aktif İşim
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={birak}
            className="text-muted-foreground h-7 px-2"
            aria-label="İşi bırak"
          >
            <X size={14} />
          </Button>
        </div>

        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xl font-bold">DANA-{kurban.kesimSirasi}</div>
            <div className="text-muted-foreground text-xs">
              {kurban.asama ?? kurban.kesimDurumu}
              {kurban.operasyonSira !== null &&
                ` · Sıra ${kurban.operasyonSira}`}
            </div>
          </div>
          <AsamaSayaci
            baslangic={kurban.asamaBaslangic}
            boyut="genis"
            tema="acik"
          />
        </div>

        <div className="bg-muted mb-3 h-2 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${kurban.ilerlemeYuzde}%` }}
          />
        </div>

        <div className="text-muted-foreground mb-3 flex items-center justify-between text-xs">
          <span>{kurban.hisseSayisi} hisse</span>
          <span>%{kurban.ilerlemeYuzde}</span>
        </div>

        {sonraki && (
          <Button
            type="button"
            onClick={sonrakiAsama}
            disabled={yukleniyor}
            className="h-12 w-full"
          >
            {yukleniyor ? (
              <Loader2 size={16} className="mr-1 animate-spin" />
            ) : (
              <ChevronRight size={16} className="mr-1" />
            )}
            {sonraki.etiket}
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={sorunBildir}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive mt-2 w-full"
        >
          <AlertTriangle size={12} className="mr-1" />
          Sorun Bildir
        </Button>
      </CardContent>
    </Card>
  );
}
