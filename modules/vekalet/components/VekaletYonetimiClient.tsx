"use client";

/**
 * Vekalet yönetimi ana client component'i.
 *
 * State:
 *  - aramaTerim: müşteri adı/telefon arama
 *  - sekme: bekliyor | alindi | tumu
 *  - secilenler: multi-select için Set<string>
 *
 * Veri akışı: server'dan ilk render, sonra her onay/iptal/yükleme
 * sonrasında `router.refresh()` ile yenilenir (RSC SSR'ı tetikler).
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { VekaletHisseSatir } from "./VekaletHisseSatir";
import { VekaletCokluOnayBar } from "./VekaletCokluOnayBar";
import type { VekaletHisseVeri } from "@/app/hayvanlar/vekalet/page";

type Sekme = "bekliyor" | "alindi" | "tumu";

interface Props {
  hisseler: VekaletHisseVeri[];
}

interface KurbanGrubu {
  kurbanId: string;
  kesimSirasi: number;
  hisseler: VekaletHisseVeri[];
  alinanSayi: number;
}

export function VekaletYonetimiClient({ hisseler }: Props) {
  const router = useRouter();
  const [aramaTerim, setAramaTerim] = useState("");
  const [sekme, setSekme] = useState<Sekme>("bekliyor");
  const [secilenler, setSecilenler] = useState<Set<string>>(new Set());

  // KPI hesabı — sekme filtresinden bağımsız, GENEL toplam
  const { toplam, alinan, bekleyen, yuzde } = useMemo(() => {
    const toplam = hisseler.length;
    const alinan = hisseler.filter((h) => h.vekaletAlindi).length;
    return {
      toplam,
      alinan,
      bekleyen: toplam - alinan,
      yuzde: toplam > 0 ? (alinan / toplam) * 100 : 0,
    };
  }, [hisseler]);

  // Filtreli + gruplu liste
  const kurbanGruplari = useMemo<KurbanGrubu[]>(() => {
    const q = aramaTerim.trim().toLocaleLowerCase("tr-TR");

    const filtreli = hisseler.filter((h) => {
      if (sekme === "bekliyor" && h.vekaletAlindi) return false;
      if (sekme === "alindi" && !h.vekaletAlindi) return false;
      if (q.length === 0) return true;
      const ad = h.musteri.adSoyad.toLocaleLowerCase("tr-TR");
      const tel = (h.musteri.telefon ?? "").replace(/\D/g, "");
      return ad.includes(q) || tel.includes(q.replace(/\D/g, ""));
    });

    const map = new Map<string, KurbanGrubu>();
    for (const h of filtreli) {
      const mevcut = map.get(h.kurban.id);
      if (mevcut) {
        mevcut.hisseler.push(h);
        if (h.vekaletAlindi) mevcut.alinanSayi++;
      } else {
        map.set(h.kurban.id, {
          kurbanId: h.kurban.id,
          kesimSirasi: h.kurban.kesimSirasi,
          hisseler: [h],
          alinanSayi: h.vekaletAlindi ? 1 : 0,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => a.kesimSirasi - b.kesimSirasi,
    );
  }, [hisseler, aramaTerim, sekme]);

  function onSec(id: string, secili: boolean) {
    setSecilenler((prev) => {
      const yeni = new Set(prev);
      if (secili) yeni.add(id);
      else yeni.delete(id);
      return yeni;
    });
  }

  // Sekme değişince seçimi temizle (yanlış görünmeyen seçim kalmasın)
  function sekmeDegistir(yeniSekme: Sekme) {
    setSekme(yeniSekme);
    setSecilenler(new Set());
  }

  function onGuncellendi() {
    // Seçimi koruma: parent state'i refresh ile gelen yeni props.hisseler'a
    // göre güncellenir; ama secilenler client state — eğer bir hisse
    // listeden filtrelenip çıkarsa (sekme=bekliyor + onaylandı) yine de
    // Set'te kalır. Temizleyelim — UX karışmasın.
    setSecilenler(new Set());
    router.refresh();
  }

  // Bekliyor sekmesinde seçim mantıklı (toplu onaylama). Alındı/tümü
  // sekmesinde seçim hâlâ çalışır ama ana use-case bekleyenlerdir.
  const sekmeBilgi: Array<{ id: Sekme; etiket: string; sayi: number }> = [
    { id: "bekliyor", etiket: "Bekliyor", sayi: bekleyen },
    { id: "alindi", etiket: "Alındı", sayi: alinan },
    { id: "tumu", etiket: "Tümü", sayi: toplam },
  ];

  const secilenIdler = useMemo(() => Array.from(secilenler), [secilenler]);

  return (
    <div className="bg-muted/20 min-h-screen pb-32">
      {/* Üst bar */}
      <header className="bg-background sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 shadow-sm">
        <Link
          href="/hayvanlar"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Hayvanlar
        </Link>
        <h1 className="text-base font-semibold">Vekalet Yönetimi</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.refresh()}
          aria-label="Yenile"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 p-4">
        {/* KPI Banner */}
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <span className="text-3xl font-bold tabular-nums">
                  {alinan}
                </span>
                <span className="text-muted-foreground ml-1 text-sm">
                  / {toplam} alındı
                </span>
                <span className="text-muted-foreground ml-2 text-xs">
                  · %{yuzde.toFixed(1)}
                </span>
              </div>
              {bekleyen > 0 ? (
                <Badge
                  variant="destructive"
                  className="bg-amber-600 hover:bg-amber-600"
                >
                  {bekleyen} bekliyor
                </Badge>
              ) : (
                <Badge className="bg-emerald-600 hover:bg-emerald-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Tamamlandı
                </Badge>
              )}
            </div>
            <div className="bg-amber-100 h-2 overflow-hidden rounded-full">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${yuzde}%` }}
              />
            </div>
            {bekleyen > 0 && (
              <p className="mt-2 flex items-center gap-1 text-xs text-amber-800">
                <AlertTriangle className="h-3 w-3" />
                Kesim öncesi tüm vekaletler alınmalı.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Arama */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={aramaTerim}
            onChange={(e) => setAramaTerim(e.target.value)}
            placeholder="Müşteri adı veya telefon..."
            className="h-11 pl-9"
            inputMode="search"
          />
          {aramaTerim && (
            <button
              type="button"
              onClick={() => setAramaTerim("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1"
              aria-label="Aramayı temizle"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sekmeler (native — sticky bar duplicate sebebiyle shadcn Tabs
            yerine button grid; daha kontrol edilebilir) */}
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {sekmeBilgi.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => sekmeDegistir(s.id)}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition-colors",
                sekme === s.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.etiket} ({s.sayi})
            </button>
          ))}
        </div>

        {/* Liste */}
        {kurbanGruplari.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-12 text-center text-sm">
              {aramaTerim
                ? "Aramaya uyan hissedar yok."
                : sekme === "bekliyor"
                  ? "Bekleyen vekalet yok 🎉"
                  : sekme === "alindi"
                    ? "Henüz alınmış vekalet yok."
                    : "Atanmış hisse yok."}
            </CardContent>
          </Card>
        ) : (
          kurbanGruplari.map((grup) => (
            <Card key={grup.kurbanId} className="overflow-hidden">
              <div className="bg-muted/40 flex items-center justify-between border-b px-3 py-2 text-xs font-semibold">
                <span>DANA-{grup.kesimSirasi}</span>
                <span className="text-muted-foreground">
                  {grup.alinanSayi}/{grup.hisseler.length} ✓
                </span>
              </div>
              <div>
                {grup.hisseler.map((h) => (
                  <VekaletHisseSatir
                    key={h.id}
                    hisse={h}
                    secili={secilenler.has(h.id)}
                    onSec={onSec}
                    onGuncellendi={onGuncellendi}
                  />
                ))}
              </div>
            </Card>
          ))
        )}
      </div>

      <VekaletCokluOnayBar
        secilenIdler={secilenIdler}
        onTemizle={() => setSecilenler(new Set())}
        onTamamlandi={onGuncellendi}
      />
    </div>
  );
}
