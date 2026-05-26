"use client";

/**
 * Dashboard yedek sağlık kartı — SPRINT-P1 İŞ 4.
 *
 * - Son yedeğin yaşına göre renk (yeşil <30dk, sarı 30-60dk, kırmızı 60+dk).
 * - "Şimdi Yedekle" butonu (yedek.manuel izni gerekli).
 * - Manuel tetikleme sonrası kendini günceller.
 */

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Database, AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

const YENILEME_MS = 60_000; // 60 saniyede bir tazele
const ESIK_SAGLIKLI_DK = 30;
const ESIK_UYARI_DK = 60;

interface SonYedekBilgi {
  varMi: boolean;
  dosyaAdi: string | null;
  zaman: string | null; // ISO string (server → client serialize)
  boyutKB: number | null;
  yasGecmisDk: number | null;
}

interface YedekKartProps {
  ilkBilgi: SonYedekBilgi;
  /** Manuel yedek butonu görünür olsun mu (yedek.manuel izni server'da kontrol edildi) */
  butonGoster: boolean;
}

type Saglik = "yok" | "iyi" | "uyari" | "kritik";

function saglikHesapla(bilgi: SonYedekBilgi): Saglik {
  if (!bilgi.varMi || bilgi.yasGecmisDk === null) return "yok";
  if (bilgi.yasGecmisDk < ESIK_SAGLIKLI_DK) return "iyi";
  if (bilgi.yasGecmisDk < ESIK_UYARI_DK) return "uyari";
  return "kritik";
}

const SAGLIK_STIL: Record<
  Saglik,
  {
    border: string;
    ikonRenk: string;
    ikonArka: string;
    metin: string;
    rozet: string;
    Ikon: typeof CheckCircle2;
    etiket: string;
  }
> = {
  iyi: {
    border: "border-emerald-300",
    ikonRenk: "text-emerald-700",
    ikonArka: "bg-emerald-100",
    metin: "text-emerald-700",
    rozet: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    Ikon: CheckCircle2,
    etiket: "Sağlıklı",
  },
  uyari: {
    border: "border-amber-300",
    ikonRenk: "text-amber-700",
    ikonArka: "bg-amber-100",
    metin: "text-amber-800",
    rozet: "bg-amber-100 text-amber-800 ring-amber-200",
    Ikon: AlertTriangle,
    etiket: "Uyarı",
  },
  kritik: {
    border: "border-red-400",
    ikonRenk: "text-red-700",
    ikonArka: "bg-red-100",
    metin: "text-red-800",
    rozet: "bg-red-100 text-red-800 ring-red-200",
    Ikon: ShieldAlert,
    etiket: "Kritik",
  },
  yok: {
    border: "border-slate-300",
    ikonRenk: "text-slate-600",
    ikonArka: "bg-slate-100",
    metin: "text-slate-700",
    rozet: "bg-slate-100 text-slate-700 ring-slate-200",
    Ikon: AlertTriangle,
    etiket: "Yedek Yok",
  },
};

function yasFormatla(dk: number | null): string {
  if (dk === null) return "—";
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk önce`;
  const saat = Math.floor(dk / 60);
  if (saat < 24) return `${saat} sa önce`;
  const gun = Math.floor(saat / 24);
  return `${gun} gün önce`;
}

function boyutFormatla(kb: number | null): string {
  if (kb === null) return "—";
  if (kb < 1024) return `${kb} KB`;
  const mb = kb / 1024;
  return mb < 100 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`;
}

function zamanFormatla(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function YedekKart({ ilkBilgi, butonGoster }: YedekKartProps) {
  const [bilgi, setBilgi] = useState<SonYedekBilgi>(ilkBilgi);
  const [bekliyor, basla] = useTransition();
  const iptalEdildi = useRef(false);

  const yenile = useCallback(async () => {
    try {
      const r = await fetch("/api/yedek/son-bilgi", { cache: "no-store" });
      if (!r.ok) return;
      const j = (await r.json()) as {
        basarili: boolean;
        veri?: SonYedekBilgi;
      };
      if (iptalEdildi.current) return;
      if (j.basarili && j.veri) setBilgi(j.veri);
    } catch {
      // sessizce yut
    }
  }, []);

  useEffect(() => {
    iptalEdildi.current = false;
    const i = setInterval(yenile, YENILEME_MS);
    return () => {
      iptalEdildi.current = true;
      clearInterval(i);
    };
  }, [yenile]);

  const manuelYedekle = useCallback(() => {
    basla(async () => {
      try {
        const r = await fetch("/api/yedek/manuel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ neden: "manuel-dashboard" }),
        });
        const j = (await r.json()) as {
          basarili?: boolean;
          hata?: string;
          boyutKB?: number;
          sonBilgi?: SonYedekBilgi;
        };
        if (!r.ok || j.basarili === false) {
          toast.error(j.hata ?? "Yedek alınamadı");
          return;
        }
        toast.success(
          `Yedek alındı (${boyutFormatla(j.boyutKB ?? null)})`,
        );
        if (j.sonBilgi) {
          setBilgi(j.sonBilgi);
        } else {
          yenile();
        }
      } catch {
        toast.error("Yedek isteği gönderilemedi");
      }
    });
  }, [yenile]);

  const saglik = saglikHesapla(bilgi);
  const stil = SAGLIK_STIL[saglik];
  const Ikon = stil.Ikon;

  return (
    <Card className={cn("flex h-full flex-col border-2", stil.border)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database size={16} className="text-blue-600" />
          Yedekleme Durumu
        </CardTitle>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
            stil.rozet,
          )}
        >
          {stil.etiket}
        </span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              stil.ikonArka,
            )}
          >
            <Ikon size={20} className={stil.ikonRenk} />
          </span>
          <div className="min-w-0 flex-1">
            <div className={cn("text-lg font-bold", stil.metin)}>
              {bilgi.varMi ? yasFormatla(bilgi.yasGecmisDk) : "Henüz yedek yok"}
            </div>
            <div className="text-muted-foreground text-xs">
              {bilgi.varMi
                ? `${zamanFormatla(bilgi.zaman)} · ${boyutFormatla(bilgi.boyutKB)}`
                : "İlk yedek için butona tıklayın"}
            </div>
          </div>
        </div>

        {saglik === "kritik" && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-800">
            <strong>Dikkat:</strong> Son yedek 1 saatten eski. Bayram günü
            saatlik yedek çalışmalı — Ayarlar &gt; Sistem ekranını kontrol edin.
          </div>
        )}
        {saglik === "uyari" && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            Otomatik yedek yakında çalışacak. Acilse manuel tetikleyebilirsiniz.
          </div>
        )}

        {bilgi.dosyaAdi && (
          <div className="text-muted-foreground truncate font-mono text-[10px]">
            {bilgi.dosyaAdi}
          </div>
        )}

        {butonGoster && (
          <Button
            onClick={manuelYedekle}
            disabled={bekliyor}
            size="sm"
            variant={saglik === "kritik" ? "default" : "outline"}
            className="mt-auto w-full"
          >
            {bekliyor ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Yedek alınıyor…
              </>
            ) : (
              <>
                <Database size={14} />
                Şimdi Yedekle
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
