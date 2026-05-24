"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  MessageCircle,
  Database,
  ServerCog,
  ChevronRight,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  bayramTemasi,
  type BayramTemasi,
} from "@/modules/dashboard/lib/tema-tokens";

interface TopBilgiSeridiProps {
  /** Sidebar bildirimleri — WhatsApp kuyruğu sayısı için */
  bekleyenMesaj?: number;
  /** Son yedekleme zamanı (ISO veya 'HH:MM') */
  sonYedek?: string;
}

/**
 * Dashboard üst bilgilendirme şeridi — TASARIM-BRIEF §3 renk paleti uyumlu.
 *
 * **Dinamik tema:** bayrama yaklaştıkça turuncu yoğunlaşır, bayram günü
 * yeşil kutlama tonuna geçer (bayramTemasi() helper'ı).
 */
export function TopBilgiSeridi({
  bekleyenMesaj = 0,
  sonYedek,
}: TopBilgiSeridiProps) {
  const [tema, setTema] = useState<BayramTemasi | null>(null);

  useEffect(() => {
    function hesapla() {
      setTema(bayramTemasi());
    }
    hesapla();
    // Saatte bir tema yeniden hesaplanır (gece yarısı geçişi için)
    const i = setInterval(hesapla, 60 * 60 * 1000);
    return () => clearInterval(i);
  }, []);

  if (!tema) {
    // Hidrasyon önyükleme — boş bant
    return (
      <div className="h-12 border-l-4 border-l-orange-400 bg-orange-50/50" />
    );
  }

  const Ikon = tema.bayramMi ? PartyPopper : Sparkles;
  const ikonRengi = tema.bayramMi ? "bg-emerald-600" : "bg-orange-500";

  return (
    <div
      className={cn(
        "border-l-4 bg-linear-to-r",
        tema.topSerit,
        tema.topSeritBorder,
        "flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6",
        "transition-colors duration-500",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "text-white flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
            ikonRengi,
            // Bayram-yaklaşıyor ise hafif puls
            tema.durum === "cok-yakin" && "animate-pulse",
          )}
        >
          <Ikon size={13} />
        </span>
        <div className="flex flex-col leading-tight">
          <span
            className={cn(
              "text-sm font-bold transition-colors",
              tema.topSeritText,
            )}
          >
            {tema.banner}
          </span>
          <span
            className={cn(
              "text-[11px] opacity-80 transition-colors",
              tema.topSeritText,
            )}
          >
            {tema.altMesaj}
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
          className={cn(
            "flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 ring-1 transition-colors hover:bg-white",
            tema.bayramMi
              ? "text-emerald-800 ring-emerald-200"
              : "text-orange-800 ring-orange-200",
          )}
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
