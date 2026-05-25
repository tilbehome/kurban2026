"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Beef,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useSSE } from "@/modules/tv/hooks/useSSE";
import { useSeslicAnons } from "@/modules/tv/hooks/useSeslicAnons";
import { usePushBildirim } from "@/modules/tv/hooks/usePushBildirim";
import {
  ASAMA_EMOJI,
  ASAMA_ETIKETLERI,
  type KurbanKesimDurumu,
} from "@/modules/tv/lib/asama-akisi";
import type { TvTumVeri } from "@/modules/tv/types";

interface KurbanTakipClientProps {
  kurbanId: string;
  kesimSirasi: number;
  kupeNo: string | null;
  hisseSayisi: number;
  whatsappTel: string;
}

/**
 * DANA-X (kurban) için müşteri takip ekranı.
 *
 * - SSE ile canlı durum
 * - Kendi kurbanı VURGULU (üst kart büyük)
 * - Aşağıda genel TV durumu (özet)
 * - Push notification + sesli anons toggle'ları
 */
export function KurbanTakipClient({
  kurbanId,
  kesimSirasi,
  kupeNo,
  hisseSayisi,
  whatsappTel,
}: KurbanTakipClientProps) {
  const { veri } = useSSE<TvTumVeri>({
    url: "/api/tv/yayin",
    eventName: "guncelleme",
  });

  const { destek: pushDestek, izinIste, goster } = usePushBildirim();
  const {
    destek: sesDestek,
    aktif: sesAktif,
    aktifEt: sesAktifEt,
    anons,
  } = useSeslicAnons();

  // Kendi kurbanını çıkar (TvTumVeri'den)
  const kendiKurban = useMemo(() => {
    if (!veri) return null;

    const ortak = (id: string) => {
      // SutunVerileri'nde kurbanId tutulmuyor — siraNo ile eşleştir
      return (
        veri.sutunlar.siradakiler.find((s) => s.siraNo === kesimSirasi) ||
        veri.sutunlar.kesimde.find((k) => k.siraNo === kesimSirasi) ||
        veri.sutunlar.tartimda.find((k) => k.siraNo === kesimSirasi) ||
        veri.sutunlar.teslimeHazir.find((t) => t.teslimNo === kesimSirasi)
      );
    };
    void ortak;
    return null;
  }, [veri, kesimSirasi]);
  void kendiKurban;

  // Aşama değişikliklerini dinle, sesli anons + bildirim göster
  const [oncekiDurum, setOncekiDurum] = useState<KurbanKesimDurumu | null>(
    null,
  );

  useEffect(() => {
    if (!veri) return;
    // Kendi kurbanın durumunu kpi/sutunlardan tahmin et
    let mevcut: KurbanKesimDurumu | null = null;
    if (veri.sutunlar.kesimde.some((k) => k.siraNo === kesimSirasi)) {
      mevcut = "kesimde";
    } else if (veri.sutunlar.tartimda.some((k) => k.siraNo === kesimSirasi)) {
      mevcut = "tartimda";
    } else if (
      veri.sutunlar.teslimeHazir.some((t) => t.teslimNo === kesimSirasi)
    ) {
      mevcut = "teslime_hazir";
    } else if (veri.sutunlar.siradakiler.some((s) => s.siraNo === kesimSirasi)) {
      mevcut = "siradaki";
    }
    if (mevcut && mevcut !== oncekiDurum) {
      if (oncekiDurum !== null) {
        const etiket = ASAMA_ETIKETLERI[mevcut];
        anons(`DANA ${kesimSirasi}, ${etiket} aşamasına geçti`);
        goster(
          `DANA-${kesimSirasi} güncellendi`,
          `Yeni aşama: ${etiket}`,
        );
      }
      setOncekiDurum(mevcut);
    }
  }, [veri, kesimSirasi, oncekiDurum, anons, goster]);

  // Aktif aşama (üst vurgulu kart için)
  const aktifAsama: KurbanKesimDurumu = oncekiDurum ?? "beklemede";
  const aktifIlerleme =
    veri?.sutunlar.kesimde.find((k) => k.siraNo === kesimSirasi)?.ilerlemeYuzde ||
    veri?.sutunlar.tartimda.find((k) => k.siraNo === kesimSirasi)
      ?.ilerlemeYuzde ||
    0;
  const aktifKalan =
    veri?.sutunlar.kesimde.find((k) => k.siraNo === kesimSirasi)?.kalanSureDk ||
    veri?.sutunlar.tartimda.find((k) => k.siraNo === kesimSirasi)
      ?.kalanSureDk ||
    null;

  const waLink = useMemo(() => {
    const rakam = whatsappTel.replace(/\D/g, "");
    if (rakam.length === 0) return null;
    const normalize = rakam.startsWith("90")
      ? rakam
      : rakam.startsWith("0")
        ? "90" + rakam.slice(1)
        : "90" + rakam;
    return `https://wa.me/${normalize}`;
  }, [whatsappTel]);

  return (
    <div className="from-slate-950 via-slate-900 to-orange-950 min-h-screen bg-linear-to-br p-4 text-white">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        {/* Üst bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/tv/m"
            className="text-slate-300 hover:text-white flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={14} />
            Geri
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => sesAktifEt(!sesAktif)}
              disabled={!sesDestek}
              title={sesAktif ? "Anonsu kapat" : "Anonsu aç"}
              className={cn(
                "rounded-full p-2 transition-colors",
                sesAktif
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-700 text-slate-300",
              )}
              aria-label="Sesli anons toggle"
            >
              {sesAktif ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            {pushDestek !== "destek-yok" && (
              <button
                type="button"
                onClick={() =>
                  void izinIste({ kurbanId, musteriId: null })
                }
                title="Bildirimleri aç"
                className={cn(
                  "rounded-full p-2 transition-colors",
                  pushDestek === "izin-var"
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-700 text-slate-300",
                )}
                aria-label="Push notification toggle"
              >
                {pushDestek === "izin-var" ? (
                  <Bell size={14} />
                ) : (
                  <BellOff size={14} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Kendi kurbanı — VURGULU kart */}
        <Card className="from-orange-500/20 to-amber-500/20 ring-orange-500/40 border-orange-500/40 bg-linear-to-br backdrop-blur-sm ring-2">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-3">
              <div className="from-orange-500 to-amber-500 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br shadow-lg">
                <Beef size={28} />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-orange-200 text-[11px] font-semibold tracking-wider uppercase">
                  Hissen
                </span>
                <span className="text-3xl font-extrabold">
                  DANA-{kesimSirasi}
                </span>
                {kupeNo && (
                  <span className="text-orange-200/80 text-xs">
                    Küpe: {kupeNo}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-orange-200 mb-1 text-[10px] font-semibold tracking-wider uppercase">
                Şu Anki Durum
              </div>
              <div className="text-xl font-extrabold">
                {ASAMA_EMOJI[aktifAsama]} {ASAMA_ETIKETLERI[aktifAsama]}
              </div>
              {(aktifIlerleme > 0 || aktifKalan !== null) && (
                <div className="mt-2">
                  <div className="bg-slate-700 h-2 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-orange-500 transition-all duration-700"
                      style={{ width: `${aktifIlerleme}%` }}
                    />
                  </div>
                  <div className="text-orange-200/80 mt-1 flex justify-between text-xs">
                    <span>%{aktifIlerleme}</span>
                    {aktifKalan !== null && <span>~{aktifKalan} dk</span>}
                  </div>
                </div>
              )}
            </div>

            <div className="text-orange-100/80 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="bg-slate-900/40 rounded p-2">
                <div className="text-orange-200 text-[9px] uppercase">
                  Hisse
                </div>
                <div className="font-tabular text-base font-bold text-white">
                  {hisseSayisi}
                </div>
              </div>
              <div className="bg-slate-900/40 rounded p-2">
                <div className="text-orange-200 text-[9px] uppercase">
                  Sıra
                </div>
                <div className="font-tabular text-base font-bold text-white">
                  {kesimSirasi}
                </div>
              </div>
              <div className="bg-slate-900/40 rounded p-2">
                <div className="text-orange-200 text-[9px] uppercase">
                  Aşama
                </div>
                <div className="font-tabular text-base font-bold text-white">
                  {ASAMA_EMOJI[aktifAsama]}
                </div>
              </div>
            </div>

            {pushDestek === "izin-yok" && (
              <Button
                type="button"
                onClick={() => void izinIste({ kurbanId })}
                className="bg-emerald-500 hover:bg-emerald-600 w-full"
              >
                <Bell size={14} />
                Bildirimleri Aç
              </Button>
            )}
            {!sesAktif && sesDestek && (
              <Button
                type="button"
                onClick={() => sesAktifEt(true)}
                variant="outline"
                className="border-slate-600 bg-slate-800/60 text-white hover:bg-slate-700 w-full"
              >
                <Volume2 size={14} />
                Sesli Anonsu Aç
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Genel durum (özet) */}
        {veri && (
          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="flex flex-col gap-3 p-4">
              <h3 className="text-slate-300 text-xs font-semibold tracking-wider uppercase">
                Genel Operasyon Durumu
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <Mini
                  etiket="Sırada"
                  sayi={veri.kpi.siradaki}
                  renk="text-purple-300"
                />
                <Mini
                  etiket="Kesimde"
                  sayi={veri.kpi.kesimde}
                  renk="text-orange-300"
                />
                <Mini
                  etiket="Tartım"
                  sayi={
                    veri.sutunlar.tartimda.length
                  }
                  renk="text-blue-300"
                />
                <Mini
                  etiket="Hazır"
                  sayi={veri.kpi.teslimHazir}
                  renk="text-green-300"
                />
                <Mini
                  etiket="Tamam"
                  sayi={veri.kpi.tamamlanan}
                  renk="text-cyan-300"
                />
                <Mini
                  etiket="Bekleyen"
                  sayi={veri.kpi.bekleyen}
                  renk="text-yellow-300"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* WhatsApp iletişim */}
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-3 rounded-xl p-4 transition-colors"
          >
            <Phone size={20} />
            <div className="flex flex-1 flex-col leading-tight">
              <span className="text-[10px] font-semibold tracking-wider uppercase">
                WhatsApp İletişim
              </span>
              <span className="font-tabular text-lg font-bold">
                {whatsappTel}
              </span>
            </div>
            <CheckCircle2 size={16} />
          </a>
        )}

        <Link
          href="/tv"
          className="text-slate-400 hover:text-white text-center text-xs underline"
        >
          Tüm TV ekranını görüntüle →
        </Link>
      </div>
    </div>
  );
}

function Mini({
  etiket,
  sayi,
  renk,
}: {
  etiket: string;
  sayi: number;
  renk: string;
}) {
  return (
    <div className="bg-slate-900/40 rounded p-2">
      <div className="text-slate-400 text-[9px] uppercase">{etiket}</div>
      <div className={cn("font-tabular text-lg font-bold", renk)}>{sayi}</div>
    </div>
  );
}
