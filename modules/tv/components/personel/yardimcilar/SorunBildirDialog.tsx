"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
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
import type { PersonelKurbanVeri } from "@/app/tv/personel/page";

interface Props {
  kurban: PersonelKurbanVeri;
  kapat: () => void;
}

export function SorunBildirDialog({ kurban, kapat }: Props) {
  const [sorun, setSorun] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  async function gonder() {
    if (sorun.trim().length < 3) {
      toast.error("En az 3 karakter girin");
      return;
    }
    setYukleniyor(true);
    try {
      const yanit = await fetch("/api/tv/sorun-bildir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kurbanId: kurban.id,
          sorun: sorun.trim(),
        }),
      });
      if (!yanit.ok) {
        toast.error("Bildirim başarısız");
        return;
      }
      toast.warning(`DANA-${kurban.kesimSirasi}: Sorun yöneticiye iletildi`);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      kapat();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && kapat()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle size={18} />
            Sorun Bildir — DANA-{kurban.kesimSirasi}
          </DialogTitle>
          <DialogDescription>
            Sorununuz kurban notlarına eklenecek ve yöneticiye iletilecek.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          value={sorun}
          onChange={(e) => setSorun(e.target.value)}
          placeholder="Örn: Hayvan stresli, ek bekleme gerekiyor..."
          rows={4}
          maxLength={500}
          disabled={yukleniyor}
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={kapat}
            disabled={yukleniyor}
          >
            Vazgeç
          </Button>
          <Button
            onClick={gonder}
            disabled={yukleniyor || sorun.trim().length < 3}
            variant="default"
            className="bg-amber-600 hover:bg-amber-700"
          >
            {yukleniyor ? (
              <>
                <Loader2 size={14} className="mr-1 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              "Sorunu Bildir"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
