"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Trash2, Lock, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import {
  KATEGORI_ETIKETLERI,
  SABLON_KARAKTER_LIMIT,
  type SablonKategorisi,
  type SablonKisa,
} from "@/modules/whatsapp/types";
import { SABLON_DEGISKENLERI } from "@/modules/whatsapp/lib/sablon-degisken-cozucu";
import { SablonOnizleme } from "./SablonOnizleme";

interface SablonEditoruProps {
  sablon: SablonKisa | null;
  yeniMi: boolean;
  onKaydedildi: (yeni: SablonKisa) => void;
  onSilindi: (id: string) => void;
  onIptal: () => void;
  /** Sadece admin düzenleyebilir */
  duzenleyebilir: boolean;
  sirketAdi: string;
  sirketTel: string;
}

export function SablonEditoru({
  sablon,
  yeniMi,
  onKaydedildi,
  onSilindi,
  onIptal,
  duzenleyebilir,
  sirketAdi,
  sirketTel,
}: SablonEditoruProps) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [ad, setAd] = useState("");
  const [kategori, setKategori] = useState<SablonKategorisi>("genel");
  const [icerik, setIcerik] = useState("");
  const [aktifMi, setAktifMi] = useState(true);

  useEffect(() => {
    if (sablon) {
      setAd(sablon.ad);
      setKategori(sablon.kategori);
      setIcerik(sablon.icerik);
      setAktifMi(sablon.aktifMi);
    } else if (yeniMi) {
      setAd("");
      setKategori("genel");
      setIcerik("");
      setAktifMi(true);
    }
  }, [sablon, yeniMi]);

  if (!sablon && !yeniMi) {
    return (
      <Card className="flex h-full items-center justify-center">
        <p className="text-muted-foreground p-12 text-center text-sm">
          Sol panelden bir şablon seçin
          <br />
          veya{" "}
          <button
            type="button"
            onClick={onIptal}
            className="text-orange-600 underline"
          >
            yeni şablon
          </button>{" "}
          oluşturun
        </p>
      </Card>
    );
  }

  const karakterSayisi = icerik.length;
  const limitYakin = karakterSayisi > SABLON_KARAKTER_LIMIT * 0.9;
  const limitAsildi = karakterSayisi > SABLON_KARAKTER_LIMIT;

  function degiskenYapistir(degisken: string) {
    if (!duzenleyebilir) return;
    const el = textareaRef.current;
    if (!el) {
      setIcerik((eski) => eski + degisken);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const yeni = icerik.slice(0, start) + degisken + icerik.slice(end);
    setIcerik(yeni);
    // Cursor'u değişken sonrasına taşı
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + degisken.length, start + degisken.length);
    }, 0);
  }

  function kaydet() {
    if (!ad.trim()) {
      toast.error("Şablon adı zorunlu");
      return;
    }
    if (!icerik.trim()) {
      toast.error("Mesaj içeriği zorunlu");
      return;
    }
    if (limitAsildi) {
      toast.error(`En fazla ${SABLON_KARAKTER_LIMIT} karakter olabilir`);
      return;
    }
    startTransition(async () => {
      try {
        const url = yeniMi
          ? "/api/whatsapp/sablonlar"
          : `/api/whatsapp/sablonlar/${sablon?.id}`;
        const method = yeniMi ? "POST" : "PATCH";
        const body = yeniMi
          ? { ad: ad.trim(), kategori, icerik }
          : { ad: ad.trim(), kategori, icerik, aktifMi };
        const yanit = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          veri?: SablonKisa;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili || !sonuc.veri) {
          throw new Error(sonuc.hata ?? "Kaydetme başarısız");
        }
        toast.success(yeniMi ? "Şablon eklendi" : "Şablon güncellendi");
        onKaydedildi(sonuc.veri);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  function sil() {
    if (!sablon || sablon.varsayilan) return;
    if (!confirm(`"${sablon.ad}" silinsin mi?`)) return;
    startTransition(async () => {
      try {
        const yanit = await fetch(`/api/whatsapp/sablonlar/${sablon.id}`, {
          method: "DELETE",
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Silme başarısız");
        }
        toast.success("Şablon silindi");
        onSilindi(sablon.id);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  const varsayilanMi = sablon?.varsayilan ?? false;
  const readonly = !duzenleyebilir;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">
            {yeniMi ? "Yeni Şablon" : sablon?.ad}
          </CardTitle>
          {varsayilanMi && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700">
              <Lock size={10} />
              Sistem şablonu (silinemez, düzenlenebilir)
            </span>
          )}
          {readonly && (
            <span className="text-muted-foreground text-[10px]">
              Salt okunur · Düzenlemek için admin yetkisi gerekir
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          {!yeniMi && !varsayilanMi && duzenleyebilir && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={sil}
              disabled={bekleniyor}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 size={13} />
              Sil
            </Button>
          )}
          {duzenleyebilir && (
            <Button
              type="button"
              size="sm"
              onClick={kaydet}
              disabled={bekleniyor || limitAsildi}
            >
              <Save size={13} />
              {bekleniyor ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {/* Ad + Kategori */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ad" className="text-xs">
              Şablon Adı
            </Label>
            <Input
              id="ad"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder="örn. Borç Hatırlatma"
              disabled={readonly}
              className="h-9 text-sm"
              maxLength={80}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kategori" className="text-xs">
              Kategori
            </Label>
            <select
              id="kategori"
              value={kategori}
              onChange={(e) =>
                setKategori(e.target.value as SablonKategorisi)
              }
              disabled={readonly}
              className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            >
              {(Object.keys(KATEGORI_ETIKETLERI) as SablonKategorisi[]).map(
                (k) => (
                  <option key={k} value={k}>
                    {KATEGORI_ETIKETLERI[k].emoji} {KATEGORI_ETIKETLERI[k].ad}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {/* İçerik */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="icerik" className="text-xs">
              Mesaj İçeriği
            </Label>
            <span
              className={cn(
                "font-tabular text-[11px]",
                limitAsildi
                  ? "font-bold text-red-600"
                  : limitYakin
                    ? "text-amber-600"
                    : "text-muted-foreground",
              )}
            >
              {karakterSayisi} / {SABLON_KARAKTER_LIMIT}
            </span>
          </div>
          <Textarea
            id="icerik"
            ref={textareaRef}
            value={icerik}
            onChange={(e) => setIcerik(e.target.value)}
            disabled={readonly}
            rows={8}
            placeholder="Sayın {adSoyad}, ..."
            className="font-mono text-sm"
          />
          {limitAsildi && (
            <span className="flex items-center gap-1 text-[11px] text-red-600">
              <AlertTriangle size={11} />
              Limit aşıldı — WhatsApp mesajı 4096 karakteri geçemez
            </span>
          )}
        </div>

        {/* Değişkenler */}
        {duzenleyebilir && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Değişkenler (tıkla, ekle)</Label>
            <div className="flex flex-wrap gap-1.5">
              {SABLON_DEGISKENLERI.map((d) => (
                <button
                  key={d.anahtar}
                  type="button"
                  onClick={() => degiskenYapistir(d.anahtar)}
                  title={d.aciklama}
                  className="rounded-md border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[10px] transition-colors hover:border-orange-300 hover:bg-orange-50"
                >
                  {d.anahtar}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Önizleme */}
        <SablonOnizleme
          icerik={icerik}
          sirketAdi={sirketAdi}
          sirketTel={sirketTel}
        />
      </CardContent>
    </Card>
  );
}
