"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  KATEGORI_ETIKETLERI,
  type SablonKisa,
} from "@/modules/whatsapp/types";

interface SablonSecAdimiProps {
  sablonlar: SablonKisa[];
  seciliId: string | null;
  onSec: (id: string) => void;
  onIleri: () => void;
  onIptal: () => void;
}

export function SablonSecAdimi({
  sablonlar,
  seciliId,
  onSec,
  onIleri,
  onIptal,
}: SablonSecAdimiProps) {
  const secili = sablonlar.find((s) => s.id === seciliId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Şablon Seç</h2>
        <p className="text-muted-foreground text-sm">
          Hangi mesajı göndereceksiniz?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {sablonlar
          .filter((s) => s.aktifMi)
          .map((s) => {
            const kat = KATEGORI_ETIKETLERI[s.kategori];
            const seciliMi = s.id === seciliId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSec(s.id)}
                className={cn(
                  "group flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all",
                  seciliMi
                    ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                    : "border-stone-200 hover:border-stone-400",
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                      kat.renk,
                    )}
                  >
                    {kat.emoji} {kat.ad}
                  </span>
                  {seciliMi && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold">{s.ad}</span>
                <span className="text-muted-foreground line-clamp-2 text-[11px]">
                  {s.icerik}
                </span>
              </button>
            );
          })}
      </div>

      {secili && (
        <div className="bg-emerald-50 ring-emerald-200 mt-2 rounded-lg p-3 ring-1">
          <div className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase">
            Tam Önizleme
          </div>
          <pre className="font-mono text-xs whitespace-pre-wrap text-stone-800">
            {secili.icerik}
          </pre>
        </div>
      )}

      <div className="mt-4 flex justify-between border-t pt-4">
        <Button type="button" variant="outline" onClick={onIptal}>
          İptal
        </Button>
        <Button type="button" onClick={onIleri} disabled={!seciliId}>
          İleri →
        </Button>
      </div>
    </div>
  );
}
