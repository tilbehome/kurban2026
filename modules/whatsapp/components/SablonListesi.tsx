"use client";

import { Plus, MessageCircle, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  KATEGORI_ETIKETLERI,
  type SablonKisa,
} from "@/modules/whatsapp/types";

interface SablonListesiProps {
  sablonlar: SablonKisa[];
  seciliId: string | null;
  yeniMi: boolean;
  onSec: (s: SablonKisa) => void;
  onYeni: () => void;
  yeniEklenebilir: boolean;
}

export function SablonListesi({
  sablonlar,
  seciliId,
  yeniMi,
  onSec,
  onYeni,
  yeniEklenebilir,
}: SablonListesiProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-1.5 text-base">
          <MessageCircle size={15} className="text-emerald-600" />
          Şablonlar ({sablonlar.length})
        </CardTitle>
        {yeniEklenebilir && (
          <Button type="button" size="sm" onClick={onYeni}>
            <Plus size={13} />
            Yeni
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-2">
        {yeniMi && (
          <div className="mb-2 rounded-md border-2 border-dashed border-orange-300 bg-orange-50 p-2.5 text-center text-xs font-semibold text-orange-800">
            ➕ Yeni Şablon Düzenleniyor
          </div>
        )}
        <div className="flex flex-col gap-1">
          {sablonlar.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-xs">
              Henüz şablon yok
            </p>
          ) : (
            sablonlar.map((s) => {
              const kat = KATEGORI_ETIKETLERI[s.kategori];
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSec(s)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-md border p-2.5 text-left transition-colors",
                    s.id === seciliId && !yeniMi
                      ? "border-orange-500 bg-orange-50 ring-1 ring-orange-300"
                      : "border-stone-200 hover:bg-stone-50",
                  )}
                >
                  <div className="flex w-full items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1",
                        kat.renk,
                      )}
                    >
                      {kat.emoji} {kat.ad}
                    </span>
                    {s.varsayilan && (
                      <Lock
                        size={9}
                        className="text-muted-foreground"
                      />
                    )}
                    {!s.aktifMi && (
                      <span className="text-[9px] font-semibold text-stone-400">
                        PASİF
                      </span>
                    )}
                  </div>
                  <span className="truncate text-xs font-semibold">
                    {s.ad}
                  </span>
                  <span className="text-muted-foreground line-clamp-1 text-[11px]">
                    {s.icerik.slice(0, 60)}...
                  </span>
                </button>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
