"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { cozumle, ORNEK_MUSTERI } from "@/modules/whatsapp/lib/sablon-degisken-cozucu";

interface SablonOnizlemeProps {
  icerik: string;
  sirketAdi: string;
  sirketTel: string;
}

/**
 * Canlı önizleme — örnek müşteri (Mehmet Yılmaz) ile değişkenleri çözüp gösterir.
 * Telefon mockup tarzı yeşil baloncuk.
 */
export function SablonOnizleme({
  icerik,
  sirketAdi,
  sirketTel,
}: SablonOnizlemeProps) {
  const cozulmus = cozumle(icerik, ORNEK_MUSTERI, { sirketAdi, sirketTel });

  return (
    <div className="flex flex-col gap-2">
      <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
        <MessageCircle size={12} className="text-emerald-600" />
        Önizleme · {ORNEK_MUSTERI.adSoyad}
      </div>
      <div className="bg-stone-100 rounded-xl p-3">
        <div
          className={cn(
            "ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-emerald-100 px-3 py-2 shadow-sm",
            "text-sm leading-relaxed whitespace-pre-wrap text-stone-900",
          )}
        >
          {cozulmus || (
            <span className="text-muted-foreground italic">
              Mesaj içeriği boş
            </span>
          )}
          <div className="text-muted-foreground mt-1 text-right text-[10px]">
            14:32 ✓✓
          </div>
        </div>
      </div>
    </div>
  );
}
