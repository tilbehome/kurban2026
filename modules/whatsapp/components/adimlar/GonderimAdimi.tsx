"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Pause,
  Play,
  SkipForward,
  Square,
  Check,
  X,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  urettWaLink,
  formatTelefon,
} from "@/modules/whatsapp/lib/wa-link-uretici";
import { cozumle } from "@/modules/whatsapp/lib/sablon-degisken-cozucu";
import type {
  GonderimDurumu,
  GonderimSatir,
  HedefMusteri,
  SablonKisa,
} from "@/modules/whatsapp/types";

interface GonderimAdimiProps {
  sablon: SablonKisa;
  hedefler: HedefMusteri[];
  sirketAdi: string;
  sirketTel: string;
  /** Tüm gönderim bittiğinde tetiklenir (yeniden başlatmak için) */
  onBitti: (sonuc: {
    acilan: number;
    atlanan: number;
    hata: number;
  }) => void;
}

type AkisDurumu = "calisior" | "duraklatildi" | "bitti";

export function GonderimAdimi({
  sablon,
  hedefler,
  sirketAdi,
  sirketTel,
  onBitti,
}: GonderimAdimiProps) {
  const router = useRouter();

  // Başlangıçta GonderimSatir listesi hazırla
  const [satirlar, setSatirlar] = useState<GonderimSatir[]>(() =>
    hedefler.map((h) => {
      const mesaj = cozumle(sablon.icerik, h, { sirketAdi, sirketTel });
      const link = urettWaLink(h.telefon, mesaj);
      return {
        musteriId: h.musteriId,
        adSoyad: h.adSoyad,
        telefon: h.telefon ?? "",
        mesaj,
        waLink: link ?? "",
        durum: (link ? "bekliyor" : "hata") as GonderimDurumu,
        acilmaZamani: null,
      };
    }),
  );

  const [aktifIdx, setAktifIdx] = useState(0);
  const [durum, setDurum] = useState<AkisDurumu>("duraklatildi");
  const [araSn, setAraSn] = useState(3);
  const baslamaRef = useRef<Date>(new Date());
  const kaydedildiRef = useRef(false);

  // Bekleyen satırı bul (mevcut idx'ten sonraki ilk bekliyor)
  const sonrakiIdx = useCallback(
    (mevcut: number) => {
      for (let i = mevcut; i < satirlar.length; i++) {
        if (satirlar[i].durum === "bekliyor") return i;
      }
      return -1;
    },
    [satirlar],
  );

  // Satır gönder (window.open)
  const satirAc = useCallback(
    (idx: number) => {
      const s = satirlar[idx];
      if (!s || s.durum !== "bekliyor") return false;
      if (!s.waLink) {
        setSatirlar((eski) => {
          const yeni = [...eski];
          yeni[idx] = { ...s, durum: "hata" };
          return yeni;
        });
        return false;
      }
      window.open(s.waLink, "_blank", "noopener");
      setSatirlar((eski) => {
        const yeni = [...eski];
        yeni[idx] = {
          ...s,
          durum: "acildi",
          acilmaZamani: new Date().toISOString(),
        };
        return yeni;
      });
      return true;
    },
    [satirlar],
  );

  // Otomatik akış
  useEffect(() => {
    if (durum !== "calisior") return;
    const i = sonrakiIdx(aktifIdx);
    if (i === -1) {
      setDurum("bitti");
      return;
    }
    setAktifIdx(i);
    satirAc(i);
    const t = setTimeout(() => {
      const sonraki = sonrakiIdx(i + 1);
      if (sonraki === -1) {
        setDurum("bitti");
      } else {
        setAktifIdx(sonraki);
      }
    }, araSn * 1000);
    return () => clearTimeout(t);
  }, [durum, aktifIdx, araSn, satirAc, sonrakiIdx]);

  // Bitti — DB'ye kaydet
  useEffect(() => {
    if (durum !== "bitti" || kaydedildiRef.current) return;
    kaydedildiRef.current = true;
    const acilan = satirlar.filter((s) => s.durum === "acildi").length;
    const atlanan = satirlar.filter((s) => s.durum === "atlandi").length;
    const hata = satirlar.filter((s) => s.durum === "hata").length;

    void fetch("/api/whatsapp/gonderimler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sablonId: sablon.id,
        baslamaTarihi: baslamaRef.current.toISOString(),
        bitisTarihi: new Date().toISOString(),
        hedefSayisi: satirlar.length,
        acilanSayisi: acilan,
        atlananSayisi: atlanan,
        hataSayisi: hata,
        telefonsuzSayisi: 0,
        not: null,
        hedefler: satirlar.map((s) => ({
          musteriId: s.musteriId,
          musteriAdSoyad: s.adSoyad,
          telefon: s.telefon,
          durum: s.durum,
          acilmaZamani: s.acilmaZamani,
        })),
      }),
    })
      .then((r) => r.json())
      .then((j: { basarili: boolean; hata?: string }) => {
        if (!j.basarili) throw new Error(j.hata ?? "Kayıt başarısız");
        toast.success(
          `Tamamlandı: ${acilan} açıldı · ${atlanan} atlandı · ${hata} hata`,
        );
        onBitti({ acilan, atlanan, hata });
        router.refresh();
      })
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : "Kayıt hatası");
      });
  }, [durum, satirlar, sablon.id, onBitti, router]);

  function basla() {
    if (durum === "bitti") return;
    setDurum("calisior");
  }
  function durakla() {
    setDurum("duraklatildi");
  }
  function durdur() {
    if (!confirm("Gönderimi durdurmak istediğinize emin misiniz?")) return;
    setDurum("bitti");
  }
  function atla() {
    setSatirlar((eski) => {
      const yeni = [...eski];
      if (yeni[aktifIdx] && yeni[aktifIdx].durum === "bekliyor") {
        yeni[aktifIdx] = { ...yeni[aktifIdx], durum: "atlandi" };
      }
      return yeni;
    });
    const sonraki = sonrakiIdx(aktifIdx + 1);
    if (sonraki === -1) {
      setDurum("bitti");
    } else {
      setAktifIdx(sonraki);
    }
  }
  function manuelAc(idx: number) {
    if (satirlar[idx].durum !== "bekliyor") return;
    satirAc(idx);
  }

  const tamamlanan = satirlar.filter((s) => s.durum !== "bekliyor").length;
  const yuzde = Math.round((tamamlanan / satirlar.length) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">
          {durum === "bitti" ? "Gönderim Tamamlandı" : "Canlı Gönderim"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {durum === "calisior"
            ? `Otomatik akış · ${araSn} saniyede bir sonraki açılıyor`
            : durum === "duraklatildi"
              ? "Manuel mod · Aşağıdan tek tek başlat veya otomatik akışı sürdür"
              : "Tüm hedefler işlendi"}
        </p>
      </div>

      {/* İlerleme */}
      <div className="flex flex-col gap-2 rounded-lg border bg-stone-50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">
            İlerleme: {tamamlanan} / {satirlar.length}
          </span>
          <span className="font-tabular font-bold text-orange-600">
            %{yuzde}
          </span>
        </div>
        <div className="bg-stone-200 h-2 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${yuzde}%` }}
          />
        </div>
      </div>

      {/* Kontroller */}
      {durum !== "bitti" && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-3">
          {durum === "calisior" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={durakla}
            >
              <Pause size={14} />
              Duraklat
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={basla}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Play size={14} />
              {tamamlanan === 0 ? "Başlat" : "Devam"}
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={atla}>
            <SkipForward size={14} />
            Bu Müşteriyi Atla
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={durdur}
            className="text-red-600 hover:bg-red-50"
          >
            <Square size={14} />
            Durdur
          </Button>
          <div className="ml-auto flex items-center gap-1.5 text-xs">
            <Clock size={12} className="text-muted-foreground" />
            <label className="font-medium">Ara:</label>
            <select
              value={araSn}
              onChange={(e) => setAraSn(Number(e.target.value))}
              className="border-input bg-background rounded border px-1.5 py-0.5 text-xs"
            >
              <option value={1}>1 sn</option>
              <option value={2}>2 sn</option>
              <option value={3}>3 sn</option>
              <option value={5}>5 sn</option>
              <option value={10}>10 sn</option>
            </select>
          </div>
        </div>
      )}

      {/* Satır listesi */}
      <div className="-mr-2 max-h-[400px] overflow-y-auto pr-2">
        <div className="flex flex-col gap-1.5">
          {satirlar.map((s, i) => (
            <div
              key={s.musteriId}
              className={cn(
                "flex items-center gap-2.5 rounded-md border p-2.5 transition-colors",
                i === aktifIdx && durum !== "bitti"
                  ? "border-orange-500 bg-orange-50 ring-1 ring-orange-200"
                  : s.durum === "acildi"
                    ? "border-green-300 bg-green-50/50"
                    : s.durum === "atlandi"
                      ? "border-stone-300 bg-stone-50 opacity-60"
                      : s.durum === "hata"
                        ? "border-red-300 bg-red-50"
                        : "border-stone-200 bg-white",
              )}
            >
              <DurumIkonu durum={s.durum} aktif={i === aktifIdx} />
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-semibold">
                  {i + 1}. {s.adSoyad}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {formatTelefon(s.telefon)}
                  {s.acilmaZamani && (
                    <span className="ml-2">
                      ·{" "}
                      {new Date(s.acilmaZamani).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  )}
                </span>
              </div>
              {s.durum === "bekliyor" && s.waLink && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => manuelAc(i)}
                  className="h-7 text-xs"
                >
                  <ExternalLink size={11} />
                  Aç
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sonuç özeti (bitince) */}
      {durum === "bitti" && (
        <div className="grid grid-cols-3 gap-2 rounded-lg border bg-stone-50 p-3 text-center">
          <Sonuc
            etiket="Açılan"
            sayi={satirlar.filter((s) => s.durum === "acildi").length}
            renk="text-green-700"
          />
          <Sonuc
            etiket="Atlanan"
            sayi={satirlar.filter((s) => s.durum === "atlandi").length}
            renk="text-stone-600"
          />
          <Sonuc
            etiket="Hata"
            sayi={satirlar.filter((s) => s.durum === "hata").length}
            renk="text-red-700"
          />
        </div>
      )}
    </div>
  );
}

function DurumIkonu({
  durum,
  aktif,
}: {
  durum: GonderimDurumu;
  aktif: boolean;
}) {
  if (durum === "acildi")
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
        <Check size={13} />
      </span>
    );
  if (durum === "atlandi")
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-400 text-white">
        <SkipForward size={11} />
      </span>
    );
  if (durum === "hata")
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
        <X size={13} />
      </span>
    );
  if (aktif)
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
        <span className="h-2 w-2 animate-ping rounded-full bg-white" />
      </span>
    );
  return (
    <span className="border-stone-300 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white text-stone-400">
      <Clock size={11} />
    </span>
  );
}

function Sonuc({
  etiket,
  sayi,
  renk,
}: {
  etiket: string;
  sayi: number;
  renk: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
        {etiket}
      </span>
      <span className={cn("font-tabular text-2xl font-bold", renk)}>{sayi}</span>
    </div>
  );
}
