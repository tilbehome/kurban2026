"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  hisseId: string;
  hisseNo: number;
  kurbanKesimSirasi: number;
  musteriAdi: string;
}

export function HissedarCikarDialog({
  hisseId,
  hisseNo,
  kurbanKesimSirasi,
  musteriAdi,
}: Props) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function cikar() {
    setYukleniyor(true);
    try {
      const yanit = await fetch(`/api/hisseler/${hisseId}/atama`, {
        method: "DELETE",
      });
      const veri = await yanit.json();
      if (!yanit.ok) {
        toast.error(veri.hata ?? "İşlem başarısız");
        return;
      }
      toast.success(`${musteriAdi} hisseden çıkarıldı`);
      setAcik(false);
      router.refresh();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setAcik(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7"
        title="Hissedarı çıkar"
      >
        <UserMinus size={14} />
      </Button>

      <Dialog open={acik} onOpenChange={setAcik}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hissedarı Çıkar</DialogTitle>
            <DialogDescription>
              <strong>{musteriAdi}</strong> kişisi Kurban #{kurbanKesimSirasi} /
              Hisse {hisseNo}'den çıkarılacak. Bu hisseye bağlı ödeme varsa
              önce iptal edilmesi gerekir.
            </DialogDescription>
          </DialogHeader>
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
              onClick={cikar}
              disabled={yukleniyor}
            >
              {yukleniyor ? (
                <>
                  <Loader2 className="mr-1 size-4 animate-spin" />
                  Çıkarılıyor...
                </>
              ) : (
                "Hissedarı Çıkar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
