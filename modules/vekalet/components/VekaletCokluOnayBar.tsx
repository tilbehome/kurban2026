"use client";

/**
 * Multi-select sticky alt bar — n hisse seçildiğinde alt bardan tek
 * kaydırmayla hepsi onaylanır. Client-side loop ile mevcut PATCH
 * endpoint'i sırayla çağrılır (her birinin ayrı audit log'u olur,
 * istenen davranış).
 */

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KaydirOnayla } from "./KaydirOnayla";

interface Props {
  secilenIdler: ReadonlyArray<string>;
  onTemizle: () => void;
  onTamamlandi: () => void;
}

export function VekaletCokluOnayBar({
  secilenIdler,
  onTemizle,
  onTamamlandi,
}: Props) {
  const [yukleniyor, setYukleniyor] = useState(false);

  if (secilenIdler.length === 0) return null;

  async function topluOnayla() {
    if (yukleniyor) return;
    setYukleniyor(true);
    let basarili = 0;
    const hatalar: string[] = [];
    try {
      // Sıralı çağrı: SQLite WAL tek-writer; paralelle çakışma riski
      // küçük ama gereksiz. Bayram günü güvenli olan basit yol.
      for (const id of secilenIdler) {
        try {
          const yanit = await fetch(`/api/hisseler/${id}/vekalet`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vekaletAlindi: true }),
          });
          const veri = (await yanit.json().catch(() => ({}))) as {
            basarili?: boolean;
            hata?: string;
          };
          if (!yanit.ok || !veri.basarili) {
            hatalar.push(veri.hata ?? "Bilinmeyen hata");
            continue;
          }
          basarili++;
        } catch {
          hatalar.push("Bağlantı hatası");
        }
      }
      if (basarili > 0) {
        toast.success(`✓ ${basarili} vekalet onaylandı`);
      }
      if (hatalar.length > 0) {
        toast.error(
          `${hatalar.length} kayıt başarısız — listeyi kontrol edin`,
        );
      }
      onTamamlandi();
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div
      className="bg-background fixed inset-x-0 bottom-0 z-50 border-t shadow-lg"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)",
      }}
    >
      <div className="mx-auto max-w-3xl space-y-2 px-4 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {secilenIdler.length} hisse seçildi
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onTemizle}
            disabled={yukleniyor}
          >
            <X className="mr-1 h-4 w-4" />
            Seçimi temizle
          </Button>
        </div>
        <KaydirOnayla
          metin={`${secilenIdler.length} HİSSEYİ ONAYLA`}
          yukleniyor={yukleniyor}
          onTamamlandi={topluOnayla}
        />
      </div>
    </div>
  );
}
