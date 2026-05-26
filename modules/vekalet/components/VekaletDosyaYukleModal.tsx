"use client";

/**
 * Vekalet PDF/JPG/PNG yükleme modalı.
 *
 * Mevcut `POST /api/vekaletler` endpoint'i (multipart) — yükleme sonrası
 * backend `vekaletAlindi=true` ve `vekaletTarihi=now()` ayarlıyor, ayrıca
 * tek bir `Vekalet` kaydı oluşturuyor (eskisi varsa siliyor).
 */

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileCheck, Loader2, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  hisseId: string;
  musteriAdi: string;
  mevcutDosyaUrl: string | null;
  onClose: () => void;
  onBasarili: () => void;
}

const MAX_BYTE = 5 * 1024 * 1024;
const KABUL_MIME = ["application/pdf", "image/jpeg", "image/png"];
const KABUL_ACCEPT = ".pdf,.jpg,.jpeg,.png";

export function VekaletDosyaYukleModal({
  hisseId,
  musteriAdi,
  mevcutDosyaUrl,
  onClose,
  onBasarili,
}: Props) {
  const [secilen, setSecilen] = useState<File | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function dosyaSec(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!KABUL_MIME.includes(f.type)) {
      toast.error("Sadece PDF, JPG veya PNG kabul edilir.");
      e.target.value = "";
      return;
    }
    if (f.size > MAX_BYTE) {
      toast.error("Dosya 5 MB'dan büyük olamaz.");
      e.target.value = "";
      return;
    }
    setSecilen(f);
  }

  async function yukle() {
    if (!secilen || yukleniyor) return;
    setYukleniyor(true);
    try {
      const form = new FormData();
      form.append("hisseId", hisseId);
      form.append("dosya", secilen);
      const yanit = await fetch("/api/vekaletler", {
        method: "POST",
        body: form,
      });
      const veri = (await yanit.json().catch(() => ({}))) as {
        basarili?: boolean;
        hata?: string;
      };
      if (!yanit.ok || !veri.basarili) {
        throw new Error(veri.hata ?? "Yükleme başarısız");
      }
      toast.success(`✓ ${musteriAdi} vekalet dosyası yüklendi`);
      onBasarili();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Yükleme hatası");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !yukleniyor && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          Vekalet Dosyası Yükle
        </DialogTitle>
        <DialogDescription>
          {musteriAdi} için PDF, JPG veya PNG (max 5 MB).
        </DialogDescription>

        {mevcutDosyaUrl && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-emerald-800">
              <FileCheck className="h-4 w-4" />
              Yüklü vekalet dosyası var
            </div>
            <a
              href={mevcutDosyaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-emerald-700 underline"
            >
              Mevcut dosyayı görüntüle
            </a>
            <p className="mt-2 text-xs text-emerald-700">
              Yeni dosya yüklerseniz eskisi arşive alınır.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={KABUL_ACCEPT}
            onChange={dosyaSec}
            disabled={yukleniyor}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700 disabled:opacity-50"
          />
          {secilen && (
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-xs">
              <span className="truncate font-medium">{secilen.name}</span>
              <span className="ml-2 shrink-0 text-muted-foreground">
                {(secilen.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={yukleniyor}
          >
            <X className="mr-1 h-4 w-4" />
            İptal
          </Button>
          <Button
            onClick={yukle}
            disabled={!secilen || yukleniyor}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {yukleniyor ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                <Upload className="mr-1 h-4 w-4" />
                Yükle
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
