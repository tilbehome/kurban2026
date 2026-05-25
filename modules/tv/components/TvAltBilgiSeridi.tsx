"use client";

import { Megaphone, ListOrdered, ShieldCheck, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { TvAyariKisa, TvTema } from "@/modules/tv/types";

interface TvAltBilgiSeridiProps {
  ayarlar: TvAyariKisa;
  tema: TvTema;
}

interface BilgiBlok {
  id: keyof TvAyariKisa;
  baslik: string;
  ikon: LucideIcon;
  renk: { iconBgLight: string; iconBgDark: string };
  href?: (deger: string) => string;
  vurgu?: boolean; // büyük telefon vb.
}

const BLOKLAR: BilgiBlok[] = [
  {
    id: "duyuru",
    baslik: "DUYURULAR",
    ikon: Megaphone,
    renk: {
      iconBgLight: "bg-orange-500 text-white",
      iconBgDark: "bg-orange-500/30 text-orange-300",
    },
  },
  {
    id: "siraHatirlatma",
    baslik: "SIRA HATIRLATMASI",
    ikon: ListOrdered,
    renk: {
      iconBgLight: "bg-purple-500 text-white",
      iconBgDark: "bg-purple-500/30 text-purple-300",
    },
  },
  {
    id: "hijyen",
    baslik: "HİJYEN ÖNCELİĞİMİZ",
    ikon: ShieldCheck,
    renk: {
      iconBgLight: "bg-teal-500 text-white",
      iconBgDark: "bg-teal-500/30 text-teal-300",
    },
  },
  {
    id: "whatsappTel",
    baslik: "WHATSAPP İLETİŞİM",
    ikon: MessageCircle,
    renk: {
      iconBgLight: "bg-green-500 text-white",
      iconBgDark: "bg-green-500/30 text-green-300",
    },
    href: (deger: string) => {
      const rakam = deger.replace(/\D/g, "");
      if (rakam.length === 0) return "#";
      const normalize = rakam.startsWith("90")
        ? rakam
        : rakam.startsWith("0")
          ? "90" + rakam.slice(1)
          : "90" + rakam;
      return `https://wa.me/${normalize}`;
    },
    vurgu: true,
  },
];

export function TvAltBilgiSeridi({ ayarlar, tema }: TvAltBilgiSeridiProps) {
  const koyuMu = tema === "dark";

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 px-6 py-3 sm:grid-cols-2 lg:grid-cols-4",
      )}
    >
      {BLOKLAR.map((b) => {
        const Ikon = b.ikon;
        const deger = (ayarlar as unknown as Record<string, string>)[b.id];
        const renk = koyuMu ? b.renk.iconBgDark : b.renk.iconBgLight;
        const govde = (
          <div
            className={cn(
              "flex h-full items-start gap-3 rounded-xl border p-4 transition-colors",
              koyuMu
                ? "border-slate-700 bg-slate-800/40"
                : "border-slate-200 bg-white",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                renk,
              )}
            >
              <Ikon size={18} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span
                className={cn(
                  "text-[10px] font-extrabold tracking-wider uppercase",
                  koyuMu ? "text-slate-400" : "text-slate-500",
                )}
              >
                {b.baslik}
              </span>
              <span
                className={cn(
                  b.vurgu
                    ? "font-tabular mt-1 text-xl font-extrabold sm:text-2xl"
                    : "mt-1 text-sm font-medium leading-snug",
                  koyuMu ? "text-white" : "text-slate-900",
                )}
              >
                {deger || "—"}
              </span>
            </div>
          </div>
        );
        if (b.href && deger) {
          return (
            <a
              key={b.id}
              href={b.href(deger)}
              target="_blank"
              rel="noopener noreferrer"
              className="block transition-transform hover:scale-[1.01]"
            >
              {govde}
            </a>
          );
        }
        return <div key={b.id}>{govde}</div>;
      })}
    </div>
  );
}
