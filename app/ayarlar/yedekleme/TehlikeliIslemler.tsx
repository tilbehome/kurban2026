"use client";

/**
 * Tehlikeli işlemler kartı — bayram öncesi tek seferlik veri sıfırlama.
 *
 * SPRINT-SIFIRLA-V1: 4 katmanlı koruma
 *   1. Admin yetki (sayfada gizlenir + API'de kontrol)
 *   2. "SIFIRLA_VERIYI" onay sözcüğü
 *   3. 5 sn geri sayım (UI "düşünme süresi")
 *   4. Server'da zorunlu otomatik yedek
 */

import { useState, useEffect } from "react";
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
  AlertTriangle,
  Trash2,
  Shield,
  CheckCircle2,
} from "lucide-react";

interface SilmeSonucu {
  basarili: boolean;
  silinen?: {
    musteri: number;
    kurban: number;
    hisse: number;
    odeme: number;
    kasaHareketi: number;
  };
  guvenlikYedek?: string;
}

export function TehlikeliIslemler() {
  const [acik, setAcik] = useState(false);
  const [onaySozcugu, setOnaySozcugu] = useState("");
  const [bekleniyor, setBekleniyor] = useState(false);
  const [geriSayim, setGeriSayim] = useState(0);
  const [sonuc, setSonuc] = useState<SilmeSonucu | null>(null);

  // Geri sayım tick — useEffect içinde sadece setTimeout zinciri, setState
  // doğrudan kullanıcı etkileşiminden (onChange) tetikleniyor.
  useEffect(() => {
    if (geriSayim <= 0) return;
    const t = setTimeout(() => setGeriSayim((g) => g - 1), 1000);
    return () => clearTimeout(t);
  }, [geriSayim]);

  function onaySozcuguDegisti(yeni: string) {
    setOnaySozcugu(yeni);
    // Onay doğruysa ve henüz geri sayım başlamadıysa başlat
    if (yeni === "SIFIRLA_VERIYI" && geriSayim === 0 && !sonuc) {
      setGeriSayim(5);
    }
  }

  async function sifirla() {
    if (onaySozcugu !== "SIFIRLA_VERIYI") {
      toast.error("Onay sözcüğü yanlış");
      return;
    }
    if (geriSayim > 0) {
      toast.error("Lütfen geri sayımı bekleyin");
      return;
    }

    setBekleniyor(true);
    try {
      const r = await fetch("/api/yedek/sifirla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onaySozcugu: "SIFIRLA_VERIYI" }),
      });
      const j = (await r.json()) as {
        basarili: boolean;
        hata?: string;
        silinen?: SilmeSonucu["silinen"];
        guvenlikYedek?: string;
      };
      if (!r.ok || !j.basarili) {
        throw new Error(j.hata ?? "Sıfırlama hatası");
      }
      setSonuc({
        basarili: true,
        silinen: j.silinen,
        guvenlikYedek: j.guvenlikYedek,
      });
      toast.success("Veri sıfırlandı");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Bilinmeyen hata";
      toast.error(m);
      setSonuc({ basarili: false });
    } finally {
      setBekleniyor(false);
    }
  }

  function modalKapat() {
    if (bekleniyor) return;
    setAcik(false);
    setOnaySozcugu("");
    setGeriSayim(0);
    if (sonuc?.basarili) {
      // Başarılı sıfırlamadan sonra 2 sn'de ana sayfaya
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } else {
      setSonuc(null);
    }
  }

  return (
    <>
      <div className="border-destructive/40 bg-destructive/5 rounded-lg border-2 p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="bg-destructive/10 text-destructive flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-destructive text-base font-bold">
              ⚠️ TEHLİKELİ İŞLEMLER
            </h3>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Bu bölümdeki işlemler <strong>geri alınamaz</strong>. Sezon
              başlangıcı veya bayram öncesi kullanılır. Sıfırlama öncesi
              otomatik yedek alınır — yine de dikkatli olun.
            </p>
          </div>
        </div>

        <div className="bg-background border-destructive/30 flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Trash2 className="text-destructive size-4" />
              Tüm Veriyi Sıfırla
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Müşteri, kurban, hisse, ödeme, kasa hareketleri ve audit log
              <strong> silinir</strong>. Yönetici hesabı + ayarlar +
              WhatsApp şablonları <strong>korunur</strong>.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setAcik(true)}
            disabled={bekleniyor}
            className="shrink-0"
          >
            <Trash2 className="size-4" />
            Sıfırla
          </Button>
        </div>
      </div>

      <Dialog
        open={acik}
        onOpenChange={(o) => {
          if (!o) modalKapat();
        }}
      >
        <DialogContent showCloseButton={false} className="max-w-md">
          {sonuc?.basarili ? (
            <>
              <div className="flex flex-col items-center gap-3 pt-2">
                <div className="bg-emerald-100 text-emerald-700 flex h-12 w-12 items-center justify-center rounded-full">
                  <CheckCircle2 className="size-7" />
                </div>
                <DialogTitle className="text-center text-lg font-bold text-emerald-900">
                  Sıfırlama Tamamlandı
                </DialogTitle>
                <DialogDescription className="text-center text-sm">
                  Tüm veriler sıfırlandı. Sistem yeni veriler için hazır.
                </DialogDescription>
              </div>

              {sonuc.silinen && (
                <div className="border-stone-200 bg-stone-50 mt-2 rounded-md border p-3 text-xs">
                  <p className="mb-1.5 font-semibold">Silinen Kayıtlar:</p>
                  <ul className="text-muted-foreground space-y-0.5">
                    <li>• Müşteri: {sonuc.silinen.musteri}</li>
                    <li>• Kurban: {sonuc.silinen.kurban}</li>
                    <li>• Hisse: {sonuc.silinen.hisse}</li>
                    <li>• Ödeme: {sonuc.silinen.odeme}</li>
                    <li>• Kasa Hareketi: {sonuc.silinen.kasaHareketi}</li>
                  </ul>
                </div>
              )}

              {sonuc.guvenlikYedek && (
                <div className="border-emerald-200 bg-emerald-50 mt-1 rounded-md border p-3">
                  <p className="text-emerald-900 mb-0.5 flex items-center gap-1 text-xs font-semibold">
                    <Shield className="size-3" />
                    Güvenlik yedeği alındı:
                  </p>
                  <code className="text-emerald-800 font-mono text-[10px] break-all">
                    {sonuc.guvenlikYedek.split(/[/\\]/).pop()}
                  </code>
                </div>
              )}

              <p className="text-muted-foreground mt-1 text-center text-xs">
                2 saniye sonra ana sayfaya yönlendirileceksiniz...
              </p>

              <div className="mt-2">
                <Button
                  onClick={modalKapat}
                  className="h-12 w-full text-base font-semibold"
                >
                  Tamam
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-3 pt-2">
                <div className="bg-destructive/10 text-destructive flex h-12 w-12 items-center justify-center rounded-full">
                  <AlertTriangle className="size-7" />
                </div>
                <DialogTitle className="text-destructive text-center text-lg font-bold">
                  ⚠️ TÜM VERİYİ SİL — GERİ ALINAMAZ
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Tüm test verisi silinecek, sadece admin hesabı ve sistem
                  ayarları korunacak.
                </DialogDescription>
              </div>

              <div className="border-destructive/30 bg-destructive/5 rounded-md border p-3 text-xs">
                <p className="text-destructive mb-1 font-semibold">
                  🔥 NE SİLİNECEK:
                </p>
                <ul className="text-foreground/80 space-y-0.5 pl-4">
                  <li>• Tüm müşteriler</li>
                  <li>• Tüm kurban kayıtları</li>
                  <li>• Tüm hisse atamaları</li>
                  <li>• Tüm tahsilat ve dekontlar</li>
                  <li>• Tüm kasa hareketleri</li>
                  <li>• Tüm notlar ve vekaletler</li>
                  <li>• Audit log (geçmiş kayıtlar)</li>
                </ul>
              </div>

              <div className="border-emerald-200 bg-emerald-50 rounded-md border p-3 text-xs">
                <p className="text-emerald-900 mb-1 font-semibold">
                  ✓ KORUNAN:
                </p>
                <ul className="text-emerald-900 space-y-0.5 pl-4">
                  <li>• Yönetici hesabınız</li>
                  <li>• Sistem ayarları (firma, TV ayarları)</li>
                  <li>• WhatsApp mesaj şablonları</li>
                  <li>• Yedek dosyaları</li>
                </ul>
              </div>

              <div className="border-amber-200 bg-amber-50 rounded-md border p-3 text-xs">
                <p className="text-amber-900 flex items-center gap-1 font-semibold">
                  <Shield className="size-3" />
                  Otomatik güvenlik yedeği alınacak.
                </p>
                <p className="text-amber-800 mt-0.5">
                  Hata olursa bu yedekten geri dönülebilir.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sifirla-onay" className="text-sm font-semibold">
                  Onaylamak için{" "}
                  <code className="bg-muted rounded px-1 py-0.5 font-mono">
                    SIFIRLA_VERIYI
                  </code>{" "}
                  yazın:
                </Label>
                <Input
                  id="sifirla-onay"
                  value={onaySozcugu}
                  onChange={(e) => onaySozcuguDegisti(e.target.value)}
                  placeholder="SIFIRLA_VERIYI"
                  className="font-mono"
                  autoFocus
                  disabled={bekleniyor}
                />
              </div>

              {onaySozcugu === "SIFIRLA_VERIYI" && geriSayim > 0 && (
                <div className="border-amber-200 bg-amber-50 flex items-center justify-between rounded-md border p-3">
                  <span className="text-amber-900 text-xs font-medium">
                    Buton bu kadar saniye sonra aktif olacak:
                  </span>
                  <span className="font-tabular text-amber-700 text-2xl font-bold">
                    {geriSayim}
                  </span>
                </div>
              )}

              <div className="mt-1 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={modalKapat}
                  disabled={bekleniyor}
                  className="h-12 text-base font-semibold"
                >
                  İptal (Güvenli)
                </Button>
                <Button
                  type="button"
                  onClick={sifirla}
                  disabled={
                    bekleniyor ||
                    onaySozcugu !== "SIFIRLA_VERIYI" ||
                    geriSayim > 0
                  }
                  className="bg-destructive hover:bg-destructive/90 h-12 text-base font-bold text-white"
                >
                  {bekleniyor
                    ? "Sıfırlanıyor..."
                    : geriSayim > 0
                      ? `${geriSayim}sn bekle...`
                      : "EVET, TÜMÜNÜ SİL"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
