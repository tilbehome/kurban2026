"use client";

/**
 * Yedek listesi — yükleme / indirme / ZIP / silme aksiyonları.
 * SPRINT-YEDEK-V2 İŞ 1+3.
 *
 * - Yedek noktası dosyaları (-yedek-noktasi-) üstte ayrı amber kartta.
 * - Yükleme tehlikeli: "YEDEK_YUKLE" onay sözcüğü zorunlu modal.
 * - Silme: basit onay modali.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  Trash2,
  Download,
  Archive,
  AlertTriangle,
  Database,
  Star,
} from "lucide-react";
import { formatTarihSaat } from "@/shared/lib/tarih";

interface YedekDosya {
  dosyaAdi: string;
  tarih: string;
  boyutKB: number;
}

interface Props {
  yedekler: YedekDosya[];
}

export function YedekListesi({ yedekler }: Props) {
  const router = useRouter();
  const [yuklemeyiOnayla, setYuklemeyiOnayla] = useState<string | null>(null);
  const [silmeyiOnayla, setSilmeyiOnayla] = useState<string | null>(null);
  const [onaySozcugu, setOnaySozcugu] = useState("");
  const [bekleniyor, setBekleniyor] = useState(false);

  async function yedekYukle(dosyaAdi: string) {
    if (onaySozcugu !== "YEDEK_YUKLE") {
      toast.error("Onay sözcüğünü doğru yazın: YEDEK_YUKLE");
      return;
    }
    setBekleniyor(true);
    try {
      const r = await fetch("/api/yedek/yukle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yedekDosyaAdi: dosyaAdi,
          onaySozcugu: "YEDEK_YUKLE",
        }),
      });
      const j = (await r.json()) as { basarili: boolean; hata?: string };
      if (!r.ok || !j.basarili) {
        throw new Error(j.hata ?? "Yedek yüklenemedi");
      }
      toast.success("Yedek başarıyla yüklendi. Sayfa yenileniyor...");
      // Prisma client + Next.js reload için hard refresh
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (e) {
      const m = e instanceof Error ? e.message : "Bilinmeyen hata";
      toast.error(m);
      setBekleniyor(false);
    }
    setYuklemeyiOnayla(null);
    setOnaySozcugu("");
  }

  async function yedekSil(dosyaAdi: string) {
    setBekleniyor(true);
    try {
      const r = await fetch("/api/yedek/sil", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yedekDosyaAdi: dosyaAdi }),
      });
      const j = (await r.json()) as { basarili: boolean; hata?: string };
      if (!r.ok || !j.basarili) {
        throw new Error(j.hata ?? "Silinemedi");
      }
      toast.success("Yedek silindi");
      router.refresh();
    } catch (e) {
      const m = e instanceof Error ? e.message : "Bilinmeyen hata";
      toast.error(m);
    } finally {
      setBekleniyor(false);
      setSilmeyiOnayla(null);
    }
  }

  function indir(dosyaAdi: string) {
    window.open(
      `/api/yedek/indir?dosya=${encodeURIComponent(dosyaAdi)}`,
      "_blank",
    );
  }
  function zipIndir(dosyaAdi: string) {
    window.open(
      `/api/yedek/zip?dosya=${encodeURIComponent(dosyaAdi)}`,
      "_blank",
    );
  }

  const restoreYedekleri = yedekler.filter((y) =>
    y.dosyaAdi.includes("-yedek-noktasi-"),
  );
  const normalYedekler = yedekler.filter(
    (y) => !y.dosyaAdi.includes("-yedek-noktasi-"),
  );

  return (
    <>
      {restoreYedekleri.length > 0 && (
        <div className="mb-4">
          <div className="text-amber-900 mb-2 flex items-center gap-2 text-sm font-semibold">
            <Star size={14} className="text-amber-600" />
            Önemli Yedek Noktaları ({restoreYedekleri.length})
          </div>
          <div className="border-amber-200 bg-amber-50/40 flex flex-col divide-y divide-amber-200 rounded-md border">
            {restoreYedekleri.map((y) => (
              <YedekSatir
                key={y.dosyaAdi}
                y={y}
                vurgu
                onYukle={() => setYuklemeyiOnayla(y.dosyaAdi)}
                onSil={() => setSilmeyiOnayla(y.dosyaAdi)}
                onIndir={() => indir(y.dosyaAdi)}
                onZipIndir={() => zipIndir(y.dosyaAdi)}
              />
            ))}
          </div>
        </div>
      )}

      {normalYedekler.length > 0 && (
        <div className="flex flex-col divide-y rounded-md border">
          {normalYedekler.map((y) => (
            <YedekSatir
              key={y.dosyaAdi}
              y={y}
              onYukle={() => setYuklemeyiOnayla(y.dosyaAdi)}
              onSil={() => setSilmeyiOnayla(y.dosyaAdi)}
              onIndir={() => indir(y.dosyaAdi)}
              onZipIndir={() => zipIndir(y.dosyaAdi)}
            />
          ))}
        </div>
      )}

      {/* YÜKLEME ONAY MODALI — tehlikeli */}
      <Dialog
        open={yuklemeyiOnayla !== null}
        onOpenChange={(acik) => {
          if (!acik) {
            setYuklemeyiOnayla(null);
            setOnaySozcugu("");
          }
        }}
      >
        <DialogContent showCloseButton={false} className="max-w-md">
          <div className="flex flex-col gap-3 pt-2">
            <div className="bg-destructive/10 text-destructive flex h-12 w-12 items-center justify-center self-center rounded-full">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-destructive text-center text-lg font-bold">
              TEHLİKELİ İŞLEM
            </DialogTitle>
            <DialogDescription className="text-foreground text-center text-sm leading-relaxed">
              <code className="font-mono text-xs">{yuklemeyiOnayla}</code>{" "}
              dosyası mevcut veritabanının <strong>üzerine</strong> yazılacak.
            </DialogDescription>

            <div className="border-amber-200 bg-amber-50 rounded-md border p-3 text-xs">
              <p className="text-amber-900 mb-1 font-semibold">
                Ne olacak?
              </p>
              <ul className="text-amber-900 list-disc space-y-0.5 pl-4">
                <li>Tüm mevcut veri (müşteri, kurban, tahsilat) silinecek</li>
                <li>Bu yedeğin verileri yüklenecek</li>
                <li>Otomatik olarak güvenlik yedeği alınacak</li>
                <li>Hata olursa güvenlik yedeğinden geri dönülebilir</li>
              </ul>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="onay-sozcugu" className="text-sm font-semibold">
                Onaylamak için{" "}
                <code className="bg-muted rounded px-1 py-0.5 font-mono">
                  YEDEK_YUKLE
                </code>{" "}
                yazın:
              </Label>
              <Input
                id="onay-sozcugu"
                value={onaySozcugu}
                onChange={(e) => setOnaySozcugu(e.target.value)}
                placeholder="YEDEK_YUKLE"
                className="font-mono"
                autoFocus
              />
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setYuklemeyiOnayla(null);
                setOnaySozcugu("");
              }}
              disabled={bekleniyor}
              className="h-12 text-base font-semibold"
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={() => yuklemeyiOnayla && yedekYukle(yuklemeyiOnayla)}
              disabled={bekleniyor || onaySozcugu !== "YEDEK_YUKLE"}
              className="bg-destructive hover:bg-destructive/90 h-12 text-base font-bold text-white"
            >
              {bekleniyor ? "Yükleniyor..." : "EVET, YÜKLE"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SİLME ONAY MODALI */}
      <Dialog
        open={silmeyiOnayla !== null}
        onOpenChange={(acik) => {
          if (!acik) setSilmeyiOnayla(null);
        }}
      >
        <DialogContent showCloseButton={false} className="max-w-sm">
          <div className="flex flex-col gap-3 pt-2">
            <DialogTitle className="text-center text-lg font-semibold">
              Yedek Sil?
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              <code className="font-mono text-xs">{silmeyiOnayla}</code>{" "}
              kalıcı olarak silinecek. Geri alınamaz.
            </DialogDescription>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSilmeyiOnayla(null)}
              disabled={bekleniyor}
              className="h-12"
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={() => silmeyiOnayla && yedekSil(silmeyiOnayla)}
              disabled={bekleniyor}
              className="bg-destructive hover:bg-destructive/90 h-12 text-white"
            >
              {bekleniyor ? "Siliniyor..." : "Sil"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function YedekSatir({
  y,
  onYukle,
  onSil,
  onIndir,
  onZipIndir,
  vurgu = false,
}: {
  y: YedekDosya;
  onYukle: () => void;
  onSil: () => void;
  onIndir: () => void;
  onZipIndir: () => void;
  vurgu?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        {vurgu ? (
          <Star className="text-amber-600 size-4 shrink-0" />
        ) : (
          <Database className="text-muted-foreground size-4 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="truncate font-mono text-sm">{y.dosyaAdi}</p>
          <p className="text-muted-foreground text-xs">
            {formatTarihSaat(new Date(y.tarih))} · {y.boyutKB} KB
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onIndir}
          title=".db indir"
          aria-label=".db indir"
        >
          <Download className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onZipIndir}
          title="ZIP indir (USB için)"
          aria-label="ZIP indir"
        >
          <Archive className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onYukle}
          title="Bu yedeği yükle (tehlikeli)"
          aria-label="Yedeği yükle"
          className="text-amber-700 hover:bg-amber-100 hover:text-amber-900"
        >
          <Upload className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onSil}
          title="Yedeği sil"
          aria-label="Yedeği sil"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
