"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface MusteriSilModalProps {
  musteriId: string;
  musteriAdSoyad: string;
  acik: boolean;
  onClose: () => void;
}

/**
 * Müşteri soft delete modalı.
 * Müşteri adını yazarak onay gerektirir (kazara silinmesin).
 */
export function MusteriSilModal({
  musteriId,
  musteriAdSoyad,
  acik,
  onClose,
}: MusteriSilModalProps) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();
  const [onayMetin, setOnayMetin] = useState("");

  function sil() {
    if (onayMetin.trim() !== musteriAdSoyad) {
      toast.error("Müşteri adını doğru yazın");
      return;
    }
    startTransition(async () => {
      try {
        const yanit = await fetch(`/api/musteriler/${musteriId}`, {
          method: "DELETE",
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Silme başarısız");
        }
        toast.success(`${musteriAdSoyad} silindi`);
        router.push("/musteriler");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  return (
    <Dialog open={acik} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={18} />
            Müşteri Sil
          </DialogTitle>
          <DialogDescription>
            <strong>{musteriAdSoyad}</strong> silinecek. Soft delete — kayıt veritabanında
            kalır ama listede görünmez. Tahsilat ve hisse kayıtları korunur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="onay">
            Onaylamak için müşteri adını yazın: <strong>{musteriAdSoyad}</strong>
          </Label>
          <Input
            id="onay"
            value={onayMetin}
            onChange={(e) => setOnayMetin(e.target.value)}
            placeholder={musteriAdSoyad}
            disabled={bekleniyor}
          />
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" type="button">
                Vazgeç
              </Button>
            }
          />
          <Button
            type="button"
            variant="outline"
            className="bg-red-50 text-red-700 hover:bg-red-100"
            onClick={sil}
            disabled={bekleniyor || onayMetin.trim() !== musteriAdSoyad}
          >
            {bekleniyor ? "Siliniyor..." : "Müşteriyi Sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
