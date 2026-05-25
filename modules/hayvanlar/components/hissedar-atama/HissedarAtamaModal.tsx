"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MusteriArama } from "./MusteriArama";
import { MusteriSonucListesi } from "./MusteriSonucListesi";
import { HizliMusteriEkleForm } from "./HizliMusteriEkleForm";

export interface AramaMusteri {
  id: string;
  adSoyad: string;
  telefon: string | null;
  hisseSayisi: number;
  kalan: number;
}

interface Props {
  hisseId: string;
  hisseNo: number;
  kurbanKesimSirasi: number;
}

type Adim = "ara" | "hizli-ekle";

export function HissedarAtamaModal({
  hisseId,
  hisseNo,
  kurbanKesimSirasi,
}: Props) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [adim, setAdim] = useState<Adim>("ara");
  const [sorgu, setSorgu] = useState("");
  const [sonuclar, setSonuclar] = useState<AramaMusteri[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [atamaYukleniyor, setAtamaYukleniyor] = useState<string | null>(null);

  async function aramaYap(q: string) {
    setSorgu(q);
    if (q.trim().length < 2) {
      setSonuclar([]);
      return;
    }
    setYukleniyor(true);
    try {
      const yanit = await fetch(
        `/api/musteriler/ara?q=${encodeURIComponent(q.trim())}&limit=10`,
      );
      if (!yanit.ok) {
        setSonuclar([]);
        return;
      }
      const veri = (await yanit.json()) as { sonuclar: AramaMusteri[] };
      setSonuclar(veri.sonuclar ?? []);
    } catch {
      setSonuclar([]);
    } finally {
      setYukleniyor(false);
    }
  }

  async function musteriyiAta(musteriId: string) {
    setAtamaYukleniyor(musteriId);
    try {
      const yanit = await fetch(`/api/hisseler/${hisseId}/atama`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musteriId }),
      });
      const veri = await yanit.json();
      if (!yanit.ok) {
        toast.error(veri.hata ?? "Atama başarısız");
        return;
      }
      toast.success("Müşteri hisseye atandı");
      setAcik(false);
      sifirla();
      router.refresh();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setAtamaYukleniyor(null);
    }
  }

  async function hizliEkleAta(yeni: { adSoyad: string; telefon: string; tcKimlik: string }) {
    try {
      const yanit = await fetch("/api/musteriler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(yeni),
      });
      const veri = await yanit.json();
      if (!yanit.ok || !veri.basarili) {
        toast.error(veri.hata ?? "Müşteri eklenemedi");
        return;
      }
      await musteriyiAta(veri.id);
    } catch {
      toast.error("Bağlantı hatası");
    }
  }

  function sifirla() {
    setAdim("ara");
    setSorgu("");
    setSonuclar([]);
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setAcik(true)}
        className="h-8"
      >
        <UserPlus size={14} className="mr-1" />
        Hissedar Ekle
      </Button>

      <Dialog
        open={acik}
        onOpenChange={(v) => {
          setAcik(v);
          if (!v) sifirla();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Hissedar Ekle — Kurban #{kurbanKesimSirasi} / Hisse {hisseNo}
            </DialogTitle>
            <DialogDescription>
              {adim === "ara"
                ? "Mevcut müşteriyi arayın, bulamazsanız hızlı kayıt yapın."
                : "Yeni müşteri bilgilerini girin. Kayıt sonrası otomatik atanır."}
            </DialogDescription>
          </DialogHeader>

          {adim === "ara" && (
            <div className="space-y-4">
              <MusteriArama
                deger={sorgu}
                degisti={aramaYap}
                yukleniyor={yukleniyor}
              />

              <MusteriSonucListesi
                sorgu={sorgu}
                sonuclar={sonuclar}
                yukleniyor={yukleniyor}
                atananId={atamaYukleniyor}
                seciliEt={musteriyiAta}
                hizliEkleyeGec={() => setAdim("hizli-ekle")}
              />
            </div>
          )}

          {adim === "hizli-ekle" && (
            <HizliMusteriEkleForm
              baslangicAd={sorgu}
              kaydetVeAta={hizliEkleAta}
              vazgec={() => setAdim("ara")}
            />
          )}

          {atamaYukleniyor && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
              <Loader2 size={14} className="animate-spin" />
              Atama yapılıyor...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
