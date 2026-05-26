"use client";

import { Megaphone, Monitor, Info, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { TvAyariKisa, TvTema } from "@/modules/tv/types";

interface Props {
  ayarlar: TvAyariKisa;
  tema: TvTema;
}

interface SeritKart {
  ikon: LucideIcon;
  ikonBg: string;
  baslik: string;
  icerik: string;
  /** Telefon stili (mono + büyük) için */
  telefonGibi?: boolean;
}

function telefonFormatla(tel: string): string {
  const sadeRakam = tel.replace(/\D/g, "");
  if (sadeRakam.length === 10) {
    return `0${sadeRakam.slice(0, 3)} ${sadeRakam.slice(3, 6)} ${sadeRakam.slice(6, 8)} ${sadeRakam.slice(8)}`;
  }
  if (sadeRakam.length === 11 && sadeRakam.startsWith("0")) {
    return `${sadeRakam.slice(0, 4)} ${sadeRakam.slice(4, 7)} ${sadeRakam.slice(7, 9)} ${sadeRakam.slice(9)}`;
  }
  if (sadeRakam.length === 12 && sadeRakam.startsWith("90")) {
    return `0${sadeRakam.slice(2, 5)} ${sadeRakam.slice(5, 8)} ${sadeRakam.slice(8, 10)} ${sadeRakam.slice(10)}`;
  }
  return tel;
}

export function TvAltBilgiSeridi({ ayarlar, tema }: Props) {
  const koyuMu = tema === "dark";

  const kartlar: SeritKart[] = [
    {
      ikon: Megaphone,
      ikonBg: "bg-orange-500",
      baslik: "DUYURULAR",
      icerik: ayarlar.duyuru || "Sıra numaranızı ekrandan takip ediniz.",
    },
    {
      ikon: Monitor,
      ikonBg: "bg-blue-500",
      baslik: "EKRAN TAKİBİ",
      icerik:
        ayarlar.siraHatirlatma ||
        "Yoğunluk durumunda listeler yavaşça yukarı kayar.",
    },
    {
      ikon: Info,
      ikonBg: "bg-sky-400",
      baslik: "BİLGİ",
      icerik:
        ayarlar.hijyen ||
        "Teslime hazır olan numaralar sağ sütunda gösterilir.",
    },
    {
      ikon: MessageCircle,
      ikonBg: "bg-green-500",
      baslik: "WHATSAPP İLETİŞİM",
      icerik: ayarlar.whatsappTel
        ? telefonFormatla(ayarlar.whatsappTel)
        : "0536 390 44 18",
      telefonGibi: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 xl:grid-cols-4">
      {kartlar.map((kart) => {
        const Icon = kart.ikon;
        return (
          <div
            key={kart.baslik}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-3 shadow-sm",
              koyuMu
                ? "border-slate-700 bg-slate-800"
                : "border-stone-200 bg-white",
            )}
          >
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                kart.ikonBg,
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "text-[11px] font-bold tracking-wider uppercase",
                  koyuMu ? "text-slate-300" : "text-stone-600",
                )}
              >
                {kart.baslik}
              </div>
              <div
                className={cn(
                  kart.telefonGibi
                    ? cn(
                        "font-mono text-lg leading-tight font-extrabold",
                        koyuMu ? "text-white" : "text-stone-900",
                      )
                    : cn(
                        "text-xs leading-snug",
                        koyuMu ? "text-slate-300" : "text-stone-600",
                      ),
                )}
              >
                {kart.icerik}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
