"use client";

/**
 * Kesim Listesi yazdırma öncesi filtre seçim ekranı.
 *
 * Liste birimi KURBAN bazlıdır: bir dana filtreyi sağlıyorsa TÜM 7 hissedarıyla
 * listede yer alır. Bayram günü "borçlu telefon listesi" ve "teslim edilecekler"
 * gibi kombine raporlar için.
 *
 * Server'dan gelen ön-hesaplı özet ile preview/sayım yapılır; "Yazdır"
 * basıldığında `?odeme=...&teslim=...` ile mevcut yazdırma sayfasına gidilir.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  Filter,
  CheckCircle2,
  AlertCircle,
  Package,
  PackageCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface KurbanOzet {
  id: string;
  kesimSirasi: number;
  kupeNo: string | null;
  atanmisHisseSayisi: number;
  borcluHisseSayisi: number;
  teslimEdilmemisHisseSayisi: number;
  toplamBedel: number;
  toplamOdenen: number;
  toplamBorc: number;
}

type OdemeFiltre = "tumu" | "borclular" | "odenmis";
type TeslimFiltre = "tumu" | "teslim_edilmedi" | "teslim_edildi";
type Renk = "red" | "emerald" | "amber" | "stone";

const KART_SAYFA_BASI = 4;

interface Props {
  ozet: KurbanOzet[];
}

export function KesimListesiFiltreClient({ ozet }: Props) {
  const router = useRouter();
  const [odemeFiltre, setOdemeFiltre] = useState<OdemeFiltre>("tumu");
  const [teslimFiltre, setTeslimFiltre] = useState<TeslimFiltre>("tumu");

  const filtreliKurbanlar = useMemo(() => {
    return ozet.filter((k) => {
      if (k.atanmisHisseSayisi === 0) return false;

      if (odemeFiltre === "borclular" && k.borcluHisseSayisi === 0) return false;
      if (odemeFiltre === "odenmis" && k.borcluHisseSayisi > 0) return false;

      if (teslimFiltre === "teslim_edilmedi" && k.teslimEdilmemisHisseSayisi === 0)
        return false;
      if (teslimFiltre === "teslim_edildi" && k.teslimEdilmemisHisseSayisi > 0)
        return false;

      return true;
    });
  }, [ozet, odemeFiltre, teslimFiltre]);

  const toplam = useMemo(() => {
    return {
      kurbanSayisi: filtreliKurbanlar.length,
      tumKurbanSayisi: ozet.length,
      toplamBorc: filtreliKurbanlar.reduce((s, k) => s + k.toplamBorc, 0),
      borcluHisseTutari: filtreliKurbanlar.reduce(
        (s, k) => s + k.borcluHisseSayisi,
        0,
      ),
    };
  }, [filtreliKurbanlar, ozet]);

  const sayfaSayisi = Math.ceil(toplam.kurbanSayisi / KART_SAYFA_BASI);

  function yazdir() {
    const params = new URLSearchParams();
    if (odemeFiltre !== "tumu") params.set("odeme", odemeFiltre);
    if (teslimFiltre !== "tumu") params.set("teslim", teslimFiltre);
    const query = params.toString();
    router.push(`/raporlar/kesim-listesi${query ? "?" + query : ""}`);
  }

  function presetBorclu() {
    setOdemeFiltre("borclular");
    setTeslimFiltre("tumu");
  }

  function presetTeslimEdilecek() {
    setOdemeFiltre("odenmis");
    setTeslimFiltre("teslim_edilmedi");
  }

  function presetTumu() {
    setOdemeFiltre("tumu");
    setTeslimFiltre("tumu");
  }

  const bosSonuc = toplam.kurbanSayisi === 0;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Kesim Listesi Yazdır
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Önce filtreleri seçin, ardından yazdırın. Filtreler{" "}
          <strong>kurban (dana) bazlıdır</strong> — bir dana filtreyi
          sağlıyorsa tüm hissedarlarıyla listede yer alır.
        </p>
      </header>

      {/* HIZLI ÖNAYAR BUTONLARI */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <PresetButton
          onClick={presetBorclu}
          aktif={odemeFiltre === "borclular" && teslimFiltre === "tumu"}
          ikon={<AlertCircle className="size-4" />}
          baslik="Borçlular Listesi"
          aciklama="En az 1 hissesi ödenmemiş danalar"
          renk="red"
        />
        <PresetButton
          onClick={presetTeslimEdilecek}
          aktif={odemeFiltre === "odenmis" && teslimFiltre === "teslim_edilmedi"}
          ikon={<Package className="size-4" />}
          baslik="Teslim Edilecekler"
          aciklama="Tamamı ödenmiş, henüz teslim edilmemiş"
          renk="amber"
        />
        <PresetButton
          onClick={presetTumu}
          aktif={odemeFiltre === "tumu" && teslimFiltre === "tumu"}
          ikon={<Users className="size-4" />}
          baslik="Tümü"
          aciklama="Tüm danaların kesim listesi"
          renk="stone"
        />
      </div>

      {/* MANUEL FİLTRELER */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="text-muted-foreground size-4" />
          <h2 className="text-base font-semibold">Manuel Filtreler</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <fieldset>
            <legend className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
              ÖDEME DURUMU
            </legend>
            <div className="flex flex-col gap-2">
              <FiltreRadio
                name="odeme"
                value="tumu"
                checked={odemeFiltre === "tumu"}
                onChange={() => setOdemeFiltre("tumu")}
                label="Tümü"
                renk="stone"
              />
              <FiltreRadio
                name="odeme"
                value="borclular"
                checked={odemeFiltre === "borclular"}
                onChange={() => setOdemeFiltre("borclular")}
                label="Borçlular (en az 1 hisse borçlu)"
                renk="red"
              />
              <FiltreRadio
                name="odeme"
                value="odenmis"
                checked={odemeFiltre === "odenmis"}
                onChange={() => setOdemeFiltre("odenmis")}
                label="Tamamı Ödenmiş (tüm hisseler tam)"
                renk="emerald"
              />
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
              TESLİM DURUMU
            </legend>
            <div className="flex flex-col gap-2">
              <FiltreRadio
                name="teslim"
                value="tumu"
                checked={teslimFiltre === "tumu"}
                onChange={() => setTeslimFiltre("tumu")}
                label="Tümü"
                renk="stone"
              />
              <FiltreRadio
                name="teslim"
                value="teslim_edilmedi"
                checked={teslimFiltre === "teslim_edilmedi"}
                onChange={() => setTeslimFiltre("teslim_edilmedi")}
                label="Teslim Edilmedi (en az 1 hisse bekliyor)"
                renk="amber"
              />
              <FiltreRadio
                name="teslim"
                value="teslim_edildi"
                checked={teslimFiltre === "teslim_edildi"}
                onChange={() => setTeslimFiltre("teslim_edildi")}
                label="Tamamı Teslim Edildi"
                renk="emerald"
              />
            </div>
          </fieldset>
        </div>
      </Card>

      {/* ÖNIZLEME — SAYIM */}
      <Card
        className={`mb-6 p-5 ${
          bosSonuc
            ? "border-amber-300 bg-amber-50"
            : "border-emerald-300 bg-emerald-50"
        }`}
      >
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2
            className={`size-4 ${
              bosSonuc ? "text-amber-600" : "text-emerald-600"
            }`}
          />
          <h2 className="text-base font-semibold">Yazdırma Önizlemesi</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <PreviewMetric
            etiket="Filtreli Dana"
            deger={
              <>
                {toplam.kurbanSayisi}
                <span className="text-muted-foreground ml-1 text-sm font-normal">
                  / {toplam.tumKurbanSayisi}
                </span>
              </>
            }
          />
          <PreviewMetric etiket="A4 Sayfa" deger={sayfaSayisi} />
          {odemeFiltre === "borclular" && (
            <>
              <PreviewMetric
                etiket="Borçlu Hisse"
                deger={toplam.borcluHisseTutari}
              />
              <PreviewMetric
                etiket="Toplam Borç"
                deger={`₺${toplam.toplamBorc.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`}
              />
            </>
          )}
        </div>

        {bosSonuc && (
          <p className="text-amber-800 mt-3 text-sm">
            ⚠️ Bu filtrelerle eşleşen dana yok. Filtreyi değiştirip tekrar
            deneyin.
          </p>
        )}
      </Card>

      {/* AKSİYON BUTONLARI */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          İptal
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={yazdir}
          disabled={bosSonuc}
          className="gap-2 bg-orange-600 text-white hover:bg-orange-700"
        >
          <Printer className="size-4" />
          Yazdır ({toplam.kurbanSayisi} dana)
        </Button>
      </div>
    </div>
  );
}

function PresetButton({
  onClick,
  aktif,
  ikon,
  baslik,
  aciklama,
  renk,
}: {
  onClick: () => void;
  aktif: boolean;
  ikon: React.ReactNode;
  baslik: string;
  aciklama: string;
  renk: Renk;
}) {
  const stil = RENK_STILLERI[renk];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all ${
        aktif
          ? `${stil.aktifBorder} ${stil.aktifBg}`
          : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >
      <span
        className={`flex items-center gap-2 text-sm font-semibold ${
          aktif ? stil.aktifMetin : "text-stone-900"
        }`}
      >
        {ikon}
        {baslik}
      </span>
      <span className="text-muted-foreground text-xs">{aciklama}</span>
    </button>
  );
}

function FiltreRadio({
  name,
  value,
  checked,
  onChange,
  label,
  renk,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  renk: Renk;
}) {
  const stil = RENK_STILLERI[renk];
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-md border-2 p-3 text-sm transition-colors ${
        checked
          ? `${stil.aktifBorder} ${stil.aktifBg} ${stil.aktifMetin}`
          : "border-stone-200 bg-white hover:bg-stone-50"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="size-4"
      />
      <span className="flex-1">{label}</span>
      {checked && <PackageCheck className="size-4" />}
    </label>
  );
}

function PreviewMetric({
  etiket,
  deger,
}: {
  etiket: string;
  deger: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {etiket}
      </span>
      <span className="font-tabular text-2xl font-bold">{deger}</span>
    </div>
  );
}

const RENK_STILLERI: Record<
  Renk,
  { aktifBorder: string; aktifBg: string; aktifMetin: string }
> = {
  red: {
    aktifBorder: "border-red-400",
    aktifBg: "bg-red-50",
    aktifMetin: "text-red-900",
  },
  emerald: {
    aktifBorder: "border-emerald-400",
    aktifBg: "bg-emerald-50",
    aktifMetin: "text-emerald-900",
  },
  amber: {
    aktifBorder: "border-amber-400",
    aktifBg: "bg-amber-50",
    aktifMetin: "text-amber-900",
  },
  stone: {
    aktifBorder: "border-stone-400",
    aktifBg: "bg-stone-50",
    aktifMetin: "text-stone-900",
  },
};
