"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Volume2,
  VolumeX,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Search,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { useSeslicAnons } from "@/modules/tv/hooks/useSeslicAnons";
import {
  GOREV_ASAMALARI,
  GOREV_KISA,
  PERSONEL_GOREVLERI,
  type PersonelGorev,
} from "@/modules/tv/lib/personel-gorev";
import { PersonelGorevSekme } from "./PersonelGorevSekme";
import { PersonelAktifIs } from "./PersonelAktifIs";
import { PersonelGorevKart } from "./PersonelGorevKart";
import { VekaletPanel } from "./ozel-aksiyonlar/VekaletPanel";
import { TartimKeypad } from "./ozel-aksiyonlar/TartimKeypad";
import { PaketlemePanel } from "./ozel-aksiyonlar/PaketlemePanel";
import { TeslimPanel } from "./ozel-aksiyonlar/TeslimPanel";
import { SorunBildirDialog } from "./yardimcilar/SorunBildirDialog";
import type {
  PersonelKurbanVeri,
} from "@/app/tv/personel/page";

const STORAGE_GOREV = "tv.personel.gorev";
const STORAGE_AKTIF_IS = "tv.personel.aktif-is";

interface Props {
  kullaniciAd: string;
  kullaniciId: string;
  baslangicGorev: PersonelGorev;
  kurbanlar: PersonelKurbanVeri[];
}

export function PersonelAnaClient({
  kullaniciAd,
  baslangicGorev,
  kurbanlar: ilkKurbanlar,
}: Props) {
  const router = useRouter();
  const { aktif: sesAktif, aktifEt: sesAktifEt, destek: sesDestek } =
    useSeslicAnons();

  const [aktifGorev, setAktifGorev] = useState<PersonelGorev>(baslangicGorev);
  const [aktifIsId, setAktifIsId] = useState<string | null>(null);
  const [sorunKurban, setSorunKurban] = useState<PersonelKurbanVeri | null>(null);
  const [kurbanlar, setKurbanlar] = useState<PersonelKurbanVeri[]>(ilkKurbanlar);
  // SPRINT-PERSONEL-PANEL: arama kutusu (kurban no veya hissedar ismi)
  const [arama, setArama] = useState("");

  // SPRINT-PERSONEL-PANEL-EK: akıllı sticky — aşağı kaydırınca sekme+arama
  // gizlenir, yukarı kaydırınca geri gelir. Üst header her zaman görünür.
  const [sekmelerGorunur, setSekmelerGorunur] = useState(true);
  const sonScrollRef = useRef(0);

  useEffect(() => {
    function scrollDinle() {
      const simdi = window.scrollY;
      const fark = simdi - sonScrollRef.current;
      if (simdi < 100) {
        setSekmelerGorunur(true);
      } else if (fark > 5) {
        setSekmelerGorunur(false);
      } else if (fark < -5) {
        setSekmelerGorunur(true);
      }
      sonScrollRef.current = simdi;
    }
    window.addEventListener("scroll", scrollDinle, { passive: true });
    return () => window.removeEventListener("scroll", scrollDinle);
  }, []);

  useEffect(() => {
    // localStorage hidrasyonu — mount'ta bir kez state'i restore eder.
    // setState içeride çağrılıyor (react-hooks/set-state-in-effect bunu
    // genel olarak uyarır) ama burada bilinçli desen: SSR sırasında
    // localStorage yok, client'a inince restore lazım.
    try {
      const k = localStorage.getItem(STORAGE_GOREV);
      if (k && (PERSONEL_GOREVLERI as string[]).includes(k)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAktifGorev(k as PersonelGorev);
      }
      const ai = localStorage.getItem(STORAGE_AKTIF_IS);
      if (ai) setAktifIsId(ai);
    } catch {
      /* localStorage yoksa devam */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GOREV, aktifGorev);
    } catch {
      /* sessiz */
    }
  }, [aktifGorev]);

  useEffect(() => {
    try {
      if (aktifIsId) localStorage.setItem(STORAGE_AKTIF_IS, aktifIsId);
      else localStorage.removeItem(STORAGE_AKTIF_IS);
    } catch {
      /* sessiz */
    }
  }, [aktifIsId]);

  // 5sn polling — yeni endpoint, sayfa yenilemeden güncel kurban listesi
  useEffect(() => {
    let iptal = false;
    async function cek() {
      try {
        const yanit = await fetch("/api/tv/personel-gorevler", {
          cache: "no-store",
        });
        if (!yanit.ok || iptal) return;
        const veri = (await yanit.json()) as {
          kurbanlar: PersonelKurbanVeri[];
        };
        if (!iptal && Array.isArray(veri.kurbanlar)) {
          setKurbanlar(veri.kurbanlar);
        }
      } catch {
        /* network hatasını sessizce yut, sonraki tick'te tekrar dene */
      }
    }
    const id = setInterval(cek, 5000);
    return () => {
      iptal = true;
      clearInterval(id);
    };
  }, []);

  const sayilar = useMemo(() => {
    const sayim = Object.fromEntries(
      PERSONEL_GOREVLERI.map((g) => [g, 0]),
    ) as Record<PersonelGorev, number>;
    for (const k of kurbanlar) {
      for (const g of PERSONEL_GOREVLERI) {
        if (GOREV_ASAMALARI[g].includes(k.kesimDurumu)) sayim[g]++;
      }
    }
    return sayim;
  }, [kurbanlar]);

  const aktifIs = useMemo(
    () => kurbanlar.find((k) => k.id === aktifIsId) ?? null,
    [kurbanlar, aktifIsId],
  );

  const gorevListesi = useMemo(() => {
    const asamalar = GOREV_ASAMALARI[aktifGorev];
    const q = arama.trim().toLowerCase();
    return kurbanlar
      .filter((k) => asamalar.includes(k.kesimDurumu))
      .filter((k) => k.id !== aktifIsId)
      .filter((k) => {
        if (q.length === 0) return true;
        const kurbanNoEslesir = k.kesimSirasi.toString().includes(q);
        const isimEslesir = k.hisseler.some((h) =>
          h.musteriAdi?.toLowerCase().includes(q),
        );
        return kurbanNoEslesir || isimEslesir;
      });
  }, [kurbanlar, aktifGorev, aktifIsId, arama]);

  async function yenile() {
    // Hem polling endpoint'inden hem RSC'den yenile — anlık ve tutarlı
    try {
      const yanit = await fetch("/api/tv/personel-gorevler", {
        cache: "no-store",
      });
      if (yanit.ok) {
        const veri = (await yanit.json()) as {
          kurbanlar: PersonelKurbanVeri[];
        };
        if (Array.isArray(veri.kurbanlar)) setKurbanlar(veri.kurbanlar);
      }
    } catch {
      /* sessiz */
    }
    router.refresh();
  }

  function isiAl(id: string) {
    setAktifIsId(id);
  }

  function isiBirak() {
    setAktifIsId(null);
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-slate-900 text-white sticky top-0 z-30 flex items-center justify-between px-4 py-3 shadow-lg">
        <Link
          href="/"
          className="text-slate-300 hover:text-white flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={14} />
          Ana
        </Link>
        <div className="flex flex-col items-center leading-tight">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-300">
            {GOREV_KISA[aktifGorev]}
          </span>
          <span className="text-sm font-bold">{kullaniciAd}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={yenile}
            className="rounded-full p-2 text-slate-300 hover:bg-slate-700"
            aria-label="Yenile"
          >
            <RefreshCw size={14} />
          </button>
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
        </div>
      </header>

      {/* AKILLI STICKY: sekme + arama. Aşağı kaydırınca gizlenir,
          yukarı kaydırınca geri gelir (üstte ilk 100px her zaman görünür). */}
      <div
        className={cn(
          "bg-stone-50/95 sticky top-[52px] z-20 border-b backdrop-blur-sm transition-transform duration-200",
          sekmelerGorunur ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="mx-auto flex max-w-md flex-col gap-3 px-4 py-3">
          <PersonelGorevSekme
            aktif={aktifGorev}
            setAktif={setAktifGorev}
            sayilar={sayilar}
          />

          <div className="relative">
            <Search
              size={18}
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            />
            <Input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Dana no veya hissedar ismi ile ara..."
              className="h-11 pl-10 text-sm"
              inputMode="search"
            />
            {arama && (
              <button
                type="button"
                onClick={() => setArama("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1"
                aria-label="Aramayı temizle"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-md flex-col gap-4 p-4">
        {aktifIs && (
          <PersonelAktifIs
            kurban={aktifIs}
            birak={isiBirak}
            sorunBildir={() => setSorunKurban(aktifIs)}
            yenile={yenile}
          />
        )}

        {aktifIs && aktifGorev === "vekalet" &&
          aktifIs.kesimDurumu === "vekalet_bekliyor" && (
            <VekaletPanel kurban={aktifIs} yenile={yenile} />
          )}

        {aktifIs && aktifGorev === "tartim" &&
          aktifIs.kesimDurumu === "tartimda" && (
            <TartimKeypad kurban={aktifIs} yenile={yenile} />
          )}

        {aktifIs && aktifGorev === "paketleme" &&
          aktifIs.kesimDurumu === "paketleme" && (
            <PaketlemePanel kurban={aktifIs} yenile={yenile} />
          )}

        {aktifIs && aktifGorev === "teslim" &&
          (aktifIs.kesimDurumu === "teslime_hazir" ||
            aktifIs.kesimDurumu === "tamamlandi") && (
            <TeslimPanel kurban={aktifIs} yenile={yenile} />
          )}

        <div className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Görevlerim ({gorevListesi.length})
          </h2>
          {gorevListesi.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground py-8 text-center text-sm">
                {aktifGorev === "genel"
                  ? "Aktif görev yok."
                  : `${GOREV_KISA[aktifGorev]} kategorisinde görev yok.`}
              </CardContent>
            </Card>
          ) : (
            gorevListesi.map((k) => (
              <PersonelGorevKart
                key={k.id}
                kurban={k}
                aktif={false}
                isiAl={() => isiAl(k.id)}
                sorunBildir={() => setSorunKurban(k)}
                yenile={yenile}
              />
            ))
          )}
        </div>

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
          onClick={() => router.refresh()}
        >
          <RefreshCw size={14} className="mr-1" />
          Yenile
        </Button>

        {sorunKurban && (
          <SorunBildirDialog
            kurban={sorunKurban}
            kapat={() => setSorunKurban(null)}
          />
        )}

        <div className="text-muted-foreground flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            Bayram günü: işi al, aşamayı bitir, sonraki personel listesine düşer.
          </span>
        </div>
      </div>
    </div>
  );
}
