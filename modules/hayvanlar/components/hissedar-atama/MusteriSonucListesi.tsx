"use client";

import { UserPlus, Phone, Users, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPara } from "@/shared/lib/para";
import type { AramaMusteri } from "./HissedarAtamaModal";

interface Props {
  sorgu: string;
  sonuclar: AramaMusteri[];
  yukleniyor: boolean;
  atananId: string | null;
  seciliEt: (id: string) => void;
  hizliEkleyeGec: () => void;
}

export function MusteriSonucListesi({
  sorgu,
  sonuclar,
  yukleniyor,
  atananId,
  seciliEt,
  hizliEkleyeGec,
}: Props) {
  if (sorgu.trim().length < 2) {
    return (
      <div className="text-center py-8 space-y-3">
        <Users size={32} className="text-muted-foreground/40 mx-auto" />
        <div className="text-muted-foreground text-sm">
          En az 2 karakter yazın — müşterilerde arama yapılır.
        </div>
        <Button variant="outline" size="sm" onClick={hizliEkleyeGec}>
          <UserPlus size={14} className="mr-1" />
          Hızlı Müşteri Ekle
        </Button>
      </div>
    );
  }

  if (yukleniyor && sonuclar.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        Aranıyor...
      </div>
    );
  }

  if (sonuclar.length === 0) {
    return (
      <div className="text-center py-6 space-y-3">
        <SearchX size={28} className="text-muted-foreground/40 mx-auto" />
        <div className="text-muted-foreground text-sm">
          "{sorgu}" için sonuç yok.
        </div>
        <Button variant="default" size="sm" onClick={hizliEkleyeGec}>
          <UserPlus size={14} className="mr-1" />
          "{sorgu.trim().toUpperCase()}" olarak hızlı ekle
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[420px] overflow-y-auto">
      <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        Mevcut Müşteriler ({sonuclar.length})
      </div>
      {sonuclar.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 hover:border-primary transition-colors"
        >
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate">{m.adSoyad}</div>
            <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
              {m.telefon && (
                <span className="flex items-center gap-1">
                  <Phone size={10} />
                  {m.telefon}
                </span>
              )}
              <span>{m.hisseSayisi} hisse</span>
              {m.kalan > 0 && (
                <span className="text-amber-600">
                  Borç: {formatPara(m.kalan)}
                </span>
              )}
              {m.kalan <= 0 && m.hisseSayisi > 0 && (
                <span className="text-green-600">Tam ödenmiş</span>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => seciliEt(m.id)}
            disabled={atananId !== null}
            className="shrink-0"
          >
            Seç →
          </Button>
        </div>
      ))}

      <div className="border-t pt-3 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={hizliEkleyeGec}
          className="w-full"
        >
          <UserPlus size={14} className="mr-1" />
          Bulamadın mı? Hızlı Müşteri Ekle
        </Button>
      </div>
    </div>
  );
}
