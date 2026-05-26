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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Loader2,
  RotateCcw,
  X,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ASAMA_ETIKETLERI,
  oncekiAsama,
  sonrakiAsama,
  type KurbanKesimDurumu,
} from "@/modules/tv/lib/asama-akisi";
import type { PersonelKurbanVeri } from "@/app/tv/personel/page";
import { AsamaSayaci } from "@/modules/tv/components/shared/AsamaSayaci";
import type { BorcDurumu } from "@/shared/lib/hisse-bakiye";

// SPRINT-PERSONEL-ISIM-BADGE: hissedar ismi tam yazılır (kısaltma yok),
// TR-locale BÜYÜK HARF. Borç durumuna göre 3 renk:
//   borc-yok    → yeşil  (tamamı ödenmiş)
//   kismi-borc  → sarı   (kısmi ödeme)
//   tam-borc    → kırmızı (hiç ödeme yok)
const BORC_BADGE_RENGI: Record<BorcDurumu, string> = {
  "borc-yok": "bg-emerald-100 text-emerald-900 border-emerald-300",
  "kismi-borc": "bg-amber-100 text-amber-900 border-amber-300",
  "tam-borc": "bg-red-100 text-red-900 border-red-300",
};

const BORC_ARIA: Record<BorcDurumu, string> = {
  "borc-yok": "Tamamı ödenmiş",
  "kismi-borc": "Kısmi borç",
  "tam-borc": "Ödeme yapılmamış",
};

function adTamGoster(adSoyad: string): string {
  return adSoyad.trim().toLocaleUpperCase("tr-TR").replace(/\s+/g, " ");
}

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

interface OnayModalDurum {
  acik: boolean;
  baslik: string;
  aciklama: string;
  hedefAsama: KurbanKesimDurumu | null;
  yon: "ileri" | "geri";
}

const ONAY_KAPALI: OnayModalDurum = {
  acik: false,
  baslik: "",
  aciklama: "",
  hedefAsama: null,
  yon: "ileri",
};

export function PersonelGorevKart({
  kurban,
  isiAl,
  sorunBildir,
  yenile,
}: Props) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [onayModal, setOnayModal] = useState<OnayModalDurum>(ONAY_KAPALI);

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
    // Kritik geçişte onay modali — diğerleri tek tıkla geçer.
    if (sonraki === "tamamlandi") {
      setOnayModal({
        acik: true,
        baslik: `DANA-${kurban.kesimSirasi} Tamamlandı?`,
        aciklama:
          "Bu kurbanı tamamlandı olarak işaretliyorsun. Yanlışlık olursa Geri Al ile düzeltilebilir.",
        hedefAsama: sonraki,
        yon: "ileri",
      });
      return;
    }
    asamaDegistir(sonraki, "ileri");
  }

  function geriAlKlik() {
    if (!onceki || yukleniyor) return;
    setOnayModal({
      acik: true,
      baslik: `DANA-${kurban.kesimSirasi} Geri Al?`,
      aciklama: `Önceki aşamaya (${ASAMA_ETIKETLERI[onceki]}) geri alınsın mı?`,
      hedefAsama: onceki,
      yon: "geri",
    });
  }

  function onayla() {
    const hedef = onayModal.hedefAsama;
    const yon = onayModal.yon;
    setOnayModal(ONAY_KAPALI);
    if (hedef) {
      asamaDegistir(hedef, yon);
    }
  }

  const bosHisseSayisi = kurban.hisseler.filter((h) => !h.musteriAdi).length;
  const doluHisseler = kurban.hisseler.filter((h) => h.musteriAdi);

  return (
    <>
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

            {/* SPRINT-PERSONEL-ISIM-BADGE: Hissedar isimleri TAM, BÜYÜK HARF
                (TR-locale). Badge rengi hisse bazlı borç durumunu gösterir:
                yeşil (ödenmiş) / sarı (kısmi) / kırmızı (ödenmemiş). */}
            <div className="mb-1 flex flex-wrap items-center gap-1">
              {doluHisseler.length === 0 ? (
                <span className="text-muted-foreground text-[10px] italic">
                  Hissedar yok
                </span>
              ) : (
                doluHisseler.map((h) => {
                  const ad = adTamGoster(h.musteriAdi ?? "");
                  const renk = BORC_BADGE_RENGI[h.borcDurumu];
                  const aria = `${ad} — ${BORC_ARIA[h.borcDurumu]}`;
                  return (
                    <span
                      key={h.id}
                      title={aria}
                      aria-label={aria}
                      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold ${renk}`}
                    >
                      {ad}
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

    {/* SPRINT-ONAY-MODAL: telefon-dostu büyük butonlu onay diyaloğu.
        window.confirm() yerine — eldivenle dokunulur boy (h-14), İptal
        varsayılan, semantik renkler (yeşil=ilerlet, amber=geri). */}
    <Dialog
      open={onayModal.acik}
      onOpenChange={(acik) => {
        if (!acik) setOnayModal(ONAY_KAPALI);
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-sm">
        <div className="flex flex-col items-center gap-3 pt-2">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              onayModal.yon === "ileri"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {onayModal.yon === "ileri" ? (
              <CheckCircle2 className="size-7" />
            ) : (
              <RotateCcw className="size-7" />
            )}
          </div>
          <DialogTitle className="text-center text-lg font-semibold">
            {onayModal.baslik}
          </DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed">
            {onayModal.aciklama}
          </DialogDescription>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOnayModal(ONAY_KAPALI)}
            className="h-14 touch-manipulation text-base font-semibold"
          >
            <X className="mr-1 size-5" />
            İptal
          </Button>
          <Button
            type="button"
            onClick={onayla}
            className={`h-14 touch-manipulation text-base font-semibold ${
              onayModal.yon === "ileri"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-amber-600 text-white hover:bg-amber-700"
            }`}
          >
            <CheckCircle2 className="mr-1 size-5" />
            Evet, Onayla
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

