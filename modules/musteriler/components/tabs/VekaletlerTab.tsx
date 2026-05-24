"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatTarihSaat } from "@/shared/lib/tarih";
import {
  FileCheck,
  AlertTriangle,
  Upload,
  ExternalLink,
  Trash2,
  Beef,
} from "lucide-react";

interface VekaletSatir {
  hisseId: string;
  kurbanKesimSirasi: number;
  hisseNo: number;
  vekalet: {
    id: string;
    dosyaUrl: string;
    dosyaTipi: string; // pdf|jpg|png
    dosyaBoyutu: number;
    yukleyenAdSoyad: string;
    createdAt: Date;
  } | null;
}

interface VekaletlerTabProps {
  musteriId: string;
  satirlar: VekaletSatir[];
  izinler: {
    yaz: boolean;
  };
}

export function VekaletlerTab({
  musteriId: _musteriId,
  satirlar,
  izinler,
}: VekaletlerTabProps) {
  const tamamlanan = satirlar.filter((s) => s.vekalet !== null).length;
  const bekleyen = satirlar.length - tamamlanan;

  return (
    <div className="space-y-4">
      {/* Üst durum */}
      <div className="grid grid-cols-3 gap-3">
        <KpiBox ad="Toplam Hisse" deger={String(satirlar.length)} />
        <KpiBox
          ad="Vekalet Tamamlanan"
          deger={String(tamamlanan)}
          renk="text-green-600"
        />
        <KpiBox
          ad="Bekleyen"
          deger={String(bekleyen)}
          renk={bekleyen > 0 ? "text-amber-600" : "text-green-600"}
        />
      </div>

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck size={16} />
            Vekalet Belgeleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          {satirlar.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Müşterinin hissesi yok.
            </p>
          ) : (
            <div className="space-y-2">
              {satirlar.map((s) => (
                <VekaletSatir
                  key={s.hisseId}
                  satir={s}
                  izinYaz={izinler.yaz}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VekaletSatir({
  satir,
  izinYaz,
}: {
  satir: VekaletSatir;
  izinYaz: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3">
      <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-md font-mono text-sm font-semibold">
        <Beef size={14} className="mr-0.5" />
        {satir.kurbanKesimSirasi}.{satir.hisseNo}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-medium">
          Kurban #{satir.kurbanKesimSirasi} — {satir.hisseNo}. hisse
        </p>
        {satir.vekalet ? (
          <p className="text-muted-foreground text-xs">
            Yüklendi: {formatTarihSaat(satir.vekalet.createdAt)} ·{" "}
            {satir.vekalet.yukleyenAdSoyad} ·{" "}
            {(satir.vekalet.dosyaBoyutu / 1024).toFixed(0)} KB ·{" "}
            <span className="uppercase">{satir.vekalet.dosyaTipi}</span>
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">Belge yüklenmemiş</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {satir.vekalet ? (
          <>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              <FileCheck size={11} className="mr-1" />
              Alındı
            </Badge>
            <a
              href={satir.vekalet.dosyaUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              <ExternalLink size={12} className="mr-1" />
              Aç
            </a>
            {izinYaz && (
              <VekaletYukleDialog
                hisseId={satir.hisseId}
                etiket={`#${satir.kurbanKesimSirasi}.${satir.hisseNo}`}
                mod="degistir"
              />
            )}
            {izinYaz && (
              <VekaletSilDialog
                vekaletId={satir.vekalet.id}
                etiket={`#${satir.kurbanKesimSirasi}.${satir.hisseNo}`}
              />
            )}
          </>
        ) : (
          <>
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
              <AlertTriangle size={11} className="mr-1" />
              Bekliyor
            </Badge>
            {izinYaz && (
              <VekaletYukleDialog
                hisseId={satir.hisseId}
                etiket={`#${satir.kurbanKesimSirasi}.${satir.hisseNo}`}
                mod="ekle"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function VekaletYukleDialog({
  hisseId,
  etiket,
  mod,
}: {
  hisseId: string;
  etiket: string;
  mod: "ekle" | "degistir";
}) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [bekleniyor, startTransition] = useTransition();
  const [dosya, setDosya] = useState<File | null>(null);

  function dosyaSec(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 5 * 1024 * 1024) {
      toast.error("Dosya 5 MB'dan büyük olamaz");
      setDosya(null);
      return;
    }
    setDosya(f);
  }

  function yukle() {
    if (!dosya) {
      toast.error("Dosya seçin");
      return;
    }
    startTransition(async () => {
      try {
        const form = new FormData();
        form.append("hisseId", hisseId);
        form.append("dosya", dosya);
        const yanit = await fetch(`/api/vekaletler`, {
          method: "POST",
          body: form,
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Yükleme başarısız");
        }
        toast.success(`Vekalet yüklendi: ${etiket}`);
        setAcik(false);
        setDosya(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  return (
    <Dialog open={acik} onOpenChange={setAcik}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Upload size={12} className="mr-1" />
            {mod === "ekle" ? "Yükle" : "Değiştir"}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vekalet Belgesi — {etiket}</DialogTitle>
          <DialogDescription>
            PDF, JPG veya PNG yükleyebilirsiniz (max 5 MB).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="dosya">Belge</Label>
          <Input
            id="dosya"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={dosyaSec}
            disabled={bekleniyor}
          />
          {dosya && (
            <p className="text-muted-foreground text-xs">
              {dosya.name} · {(dosya.size / 1024).toFixed(0)} KB
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" type="button">
                Vazgeç
              </Button>
            }
          />
          <Button type="button" onClick={yukle} disabled={bekleniyor || !dosya}>
            {bekleniyor ? "Yükleniyor..." : "Yükle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VekaletSilDialog({
  vekaletId,
  etiket,
}: {
  vekaletId: string;
  etiket: string;
}) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [bekleniyor, startTransition] = useTransition();

  function sil() {
    startTransition(async () => {
      try {
        const yanit = await fetch(`/api/vekaletler/${vekaletId}`, {
          method: "DELETE",
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Silme başarısız");
        }
        toast.success(`Vekalet silindi: ${etiket}`);
        setAcik(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  return (
    <Dialog open={acik} onOpenChange={setAcik}>
      <DialogTrigger
        render={
          <Button size="sm" variant="ghost" className="text-destructive">
            <Trash2 size={12} />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vekalet Sil</DialogTitle>
          <DialogDescription>
            {etiket} için vekalet belgesi kalıcı olarak silinecek. Devam?
          </DialogDescription>
        </DialogHeader>
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
            disabled={bekleniyor}
          >
            {bekleniyor ? "Siliniyor..." : "Sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KpiBox({
  ad,
  deger,
  renk = "text-foreground",
}: {
  ad: string;
  deger: string;
  renk?: string;
}) {
  return (
    <div className="rounded-md border bg-white p-3">
      <p className="text-muted-foreground text-[11px]">{ad}</p>
      <p className={`font-tabular text-lg font-bold ${renk}`}>{deger}</p>
    </div>
  );
}
