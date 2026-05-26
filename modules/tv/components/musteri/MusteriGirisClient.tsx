"use client";

/**
 * Müşteri TV giriş ekranı.
 *
 * SPRINT-MUSTERI-GIRIS-V2: sıcak Ada Bereket brandı + büyük dokunmatik UX.
 * Önceki koyu mat tema → krem/beyaz, kırmızı (#DE0B1E) vurgu.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Phone,
  Hash,
  UserCircle,
  ArrowRight,
  Beef,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MARKA_KIRMIZI = "#DE0B1E";
const MARKA_KIRMIZI_HOVER = "#B8091A";
const FIRMA_TEL_WA = "905363904418";
const FIRMA_TEL_GORUNUM = "0536 390 44 18";

interface AramaSonucu {
  tip: "kurban" | "musteri-id" | "telefon" | "kod" | "metin" | null;
  mesaj?: string;
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
        const j = (await r.json()) as {
          basarili: boolean;
          sonuc?: AramaSonucu;
        };
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

  function whatsappAc() {
    window.open(`https://wa.me/${FIRMA_TEL_WA}`, "_blank");
  }

  return (
    <div className="from-stone-50 via-amber-50/30 to-white min-h-screen bg-linear-to-b p-4">
      <div className="mx-auto flex max-w-md flex-col gap-5 pt-6">
        {/* MARKA BAŞLIĞI */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg ring-4 ring-red-100"
            style={{ backgroundColor: MARKA_KIRMIZI }}
          >
            <Beef size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-stone-900 text-2xl font-extrabold tracking-tight">
              Ada Bereket Hayvancılık
            </h1>
            <p className="text-stone-600 mt-0.5 text-sm">
              Kurban 2026 · Hisse Takip Sistemi
            </p>
          </div>
        </div>

        {/* ANA ARAMA KARTI */}
        <div className="border-stone-200 rounded-2xl border bg-white p-5 shadow-sm">
          <form onSubmit={ara} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="kurban-ara"
                className="text-stone-900 text-base font-semibold"
              >
                Kurban Sıra Numaranız
              </label>
              <span className="text-stone-500 text-xs">Örn: 18</span>
            </div>

            <div className="relative">
              <Search
                size={20}
                className="text-stone-400 absolute top-1/2 left-4 -translate-y-1/2"
              />
              <Input
                id="kurban-ara"
                value={aranan}
                onChange={(e) => setAranan(e.target.value)}
                placeholder="18 ya da DANA-18"
                className="border-stone-300 h-16 border-2 pl-12 text-xl font-bold focus-visible:ring-red-100"
                style={{ borderColor: aranan ? MARKA_KIRMIZI : undefined }}
                inputMode="text"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={bekleniyor || aranan.trim().length === 0}
              className="h-14 text-base font-bold text-white hover:opacity-95"
              style={{ backgroundColor: MARKA_KIRMIZI }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = MARKA_KIRMIZI_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = MARKA_KIRMIZI;
              }}
            >
              {bekleniyor ? (
                "Aranıyor..."
              ) : (
                <>
                  <Search size={18} />
                  KURBANI BUL
                </>
              )}
            </Button>

            <p className="text-stone-500 text-center text-[11px]">
              Telefon numaranızla da arayabilirsiniz (0532…)
            </p>
          </form>
        </div>

        {/* SONUÇ */}
        {sonuc && (
          <>
            {sonuc.tip === null && (
              <div className="border-amber-300 bg-amber-50 flex items-start gap-3 rounded-xl border p-4">
                <AlertCircle className="text-amber-600 mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="text-amber-900 font-semibold">
                    {sonuc.mesaj || "Sonuç bulunamadı"}
                  </p>
                  <p className="text-amber-700 mt-0.5 text-xs">
                    Farklı bir terim deneyin veya destek için aşağıdaki
                    WhatsApp&apos;a yazın.
                  </p>
                </div>
              </div>
            )}

            {sonuc.tip === "kurban" && sonuc.kurban && (
              <button
                type="button"
                onClick={() => kurbanaGit(sonuc.kurban!.kesimSirasi)}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 flex w-full items-center justify-between gap-3 rounded-2xl p-5 text-left text-white shadow-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                    <Beef size={26} />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold">
                      DANA-{sonuc.kurban.kesimSirasi}
                    </div>
                    <div className="text-emerald-100 text-xs">
                      {sonuc.kurban.kupeNo
                        ? `Küpe: ${sonuc.kurban.kupeNo} · Hissenizi görüntüle`
                        : "Hissenizi görüntüle"}
                    </div>
                  </div>
                </div>
                <ArrowRight size={24} className="shrink-0" />
              </button>
            )}

            {(sonuc.tip === "telefon" || sonuc.tip === "musteri-id") &&
              sonuc.musteri && (
                <div className="border-emerald-300 bg-emerald-50 rounded-2xl border p-5">
                  <div className="text-emerald-700 mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
                    <CheckCircle2 size={14} />
                    Müşteri bulundu
                  </div>
                  <div className="text-emerald-900 text-xl font-bold">
                    {sonuc.musteri.adSoyad}
                  </div>
                  <p className="text-emerald-800 mt-2 text-xs leading-relaxed">
                    Hissenizi takip etmek için <strong>DANA numaranız</strong>{" "}
                    ile arama yapmanız önerilir. Numaranızı kayıt sırasında
                    verilen dekonttan bulabilirsiniz.
                  </p>
                </div>
              )}
          </>
        )}

        {/* ALTERNATİF YÖNTEMLER */}
        <div className="border-stone-200 rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-stone-500 mb-3 text-[11px] font-semibold tracking-wider uppercase">
            Alternatif Yöntemler
          </p>
          <div className="flex flex-col gap-1">
            <YontemSatir
              ikon={<Hash size={16} />}
              etiket="Müşteri No"
              aciklama="6 haneli ID (örn. 000286)"
            />
            <YontemSatir
              ikon={<Phone size={16} />}
              etiket="Telefon Numarası"
              aciklama="Kayıt sırasında verdiğiniz telefon"
            />
            <YontemSatir
              ikon={<UserCircle size={16} />}
              etiket="Misafir Görünüm"
              aciklama="Genel TV ekranını aç"
              onClick={misafirGiris}
            />
          </div>
        </div>

        {/* WHATSAPP DESTEK */}
        <button
          type="button"
          onClick={whatsappAc}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 flex items-center justify-center gap-3 rounded-2xl p-4 text-white shadow-md transition-colors"
        >
          <MessageCircle size={22} />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs font-medium opacity-90">
              WhatsApp Destek
            </span>
            <span className="text-base font-bold">{FIRMA_TEL_GORUNUM}</span>
          </div>
        </button>

        <p className="text-stone-400 mt-2 text-center text-[11px]">
          Ada Bereket Hayvancılık · Kurban 2026
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
    <div className="flex items-center gap-3 rounded-xl p-3 transition-colors">
      <span className="bg-stone-100 text-stone-700 flex h-10 w-10 items-center justify-center rounded-xl">
        {ikon}
      </span>
      <div className="flex flex-1 flex-col leading-tight">
        <span className="text-stone-900 text-sm font-semibold">{etiket}</span>
        <span className="text-stone-500 text-xs">{aciklama}</span>
      </div>
      {onClick && <ArrowRight size={16} className="text-stone-400" />}
    </div>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="hover:bg-stone-50 active:bg-stone-100 text-left transition-colors"
      >
        {govde}
      </button>
    );
  }
  return govde;
}
