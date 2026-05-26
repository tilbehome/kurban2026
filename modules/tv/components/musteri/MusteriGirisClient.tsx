"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Beef,
  Phone,
  Hash,
  UserCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AramaSonucu {
  tip:
    | "kurban"
    | "musteri-id"
    | "telefon"
    | "kod"
    | "metin"
    | null;
  kurban?: {
    id: string;
    kesimSirasi: number;
    kupeNo: string | null;
    kesimDurumu: string;
  };
  musteri?: {
    id: string;
    adSoyad: string;
    telefon: string | null;
  };
  musteriler?: Array<{
    id: string;
    adSoyad: string;
    telefon: string | null;
  }>;
}

/**
 * Müşteri telefon giriş ekranı.
 * 5 farklı arama formatı destekler (akilliAra helper'ı kullanır).
 */
export function MusteriGirisClient() {
  const router = useRouter();
  const [aranan, setAranan] = useState("");
  const [sonuc, setSonuc] = useState<AramaSonucu | null>(null);
  const [bekleniyor, startTransition] = useTransition();

  function ara(e?: React.FormEvent) {
    e?.preventDefault();
    const q = aranan.trim();
    if (q.length === 0) return;
    setSonuc(null);
    startTransition(async () => {
      try {
        const r = await fetch(
          `/api/tv/musteri-bul?q=${encodeURIComponent(q)}`,
        );
        const j = (await r.json()) as { basarili: boolean; sonuc?: AramaSonucu };
        if (j.basarili && j.sonuc) setSonuc(j.sonuc);
      } catch {
        setSonuc({ tip: null });
      }
    });
  }

  function kurbanaGit(kesimSirasi: number) {
    router.push(`/tv/m/k/${kesimSirasi}`);
  }

  function misafirGiris() {
    router.push("/tv");
  }

  return (
    <div className="from-slate-950 via-slate-900 to-orange-950 min-h-screen bg-linear-to-br p-4 text-white">
      <div className="mx-auto flex max-w-md flex-col gap-5 pt-8">
        {/* Logo + başlık */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="from-orange-500 to-amber-500 ring-orange-400/40 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br shadow-2xl ring-4">
            <Beef size={32} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            TilbeCore Kurban
          </h1>
          <p className="text-slate-400 text-sm">
            Hisse takip ve canlı durum
          </p>
        </div>

        {/* Arama */}
        <Card className="bg-slate-800/80 border-slate-700 text-white backdrop-blur-sm">
          <CardContent className="flex flex-col gap-3 p-5">
            <label className="text-slate-300 text-xs font-semibold tracking-wider uppercase">
              Sıra Takibi
            </label>
            <form onSubmit={ara} className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="text-slate-400 absolute top-1/2 left-3 -translate-y-1/2"
                />
                <Input
                  value={aranan}
                  onChange={(e) => setAranan(e.target.value)}
                  placeholder="Kurban no (18) veya telefon (0532...)"
                  className="bg-slate-900 border-slate-600 h-11 pl-9 text-white placeholder:text-slate-500"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={bekleniyor || aranan.trim().length === 0}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600"
              >
                {bekleniyor ? "..." : "Ara"}
              </Button>
            </form>
            <p className="text-slate-400 text-[11px]">
              Örnek: <kbd className="bg-slate-700 px-1 rounded">18</kbd>{" "}
              <kbd className="bg-slate-700 px-1 rounded">DANA-18</kbd>{" "}
              <kbd className="bg-slate-700 px-1 rounded">0532...</kbd>
            </p>
          </CardContent>
        </Card>

        {/* Sonuçlar */}
        {sonuc && (
          <Card className="bg-slate-800/80 border-slate-700 text-white">
            <CardContent className="flex flex-col gap-2 p-4">
              {sonuc.tip === null && (
                <p className="text-slate-300 py-4 text-center text-sm">
                  Sonuç bulunamadı. Farklı bir terim deneyin.
                </p>
              )}

              {sonuc.tip === "kurban" && sonuc.kurban && (
                <button
                  type="button"
                  onClick={() => kurbanaGit(sonuc.kurban!.kesimSirasi)}
                  className="bg-orange-500 hover:bg-orange-600 flex items-center justify-between rounded-lg p-3 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Beef size={24} />
                    <div>
                      <div className="text-lg font-extrabold">
                        DANA-{sonuc.kurban.kesimSirasi}
                      </div>
                      <div className="text-orange-100 text-xs">
                        {sonuc.kurban.kupeNo
                          ? `Küpe: ${sonuc.kurban.kupeNo}`
                          : "Hisseni takip et"}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={20} />
                </button>
              )}

              {(sonuc.tip === "telefon" ||
                sonuc.tip === "musteri-id" ||
                (sonuc.tip === "metin" && sonuc.musteri)) &&
                sonuc.musteri && (
                  <div className="bg-slate-900/60 rounded-lg p-3">
                    <div className="text-slate-400 mb-1 text-[11px]">
                      Müşteri bulundu
                    </div>
                    <div className="text-base font-bold">
                      {sonuc.musteri.adSoyad}
                    </div>
                    <p className="text-slate-400 mt-2 text-xs">
                      Kurban numaranızla giriş yapmanız önerilir
                      (DANA-X).
                    </p>
                  </div>
                )}

              {sonuc.tip === "metin" &&
                sonuc.musteriler &&
                sonuc.musteriler.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="text-slate-400 text-[11px] font-semibold">
                      Çoklu sonuç ({sonuc.musteriler.length})
                    </div>
                    {sonuc.musteriler.map((m) => (
                      <div
                        key={m.id}
                        className="bg-slate-900/60 rounded p-2 text-sm"
                      >
                        {m.adSoyad}
                      </div>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Diğer giriş seçenekleri */}
        <Card className="bg-slate-800/40 border-slate-700/60 text-white">
          <CardContent className="flex flex-col gap-2 p-4">
            <p className="text-slate-400 text-[11px] font-semibold tracking-wider uppercase">
              Diğer Seçenekler
            </p>
            <YontemSatir
              ikon={<Hash size={14} />}
              etiket="Müşteri No"
              aciklama="6 haneli ID (örn. 000286)"
            />
            <YontemSatir
              ikon={<Phone size={14} />}
              etiket="Telefon"
              aciklama="0532 123 45 67"
            />
            <YontemSatir
              ikon={<UserCircle size={14} />}
              etiket="Misafir"
              aciklama="Genel TV ekranını gör"
              onClick={misafirGiris}
            />
          </CardContent>
        </Card>

        <p className="text-slate-500 mt-4 text-center text-[11px]">
          TilbeCore Kurban — Adabereket Hayvancılık 2026
        </p>
      </div>
    </div>
  );
}

function YontemSatir({
  ikon,
  etiket,
  aciklama,
  onClick,
}: {
  ikon: React.ReactNode;
  etiket: string;
  aciklama: string;
  onClick?: () => void;
}) {
  const govde = (
    <div className="hover:bg-slate-800/60 flex items-center gap-2.5 rounded-md p-2 transition-colors">
      <span className="bg-slate-700 text-slate-300 flex h-7 w-7 items-center justify-center rounded-md">
        {ikon}
      </span>
      <div className="flex flex-1 flex-col leading-tight">
        <span className="text-xs font-semibold">{etiket}</span>
        <span className="text-slate-400 text-[10px]">{aciklama}</span>
      </div>
    </div>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="text-left">
        {govde}
      </button>
    );
  }
  return govde;
}
