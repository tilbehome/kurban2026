/**
 * Kurban (hayvan) + hisseleri için sorgu/özet servisi.
 */

import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";
import { aktifOturum } from "@/shared/lib/session";
import { masterDataMode, tenantActiveSeasonId, tenantMasterDataService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";

export interface KurbanHissedar {
  hisseNo: number;
  musteriId: string | null;
  adSoyad: string | null;
  telefon: string | null;
}

export interface KurbanOzet {
  id: string;
  kesimSirasi: number;
  kupeNo: string | null;
  kesimSaati: string | null;
  canliAgirlik: number | null;
  hisseGrubu: string | null;
  hisseSayisi: number;
  bosHisseSayisi: number;
  satisBedeli: number;
  toplamOdenen: number;
  kalan: number;
  durum: string;
  kesimDurumu: string;
  ilerlemeYuzde: number;
  hissedarlar: KurbanHissedar[];
  /** Filtre/arama için düzleştirilmiş büyük harf metin */
  aramaIndeks: string;
}

export async function kurbanlariListele(): Promise<KurbanOzet[]> {
  if (masterDataMode() === "postgres") {
    const oturum = await aktifOturum();
    if (!oturum) return [];
    const rows = await tenantMasterDataService().listAnimals(tenantUseCaseContext(oturum, { readOnly: true }), tenantActiveSeasonId());
    return rows.map((row, index) => {
      const kesimSirasi = row.queueNo ?? index + 1;
      return {
        id: row.id, kesimSirasi, kupeNo: row.earTag, kesimSaati: null,
        canliAgirlik: row.liveWeightKg ? Number(row.liveWeightKg) : null,
        hisseGrubu: null, hisseSayisi: 7, bosHisseSayisi: 7,
        satisBedeli: 0, toplamOdenen: 0, kalan: 0,
        durum: row.status, kesimDurumu: row.status, ilerlemeYuzde: 0,
        hissedarlar: Array.from({ length: 7 }, (_, shareIndex) => ({ hisseNo: shareIndex + 1, musteriId: null, adSoyad: null, telefon: null })),
        aramaIndeks: `#${kesimSirasi} ${row.earTag} ${row.supplierName ?? ""}`.toLocaleUpperCase("tr-TR"),
      };
    }).sort((a, b) => a.kesimSirasi - b.kesimSirasi);
  }
  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    orderBy: { kesimSirasi: "asc" },
    include: {
      hisseler: {
        where: { silindiMi: false },
        orderBy: { no: "asc" },
        include: {
          musteri: { select: { id: true, adSoyad: true, telefon: true } },
          odemeler: { where: { iptal: false }, select: { toplamTutar: true } },
        },
      },
    },
  });

  return kurbanlar.map((k) => {
    const hisseToplamBedel = yuvarla(
      topla(...k.hisseler.map((h) => h.hisseFiyati)),
    );
    const toplamOdenen = yuvarla(
      topla(
        ...k.hisseler.flatMap((h) => h.odemeler.map((o) => o.toplamTutar)),
      ),
    );
    const satisBedeli = yuvarla(k.satisBedeli || hisseToplamBedel);
    const kalan = yuvarla(satisBedeli - toplamOdenen);
    const bosHisseSayisi = k.hisseler.filter((h) => h.musteriId === null).length;
    const ilerlemeYuzde =
      satisBedeli > 0
        ? Math.min(100, Math.round((toplamOdenen / satisBedeli) * 100))
        : 0;

    const hissedarlar: KurbanHissedar[] = k.hisseler.map((h) => ({
      hisseNo: h.no,
      musteriId: h.musteri?.id ?? null,
      adSoyad: h.musteri?.adSoyad ?? null,
      telefon: h.musteri?.telefon ?? null,
    }));

    const aramaIndeks = [
      `#${k.kesimSirasi}`,
      String(k.kesimSirasi),
      k.kupeNo ?? "",
      k.hisseGrubu ?? "",
      ...hissedarlar.map((h) => h.adSoyad ?? ""),
      ...hissedarlar.map((h) => h.telefon ?? ""),
    ]
      .join(" ")
      .toUpperCase();

    return {
      id: k.id,
      kesimSirasi: k.kesimSirasi,
      kupeNo: k.kupeNo,
      kesimSaati: k.kesimSaati,
      canliAgirlik: k.canliAgirlik ?? null,
      hisseGrubu: k.hisseGrubu ?? null,
      hisseSayisi: k.hisseSayisi,
      bosHisseSayisi,
      satisBedeli,
      toplamOdenen,
      kalan,
      durum: k.durum,
      kesimDurumu: k.kesimDurumu,
      ilerlemeYuzde,
      hissedarlar,
      aramaIndeks,
    };
  });
}

export async function kurbanDetayi(id: string) {
  return prisma.kurban.findFirst({
    where: { id, silindiMi: false },
    include: {
      hisseler: {
        where: { silindiMi: false },
        include: {
          musteri: true,
          odemeler: { where: { iptal: false }, select: { toplamTutar: true } },
        },
        orderBy: { no: "asc" },
      },
    },
  });
}
