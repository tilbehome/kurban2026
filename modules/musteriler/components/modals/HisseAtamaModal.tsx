"use client";

import { useState, useEffect, useTransition } from "react";
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
import { formatPara, parsePara } from "@/shared/lib/para";
import { Beef, ExternalLink } from "lucide-react";
import Link from "next/link";

interface BosKurbanOzeti {
  id: string;
  kesimSirasi: number;
  bosHisseIds: string[]; // boş hisse cuid'leri
  bosHisseNumaralari: number[]; // 1-7 arası
  hisseFiyati: number; // varsayılan
}

interface HisseAtamaModalProps {
  musteriId: string;
  musteriAdSoyad: string;
  acik: boolean;
  onClose: () => void;
}

export function HisseAtamaModal({
  musteriId,
  musteriAdSoyad,
  acik,
  onClose,
}: HisseAtamaModalProps) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [bosKurbanlar, setBosKurbanlar] = useState<BosKurbanOzeti[]>([]);
  const [secilenKurbanId, setSecilenKurbanId] = useState<string | null>(null);
  const [secilenHisseler, setSecilenHisseler] = useState<string[]>([]);
  const [hisseFiyati, setHisseFiyati] = useState("");

  useEffect(() => {
    if (!acik) return;
    setYukleniyor(true);
    setSecilenKurbanId(null);
    setSecilenHisseler([]);
    fetch("/api/hisseler/bos-kurbanlar")
      .then((r) => r.json())
      .then((d: { basarili: boolean; veri?: BosKurbanOzeti[] }) => {
        if (d.basarili && d.veri) setBosKurbanlar(d.veri);
      })
      .finally(() => setYukleniyor(false));
  }, [acik]);

  const secilenKurban = bosKurbanlar.find((k) => k.id === secilenKurbanId);

  useEffect(() => {
    if (secilenKurban && !hisseFiyati) {
      setHisseFiyati(String(secilenKurban.hisseFiyati));
    }
  }, [secilenKurban, hisseFiyati]);

  function hisseToggle(hisseId: string) {
    setSecilenHisseler((eski) =>
      eski.includes(hisseId)
        ? eski.filter((id) => id !== hisseId)
        : [...eski, hisseId],
    );
  }

  function atamayiYap() {
    if (!secilenKurban) return;
    if (secilenHisseler.length === 0) {
      toast.error("En az 1 hisse seçin");
      return;
    }
    const fiyat = parsePara(hisseFiyati);
    if (fiyat <= 0) {
      toast.error("Hisse fiyatı 0'dan büyük olmalı");
      return;
    }

    startTransition(async () => {
      try {
        const yanit = await fetch("/api/hisseler/ata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hisseIds: secilenHisseler,
            musteriId,
            hisseFiyati: fiyat,
          }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Atama başarısız");
        }
        toast.success(
          `${secilenHisseler.length} hisse ${musteriAdSoyad} üzerine atandı`,
        );
        onClose();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  const toplam =
    parsePara(hisseFiyati) * secilenHisseler.length || 0;

  return (
    <Dialog open={acik} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Hisse Ata — {musteriAdSoyad}</DialogTitle>
          <DialogDescription>
            Önce kurban seç, sonra hisseleri seç, fiyatı gir ve onayla.
          </DialogDescription>
        </DialogHeader>

        {yukleniyor ? (
          <p className="text-muted-foreground py-4 text-center">Yükleniyor...</p>
        ) : bosKurbanlar.length === 0 ? (
          <div className="space-y-3 py-4 text-center">
            <p className="text-muted-foreground">Boş hisseli kurban yok.</p>
            <Link
              href="/hayvanlar/hisse-atama"
              className="text-primary text-sm underline"
              target="_blank"
            >
              <ExternalLink size={12} className="inline" /> Tam hisse atama paneline git
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Kurban grid */}
            <div>
              <Label className="mb-1.5 block text-xs">Kurban seç:</Label>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                {bosKurbanlar.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => {
                      setSecilenKurbanId(k.id);
                      setSecilenHisseler([]);
                      setHisseFiyati(String(k.hisseFiyati));
                    }}
                    className={`flex flex-col items-center rounded-md border p-2 text-xs transition-colors ${
                      secilenKurbanId === k.id
                        ? "border-primary bg-primary/10"
                        : "hover:border-primary/40"
                    }`}
                  >
                    <Beef size={14} />
                    <span className="font-mono font-bold">#{k.kesimSirasi}</span>
                    <span className="text-muted-foreground">
                      {k.bosHisseIds.length} boş
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hisse seçim */}
            {secilenKurban && (
              <>
                <div>
                  <Label className="mb-1.5 block text-xs">
                    Hisseleri seç ({secilenHisseler.length}/{secilenKurban.bosHisseIds.length}):
                  </Label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {secilenKurban.bosHisseIds.map((id, i) => {
                      const no = secilenKurban.bosHisseNumaralari[i]!;
                      const aktif = secilenHisseler.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => hisseToggle(id)}
                          className={`flex h-10 items-center justify-center rounded-md font-mono text-sm font-semibold transition-colors ${
                            aktif
                              ? "bg-primary text-primary-foreground"
                              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          }`}
                        >
                          {no}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label htmlFor="fiyat" className="text-xs">
                    Hisse fiyatı (her biri için):
                  </Label>
                  <Input
                    id="fiyat"
                    inputMode="decimal"
                    value={hisseFiyati}
                    onChange={(e) => setHisseFiyati(e.target.value)}
                    className="font-tabular mt-1 text-right"
                  />
                </div>

                <div className="rounded-md border bg-amber-50 p-2 text-sm">
                  <div className="flex justify-between">
                    <span>Toplam Bedel:</span>
                    <span className="font-tabular font-semibold">
                      {formatPara(toplam)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

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
            onClick={atamayiYap}
            disabled={
              bekleniyor ||
              !secilenKurban ||
              secilenHisseler.length === 0 ||
              parsePara(hisseFiyati) <= 0
            }
          >
            {bekleniyor ? "Atanıyor..." : "Atamayı Onayla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
