"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Volume2,
  VolumeX,
  Activity,
  List,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useSeslicAnons } from "@/modules/tv/hooks/useSeslicAnons";
import {
  PersonelKurbanKart,
  type PersonelKurbanData,
} from "./PersonelKurbanKart";

interface PersonelAnaClientProps {
  kullaniciAd: string;
  kurbanlar: PersonelKurbanData[];
}

/**
 * Personel telefon ana ekranı.
 * Aktif kurbanları listeler, "Sonraki Aşamaya Geç" tek tıkla.
 */
export function PersonelAnaClient({
  kullaniciAd,
  kurbanlar,
}: PersonelAnaClientProps) {
  const { aktif: sesAktif, aktifEt: sesAktifEt, destek: sesDestek } =
    useSeslicAnons();

  const aktifKurbanlar = useMemo(
    () =>
      kurbanlar.filter(
        (k) =>
          k.kesimDurumu !== "beklemede" &&
          k.kesimDurumu !== "tamamlandi" &&
          k.kesimDurumu !== "iptal",
      ),
    [kurbanlar],
  );

  const sıradakiler = useMemo(
    () =>
      kurbanlar.filter(
        (k) =>
          k.kesimDurumu === "siradaki" || k.kesimDurumu === "vekalet_bekliyor",
      ),
    [kurbanlar],
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Üst bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-10 flex items-center justify-between px-4 py-3 shadow-lg">
        <Link
          href="/"
          className="text-slate-300 hover:text-white flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={14} />
          Ana
        </Link>
        <div className="flex flex-col items-center leading-tight">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-300">
            Personel
          </span>
          <span className="text-sm font-bold">{kullaniciAd}</span>
        </div>
        <button
          type="button"
          onClick={() => sesAktifEt(!sesAktif)}
          disabled={!sesDestek}
          className={cn(
            "rounded-full p-2 transition-colors",
            sesAktif
              ? "bg-emerald-500 text-white"
              : "bg-slate-700 text-slate-300",
          )}
          aria-label="Sesli anons toggle"
        >
          {sesAktif ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      </header>

      <div className="mx-auto flex max-w-md flex-col gap-4 p-4">
        {/* İstatistik mini */}
        <div className="grid grid-cols-2 gap-2">
          <Card>
            <CardContent className="flex items-center gap-2.5 p-3">
              <Activity size={20} className="text-orange-500" />
              <div className="flex flex-col leading-tight">
                <span className="text-muted-foreground text-[10px] uppercase">
                  Aktif
                </span>
                <span className="font-tabular text-xl font-extrabold">
                  {aktifKurbanlar.length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-2.5 p-3">
              <List size={20} className="text-purple-500" />
              <div className="flex flex-col leading-tight">
                <span className="text-muted-foreground text-[10px] uppercase">
                  Sırada
                </span>
                <span className="font-tabular text-xl font-extrabold">
                  {sıradakiler.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aktif kurbanlar */}
        <div className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Aktif Kurbanlar ({aktifKurbanlar.length})
          </h2>
          {aktifKurbanlar.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground py-8 text-center text-sm">
                Şu an aktif kurban yok
              </CardContent>
            </Card>
          ) : (
            aktifKurbanlar.map((k) => (
              <PersonelKurbanKart key={k.id} kurban={k} />
            ))
          )}
        </div>

        {/* Sıradakiler */}
        {sıradakiler.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Sıradakiler ({sıradakiler.length})
            </h2>
            <Card>
              <CardContent className="flex flex-col gap-1 p-3">
                {sıradakiler.slice(0, 10).map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center justify-between border-b py-1.5 last:border-0"
                  >
                    <span className="text-sm font-semibold">
                      DANA-{k.kesimSirasi}
                      {k.operasyonSira !== null && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          Sıra: {k.operasyonSira}
                        </span>
                      )}
                    </span>
                    <span className="text-purple-700 text-[10px] font-semibold">
                      {k.kesimDurumu === "vekalet_bekliyor"
                        ? "Vekalet Bekliyor"
                        : "Sıradaki"}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        <Link
          href="/tv"
          target="_blank"
          className="text-muted-foreground hover:text-foreground text-center text-xs underline"
        >
          TV ekranını yeni sekmede aç →
        </Link>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => window.location.reload()}
        >
          Yenile
        </Button>
      </div>
    </div>
  );
}
