"use client";

import Link from "next/link";
import {
  AlertCircle,
  ScrollText,
  PackageCheck,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";
import type { SidebarBildirimleri } from "@/shared/lib/sidebar-bildirim.service";

interface HatirlatmalarPaneliProps {
  bildirimler: SidebarBildirimleri | null;
}

interface Satir {
  id: string;
  baslik: string;
  altYazi: string;
  sayi: number;
  href: string;
  ikon: LucideIcon;
  renk: "kirmizi" | "sari" | "mavi" | "yesil";
}

const RENK_SINIFLARI: Record<
  Satir["renk"],
  { iconBg: string; rozet: string; ring: string }
> = {
  kirmizi: {
    iconBg: "bg-red-100 text-red-600",
    rozet: "bg-red-500 text-white",
    ring: "hover:bg-red-50/50",
  },
  sari: {
    iconBg: "bg-amber-100 text-amber-600",
    rozet: "bg-amber-500 text-white",
    ring: "hover:bg-amber-50/50",
  },
  mavi: {
    iconBg: "bg-blue-100 text-blue-600",
    rozet: "bg-blue-500 text-white",
    ring: "hover:bg-blue-50/50",
  },
  yesil: {
    iconBg: "bg-emerald-100 text-emerald-600",
    rozet: "bg-emerald-500 text-white",
    ring: "hover:bg-emerald-50/50",
  },
};

export function HatirlatmalarPaneli({ bildirimler }: HatirlatmalarPaneliProps) {
  const satirlar: Satir[] = [
    {
      id: "borclu",
      baslik: "Ödeme Bekleyen Müşteriler",
      altYazi: "Bayrama kadar tahsil edilmeli",
      sayi: bildirimler?.borclu ?? 0,
      href: "/musteriler/borclular",
      ikon: AlertCircle,
      renk: "kirmizi",
    },
    {
      id: "vekalet",
      baslik: "Eksik Vekalet Onayları",
      altYazi: "Hisse sahibinden belge alınmalı",
      sayi: bildirimler?.eksikVekalet ?? 0,
      href: "/hayvanlar/vekalet",
      ikon: ScrollText,
      renk: "sari",
    },
    {
      id: "bos-hisse",
      baslik: "Boş Hisseler",
      altYazi: "Müşteri atama bekleniyor",
      sayi: bildirimler?.bosHisse ?? 0,
      href: "/hayvanlar/bos-hisseler",
      ikon: PackageCheck,
      renk: "mavi",
    },
    {
      id: "whatsapp",
      baslik: "WhatsApp Mesaj Kuyruğu",
      altYazi: "Gönderilmeyi bekleyen mesajlar",
      sayi: bildirimler?.bekleyenMesaj ?? 0,
      href: "/whatsapp",
      ikon: MessageCircle,
      renk: "yesil",
    },
  ];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Hatırlatmalar</CardTitle>
        <Link
          href="/raporlar"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          Tümü →
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-1.5">
        {satirlar.map((s) => {
          const r = RENK_SINIFLARI[s.renk];
          const Ikon = s.ikon;
          return (
            <Link
              key={s.id}
              href={s.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg border border-transparent p-2.5 transition-colors",
                r.ring,
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  r.iconBg,
                )}
              >
                <Ikon size={16} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">
                  {s.baslik}
                </span>
                <span className="text-muted-foreground truncate text-[11px]">
                  {s.altYazi}
                </span>
              </div>
              <span
                className={cn(
                  "flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-2 text-xs font-bold",
                  s.sayi > 0 ? r.rozet : "bg-stone-100 text-stone-400",
                )}
              >
                {s.sayi > 99 ? "99+" : s.sayi}
              </span>
              <ChevronRight
                size={14}
                className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
