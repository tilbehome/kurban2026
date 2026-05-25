"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Octagon, Play, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/lib/utils";

interface AcilDurumKartProps {
  ilkAktif: boolean;
  ilkMesaj: string | null;
}

/**
 * Acil durum modu kart — admin tek tıkla "DURDUR" yapar.
 * TvAyari (acil_durum_aktif) DB'de tutulur, SSE ile tüm cihazlara push edilir.
 */
export function AcilDurumKart({
  ilkAktif,
  ilkMesaj,
}: AcilDurumKartProps) {
  const router = useRouter();
  const [aktif, setAktif] = useState(ilkAktif);
  const [mesaj, setMesaj] = useState(ilkMesaj ?? "");
  const [bekleniyor, startTransition] = useTransition();

  useEffect(() => {
    setAktif(ilkAktif);
    setMesaj(ilkMesaj ?? "");
  }, [ilkAktif, ilkMesaj]);

  function tetikle(yeniAktif: boolean) {
    const onayMetin = yeniAktif
      ? "Tüm operasyonu DURDURMAK istediğinize emin misiniz?\n\nTV ekranlarında MOLA mesajı görünecek."
      : "Operasyonu yeniden başlatmak istediğinize emin misiniz?";
    if (!confirm(onayMetin)) return;

    startTransition(async () => {
      try {
        const yanit = await fetch("/api/tv/acil-durum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aktif: yeniAktif,
            mesaj: yeniAktif ? mesaj || "Operasyona mola verildi" : "",
          }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Tetikleme başarısız");
        }
        setAktif(yeniAktif);
        toast.success(
          yeniAktif ? "🚨 Operasyon DURDURULDU" : "✅ Operasyon DEVAM EDİYOR",
        );
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  return (
    <Card
      className={cn(
        "border-2 transition-colors",
        aktif
          ? "border-red-500 bg-red-50/50 ring-2 ring-red-200"
          : "border-stone-200",
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {aktif ? (
            <AlertTriangle size={16} className="text-red-600 animate-pulse" />
          ) : (
            <Octagon size={16} className="text-stone-500" />
          )}
          Acil Durum Modu
          {aktif && (
            <span className="bg-red-500 ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
              AKTİF
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {aktif ? (
          <>
            <div className="rounded-md bg-red-100 p-3 text-sm text-red-900">
              <strong>⚠️ Operasyon durduruldu.</strong>
              <br />
              {mesaj || "Mola — TV ekranlarında bildirildi."}
            </div>
            <Button
              type="button"
              onClick={() => tetikle(false)}
              disabled={bekleniyor}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Play size={14} />
              Operasyona Devam Et
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Mola Mesajı (opsiyonel)</Label>
              <Input
                value={mesaj}
                onChange={(e) => setMesaj(e.target.value)}
                placeholder="Öğle molası — 13:00'te devam"
                className="h-9 text-sm"
                maxLength={200}
              />
            </div>
            <Button
              type="button"
              onClick={() => tetikle(true)}
              disabled={bekleniyor}
              variant="outline"
              className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
            >
              <Octagon size={14} />
              🚨 ACİL DURDUR
            </Button>
            <p className="text-muted-foreground text-[11px]">
              Tüm TV ekranlarında MOLA mesajı görünür. Personel
              telefonlarına da bildirilir.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
