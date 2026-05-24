"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  MessageCircle,
  Database,
  ServerCog,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

const BAYRAM_TARIHI = new Date("2026-06-05T00:00:00+03:00");

interface TopBilgiSeridiProps {
  /** Sidebar bildirimleri — WhatsApp kuyruğu sayısı için */
  bekleyenMesaj?: number;
  /** Son yedekleme zamanı (ISO veya 'HH:MM') */
  sonYedek?: string;
}

/**
 * Dashboard'un en üstündeki bilgilendirme şeridi.
 * Bayram sayacı + WhatsApp + yedek + sistem durumu.
 */
export function TopBilgiSeridi({
  bekleyenMesaj = 0,
  sonYedek,
}: TopBilgiSeridiProps) {
  const [kalanGun, setKalanGun] = useState<number | null>(null);

  useEffect(() => {
    function hesapla() {
      const fark = BAYRAM_TARIHI.getTime() - Date.now();
      setKalanGun(Math.max(0, Math.ceil(fark / (1000 * 60 * 60 * 24))));
    }
    hesapla();
    const i = setInterval(hesapla, 60 * 60 * 1000);
    return () => clearInterval(i);
  }, []);

  const bayramGectiMi = kalanGun === 0;

  return (
    <div
      className={cn(
        "from-orange-50 to-amber-50 border-l-4 border-l-orange-500 bg-linear-to-r",
        "flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="bg-orange-500 text-white flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
          <Sparkles size={13} />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-orange-900">
            {bayramGectiMi
              ? "🎉 Bayramınız Mübarek Olsun"
              : `Kurban Bayramına ${kalanGun ?? "—"} gün kaldı`}
          </span>
          <span className="text-[11px] text-orange-700/80">
            5 Haziran 2026 · Operasyon planlamasını hazırlayın
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-3">
        <BilgiBlok
          ikon={<MessageCircle size={12} />}
          renk="emerald"
          label="WhatsApp"
          deger={
            bekleyenMesaj > 0 ? `${bekleyenMesaj} kuyrukta` : "Boş kuyruk"
          }
          aktif={bekleyenMesaj > 0}
          href="/whatsapp"
        />
        <BilgiBlok
          ikon={<Database size={12} />}
          renk="blue"
          label="Yedek"
          deger={sonYedek ?? "—"}
          href="/ayarlar/yedekleme"
        />
        <Link
          href="/ayarlar/sistem"
          className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-orange-800 ring-1 ring-orange-200 transition-colors hover:bg-white"
        >
          <ServerCog size={12} />
          <span className="font-medium">Sistem</span>
          <ChevronRight size={11} className="opacity-60" />
        </Link>
      </div>
    </div>
  );
}

interface BilgiBlokProps {
  ikon: React.ReactNode;
  renk: "emerald" | "blue" | "amber";
  label: string;
  deger: string;
  aktif?: boolean;
  href?: string;
}

function BilgiBlok({ ikon, renk, label, deger, aktif, href }: BilgiBlokProps) {
  const renkStilleri = {
    emerald: "ring-emerald-200 text-emerald-800",
    blue: "ring-blue-200 text-blue-800",
    amber: "ring-amber-200 text-amber-800",
  } as const;
  const noktaRenkleri = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
  } as const;

  const icerik = (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 ring-1",
        renkStilleri[renk],
      )}
    >
      {aktif && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            noktaRenkleri[renk],
            "animate-pulse",
          )}
        />
      )}
      {ikon}
      <span className="font-medium">{label}:</span>
      <span className="font-tabular">{deger}</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="transition-colors hover:opacity-80">
        {icerik}
      </Link>
    );
  }
  return icerik;
}
