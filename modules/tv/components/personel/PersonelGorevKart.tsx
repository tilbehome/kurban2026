"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, AlertTriangle } from "lucide-react";
import type { PersonelKurbanVeri } from "@/app/tv/personel/page";

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

const ASAMA_ETIKET: Record<string, string> = {
  vekalet_bekliyor: "Vekalet Bekliyor",
  siradaki: "Sıradaki",
  hazirlik: "Hazırlık",
  kesimde: "Kesimde",
  deri_yuzme: "Deri Yüzme",
  parcalama: "Parçalama",
  tartimda: "Tartımda",
  paketleme: "Paketleme",
  teslime_hazir: "Teslim Hazır",
  tamamlandi: "Tamamlandı",
};

interface Props {
  kurban: PersonelKurbanVeri;
  aktif: boolean;
  isiAl: () => void;
  sorunBildir: () => void;
  yenile: () => void;
}

export function PersonelGorevKart({
  kurban,
  isiAl,
  sorunBildir,
}: Props) {
  const renk = ASAMA_RENGI[kurban.kesimDurumu] ?? "bg-slate-100 text-slate-700";
  const etiket = ASAMA_ETIKET[kurban.kesimDurumu] ?? kurban.kesimDurumu;

  return (
    <Card>
      <CardContent className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-base font-bold">DANA-{kurban.kesimSirasi}</div>
            <div className="text-muted-foreground text-[10px]">
              {kurban.hisseSayisi} hisse
              {kurban.operasyonSira !== null && ` · Sıra ${kurban.operasyonSira}`}
            </div>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${renk}`}
          >
            {etiket}
          </span>
        </div>

        <div className="bg-muted mb-2 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${kurban.ilerlemeYuzde}%` }}
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={isiAl}
            size="sm"
            className="h-10 flex-1"
          >
            <Zap size={12} className="mr-1" />
            Bu İşi Al
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={sorunBildir}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-10"
            aria-label="Sorun bildir"
          >
            <AlertTriangle size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
