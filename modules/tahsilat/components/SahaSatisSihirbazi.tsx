"use client";

/**
 * Saha Satış Sihirbazı — 5 adımlı mobil-first akış.
 *
 * Backend'e hiçbir yeni endpoint eklenmedi, sadece mevcut API'ler:
 *   - POST /api/musteriler (yeni müşteri, opsiyonel)
 *   - POST /api/hisseler/ata (atama)
 *   - POST /api/tahsilat/odeme (kapora, opsiyonel)
 *   - GET /api/musteriler?arama= (müşteri arama)
 *   - GET /api/hisseler/bos-kurbanlar (boş hisseli kurbanlar)
 *
 * İkonlar: lucide-react temel set (versiyon güvenli).
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Search,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { formatPara, parsePara } from "@/shared/lib/para";
import { uuidv4 } from "@/shared/lib/uuid";
import {
  telefonApiFormat,
  telefonGecerli,
  telefonGoster,
} from "@/shared/lib/telefon-formu";

type Adim = 1 | 2 | 3 | 4 | 5;

interface SecMusteri {
  id: string;
  adSoyad: string;
  telefon: string | null;
  yeniMi: boolean;
}

interface SecKurban {
  id: string;
  kesimSirasi: number;
  hisseFiyati: number;
  bosHisseIds: string[];
  bosHisseNumaralari: number[];
}

interface BosKurbanRow {
  id: string;
  kesimSirasi: number;
  hisseFiyati: number;
  bosHisseIds: string[];
  bosHisseNumaralari: number[];
}

interface MusteriArama {
  id: string;
  adSoyad: string;
  telefon: string | null;
}

export function SahaSatisSihirbazi() {
  const router = useRouter();
  const [adim, setAdim] = useState<Adim>(1);

  // ADIM 1 — Müşteri
  const [musteri, setMusteri] = useState<SecMusteri | null>(null);

  // ADIM 2 — Kurban + hisse
  const [kurbanlar, setKurbanlar] = useState<BosKurbanRow[]>([]);
  const [kurbanYukleniyor, setKurbanYukleniyor] = useState(false);
  const [seciliKurban, setSeciliKurban] = useState<SecKurban | null>(null);
  const [seciliHisseIds, setSeciliHisseIds] = useState<Set<string>>(
    new Set(),
  );

  // ADIM 3 — Fiyat (her hisse fiyatı, toplam = fiyat × adet)
  const [hisseFiyati, setHisseFiyati] = useState<number>(0);

  // ADIM 4 — Kapora (opsiyonel)
  const [kaporaAlinacak, setKaporaAlinacak] = useState<boolean | null>(null);
  const [kaporaNakit, setKaporaNakit] = useState<number>(0);
  const [kaporaHavale, setKaporaHavale] = useState<number>(0);
  const [kaporaKart, setKaporaKart] = useState<number>(0);
  const [kaporaNot, setKaporaNot] = useState("");

  // Sonuç
  const [bekleniyor, startTransition] = useTransition();
  const [sonuc, setSonuc] = useState<{
    musteriId: string;
    odemeIds: string[];
  } | null>(null);

  // Boş hisseli kurbanları yükle (Adım 2'ye geçince)
  useEffect(() => {
    if (adim !== 2 || kurbanlar.length > 0 || kurbanYukleniyor) return;
    setKurbanYukleniyor(true);
    fetch("/api/hisseler/bos-kurbanlar")
      .then((r) => r.json())
      .then((veri) => {
        if (veri.basarili && Array.isArray(veri.veri)) {
          setKurbanlar(veri.veri);
        } else {
          toast.error(veri.hata ?? "Kurban listesi alınamadı");
        }
      })
      .catch(() => toast.error("Bağlantı hatası"))
      .finally(() => setKurbanYukleniyor(false));
  }, [adim, kurbanlar.length, kurbanYukleniyor]);

  // Kurban seçilince fiyatı önerilen ile doldur
  useEffect(() => {
    if (seciliKurban && hisseFiyati === 0) {
      setHisseFiyati(seciliKurban.hisseFiyati);
    }
  }, [seciliKurban, hisseFiyati]);

  const hisseAdedi = seciliHisseIds.size;
  const toplamBedel = hisseFiyati * hisseAdedi;
  const kaporaToplam = kaporaNakit + kaporaHavale + kaporaKart;
  const kaporaGecerli =
    kaporaAlinacak === false ||
    (kaporaAlinacak === true && kaporaToplam > 0 && kaporaToplam <= toplamBedel);

  function ileri() {
    setAdim((a) => {
      const sonraki = a + 1;
      return (sonraki > 5 ? 5 : sonraki) as Adim;
    });
  }
  function geri() {
    setAdim((a) => {
      const onceki = a - 1;
      return (onceki < 1 ? 1 : onceki) as Adim;
    });
  }

  async function tamamla() {
    if (!musteri || !seciliKurban) return;
    if (seciliHisseIds.size === 0) {
      toast.error("En az 1 hisse seçilmeli");
      return;
    }
    if (hisseFiyati <= 0) {
      toast.error("Hisse fiyatı 0'dan büyük olmalı");
      return;
    }

    startTransition(async () => {
      try {
        // Adım A: Atama
        const atamaResp = await fetch("/api/hisseler/ata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hisseIds: Array.from(seciliHisseIds),
            musteriId: musteri.id,
            hisseFiyati: hisseFiyati,
          }),
        });
        const atamaSonuc = (await atamaResp.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!atamaResp.ok || !atamaSonuc.basarili) {
          throw new Error(atamaSonuc.hata ?? "Atama başarısız");
        }

        // Adım B: Kapora (opsiyonel)
        const odemeIds: string[] = [];
        if (kaporaAlinacak && kaporaToplam > 0) {
          const tahsilatResp = await fetch("/api/tahsilat/odeme", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              musteriId: musteri.id,
              hisseIds: Array.from(seciliHisseIds),
              nakit: kaporaNakit,
              havale: kaporaHavale,
              kart: kaporaKart,
              notlar: kaporaNot.trim() || `Saha satış kapora`,
              dagitim: "esit",
              clientRequestId: uuidv4(),
            }),
          });
          const tahsilatSonuc = (await tahsilatResp.json()) as {
            basarili: boolean;
            odemeIds?: string[];
            hata?: string;
          };
          if (!tahsilatResp.ok || !tahsilatSonuc.basarili) {
            // Atama başarılı ama kapora başarısız — kullanıcıyı bilgilendir, ama
            // atamayı geri almaya çalışma (mevcut endpoint yok). Manuel düzeltme.
            toast.error(
              `Hisseler atandı ama kapora alınamadı: ${tahsilatSonuc.hata ?? "Hata"}. Müşteri detayından tekrar deneyin.`,
            );
            setSonuc({ musteriId: musteri.id, odemeIds: [] });
            setAdim(5);
            return;
          }
          if (tahsilatSonuc.odemeIds) odemeIds.push(...tahsilatSonuc.odemeIds);
        }

        toast.success(
          kaporaAlinacak && odemeIds.length > 0
            ? `Satış tamamlandı + ${formatPara(kaporaToplam)} kapora alındı`
            : `Satış tamamlandı`,
        );
        setSonuc({ musteriId: musteri.id, odemeIds });
        setAdim(5);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  // İleri butonu için doğrulamalar
  const ileriDevreEksik = useMemo(() => {
    if (adim === 1) return !musteri;
    if (adim === 2) return !seciliKurban || seciliHisseIds.size === 0;
    if (adim === 3) return hisseFiyati <= 0;
    if (adim === 4) return !kaporaGecerli;
    return false;
  }, [adim, musteri, seciliKurban, seciliHisseIds.size, hisseFiyati, kaporaGecerli]);

  return (
    <div className="flex flex-col gap-4">
      {/* PROGRESS */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={cn(
              "flex h-2 flex-1 rounded-full transition-colors",
              n <= adim ? "bg-orange-500" : "bg-muted",
              n < 5 && "mr-1",
            )}
          />
        ))}
      </div>
      <div className="text-muted-foreground -mt-2 flex justify-between text-[10px] font-semibold uppercase">
        <span>1. Müşteri</span>
        <span>2. Kurban</span>
        <span>3. Fiyat</span>
        <span>4. Kapora</span>
        <span>5. Tamam</span>
      </div>

      {/* ADIM 1 — MÜŞTERİ */}
      {adim === 1 && (
        <Adim1Musteri musteri={musteri} setMusteri={setMusteri} />
      )}

      {/* ADIM 2 — KURBAN + HİSSE */}
      {adim === 2 && (
        <Adim2KurbanHisse
          kurbanlar={kurbanlar}
          yukleniyor={kurbanYukleniyor}
          seciliKurban={seciliKurban}
          setSeciliKurban={(k) => {
            setSeciliKurban(k);
            setSeciliHisseIds(new Set());
            setHisseFiyati(k.hisseFiyati);
          }}
          seciliHisseIds={seciliHisseIds}
          setSeciliHisseIds={setSeciliHisseIds}
        />
      )}

      {/* ADIM 3 — FİYAT */}
      {adim === 3 && seciliKurban && (
        <Adim3Fiyat
          seciliKurban={seciliKurban}
          hisseAdedi={hisseAdedi}
          hisseFiyati={hisseFiyati}
          setHisseFiyati={setHisseFiyati}
          toplamBedel={toplamBedel}
        />
      )}

      {/* ADIM 4 — KAPORA */}
      {adim === 4 && (
        <Adim4Kapora
          toplamBedel={toplamBedel}
          kaporaAlinacak={kaporaAlinacak}
          setKaporaAlinacak={setKaporaAlinacak}
          nakit={kaporaNakit}
          setNakit={setKaporaNakit}
          havale={kaporaHavale}
          setHavale={setKaporaHavale}
          kart={kaporaKart}
          setKart={setKaporaKart}
          notlar={kaporaNot}
          setNotlar={setKaporaNot}
        />
      )}

      {/* ADIM 5 — SONUÇ */}
      {adim === 5 && (
        <Adim5Sonuc
          musteri={musteri}
          seciliKurban={seciliKurban}
          hisseAdedi={hisseAdedi}
          hisseFiyati={hisseFiyati}
          toplamBedel={toplamBedel}
          kaporaToplam={kaporaAlinacak ? kaporaToplam : 0}
          tamamlandi={sonuc !== null}
          musteriId={sonuc?.musteriId}
        />
      )}

      {/* NAVİGASYON */}
      {adim !== 5 && (
        <div className="sticky bottom-0 -mx-4 mt-2 flex gap-2 border-t bg-white p-3 sm:-mx-6"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
          }}
        >
          <Button
            variant="outline"
            onClick={geri}
            disabled={adim === 1 || bekleniyor}
            className="flex-1 h-12"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Geri
          </Button>
          {adim < 4 ? (
            <Button
              onClick={ileri}
              disabled={ileriDevreEksik || bekleniyor}
              className="flex-1 h-12 bg-orange-500 hover:bg-orange-600"
            >
              İleri
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={tamamla}
              disabled={ileriDevreEksik || bekleniyor}
              className="flex-1 h-12 bg-green-600 hover:bg-green-700"
            >
              {bekleniyor ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-1 h-4 w-4" />
              )}
              Tamamla
            </Button>
          )}
        </div>
      )}

      {adim === 5 && (
        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex-1 h-12"
          >
            Ana Sayfa
          </Button>
          <Button
            onClick={() => {
              // Tüm state sıfırla, yeni satış
              setMusteri(null);
              setSeciliKurban(null);
              setSeciliHisseIds(new Set());
              setHisseFiyati(0);
              setKaporaAlinacak(null);
              setKaporaNakit(0);
              setKaporaHavale(0);
              setKaporaKart(0);
              setKaporaNot("");
              setSonuc(null);
              setAdim(1);
              setKurbanlar([]); // listeyi tazele
            }}
            className="flex-1 h-12 bg-orange-500 hover:bg-orange-600"
          >
            Yeni Satış
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADIM 1 — MÜŞTERİ
// ============================================================================

function Adim1Musteri({
  musteri,
  setMusteri,
}: {
  musteri: SecMusteri | null;
  setMusteri: (m: SecMusteri | null) => void;
}) {
  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<MusteriArama[]>([]);
  const [yeniMod, setYeniMod] = useState(false);
  const [yeniAd, setYeniAd] = useState("");
  const [yeniTel, setYeniTel] = useState("");
  const [arama_yukleniyor, setAramaYukleniyor] = useState(false);
  const [yeniYukleniyor, setYeniYukleniyor] = useState(false);
  const aramaRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = arama.trim();
    if (q.length < 2) {
      setSonuclar([]);
      return;
    }
    aramaRef.current?.abort();
    const ctrl = new AbortController();
    aramaRef.current = ctrl;
    setAramaYukleniyor(true);
    const t = setTimeout(() => {
      fetch(`/api/musteriler?arama=${encodeURIComponent(q)}&limit=10`, {
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((veri) => {
          if (Array.isArray(veri.liste)) {
            setSonuclar(veri.liste);
          }
        })
        .catch(() => {
          /* sessiz fail */
        })
        .finally(() => setAramaYukleniyor(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [arama]);

  async function yeniMusteriOlustur() {
    const ad = yeniAd.trim();
    if (ad.split(/\s+/).filter((k) => k.length >= 2).length < 2) {
      toast.error("Ad ve soyad ayrı olmalı");
      return;
    }
    if (yeniTel.trim() && !telefonGecerli(yeniTel)) {
      toast.error("Geçerli bir cep numarası girin");
      return;
    }
    setYeniYukleniyor(true);
    try {
      const r = await fetch("/api/musteriler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adSoyad: ad,
          telefon: yeniTel.trim() ? telefonApiFormat(yeniTel) : undefined,
        }),
      });
      const sonuc = (await r.json()) as {
        basarili: boolean;
        id?: string;
        hata?: string;
      };
      if (!r.ok || !sonuc.basarili || !sonuc.id) {
        throw new Error(sonuc.hata ?? "Müşteri kaydı başarısız");
      }
      setMusteri({
        id: sonuc.id,
        adSoyad: ad.toLocaleUpperCase("tr-TR"),
        telefon: yeniTel.trim() ? telefonApiFormat(yeniTel) : null,
        yeniMi: true,
      });
      toast.success(`✓ ${ad} kaydedildi`);
      setYeniMod(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    } finally {
      setYeniYukleniyor(false);
    }
  }

  if (musteri) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <div className="flex-1">
            <div className="font-semibold text-emerald-900">
              {musteri.adSoyad}
            </div>
            <div className="text-xs text-emerald-700">
              {musteri.telefon ?? "Telefon yok"}
              {musteri.yeniMi && " · YENİ KAYIT"}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMusteri(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  if (yeniMod) {
    return (
      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <UserPlus className="h-5 w-5 text-orange-500" />
          Yeni Müşteri
        </h3>
        <div className="space-y-3">
          <div>
            <Label>
              Ad Soyad <span className="text-red-500">*</span>
            </Label>
            <Input
              autoFocus
              value={yeniAd}
              onChange={(e) =>
                setYeniAd(e.target.value.toLocaleUpperCase("tr-TR"))
              }
              placeholder="AHMET YILMAZ"
              className="h-12 text-base"
            />
          </div>
          <div>
            <Label>Telefon (opsiyonel)</Label>
            <Input
              type="tel"
              inputMode="tel"
              value={yeniTel}
              onChange={(e) => setYeniTel(telefonGoster(e.target.value))}
              placeholder="0532 123 45 67"
              className="h-12 font-mono text-base"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={() => setYeniMod(false)}
              disabled={yeniYukleniyor}
              className="flex-1 h-12"
            >
              Vazgeç
            </Button>
            <Button
              onClick={yeniMusteriOlustur}
              disabled={yeniYukleniyor}
              className="flex-1 h-12 bg-orange-500 hover:bg-orange-600"
            >
              {yeniYukleniyor ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              Kaydet
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <Users className="h-5 w-5 text-orange-500" />
        Müşteri Seç
      </h3>

      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          autoFocus
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Ad veya telefon ile ara..."
          className="h-12 pl-9 text-base"
        />
      </div>

      <div className="mt-3 max-h-72 overflow-y-auto">
        {arama_yukleniyor && (
          <div className="text-muted-foreground py-2 text-center text-sm">
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          </div>
        )}
        {sonuclar.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() =>
              setMusteri({
                id: m.id,
                adSoyad: m.adSoyad,
                telefon: m.telefon,
                yeniMi: false,
              })
            }
            className="hover:bg-muted/40 mb-1 flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">
              {m.adSoyad.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{m.adSoyad}</div>
              <div className="text-muted-foreground text-xs">
                {m.telefon ?? "—"}
              </div>
            </div>
            <ChevronRight className="text-muted-foreground h-4 w-4" />
          </button>
        ))}
        {arama.trim().length >= 2 && !arama_yukleniyor && sonuclar.length === 0 && (
          <div className="text-muted-foreground py-3 text-center text-sm">
            Sonuç yok
          </div>
        )}
      </div>

      <Button
        variant="outline"
        onClick={() => setYeniMod(true)}
        className="mt-3 h-12 w-full"
      >
        <UserPlus className="mr-1 h-4 w-4" />
        Yeni Müşteri Oluştur
      </Button>
    </Card>
  );
}

// ============================================================================
// ADIM 2 — KURBAN + HİSSE
// ============================================================================

function Adim2KurbanHisse({
  kurbanlar,
  yukleniyor,
  seciliKurban,
  setSeciliKurban,
  seciliHisseIds,
  setSeciliHisseIds,
}: {
  kurbanlar: BosKurbanRow[];
  yukleniyor: boolean;
  seciliKurban: SecKurban | null;
  setSeciliKurban: (k: SecKurban) => void;
  seciliHisseIds: Set<string>;
  setSeciliHisseIds: (s: Set<string>) => void;
}) {
  if (yukleniyor) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
        <p className="text-muted-foreground mt-2 text-sm">
          Boş hisseli kurbanlar yükleniyor...
        </p>
      </Card>
    );
  }

  if (kurbanlar.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Boş hissesi olan kurban yok.
        </p>
      </Card>
    );
  }

  function hisseToggle(hisseId: string) {
    const yeni = new Set(seciliHisseIds);
    if (yeni.has(hisseId)) yeni.delete(hisseId);
    else yeni.add(hisseId);
    setSeciliHisseIds(yeni);
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 font-semibold">Kurban Seç</h3>
      <div className="max-h-60 space-y-2 overflow-y-auto">
        {kurbanlar.map((k) => {
          const aktif = seciliKurban?.id === k.id;
          return (
            <button
              key={k.id}
              type="button"
              onClick={() =>
                setSeciliKurban({
                  id: k.id,
                  kesimSirasi: k.kesimSirasi,
                  hisseFiyati: k.hisseFiyati,
                  bosHisseIds: k.bosHisseIds,
                  bosHisseNumaralari: k.bosHisseNumaralari,
                })
              }
              className={cn(
                "flex w-full items-center gap-3 rounded-md border-2 p-3 text-left transition-all",
                aktif
                  ? "border-orange-500 bg-orange-50"
                  : "hover:bg-muted/40 border-border",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg font-bold",
                  aktif
                    ? "bg-orange-500 text-white"
                    : "bg-orange-100 text-orange-700",
                )}
              >
                {k.kesimSirasi}
              </div>
              <div className="flex-1">
                <div className="font-semibold">DANA-{k.kesimSirasi}</div>
                <div className="text-muted-foreground text-xs">
                  {k.bosHisseIds.length} boş hisse ·{" "}
                  {k.hisseFiyati > 0 ? formatPara(k.hisseFiyati) : "Fiyat yok"}
                </div>
              </div>
              {aktif && <CheckCircle2 className="h-5 w-5 text-orange-500" />}
            </button>
          );
        })}
      </div>

      {seciliKurban && (
        <div className="mt-4 border-t pt-3">
          <h4 className="mb-2 text-sm font-semibold">
            Hangi hisseler? ({seciliHisseIds.size}/
            {seciliKurban.bosHisseIds.length})
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {seciliKurban.bosHisseIds.map((hisseId, idx) => {
              const hisseNo = seciliKurban.bosHisseNumaralari[idx]!;
              const aktif = seciliHisseIds.has(hisseId);
              return (
                <button
                  key={hisseId}
                  type="button"
                  onClick={() => hisseToggle(hisseId)}
                  className={cn(
                    "flex h-12 items-center justify-center rounded-md border-2 font-semibold transition-all",
                    aktif
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-border bg-white hover:border-orange-300",
                  )}
                >
                  H{hisseNo}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// ADIM 3 — FİYAT
// ============================================================================

function Adim3Fiyat({
  seciliKurban,
  hisseAdedi,
  hisseFiyati,
  setHisseFiyati,
  toplamBedel,
}: {
  seciliKurban: SecKurban;
  hisseAdedi: number;
  hisseFiyati: number;
  setHisseFiyati: (n: number) => void;
  toplamBedel: number;
}) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 font-semibold">Hisse Fiyatı</h3>
      <div className="mb-3 rounded-lg bg-orange-50 p-3 text-sm">
        <div>
          DANA-{seciliKurban.kesimSirasi} · {hisseAdedi} hisse
        </div>
        {seciliKurban.hisseFiyati > 0 && (
          <div className="text-muted-foreground mt-1 text-xs">
            Önerilen fiyat: {formatPara(seciliKurban.hisseFiyati)}
          </div>
        )}
      </div>

      <div>
        <Label>Bir hisse fiyatı (TL)</Label>
        <Input
          type="text"
          inputMode="decimal"
          value={hisseFiyati || ""}
          onChange={(e) => setHisseFiyati(parsePara(e.target.value))}
          placeholder="0"
          className="h-14 text-xl font-bold tabular-nums"
        />
      </div>

      <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-center">
        <div className="text-xs font-semibold uppercase text-emerald-700">
          Toplam Bedel
        </div>
        <div className="mt-1 text-3xl font-bold text-emerald-700 tabular-nums">
          {formatPara(toplamBedel)}
        </div>
        <div className="text-muted-foreground mt-1 text-xs">
          {formatPara(hisseFiyati)} × {hisseAdedi} hisse
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// ADIM 4 — KAPORA
// ============================================================================

function Adim4Kapora({
  toplamBedel,
  kaporaAlinacak,
  setKaporaAlinacak,
  nakit,
  setNakit,
  havale,
  setHavale,
  kart,
  setKart,
  notlar,
  setNotlar,
}: {
  toplamBedel: number;
  kaporaAlinacak: boolean | null;
  setKaporaAlinacak: (b: boolean) => void;
  nakit: number;
  setNakit: (n: number) => void;
  havale: number;
  setHavale: (n: number) => void;
  kart: number;
  setKart: (n: number) => void;
  notlar: string;
  setNotlar: (s: string) => void;
}) {
  const toplam = nakit + havale + kart;
  const fazla = toplam > toplamBedel;

  if (kaporaAlinacak === null) {
    return (
      <Card className="p-4">
        <h3 className="mb-3 font-semibold">Şimdi kapora alınacak mı?</h3>
        <div className="space-y-2">
          <Button
            onClick={() => setKaporaAlinacak(true)}
            className="h-16 w-full justify-start bg-emerald-600 text-base hover:bg-emerald-700"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Evet, kapora al
          </Button>
          <Button
            variant="outline"
            onClick={() => setKaporaAlinacak(false)}
            className="h-16 w-full justify-start text-base"
          >
            <ChevronRight className="mr-2 h-5 w-5" />
            Sonra alacağım, devam
          </Button>
        </div>
      </Card>
    );
  }

  if (!kaporaAlinacak) {
    return (
      <Card className="border-amber-200 bg-amber-50 p-4">
        <h3 className="mb-2 font-semibold text-amber-900">
          Kapora alınmayacak
        </h3>
        <p className="text-sm text-amber-700">
          Müşteri hisseleri sahiplendi, borç hesabı açıldı. Daha sonra
          tahsilat sayfasından ödeme alabilirsiniz.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setKaporaAlinacak(true)}
          className="mt-2"
        >
          Vazgeç, şimdi al
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Kapora Tutarları</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setKaporaAlinacak(false)}
          className="text-xs"
        >
          Kaporasız geç
        </Button>
      </div>

      <div className="mb-3 rounded-lg bg-orange-50 p-3 text-sm">
        Toplam bedel: <strong>{formatPara(toplamBedel)}</strong>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Nakit</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={nakit || ""}
            onChange={(e) => setNakit(parsePara(e.target.value))}
            placeholder="0"
            className="h-12 text-lg font-semibold tabular-nums"
          />
        </div>
        <div>
          <Label>Havale</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={havale || ""}
            onChange={(e) => setHavale(parsePara(e.target.value))}
            placeholder="0"
            className="h-12 text-lg font-semibold tabular-nums"
          />
        </div>
        <div>
          <Label>Kart</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={kart || ""}
            onChange={(e) => setKart(parsePara(e.target.value))}
            placeholder="0"
            className="h-12 text-lg font-semibold tabular-nums"
          />
        </div>
        <div>
          <Label>Not (opsiyonel)</Label>
          <Textarea
            value={notlar}
            onChange={(e) => setNotlar(e.target.value)}
            placeholder="Saha satış kapora"
            rows={2}
          />
        </div>
      </div>

      <div
        className={cn(
          "mt-4 rounded-lg p-3 text-center",
          fazla ? "bg-red-50" : "bg-emerald-50",
        )}
      >
        <div className="text-xs font-semibold uppercase">
          Kapora Toplamı
        </div>
        <div
          className={cn(
            "mt-1 text-2xl font-bold tabular-nums",
            fazla ? "text-red-700" : "text-emerald-700",
          )}
        >
          {formatPara(toplam)}
        </div>
        {fazla && (
          <div className="text-xs text-red-600">
            ⚠ Bedeli ({formatPara(toplamBedel)}) aşıyor
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// ADIM 5 — SONUÇ
// ============================================================================

function Adim5Sonuc({
  musteri,
  seciliKurban,
  hisseAdedi,
  hisseFiyati,
  toplamBedel,
  kaporaToplam,
  tamamlandi,
  musteriId,
}: {
  musteri: SecMusteri | null;
  seciliKurban: SecKurban | null;
  hisseAdedi: number;
  hisseFiyati: number;
  toplamBedel: number;
  kaporaToplam: number;
  tamamlandi: boolean;
  musteriId: string | undefined;
}) {
  if (tamamlandi) {
    return (
      <Card className="border-emerald-300 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
        <h3 className="mt-3 text-xl font-bold text-emerald-900">
          Satış Tamamlandı
        </h3>
        <p className="mt-1 text-sm text-emerald-700">
          {musteri?.adSoyad} · DANA-{seciliKurban?.kesimSirasi} · {hisseAdedi}{" "}
          hisse
        </p>
        <div className="mt-3 rounded-lg bg-white p-3 text-sm">
          <div className="flex justify-between">
            <span>Toplam Bedel</span>
            <strong>{formatPara(toplamBedel)}</strong>
          </div>
          {kaporaToplam > 0 && (
            <>
              <div className="flex justify-between text-emerald-700">
                <span>Kapora Alındı</span>
                <strong>{formatPara(kaporaToplam)}</strong>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span>Kalan Borç</span>
                <strong className="text-red-600">
                  {formatPara(toplamBedel - kaporaToplam)}
                </strong>
              </div>
            </>
          )}
        </div>
        {musteriId && (
          <Link
            href={`/musteriler/${musteriId}`}
            className="mt-3 inline-block text-sm font-medium text-orange-600 underline"
          >
            Müşteri detayını görüntüle →
          </Link>
        )}
      </Card>
    );
  }

  // Henüz tamamlanmadı — özet onay ekranı (adım 4'te "Tamamla" tıklanır)
  return (
    <Card className="p-4">
      <h3 className="mb-3 font-semibold">Özet</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Müşteri</span>
          <strong>{musteri?.adSoyad}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Kurban</span>
          <strong>DANA-{seciliKurban?.kesimSirasi}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Hisse</span>
          <strong>{hisseAdedi} adet</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Birim Fiyat</span>
          <strong>{formatPara(hisseFiyati)}</strong>
        </div>
        <div className="flex justify-between border-t pt-2">
          <span>Toplam Bedel</span>
          <strong className="text-emerald-700">
            {formatPara(toplamBedel)}
          </strong>
        </div>
        {kaporaToplam > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kapora</span>
            <strong>{formatPara(kaporaToplam)}</strong>
          </div>
        )}
      </div>
    </Card>
  );
}
