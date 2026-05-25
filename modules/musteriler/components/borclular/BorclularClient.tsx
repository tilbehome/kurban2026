"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MessageCircle,
  Phone,
  Wallet,
  User,
  Beef,
  FileSpreadsheet,
  Search,
  Filter,
  X,
  Tag,
  CheckSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { formatPara } from "@/shared/lib/para";
import { avatarGradient } from "@/modules/dashboard/types";
import type { BorcluSatir } from "@/modules/raporlar/lib/rapor.service";

type TelefonFiltre = "hepsi" | "var" | "yok";
type Siralama = "borc" | "ad";

interface BorclularClientProps {
  borclular: BorcluSatir[];
  tumEtiketler: string[];
}

export function BorclularClient({
  borclular,
  tumEtiketler,
}: BorclularClientProps) {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [minBorc, setMinBorc] = useState<number>(0);
  const [telefonFiltre, setTelefonFiltre] = useState<TelefonFiltre>("hepsi");
  const [etiketFiltre, setEtiketFiltre] = useState<Set<string>>(new Set());
  const [siralama, setSiralama] = useState<Siralama>("borc");
  const [secili, setSecili] = useState<Set<string>>(new Set());

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

    // Min borç
    if (minBorc > 0) {
      liste = liste.filter((b) => b.kalan >= minBorc);
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
    } else {
      liste.sort((a, b) => b.kalan - a.kalan);
    }

    return liste;
  }, [borclular, arama, minBorc, telefonFiltre, etiketFiltre, siralama]);

  const ozet = useMemo(() => {
    const toplam = filtreli.reduce((s, b) => s + b.kalan, 0);
    const ortalama = filtreli.length > 0 ? toplam / filtreli.length : 0;
    const enYuksek =
      filtreli.length > 0
        ? Math.max(...filtreli.map((b) => b.kalan))
        : 0;
    const telefonlu = filtreli.filter(
      (b) => b.telefon && b.telefon.trim().length > 0,
    ).length;
    return { toplam, ortalama, enYuksek, telefonlu };
  }, [filtreli]);

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
    if (secili.size === telefonlular.length) {
      setSecili(new Set());
    } else {
      setSecili(new Set(telefonlular));
    }
  }

  function filtreyleHatirlat() {
    const telefonluFiltre = filtreli.filter(
      (b) => b.telefon && b.telefon.trim().length > 0,
    );
    if (telefonluFiltre.length === 0) {
      toast.error("Telefonlu borçlu yok");
      return;
    }
    // FAZ 8 wizard'ına yönlendir (URL param ile pre-select)
    router.push(`/whatsapp/toplu?durum=borclu`);
  }

  function secililereHatirlat() {
    if (secili.size === 0) {
      toast.error("Önce müşteri seçin");
      return;
    }
    router.push(`/whatsapp/toplu?durum=borclu&ids=${Array.from(secili).join(",")}`);
  }

  const aktifFiltreVarMi =
    arama.length > 0 ||
    minBorc > 0 ||
    telefonFiltre !== "hepsi" ||
    etiketFiltre.size > 0;

  return (
    <>
      {/* ÜST FİLTRE BAR */}
      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3">
          {/* Arama + WhatsApp toplu */}
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
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <Button
              type="button"
              onClick={filtreyleHatirlat}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <MessageCircle size={14} />
              WhatsApp Toplu ({ozet.telefonlu})
            </Button>
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

          {/* Filtre chip'leri */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold">
              <Filter size={11} />
              Min:
            </span>
            {[0, 10000, 50000, 100000, 500000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setMinBorc(v)}
                className={cn(
                  "rounded-full px-2.5 py-1 font-medium transition-colors",
                  minBorc === v
                    ? "bg-orange-100 text-orange-800 ring-1 ring-orange-300"
                    : "hover:bg-stone-100",
                )}
              >
                {v === 0 ? "Hepsi" : `${v / 1000}K+`}
              </button>
            ))}

            <span className="bg-stone-200 mx-1 h-4 w-px" />

            <span className="text-muted-foreground flex items-center gap-1 font-semibold">
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
                {t === "hepsi" ? "Hepsi" : t === "var" ? "Telefonlu" : "Telefonsuz"}
              </button>
            ))}

            <span className="bg-stone-200 mx-1 h-4 w-px" />

            <span className="text-muted-foreground flex items-center gap-1 font-semibold">
              Sıra:
            </span>
            {(
              [
                { val: "borc", label: "Borç (azalan)" },
                { val: "ad", label: "İsim (A-Z)" },
              ] as { val: Siralama; label: string }[]
            ).map((s) => (
              <button
                key={s.val}
                type="button"
                onClick={() => setSiralama(s.val)}
                className={cn(
                  "rounded-full px-2.5 py-1 font-medium transition-colors",
                  siralama === s.val
                    ? "bg-purple-100 text-purple-800 ring-1 ring-purple-300"
                    : "hover:bg-stone-100",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Etiket filtreleri */}
          {tumEtiketler.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t pt-2 text-xs">
              <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                <Tag size={11} />
                Etiketler:
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
            </div>
          )}

          {/* Aktif filtre uyarısı */}
          {aktifFiltreVarMi && (
            <div className="bg-amber-50 ring-amber-200 flex items-center justify-between rounded-md px-3 py-1.5 text-[11px] text-amber-900 ring-1">
              <span>
                Filtreli sonuç: <strong>{filtreli.length}</strong> /{" "}
                {borclular.length} borçlu
              </span>
              <button
                type="button"
                onClick={() => {
                  setArama("");
                  setMinBorc(0);
                  setTelefonFiltre("hepsi");
                  setEtiketFiltre(new Set());
                }}
                className="font-medium underline"
              >
                Tüm filtreleri temizle
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* TOPLU SEÇİM BAR (gizli/açık) */}
      {secili.size > 0 && (
        <Card className="mb-4 border-orange-300 bg-orange-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-orange-900">
              <CheckSquare size={14} />
              {secili.size} müşteri seçili
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={secililereHatirlat}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <MessageCircle size={13} />
                WhatsApp ({secili.size})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSecili(new Set())}
              >
                İptal
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* TABLO */}
      <Card>
        <div className="overflow-x-auto pb-32">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b text-left">
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={
                      secili.size > 0 &&
                      secili.size ===
                        filtreli.filter((b) => b.telefon).length
                    }
                    onChange={tumunuSec}
                    className="h-4 w-4"
                    aria-label="Tümünü seç"
                  />
                </th>
                <th className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase">
                  Müşteri
                </th>
                <th className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase">
                  Telefon
                </th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold tracking-wider uppercase">
                  Hisse
                </th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-wider uppercase">
                  Bedel
                </th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-wider uppercase">
                  Ödenen
                </th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-wider uppercase">
                  Kalan
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtreli.map((b) => (
                <BorcluRow
                  key={b.musteriId}
                  borclu={b}
                  secili={secili.has(b.musteriId)}
                  onSec={() => birSec(b.musteriId)}
                />
              ))}
              {filtreli.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-muted-foreground py-12 text-center text-sm"
                  >
                    Filtreye uyan borçlu yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* STICKY ÖZET BAR (alt sabit) */}
      <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:left-64">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap gap-4">
            <Mini etiket="Borçlu" deger={filtreli.length.toString()} />
            <Mini
              etiket="Toplam Alacak"
              deger={formatPara(ozet.toplam)}
              vurgu="text-red-600"
            />
            <Mini etiket="Ortalama" deger={formatPara(ozet.ortalama)} />
            <Mini
              etiket="En Yüksek"
              deger={formatPara(ozet.enYuksek)}
              vurgu="text-orange-600"
            />
          </div>
        </div>
      </div>
    </>
  );
}

function BorcluRow({
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
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();
  const telefonsuz = !borclu.telefon || borclu.telefon.trim().length === 0;

  return (
    <tr
      className={cn(
        "group hover:bg-stone-50 border-b transition-colors",
        secili && "bg-orange-50",
      )}
    >
      <td className="px-3 py-2">
        {!telefonsuz && (
          <input
            type="checkbox"
            checked={secili}
            onChange={onSec}
            className="h-4 w-4"
            aria-label="Seç"
          />
        )}
      </td>
      <td className="px-3 py-2">
        <Link
          href={`/musteriler/${borclu.musteriId}`}
          className="flex items-center gap-2.5"
        >
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[10px] font-bold text-white",
              grad.from,
              grad.to,
            )}
          >
            {bashar}
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">{borclu.adSoyad}</span>
            {borclu.etiketler.length > 0 && (
              <div className="mt-0.5 flex flex-wrap gap-1">
                {borclu.etiketler.slice(0, 2).map((e) => (
                  <Badge
                    key={e}
                    variant="secondary"
                    className="px-1.5 py-0 text-[9px]"
                  >
                    {e}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Link>
      </td>
      <td className="px-3 py-2">
        {telefonsuz ? (
          <span className="text-muted-foreground italic">—</span>
        ) : (
          <a
            href={`tel:${borclu.telefon}`}
            className="text-blue-700 hover:underline"
          >
            {borclu.telefon}
          </a>
        )}
      </td>
      <td className="px-3 py-2 text-center text-xs">
        {borclu.hisseSayisi}
      </td>
      <td className="font-tabular px-3 py-2 text-right text-xs">
        {formatPara(borclu.toplamBedel)}
      </td>
      <td className="font-tabular px-3 py-2 text-right text-xs text-emerald-700">
        {formatPara(borclu.toplamOdenen)}
      </td>
      <td className="font-tabular px-3 py-2 text-right text-sm font-bold text-red-700">
        {formatPara(borclu.kalan)}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Link
            href={`/tahsilat/musteri/${borclu.musteriId}`}
            title="Tahsilat al"
            className="text-emerald-700 hover:bg-emerald-50 rounded p-1.5"
          >
            <Wallet size={14} />
          </Link>
          {!telefonsuz && (
            <a
              href={`https://wa.me/${(borclu.telefon ?? "").replace(/\D/g, "").replace(/^0/, "90")}`}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp"
              className="text-green-700 hover:bg-green-50 rounded p-1.5"
            >
              <MessageCircle size={14} />
            </a>
          )}
          <Link
            href={`/musteriler/${borclu.musteriId}`}
            title="Detay"
            className="text-stone-700 hover:bg-stone-100 rounded p-1.5"
          >
            <User size={14} />
          </Link>
          <Link
            href={`/musteriler/${borclu.musteriId}?tab=hisseler`}
            title="Hisseler"
            className="text-purple-700 hover:bg-purple-50 rounded p-1.5"
          >
            <Beef size={14} />
          </Link>
        </div>
      </td>
    </tr>
  );
}

function Mini({
  etiket,
  deger,
  vurgu,
}: {
  etiket: string;
  deger: string;
  vurgu?: string;
}) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
        {etiket}
      </span>
      <span
        className={cn("font-tabular text-sm font-bold", vurgu ?? "text-foreground")}
      >
        {deger}
      </span>
    </div>
  );
}
