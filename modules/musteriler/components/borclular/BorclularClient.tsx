"use client";

/**
 * Borçlular ana ekranı — tahsilat odaklı (SPRINT 12).
 *
 * Eklemeler:
 *  - KPI Banner (toplam/sayı/ortalama/tahsilat oranı + progress)
 *  - Sekmeli durum filtresi (Hepsi / Hiç Ödeme / Kısmi / Yakın Tamamlanan)
 *  - Aralık filtresi (5 hızlı buton + Min-Max manuel)
 *  - 6 sıralama opsiyonu (borç ↓↑, ad, öncelik, yaş, yüzde)
 *  - Kart-stili satır: avatar + durum + yaş + progress + öncelik yıldız
 *  - Yazdırma menüsü (3 profil — saha/telefon/kapı)
 *  - Toplu WhatsApp: 3 hard-coded şablon + batch 3'er gönderim
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckSquare,
  FileSpreadsheet,
  Filter,
  MessageCircle,
  Phone,
  Printer,
  Search,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/shared/lib/utils";
import { formatPara } from "@/shared/lib/para";
import { avatarGradient } from "@/modules/dashboard/types";
import type { BorcluSatir } from "@/modules/raporlar/lib/rapor.service";

type DurumFiltresi = "hepsi" | "hic-odeme" | "kismi" | "yakin-tamamlanan";
type TelefonFiltre = "hepsi" | "var" | "yok";
type Siralama =
  | "borc"
  | "borc-asc"
  | "ad"
  | "oncelik"
  | "yas"
  | "yuzde";

interface BorclularClientProps {
  borclular: BorcluSatir[];
  tumEtiketler: string[];
}

const HIZLI_ARALIKLAR: ReadonlyArray<{
  label: string;
  min: number;
  max: number | null;
}> = [
  { label: "Hepsi", min: 0, max: null },
  { label: "1K - 5K", min: 1000, max: 5000 },
  { label: "5K - 15K", min: 5000, max: 15000 },
  { label: "15K - 50K", min: 15000, max: 50000 },
  { label: "50K+", min: 50000, max: null },
];

const SIRALAMA_OPSIYONLARI: ReadonlyArray<{ value: Siralama; label: string }> = [
  { value: "borc", label: "Kalan Borç (en yüksek)" },
  { value: "borc-asc", label: "Kalan Borç (en düşük)" },
  { value: "ad", label: "Ad Soyad (A-Z)" },
  { value: "oncelik", label: "Tahsilat Önceliği" },
  { value: "yas", label: "Borç Yaşı (en eski)" },
  { value: "yuzde", label: "Ödeme Yüzdesi" },
];

interface WhatsAppSablon {
  id: string;
  ad: string;
  aciklama: string;
  mesaj: (ad: string, kalan: number, kurbanlar: ReadonlyArray<string>) => string;
}

const WHATSAPP_SABLONLARI: ReadonlyArray<WhatsAppSablon> = [
  {
    id: "hatirlatma",
    ad: "1. Hatırlatma (Kibar)",
    aciklama: "İlk hatırlatma için profesyonel ton",
    mesaj: (ad, kalan, kurbanlar) =>
      `Sayın ${ad},\n\nAda Bereket Hayvancılık olarak size hatırlatmak isteriz. ${kurbanlar.join(", ")} kurbanlığınız için ${formatPara(kalan)} kalan bakiyeniz bulunmaktadır.\n\nUygun bir zamanda iletişime geçmenizi rica ederiz.\n\nİyi günler.`,
  },
  {
    id: "takip",
    ad: "2. Takip (Bekleyen)",
    aciklama: "1 ay sonra takip için",
    mesaj: (ad, kalan, kurbanlar) =>
      `Sayın ${ad},\n\n${kurbanlar.join(", ")} kurbanınız ile ilgili ${formatPara(kalan)} ödemenizi bekliyoruz.\n\nLütfen en kısa zamanda iletişime geçiniz.\n\nAda Bereket Hayvancılık`,
  },
  {
    id: "son-uyari",
    ad: "3. Son Uyarı",
    aciklama: "Uzun süredir ödeme yok",
    mesaj: (ad, kalan, kurbanlar) =>
      `Sayın ${ad},\n\n${kurbanlar.join(", ")} kurbanınızın ${formatPara(kalan)} bakiyesi hâlâ ödenmemiştir. Lütfen 3 gün içinde tarafımızla iletişime geçiniz.\n\nAda Bereket Hayvancılık`,
  },
];

function waLinkUret(telefon: string, mesaj: string): string {
  const rakam = telefon.replace(/\D/g, "");
  // 0 ile başlıyorsa 90 ile değiştir
  const normalize = rakam.startsWith("0")
    ? "9" + rakam
    : rakam.startsWith("90")
      ? rakam
      : "90" + rakam;
  return `https://wa.me/${normalize}?text=${encodeURIComponent(mesaj)}`;
}

export function BorclularClient({
  borclular,
  tumEtiketler,
}: BorclularClientProps) {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [durumFiltre, setDurumFiltre] = useState<DurumFiltresi>("hepsi");
  const [minBorc, setMinBorc] = useState<number>(0);
  const [maxBorc, setMaxBorc] = useState<number | null>(null);
  const [telefonFiltre, setTelefonFiltre] = useState<TelefonFiltre>("hepsi");
  const [etiketFiltre, setEtiketFiltre] = useState<Set<string>>(new Set());
  const [siralama, setSiralama] = useState<Siralama>("borc");
  const [secili, setSecili] = useState<Set<string>>(new Set());

  // Tüm istatistikler (sekme sayaçları + KPI banner)
  const tumIstatistikler = useMemo(() => {
    const toplamBedel = borclular.reduce((s, b) => s + b.toplamBedel, 0);
    const toplamOdenen = borclular.reduce((s, b) => s + b.toplamOdenen, 0);
    const toplamBorc = borclular.reduce((s, b) => s + b.kalan, 0);
    return {
      hepsi: borclular.length,
      hicOdeme: borclular.filter((b) => b.borcDurumu === "hic-odeme").length,
      kismi: borclular.filter((b) => b.borcDurumu === "kismi").length,
      yakinTamamlanan: borclular.filter(
        (b) => b.borcDurumu === "yakin-tamamlanan",
      ).length,
      toplamBorc,
      toplamBedel,
      toplamOdenen,
      tahsilatOrani:
        toplamBedel > 0 ? Math.round((toplamOdenen / toplamBedel) * 100) : 0,
    };
  }, [borclular]);

  const filtreli = useMemo(() => {
    let liste = [...borclular];

    // Arama
    const q = arama.trim().toLowerCase();
    if (q) {
      liste = liste.filter(
        (b) =>
          b.adSoyad.toLowerCase().includes(q) ||
          b.telefon?.toLowerCase().includes(q),
      );
    }

    // Durum sekmesi
    if (durumFiltre !== "hepsi") {
      liste = liste.filter((b) => b.borcDurumu === durumFiltre);
    }

    // Aralık
    if (minBorc > 0) {
      liste = liste.filter((b) => b.kalan >= minBorc);
    }
    if (maxBorc !== null) {
      liste = liste.filter((b) => b.kalan <= maxBorc);
    }

    // Telefon
    if (telefonFiltre === "var") {
      liste = liste.filter((b) => b.telefon && b.telefon.trim().length > 0);
    } else if (telefonFiltre === "yok") {
      liste = liste.filter((b) => !b.telefon || b.telefon.trim().length === 0);
    }

    // Etiket
    if (etiketFiltre.size > 0) {
      liste = liste.filter((b) =>
        b.etiketler.some((e) => etiketFiltre.has(e)),
      );
    }

    // Sıralama
    if (siralama === "ad") {
      liste.sort((a, b) => a.adSoyad.localeCompare(b.adSoyad, "tr"));
    } else if (siralama === "borc-asc") {
      liste.sort((a, b) => a.kalan - b.kalan);
    } else if (siralama === "oncelik") {
      liste.sort((a, b) => b.oncelikSkoru - a.oncelikSkoru);
    } else if (siralama === "yas") {
      liste.sort((a, b) => b.gunlukYaslandirma - a.gunlukYaslandirma);
    } else if (siralama === "yuzde") {
      liste.sort((a, b) => a.odenmeYuzdesi - b.odenmeYuzdesi);
    } else {
      liste.sort((a, b) => b.kalan - a.kalan);
    }

    return liste;
  }, [
    borclular,
    arama,
    durumFiltre,
    minBorc,
    maxBorc,
    telefonFiltre,
    etiketFiltre,
    siralama,
  ]);

  function etiketToggle(e: string) {
    setEtiketFiltre((eski) => {
      const yeni = new Set(eski);
      if (yeni.has(e)) yeni.delete(e);
      else yeni.add(e);
      return yeni;
    });
  }

  function birSec(id: string) {
    setSecili((eski) => {
      const yeni = new Set(eski);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      return yeni;
    });
  }

  function tumunuSec() {
    const telefonlular = filtreli
      .filter((b) => b.telefon && b.telefon.trim().length > 0)
      .map((b) => b.musteriId);
    if (
      telefonlular.length > 0 &&
      telefonlular.every((id) => secili.has(id))
    ) {
      setSecili(new Set());
    } else {
      setSecili(new Set(telefonlular));
    }
  }

  function seciliyeWaWizard() {
    if (secili.size === 0) {
      toast.error("Önce müşteri seçin");
      return;
    }
    router.push(
      `/whatsapp/toplu?durum=borclu&ids=${Array.from(secili).join(",")}`,
    );
  }

  function topluWhatsappGonder(sablonId: string) {
    const sablon = WHATSAPP_SABLONLARI.find((s) => s.id === sablonId);
    if (!sablon) return;

    const seciliList = filtreli.filter((b) => secili.has(b.musteriId));
    const telefonlular = seciliList.filter(
      (b) => b.telefon && b.telefon.trim().length > 0,
    );
    const telefonsuzlar = seciliList.length - telefonlular.length;

    if (telefonlular.length === 0) {
      toast.error("Seçilenlerin hiçbirinde telefon yok");
      return;
    }
    if (telefonsuzlar > 0) {
      toast.warning(`${telefonsuzlar} müşterinin telefonu yok, atlanacak`);
    }

    let acilan = 0;
    const batch = 3;

    function sonrakiBatch() {
      const grup = telefonlular.slice(acilan, acilan + batch);
      if (grup.length === 0) {
        toast.success(`✓ Tüm ${telefonlular.length} mesaj açıldı`);
        setSecili(new Set());
        return;
      }

      grup.forEach((b) => {
        if (!b.telefon || !sablon) return;
        const metin = sablon.mesaj(b.adSoyad, b.kalan, b.kurbanlar);
        window.open(waLinkUret(b.telefon, metin), "_blank", "noopener,noreferrer");
      });

      acilan += batch;

      if (acilan < telefonlular.length) {
        toast.info(
          `${acilan}/${telefonlular.length} açıldı. Devam için tıklayın.`,
          {
            action: { label: "Devam", onClick: sonrakiBatch },
            duration: 60000,
          },
        );
      } else {
        toast.success(`✓ Tüm ${telefonlular.length} mesaj açıldı`);
        setSecili(new Set());
      }
    }

    sonrakiBatch();
  }

  const aktifFiltreVarMi =
    arama.length > 0 ||
    durumFiltre !== "hepsi" ||
    minBorc > 0 ||
    maxBorc !== null ||
    telefonFiltre !== "hepsi" ||
    etiketFiltre.size > 0;

  function filtreleriTemizle() {
    setArama("");
    setDurumFiltre("hepsi");
    setMinBorc(0);
    setMaxBorc(null);
    setTelefonFiltre("hepsi");
    setEtiketFiltre(new Set());
  }

  const seciliToplamBorc = useMemo(() => {
    return Array.from(secili).reduce((s, id) => {
      const b = borclular.find((x) => x.musteriId === id);
      return s + (b?.kalan ?? 0);
    }, 0);
  }, [secili, borclular]);

  return (
    <div className="pb-32">
      {/* KPI BANNER */}
      <Card className="mb-4 border-orange-200 bg-linear-to-br from-orange-50 to-white">
        <div className="p-4">
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Toplam Borç
              </p>
              <p className="font-tabular text-2xl font-bold text-red-600">
                {formatPara(tumIstatistikler.toplamBorc)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Borçlu Sayısı
              </p>
              <p className="font-tabular text-2xl font-bold">
                {tumIstatistikler.hepsi}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ortalama Borç
              </p>
              <p className="font-tabular text-2xl font-bold">
                {formatPara(
                  tumIstatistikler.toplamBorc /
                    Math.max(tumIstatistikler.hepsi, 1),
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tahsilat Oranı
              </p>
              <p className="font-tabular text-2xl font-bold text-emerald-600">
                %{tumIstatistikler.tahsilatOrani}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-linear-to-r from-emerald-400 to-emerald-600 transition-all"
                style={{ width: `${tumIstatistikler.tahsilatOrani}%` }}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {formatPara(tumIstatistikler.toplamOdenen)} /{" "}
              {formatPara(tumIstatistikler.toplamBedel)} tahsil edildi
            </p>
          </div>
        </div>
      </Card>

      {/* DURUM SEKMELERİ */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-muted/30 p-1">
        {[
          {
            id: "hepsi" as const,
            label: "Hepsi",
            sayi: tumIstatistikler.hepsi,
            aktifSinif: "bg-orange-500 text-white shadow-sm",
            hoverSinif: "hover:bg-orange-50",
          },
          {
            id: "hic-odeme" as const,
            label: "Hiç Ödeme",
            sayi: tumIstatistikler.hicOdeme,
            aktifSinif: "bg-red-500 text-white shadow-sm",
            hoverSinif: "hover:bg-red-50",
          },
          {
            id: "kismi" as const,
            label: "Kısmi",
            sayi: tumIstatistikler.kismi,
            aktifSinif: "bg-amber-500 text-white shadow-sm",
            hoverSinif: "hover:bg-amber-50",
          },
          {
            id: "yakin-tamamlanan" as const,
            label: "Yakın Tamamlanan",
            sayi: tumIstatistikler.yakinTamamlanan,
            aktifSinif: "bg-emerald-500 text-white shadow-sm",
            hoverSinif: "hover:bg-emerald-50",
          },
        ].map((sekme) => {
          const aktif = durumFiltre === sekme.id;
          return (
            <button
              key={sekme.id}
              type="button"
              onClick={() => setDurumFiltre(sekme.id)}
              className={cn(
                "flex-1 min-w-35 rounded-md px-3 py-2 text-sm font-semibold transition-all",
                aktif
                  ? sekme.aktifSinif
                  : `bg-white text-foreground ${sekme.hoverSinif}`,
              )}
            >
              {sekme.label} ({sekme.sayi})
            </button>
          );
        })}
      </div>

      {/* ÜST FİLTRE BAR */}
      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3">
          {/* Arama + aksiyon butonları */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={14}
                className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2"
              />
              <Input
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                placeholder="Müşteri / telefon ara"
                className="h-9 pl-8 text-sm"
              />
              {arama && (
                <button
                  type="button"
                  onClick={() => setArama("")}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                  aria-label="Aramayı temizle"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <Select
              value={siralama}
              onValueChange={(v) => setSiralama(v as Siralama)}
            >
              <SelectTrigger className="h-9 w-full sm:w-55">
                <SelectValue placeholder="Sıralama" />
              </SelectTrigger>
              <SelectContent>
                {SIRALAMA_OPSIYONLARI.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Printer size={14} className="mr-1.5" />
                Yazdır
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Yazdırma Profili</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex flex-col items-start"
                  onClick={() =>
                    window.open(
                      "/musteriler/borclular/yazdir?profil=saha",
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  <span className="font-semibold">🎯 Sahaya Çıkış Listesi</span>
                  <span className="text-xs text-muted-foreground">
                    Telefonlu, öncelikli sıralı
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex flex-col items-start"
                  onClick={() =>
                    window.open(
                      "/musteriler/borclular/yazdir?profil=telefon",
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  <span className="font-semibold">📞 Telefon Aramaları</span>
                  <span className="text-xs text-muted-foreground">
                    Alfabetik
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex flex-col items-start"
                  onClick={() =>
                    window.open(
                      "/musteriler/borclular/yazdir?profil=kapi",
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  <span className="font-semibold">🚪 Kapı Kapı Listesi</span>
                  <span className="text-xs text-muted-foreground">
                    Telefonsuzlar, alfabetik
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <a
              href="/api/raporlar/borclular/excel"
              className={
                buttonVariants({ variant: "outline", size: "sm" }) + " gap-1.5"
              }
            >
              <FileSpreadsheet size={14} />
              Excel
            </a>
          </div>

          {/* Aralık filtresi */}
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/20 p-3">
            <span className="flex items-center gap-1 text-sm font-semibold text-muted-foreground">
              <Filter size={12} />
              Borç aralığı:
            </span>
            {HIZLI_ARALIKLAR.map((aralik) => {
              const aktif = minBorc === aralik.min && maxBorc === aralik.max;
              return (
                <Button
                  key={aralik.label}
                  variant={aktif ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setMinBorc(aralik.min);
                    setMaxBorc(aralik.max);
                  }}
                  className={
                    aktif ? "bg-orange-500 hover:bg-orange-600" : "h-8"
                  }
                >
                  {aralik.label}
                </Button>
              );
            })}

            <div className="ml-auto flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Min ₺"
                value={minBorc || ""}
                onChange={(e) => setMinBorc(Number(e.target.value) || 0)}
                className="h-8 w-28"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Max ₺"
                value={maxBorc ?? ""}
                onChange={(e) =>
                  setMaxBorc(e.target.value ? Number(e.target.value) : null)
                }
                className="h-8 w-28"
              />
            </div>
          </div>

          {/* Telefon + Etiket */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 font-semibold text-muted-foreground">
              <Phone size={11} />
              Tel:
            </span>
            {(["hepsi", "var", "yok"] as TelefonFiltre[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTelefonFiltre(t)}
                className={cn(
                  "rounded-full px-2.5 py-1 font-medium transition-colors",
                  telefonFiltre === t
                    ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                    : "hover:bg-stone-100",
                )}
              >
                {t === "hepsi"
                  ? "Hepsi"
                  : t === "var"
                    ? "Telefonlu"
                    : "Telefonsuz"}
              </button>
            ))}

            {tumEtiketler.length > 0 && (
              <>
                <span className="bg-stone-200 mx-1 h-4 w-px" />
                <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                  <Tag size={11} />
                  Etiket:
                </span>
                {tumEtiketler.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => etiketToggle(e)}
                    className={cn(
                      "rounded-full px-2 py-0.5 font-medium transition-colors",
                      etiketFiltre.has(e)
                        ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                        : "bg-stone-50 text-stone-600 hover:bg-stone-100",
                    )}
                  >
                    {e}
                  </button>
                ))}
                {etiketFiltre.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setEtiketFiltre(new Set())}
                    className="text-muted-foreground hover:text-foreground ml-1 underline"
                  >
                    temizle
                  </button>
                )}
              </>
            )}
          </div>

          {/* Aktif filtre uyarısı */}
          {aktifFiltreVarMi && (
            <div className="bg-amber-50 ring-amber-200 flex items-center justify-between rounded-md px-3 py-1.5 text-[11px] text-amber-900 ring-1">
              <span>
                Filtreli sonuç: <strong>{filtreli.length}</strong> /{" "}
                {borclular.length} borçlu
              </span>
              <button
                type="button"
                onClick={filtreleriTemizle}
                className="font-medium underline"
              >
                Tüm filtreleri temizle
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* SEÇİM BAR (üstte, kompakt) */}
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={
              filtreli.filter((b) => b.telefon).length > 0 &&
              filtreli
                .filter((b) => b.telefon)
                .every((b) => secili.has(b.musteriId))
            }
            onChange={tumunuSec}
            className="h-4 w-4 cursor-pointer accent-orange-600"
          />
          <span>
            Telefonlulardan tümünü seç (
            {filtreli.filter((b) => b.telefon).length})
          </span>
        </label>
        <span>Toplam {filtreli.length} satır</span>
      </div>

      {/* BORÇLU KARTLARI */}
      <div className="space-y-2">
        {filtreli.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-sm">
              Filtreye uyan borçlu yok
            </p>
          </Card>
        ) : (
          filtreli.map((b) => (
            <BorcluKart
              key={b.musteriId}
              borclu={b}
              secili={secili.has(b.musteriId)}
              onSec={() => birSec(b.musteriId)}
            />
          ))
        )}
      </div>

      {/* STICKY ALT BAR — Seçim varsa */}
      {secili.size > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 px-4 shadow-lg backdrop-blur-sm sm:left-64"
          style={{
            paddingTop: "0.75rem",
            paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)",
          }}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 font-semibold">
              <CheckSquare size={16} className="text-orange-600" />
              {secili.size} müşteri seçildi
            </span>
            <span className="text-sm text-muted-foreground">
              Toplam: {formatPara(seciliToplamBorc)}
            </span>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ size: "default" }),
                    "bg-emerald-600 hover:bg-emerald-700",
                  )}
                >
                  <MessageCircle size={14} className="mr-1.5" />
                  Toplu WhatsApp ({secili.size})
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>
                    Şablon Seç (Batch 3'er gönderim)
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {WHATSAPP_SABLONLARI.map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={() => topluWhatsappGonder(s.id)}
                      className="flex flex-col items-start"
                    >
                      <span className="font-semibold">{s.ad}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.aciklama}
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={seciliyeWaWizard}>
                    <MessageCircle size={14} className="mr-2" />
                    Detaylı Wizard'ı Aç
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" onClick={() => setSecili(new Set())}>
                Seçimi Temizle
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BorcluKart({
  borclu,
  secili,
  onSec,
}: {
  borclu: BorcluSatir;
  secili: boolean;
  onSec: () => void;
}) {
  const grad = avatarGradient(borclu.musteriId);
  const bashar = (() => {
    const parts = borclu.adSoyad.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "??";
    if (parts.length === 1) return parts[0]!.slice(0, 2).toLocaleUpperCase("tr-TR");
    return (
      parts[0]![0]! + parts[parts.length - 1]![0]!
    ).toLocaleUpperCase("tr-TR");
  })();
  const telefonsuz = !borclu.telefon || borclu.telefon.trim().length === 0;
  const hicOdeme = borclu.borcDurumu === "hic-odeme";

  const hizliMesaj =
    !telefonsuz && borclu.telefon
      ? waLinkUret(
          borclu.telefon,
          WHATSAPP_SABLONLARI[0]!.mesaj(
            borclu.adSoyad,
            borclu.kalan,
            borclu.kurbanlar,
          ),
        )
      : null;

  return (
    <Card
      className={cn(
        "p-3 transition-shadow hover:shadow-md",
        secili && "ring-2 ring-orange-400 bg-orange-50/30",
      )}
    >
      <div className="flex items-start gap-3">
        {!telefonsuz && (
          <input
            type="checkbox"
            checked={secili}
            onChange={onSec}
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-orange-600"
            aria-label={`${borclu.adSoyad} seç`}
          />
        )}

        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-xs font-bold text-white",
            grad.from,
            grad.to,
          )}
        >
          {bashar}
        </span>

        <div className="min-w-0 flex-1">
          {/* Üst satır: ad + badge'ler */}
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Link
              href={`/musteriler/${borclu.musteriId}`}
              className="truncate text-sm font-semibold hover:text-orange-600"
            >
              {borclu.adSoyad}
            </Link>

            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                borclu.borcDurumu === "hic-odeme" &&
                  "bg-red-100 text-red-700 border-red-300",
                borclu.borcDurumu === "kismi" &&
                  "bg-amber-100 text-amber-700 border-amber-300",
                borclu.borcDurumu === "yakin-tamamlanan" &&
                  "bg-emerald-100 text-emerald-700 border-emerald-300",
              )}
            >
              %{borclu.odenmeYuzdesi}
            </Badge>

            {hicOdeme ? (
              <Badge
                variant="outline"
                className="bg-red-50 text-red-600 border-red-200 text-xs"
              >
                Hiç ödeme
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground"
              >
                {borclu.gunlukYaslandirma} gün
              </Badge>
            )}

            {borclu.etiketler.slice(0, 2).map((e) => (
              <Badge
                key={e}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                #{e}
              </Badge>
            ))}
          </div>

          {/* Orta satır: telefon + kurbanlar */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {telefonsuz ? (
              <span className="italic">Telefon yok</span>
            ) : (
              <a
                href={`tel:${borclu.telefon}`}
                className="flex items-center gap-1 hover:text-orange-600"
              >
                <Phone className="h-3 w-3" />
                {borclu.telefon}
              </a>
            )}
            {borclu.kurbanlar.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {borclu.kurbanlar.join(", ")}
              </span>
            )}
            <span>· {borclu.hisseSayisi} hisse</span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full transition-all",
                  borclu.borcDurumu === "hic-odeme" && "bg-red-500",
                  borclu.borcDurumu === "kismi" && "bg-amber-500",
                  borclu.borcDurumu === "yakin-tamamlanan" && "bg-emerald-500",
                )}
                style={{ width: `${borclu.odenmeYuzdesi}%` }}
              />
            </div>
            <span className="font-tabular text-xs text-muted-foreground">
              {formatPara(borclu.toplamOdenen)} /{" "}
              {formatPara(borclu.toplamBedel)}
            </span>
          </div>
        </div>

        {/* Sağ: Kalan + Öncelik yıldız */}
        <div className="shrink-0 text-right">
          <p className="font-tabular text-lg font-bold text-red-600">
            {formatPara(borclu.kalan)}
          </p>
          <div
            className="mt-1 flex items-center justify-end gap-0.5"
            title={`Tahsilat önceliği: ${borclu.oncelikSkoru}/100`}
            aria-label={`Öncelik ${borclu.oncelikSkoru}/100`}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={cn(
                  "text-xs",
                  borclu.oncelikSkoru >= i * 20
                    ? "text-yellow-500"
                    : "text-muted-foreground/30",
                )}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hızlı aksiyon butonları */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
        {!telefonsuz && (
          <a
            href={`tel:${borclu.telefon}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Phone className="mr-1 h-3 w-3" /> Ara
          </a>
        )}
        {hizliMesaj && (
          <a
            href={hizliMesaj}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
            )}
          >
            <MessageCircle className="mr-1 h-3 w-3" /> WhatsApp
          </a>
        )}
        <Link
          href={`/tahsilat/musteri/${borclu.musteriId}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Wallet className="mr-1 h-3 w-3" /> Tahsilat Al
        </Link>
        <Link
          href={`/musteriler/${borclu.musteriId}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "ml-auto",
          )}
        >
          Detay →
        </Link>
      </div>
    </Card>
  );
}
