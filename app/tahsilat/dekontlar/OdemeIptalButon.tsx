"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  odemeId: string;
  dekontNo: string;
}

export function OdemeIptalButon({ odemeId, dekontNo }: Props) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [sebep, setSebep] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  async function gonder() {
    if (sebep.trim().length < 2) {
      toast.error("İptal sebebi en az 2 karakter olmalı");
      return;
    }
    setYukleniyor(true);
    try {
      const yanit = await fetch(`/api/tahsilat/iptal/${odemeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sebep: sebep.trim() }),
      });
      const veri = await yanit.json();
      if (!yanit.ok) {
        toast.error(veri.hata ?? "İptal başarısız");
        return;
      }
      toast.success(`${dekontNo} iptal edildi`);
      setAcik(false);
      router.refresh();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <Dialog open={acik} onOpenChange={setAcik}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setAcik(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 px-2"
      >
        <Ban size={12} className="mr-1" />
        İptal
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tahsilat İptali</DialogTitle>
          <DialogDescription>
            <span className="font-mono">{dekontNo}</span> dekontu iptal
            edilecek. Kasa hareketi otomatik ters çevrilir. Bu işlem geri
            alınamaz.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="sebep" className="text-sm font-medium">
            İptal sebebi
          </label>
          <Textarea
            id="sebep"
            value={sebep}
            onChange={(e) => setSebep(e.target.value)}
            placeholder="Örn: Yanlış müşteriye girilmiş tahsilat"
            rows={3}
            maxLength={500}
            disabled={yukleniyor}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setAcik(false)}
            disabled={yukleniyor}
          >
            Vazgeç
          </Button>
          <Button
            variant="destructive"
            onClick={gonder}
            disabled={yukleniyor || sebep.trim().length < 2}
          >
            {yukleniyor ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                İptal ediliyor...
              </>
            ) : (
              "İptal Et"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
