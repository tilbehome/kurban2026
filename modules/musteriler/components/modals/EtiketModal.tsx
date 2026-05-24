"use client";

import { useState, useTransition, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface EtiketModalProps {
  musteriId: string;
  mevcutEtiketler: string[];
  acik: boolean;
  onClose: () => void;
}

const ONERILEN = ["VIP", "Düzenli", "Yeni", "Sorunlu", "Eski Müşteri"];

export function EtiketModal({
  musteriId,
  mevcutEtiketler,
  acik,
  onClose,
}: EtiketModalProps) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();
  const [etiketler, setEtiketler] = useState<string[]>(mevcutEtiketler);
  const [yeniMetin, setYeniMetin] = useState("");

  useEffect(() => {
    if (acik) setEtiketler(mevcutEtiketler);
  }, [acik, mevcutEtiketler]);

  function etiketEkle(t: string) {
    const temiz = t.trim();
    if (!temiz) return;
    if (etiketler.includes(temiz)) {
      toast.info("Bu etiket zaten var");
      return;
    }
    setEtiketler([...etiketler, temiz]);
    setYeniMetin("");
  }

  function etiketSil(t: string) {
    setEtiketler(etiketler.filter((x) => x !== t));
  }

  function kaydet() {
    startTransition(async () => {
      try {
        const yanit = await fetch(`/api/musteriler/${musteriId}/etiketler`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ etiketler }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Kayıt başarısız");
        }
        toast.success("Etiketler güncellendi");
        onClose();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  return (
    <Dialog open={acik} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Etiket Yönetimi</DialogTitle>
          <DialogDescription>
            Müşteri için etiketler — VIP, Düzenli vb. Kaydedince güncellenir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Mevcut etiketler */}
          <div>
            <p className="text-muted-foreground mb-1.5 text-xs">Mevcut</p>
            {etiketler.length === 0 ? (
              <p className="text-muted-foreground text-sm">Etiket yok</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {etiketler.map((e) => (
                  <Badge
                    key={e}
                    className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                  >
                    {e}
                    <button
                      type="button"
                      onClick={() => etiketSil(e)}
                      className="ml-1 hover:opacity-70"
                    >
                      <X size={10} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Önerilen etiketler */}
          <div>
            <p className="text-muted-foreground mb-1.5 text-xs">Önerilen</p>
            <div className="flex flex-wrap gap-1.5">
              {ONERILEN.filter((e) => !etiketler.includes(e)).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => etiketEkle(e)}
                  className="hover:bg-muted rounded-md border border-dashed px-2 py-1 text-xs"
                >
                  <Plus size={10} className="mr-0.5 inline" />
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Yeni etiket */}
          <div>
            <p className="text-muted-foreground mb-1.5 text-xs">Yeni etiket</p>
            <div className="flex gap-2">
              <Input
                placeholder="Örn: Toptan"
                value={yeniMetin}
                onChange={(e) => setYeniMetin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    etiketEkle(yeniMetin);
                  }
                }}
                maxLength={20}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => etiketEkle(yeniMetin)}
              >
                Ekle
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" type="button">
                Vazgeç
              </Button>
            }
          />
          <Button type="button" onClick={kaydet} disabled={bekleniyor}>
            {bekleniyor ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
