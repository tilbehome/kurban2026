"use client";

import { useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Construction } from "lucide-react";

interface IadeModalProps {
  musteriId: string;
  acik: boolean;
  onClose: () => void;
}

/**
 * İade modalı — Faz 4 placeholder.
 *
 * Tam iade akışı (gerçek para iadesi + Odeme.iptal + KasaHareketi negatif kayıt)
 * Faz 5'te geliştirilecek. Şimdilik bilgi notu olarak çalışır.
 */
export function IadeModal({ musteriId: _musteriId, acik, onClose }: IadeModalProps) {
  const [not, setNot] = useState("");
  const [bekleniyor, _startTransition] = useTransition();

  return (
    <Dialog open={acik} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>İade İşlemi</DialogTitle>
          <DialogDescription>
            Tam iade akışı (Odeme.iptal + KasaHareketi negatif kayıt + audit) Faz 5'te
            geliştirilecek. Şimdilik dekontlar listesinden tek tek iptal yapabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3">
          <Construction className="mt-0.5 text-amber-600" size={18} />
          <div className="text-sm text-amber-900">
            <p className="font-medium">Yakında</p>
            <p>
              Bu sürümde iade için: <em>Tahsilatlar</em> tab'ında ilgili dekontu bul,
              <strong> İptal Et</strong> butonuyla iptal yap, kasaya manuel gider gir.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Not (opsiyonel, kayıt için)</label>
          <Textarea
            rows={2}
            value={not}
            onChange={(e) => setNot(e.target.value)}
            placeholder="İade ile ilgili açıklama..."
            disabled={bekleniyor}
          />
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" type="button">
                Kapat
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
