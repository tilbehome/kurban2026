"use client";

import { useMemo } from "react";
import { AlertTriangle, Play, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cozumle } from "@/modules/whatsapp/lib/sablon-degisken-cozucu";
import type {
  HedefMusteri,
  SablonKisa,
} from "@/modules/whatsapp/types";

interface OnizlemeAdimiProps {
  sablon: SablonKisa;
  hedefler: HedefMusteri[];
  sirketAdi: string;
  sirketTel: string;
  onBaslat: () => void;
  onGeri: () => void;
}

export function OnizlemeAdimi({
  sablon,
  hedefler,
  sirketAdi,
  sirketTel,
  onBaslat,
  onGeri,
}: OnizlemeAdimiProps) {
  const ilkUc = useMemo(() => hedefler.slice(0, 3), [hedefler]);
  // Tahmini süre = 3 sn/müşteri
  const tahminiSure = Math.ceil((hedefler.length * 3) / 60);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Önizleme ve Onay</h2>
        <p className="text-muted-foreground text-sm">
          Mesajlar doğru görünüyor mu kontrol edin
        </p>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 gap-3 rounded-lg border bg-stone-50 p-3 sm:grid-cols-4">
        <Mini etiket="Şablon" deger={sablon.ad} />
        <Mini etiket="Hedef" deger={`${hedefler.length} müşteri`} />
        <Mini
          etiket="Tahmini Süre"
          deger={`~${tahminiSure < 1 ? "1" : tahminiSure} dakika`}
        />
        <Mini etiket="Yöntem" deger="wa.me click-to-chat" />
      </div>

      {/* Uyarı */}
      <div className="bg-amber-50 ring-amber-200 flex items-start gap-2.5 rounded-lg p-3 ring-1">
        <AlertTriangle
          size={16}
          className="text-amber-600 mt-0.5 shrink-0"
        />
        <div className="text-sm text-amber-900">
          <strong>Önemli:</strong> Her müşteri için WhatsApp Web (veya
          uygulaması) açılacak. Mesaj önceden doludur ama{" "}
          <strong>&quot;Gönder&quot; butonuna sizin basmanız gerekir</strong>{" "}
          (WhatsApp kuralı — spam önleme).
          <br />
          <span className="text-[11px] opacity-80">
            Tüm mesajları manuel onaylayacağınız için yasal ve güvenlidir.
          </span>
        </div>
      </div>

      {/* İlk 3 örnek */}
      <div className="flex flex-col gap-2">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          İlk 3 Müşteriye Gidecek Mesajlar
        </h3>
        {ilkUc.map((m, i) => {
          const mesaj = cozumle(sablon.icerik, m, { sirketAdi, sirketTel });
          return (
            <div
              key={m.musteriId}
              className="rounded-lg border border-stone-200 bg-white p-3"
            >
              <div className="mb-2 flex items-center gap-2 text-xs">
                <span className="bg-orange-500 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="font-semibold">{m.adSoyad}</span>
                <span className="text-muted-foreground">({m.telefon})</span>
              </div>
              <div className="rounded-md bg-emerald-50 p-2.5">
                <MessageCircle
                  size={11}
                  className="text-emerald-600 mb-1 inline"
                />
                <pre className="font-mono text-[11px] whitespace-pre-wrap text-stone-800">
                  {mesaj}
                </pre>
              </div>
            </div>
          );
        })}
        {hedefler.length > 3 && (
          <p className="text-muted-foreground text-center text-xs">
            ...ve {hedefler.length - 3} müşteri daha
          </p>
        )}
      </div>

      <div className="flex justify-between border-t pt-4">
        <Button type="button" variant="outline" onClick={onGeri}>
          ← Geri
        </Button>
        <Button
          type="button"
          onClick={onBaslat}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Play size={14} />
          Gönderimi Başlat ({hedefler.length})
        </Button>
      </div>
    </div>
  );
}

function Mini({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
        {etiket}
      </span>
      <span className="text-sm font-bold">{deger}</span>
    </div>
  );
}
