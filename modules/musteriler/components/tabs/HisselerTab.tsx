"use client";

import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPara } from "@/shared/lib/para";
import { formatTarih } from "@/shared/lib/tarih";
import {
  Beef,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRightLeft,
  Plus,
  FileCheck,
  AlertTriangle,
} from "lucide-react";

interface HisseSatir {
  id: string;
  kurbanKesimSirasi: number;
  kurbanKupeNo: string | null;
  hisseNo: number;
  hisseFiyati: number;
  odenen: number;
  kalan: number;
  durum: "tamamlandi" | "kismi" | "borclu" | "iptal";
  atanmaTarihi: Date;
  vekaletVar: boolean;
}

interface HisselerTabProps {
  musteriId: string;
  hisseler: HisseSatir[];
  ozet: {
    toplamHisse: number;
    toplamBedel: number;
    odenen: number;
    kalan: number;
  };
  izinler: {
    iptal: boolean;
    transfer: boolean;
    ata: boolean;
  };
  hisseAtamaAc: () => void;
}

export function HisselerTab({
  musteriId,
  hisseler,
  ozet,
  izinler,
  hisseAtamaAc,
}: HisselerTabProps) {
  return (
    <div className="space-y-4">
      {/* Üst KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiBox ad="Hisse" deger={String(ozet.toplamHisse)} />
        <KpiBox ad="Bedel" deger={formatPara(ozet.toplamBedel)} />
        <KpiBox
          ad="Ödenen"
          deger={formatPara(ozet.odenen)}
          renk="text-green-600"
        />
        <KpiBox
          ad="Kalan"
          deger={formatPara(ozet.kalan)}
          renk={ozet.kalan > 0 ? "text-amber-600" : "text-green-600"}
          vurgu
        />
      </div>

      {/* Hisse listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Beef size={16} />
              Atanan Hisseler ({hisseler.length})
            </span>
            {izinler.ata && (
              <Button size="sm" onClick={hisseAtamaAc}>
                <Plus size={14} className="mr-1" />
                Hisse Ata
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hisseler.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Bu müşteriye atanmış hisse yok.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {hisseler.map((h) => (
                <HisseKart
                  key={h.id}
                  hisse={h}
                  musteriId={musteriId}
                  izinler={izinler}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HisseKart({
  hisse,
  musteriId: _musteriId,
  izinler,
}: {
  hisse: HisseSatir;
  musteriId: string;
  izinler: HisselerTabProps["izinler"];
}) {
  return (
    <div className="hover:border-primary/40 rounded-lg border bg-white p-4 transition-colors">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <Link
            href={`/hayvanlar`}
            className="flex items-center gap-2 font-mono text-lg font-bold hover:underline"
          >
            <Beef size={16} />#{hisse.kurbanKesimSirasi}.{hisse.hisseNo}
          </Link>
          {hisse.kurbanKupeNo && (
            <p className="text-muted-foreground text-xs">
              Küpe: {hisse.kurbanKupeNo}
            </p>
          )}
        </div>
        <DurumRozet durum={hisse.durum} />
      </div>

      <div className="my-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground text-[11px]">Fiyat</p>
          <p className="font-tabular font-semibold">{formatPara(hisse.hisseFiyati)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[11px]">Ödenen</p>
          <p className="font-tabular text-green-600">{formatPara(hisse.odenen)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[11px]">Kalan</p>
          <p
            className={`font-tabular font-semibold ${
              hisse.kalan > 0 ? "text-amber-600" : "text-green-600"
            }`}
          >
            {formatPara(hisse.kalan)}
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs">
        {hisse.vekaletVar ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <FileCheck size={11} className="mr-1" />
            Vekalet ✓
          </Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <AlertTriangle size={11} className="mr-1" />
            Vekalet yok
          </Badge>
        )}
        <span className="text-muted-foreground">
          Atandı: {formatTarih(hisse.atanmaTarihi)}
        </span>
      </div>

      <div className="flex gap-1.5">
        {izinler.iptal && hisse.durum !== "iptal" && (
          <HisseIptalDialog hisseId={hisse.id} etiket={`#${hisse.kurbanKesimSirasi}.${hisse.hisseNo}`} />
        )}
        {izinler.transfer && hisse.durum !== "iptal" && (
          <Button size="sm" variant="outline" disabled title="Yakında (Faz 5)">
            <ArrowRightLeft size={12} className="mr-1" />
            Transfer
          </Button>
        )}
      </div>
    </div>
  );
}

function DurumRozet({ durum }: { durum: HisseSatir["durum"] }) {
  if (durum === "tamamlandi") {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        <CheckCircle2 size={11} className="mr-1" />
        Tamamlandı
      </Badge>
    );
  }
  if (durum === "kismi") {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        <Clock size={11} className="mr-1" />
        Kısmi
      </Badge>
    );
  }
  if (durum === "iptal") {
    return (
      <Badge variant="secondary" className="text-muted-foreground">
        <XCircle size={11} className="mr-1" />
        İptal
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
      <AlertTriangle size={11} className="mr-1" />
      Borçlu
    </Badge>
  );
}

function HisseIptalDialog({ hisseId, etiket }: { hisseId: string; etiket: string }) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [bekleniyor, startTransition] = useTransition();
  const [sebep, setSebep] = useState("");

  function onayla() {
    if (sebep.trim().length < 3) {
      toast.error("Gerekçe en az 3 karakter olmalı");
      return;
    }
    startTransition(async () => {
      try {
        const yanit = await fetch(`/api/hisseler/${hisseId}/iptal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sebep }),
        });
        const sonuc = (await yanit.json()) as { basarili: boolean; hata?: string };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "İptal başarısız");
        }
        toast.success(`Hisse ${etiket} iptal edildi`);
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
          <Button size="sm" variant="outline" className="text-destructive">
            <XCircle size={12} className="mr-1" />
            İptal
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hisse İptal: {etiket}</DialogTitle>
          <DialogDescription>
            Bu hissenin müşteriye atanması iptal edilecek. Eylem audit log'a kaydedilir.
            Devam etmek için gerekçe girin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="sebep">Gerekçe</Label>
          <Textarea
            id="sebep"
            rows={3}
            value={sebep}
            onChange={(e) => setSebep(e.target.value)}
            placeholder="Örn: Müşteri vazgeçti, çift hisse vb."
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
            onClick={onayla}
            disabled={bekleniyor || sebep.trim().length < 3}
          >
            {bekleniyor ? "İptal ediliyor..." : "Hisseyi İptal Et"}
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
  vurgu = false,
}: {
  ad: string;
  deger: string;
  renk?: string;
  vurgu?: boolean;
}) {
  return (
    <div
      className={`rounded-md border bg-white p-3 ${
        vurgu ? "border-primary" : ""
      }`}
    >
      <p className="text-muted-foreground text-[11px]">{ad}</p>
      <p className={`font-tabular text-lg font-bold ${renk}`}>{deger}</p>
    </div>
  );
}
