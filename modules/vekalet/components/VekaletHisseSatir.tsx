"use client";

/**
 * Tek hisse satırı — checkbox + kimlik + sağa-kaydır + dosya butonu.
 *
 * Toggle davranışı: zaten onaylıysa slider iptal eder.
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Calendar, FileCheck, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KaydirOnayla } from "./KaydirOnayla";
import { VekaletDosyaYukleModal } from "./VekaletDosyaYukleModal";
import { formatTarih } from "@/shared/lib/tarih";
import type { VekaletHisseVeri } from "@/app/hayvanlar/vekalet/page";

interface Props {
  hisse: VekaletHisseVeri;
  secili: boolean;
  onSec: (id: string, secili: boolean) => void;
  onGuncellendi: () => void;
}

export function VekaletHisseSatir({
  hisse,
  secili,
  onSec,
  onGuncellendi,
}: Props) {
  const [yukleniyor, startTransition] = useTransition();
  const [dosyaModal, setDosyaModal] = useState(false);

  function toggleVekalet() {
    const yeni = !hisse.vekaletAlindi;
    startTransition(async () => {
      try {
        const yanit = await fetch(`/api/hisseler/${hisse.id}/vekalet`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vekaletAlindi: yeni }),
        });
        const veri = (await yanit.json().catch(() => ({}))) as {
          basarili?: boolean;
          hata?: string;
        };
        if (!yanit.ok || !veri.basarili) {
          throw new Error(veri.hata ?? "Vekalet güncellenemedi");
        }
        toast.success(
          yeni
            ? `✓ ${hisse.musteri.adSoyad} vekaleti alındı`
            : `${hisse.musteri.adSoyad} vekaleti iptal edildi`,
        );
        onGuncellendi();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Bağlantı hatası");
      }
    });
  }

  return (
    <div className="border-b last:border-b-0 px-3 py-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={secili}
          onChange={(e) => onSec(hisse.id, e.target.checked)}
          aria-label={`${hisse.musteri.adSoyad} seç`}
          className="mt-1 size-4 cursor-pointer accent-blue-600"
        />

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono text-xs">
                  {hisse.kurban.kesimSirasi}.{hisse.no}
                </span>
                <span className="truncate text-sm font-medium">
                  {hisse.musteri.adSoyad}
                </span>
              </div>
              <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                {hisse.musteri.telefon ? (
                  <a
                    href={`tel:${hisse.musteri.telefon}`}
                    className="hover:underline"
                  >
                    {hisse.musteri.telefon}
                  </a>
                ) : (
                  <span className="italic">telefon yok</span>
                )}
                {hisse.vekaletAlindi && hisse.vekaletTarihi && (
                  <span className="flex items-center gap-1 text-emerald-700">
                    <Calendar className="h-3 w-3" />
                    {formatTarih(new Date(hisse.vekaletTarihi))}
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDosyaModal(true)}
              className="h-8 shrink-0"
              title={
                hisse.vekaletDosyaUrl
                  ? "Vekalet dosyası yüklü — değiştir"
                  : "PDF/Foto yükle"
              }
              aria-label="Dosya yükle"
            >
              {hisse.vekaletDosyaUrl ? (
                <FileCheck className="h-4 w-4 text-emerald-600" />
              ) : (
                <Paperclip className="text-muted-foreground h-4 w-4" />
              )}
            </Button>
          </div>

          <KaydirOnayla
            metin={
              hisse.vekaletAlindi ? "VEKALETİ İPTAL ET" : "VEKALETİ ONAYLA"
            }
            onayli={hisse.vekaletAlindi}
            yukleniyor={yukleniyor}
            onTamamlandi={toggleVekalet}
          />
        </div>
      </div>

      {dosyaModal && (
        <VekaletDosyaYukleModal
          hisseId={hisse.id}
          musteriAdi={hisse.musteri.adSoyad}
          mevcutDosyaUrl={hisse.vekaletDosyaUrl}
          onClose={() => setDosyaModal(false)}
          onBasarili={() => {
            setDosyaModal(false);
            onGuncellendi();
          }}
        />
      )}
    </div>
  );
}
