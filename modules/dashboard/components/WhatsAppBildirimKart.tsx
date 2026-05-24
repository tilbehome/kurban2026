"use client";

import Link from "next/link";
import {
  MessageCircle,
  Send,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";
import type { WhatsAppMetrik } from "@/modules/dashboard/types";

interface WhatsAppBildirimKartProps {
  metrik: WhatsAppMetrik;
}

interface MiniMetrik {
  id: string;
  baslik: string;
  sayi: number;
  ikon: React.ReactNode;
  renk: string;
}

export function WhatsAppBildirimKart({ metrik }: WhatsAppBildirimKartProps) {
  const metrikler: MiniMetrik[] = [
    {
      id: "yeni",
      baslik: "Yeni Mesaj",
      sayi: metrik.yeniMesaj,
      ikon: <MessageCircle size={14} />,
      renk: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    {
      id: "kuyruk",
      baslik: "Kuyruk",
      sayi: metrik.kuyruk,
      ikon: <Send size={14} />,
      renk: "bg-blue-50 text-blue-700 ring-blue-200",
    },
    {
      id: "basarili",
      baslik: "Başarılı",
      sayi: metrik.basarili,
      ikon: <CheckCircle2 size={14} />,
      renk: "bg-purple-50 text-purple-700 ring-purple-200",
    },
    {
      id: "hata",
      baslik: "Hata",
      sayi: metrik.hata,
      ikon: <AlertTriangle size={14} />,
      renk: "bg-red-50 text-red-700 ring-red-200",
    },
  ];

  const hicVeriYok =
    metrik.yeniMesaj === 0 &&
    metrik.kuyruk === 0 &&
    metrik.basarili === 0 &&
    metrik.hata === 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <MessageCircle size={14} />
          </span>
          <CardTitle className="text-base">WhatsApp Merkezi</CardTitle>
        </div>
        <span className="bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-amber-200">
          DEMO
        </span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          {metrikler.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex flex-col gap-1 rounded-lg p-2.5 ring-1",
                m.renk,
              )}
            >
              <div className="flex items-center gap-1.5">
                {m.ikon}
                <span className="text-[10px] font-semibold tracking-wide uppercase">
                  {m.baslik}
                </span>
              </div>
              <span className="font-tabular text-xl font-bold">{m.sayi}</span>
            </div>
          ))}
        </div>

        {hicVeriYok && (
          <p className="text-muted-foreground text-center text-[11px]">
            WhatsApp entegrasyonu Faz 2&apos;de aktif olacak
          </p>
        )}

        <Link
          href="/whatsapp"
          className="bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground mt-auto flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors"
        >
          Mesaj Merkezine Git
          <ChevronRight size={12} />
        </Link>
      </CardContent>
    </Card>
  );
}
