/**
 * Vekalet Yönetimi — bayram günü saha kullanımına yönelik modern UI.
 *
 * Server component: query + yetki + tip aktarımı. UI tarafı tamamen
 * client (`VekaletYonetimiClient`). Mevcut backend endpoint'leri
 * (`PATCH /api/hisseler/[id]/vekalet`, `POST /api/vekaletler`)
 * kullanılır — schema veya API'lere dokunulmadı.
 */

import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { VekaletYonetimiClient } from "@/modules/vekalet/components/VekaletYonetimiClient";

export const dynamic = "force-dynamic";

export interface VekaletHisseVeri {
  id: string;
  no: number;
  vekaletAlindi: boolean;
  /** ISO datetime — client'a serialize edilebilir tip */
  vekaletTarihi: string | null;
  vekaletDosyaUrl: string | null;
  musteri: {
    id: string;
    adSoyad: string;
    telefon: string | null;
  };
  kurban: {
    id: string;
    kesimSirasi: number;
  };
}

export default async function VekaletYonetimiPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris?next=/hayvanlar/vekalet");

  // Backend PATCH /api/hisseler/[id]/vekalet sadece tv.kontrol kabul ediyor.
  // Sayfa izniyle tutarlı tut — yetki uyuşmazlığı UX kırılganlığı yaratır.
  if (!izinKontrol(oturum, "tv.kontrol")) {
    return (
      <div className="bg-slate-50 flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Vekalet yönetimi için TV kontrol yetkiniz gerekiyor.
        </p>
      </div>
    );
  }

  const hisseler = await prisma.hisse.findMany({
    where: { musteriId: { not: null }, silindiMi: false },
    include: {
      musteri: { select: { id: true, adSoyad: true, telefon: true } },
      kurban: { select: { id: true, kesimSirasi: true } },
      vekalet: { select: { dosyaUrl: true, silindiMi: true } },
    },
    orderBy: [
      { kurban: { kesimSirasi: "asc" } },
      { no: "asc" },
    ],
  });

  const veri: VekaletHisseVeri[] = hisseler.map((h) => ({
    id: h.id,
    no: h.no,
    vekaletAlindi: h.vekaletAlindi,
    vekaletTarihi: h.vekaletTarihi?.toISOString() ?? null,
    vekaletDosyaUrl:
      h.vekalet && !h.vekalet.silindiMi ? h.vekalet.dosyaUrl : null,
    musteri: {
      id: h.musteri!.id,
      adSoyad: h.musteri!.adSoyad,
      telefon: h.musteri!.telefon,
    },
    kurban: {
      id: h.kurban.id,
      kesimSirasi: h.kurban.kesimSirasi,
    },
  }));

  return <VekaletYonetimiClient hisseler={veri} />;
}
