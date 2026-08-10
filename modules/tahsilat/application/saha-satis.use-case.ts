import type { Prisma } from "@prisma/client";
import { auditLog, type AuditVeri } from "@/shared/lib/audit";
import { belirleYontem, hisselereDagit } from "@/modules/tahsilat/lib/dagitim";
import { sonrakiDekontNo } from "@/modules/tahsilat/lib/tahsilat.service";
import {
  eszamanliAtamaBasariliOlmali,
  hisseEtiketi,
  hisseKalanlariHesapla,
  hisselerBosOlmali,
  hisselerEksiksizBulunmali,
  kaporaSatisBedeliniAsamaz,
  kaporaYetkisiniDogrula,
  musteriBulunmali,
  odemeKanaliTutarlari,
  sahaSatisTutarlariHesapla,
  type SahaSatisHisseKaydi,
  type SahaSatisKomutu,
  type SahaSatisSonucu,
} from "@/modules/tahsilat/domain/saha-satis";

interface IslemAnahtariKaydi {
  sonucJson: string | null;
}

interface SahaSatisPrismaPort {
  islemAnahtari: {
    findUnique(args: unknown): Promise<IslemAnahtariKaydi | null>;
  };
  $transaction<T>(islem: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>;
}

interface SahaSatisBagimliliklari {
  prisma: SahaSatisPrismaPort;
  auditLog?: (veri: AuditVeri) => Promise<void>;
  dekontNoUret?: (tx: Prisma.TransactionClient) => Promise<string>;
  yayinla?: (olay: string, veri: Record<string, unknown>) => void;
}

export interface SahaSatisCalistirGirdisi {
  komut: SahaSatisKomutu;
  kullaniciId: string;
  ip?: string;
  tahsilatYetkisiVar: boolean;
}

export class SahaSatisIslemSuruyorHatasi extends Error {
  constructor() {
    super("REQUEST_ALREADY_PROCESSING");
    this.name = "SahaSatisIslemSuruyorHatasi";
  }
}

export async function sahaSatisTamamla(
  girdi: SahaSatisCalistirGirdisi,
  bagimliliklar: SahaSatisBagimliliklari,
): Promise<SahaSatisSonucu> {
  const { komut, kullaniciId, ip, tahsilatYetkisiVar } = girdi;
  const tutarlar = sahaSatisTutarlariHesapla(komut);

  kaporaYetkisiniDogrula(tutarlar.toplamKapora, tahsilatYetkisiVar);
  kaporaSatisBedeliniAsamaz(tutarlar.toplamKapora, tutarlar.toplamBedel);

  const onceki = await bagimliliklar.prisma.islemAnahtari.findUnique({
    where: { anahtar: komut.clientRequestId },
  });
  if (onceki?.sonucJson) {
    return JSON.parse(onceki.sonucJson) as SahaSatisSonucu;
  }
  if (onceki) {
    throw new SahaSatisIslemSuruyorHatasi();
  }

  const sonuc = await bagimliliklar.prisma.$transaction(async (tx) => {
    const auditYaz = bagimliliklar.auditLog ?? auditLog;
    const dekontNoUret = bagimliliklar.dekontNoUret ?? sonrakiDekontNo;

    await tx.islemAnahtari.create({
      data: {
        anahtar: komut.clientRequestId,
        islemTipi: "saha-satis",
        kullaniciId,
        ip,
      },
    });

    const musteri = await tx.musteri.findFirst({
      where: { id: komut.musteriId, silindiMi: false },
      select: { id: true },
    });
    musteriBulunmali(musteri);

    const hisseler = (await tx.hisse.findMany({
      where: {
        id: { in: komut.hisseIds },
        silindiMi: false,
        kurban: {
          silindiMi: false,
          durum: { not: "iptal" },
          kesimDurumu: { not: "iptal" },
        },
      },
      select: {
        id: true,
        no: true,
        musteriId: true,
        hisseFiyati: true,
        kurban: {
          select: {
            kesimSirasi: true,
            durum: true,
            kesimDurumu: true,
            silindiMi: true,
          },
        },
        odemeler: {
          where: { iptal: false },
          select: { toplamTutar: true },
        },
      },
    })) as SahaSatisHisseKaydi[];

    hisselerEksiksizBulunmali(hisseler, komut.hisseIds.length);
    hisselerBosOlmali(hisseler);

    const atama = await tx.hisse.updateMany({
      where: { id: { in: komut.hisseIds }, musteriId: null, silindiMi: false },
      data: {
        musteriId: komut.musteriId,
        hisseFiyati: tutarlar.hisseFiyati,
      },
    });
    eszamanliAtamaBasariliOlmali(atama.count, komut.hisseIds.length);

    await auditYaz({
      tx,
      eylem: "hisse-atama",
      model: "Hisse",
      kayitId: komut.hisseIds[0],
      kullaniciId,
      ip,
      detaylar: {
        kaynak: "saha-satis",
        hisseIds: komut.hisseIds,
        musteriId: komut.musteriId,
        hisseFiyati: tutarlar.hisseFiyati,
        toplam: tutarlar.toplamBedel,
      },
    });

    const odemeIds: string[] = [];
    if (tutarlar.toplamKapora > 0) {
      const kalanlar = hisseKalanlariHesapla(hisseler, tutarlar.hisseFiyati);
      const tahsisler = hisselereDagit(
        tutarlar.toplamKapora,
        kalanlar,
        "esit",
      ).filter((t) => t.tutar > 0);

      for (const t of tahsisler) {
        const odemeKanali = odemeKanaliTutarlari(
          t.tutar,
          tutarlar.toplamKapora,
          komut,
        );
        const dekontNo = await dekontNoUret(tx);

        const odeme = await tx.odeme.create({
          data: {
            hisseId: t.hisseId,
            nakit: odemeKanali.nakit,
            havale: odemeKanali.havale,
            kart: odemeKanali.kart,
            toplamTutar: t.tutar,
            yontem: belirleYontem(
              odemeKanali.nakit,
              odemeKanali.havale,
              odemeKanali.kart,
            ),
            notlar: komut.notlar?.trim() || "Saha satış kapora",
            dekontNo,
            kullaniciId,
            olusturanId: kullaniciId,
          },
        });
        odemeIds.push(odeme.id);

        const etiket = hisseEtiketi(hisseler, t.hisseId);
        for (const [yontem, tutar] of [
          ["nakit", odemeKanali.nakit],
          ["havale", odemeKanali.havale],
          ["kart", odemeKanali.kart],
        ] as const) {
          if (tutar <= 0) continue;
          await tx.kasaHareketi.create({
            data: {
              tip: "tahsilat",
              tutar,
              yontem,
              aciklama: `${etiket} - ${dekontNo}`,
              odemeId: odeme.id,
              kullaniciId,
              olusturanId: kullaniciId,
              tarih: new Date(),
            },
          });
        }
      }

      await auditYaz({
        tx,
        eylem: "odeme",
        model: "Odeme",
        kayitId: odemeIds[0],
        kullaniciId,
        ip,
        detaylar: {
          kaynak: "saha-satis",
          musteriId: komut.musteriId,
          hisseIds: komut.hisseIds,
          odemeIds,
          toplamTutar: tutarlar.toplamKapora,
          nakit: tutarlar.nakit,
          havale: tutarlar.havale,
          kart: tutarlar.kart,
        },
      });
    }

    const body: SahaSatisSonucu = {
      basarili: true,
      musteriId: komut.musteriId,
      hisseIds: komut.hisseIds,
      odemeIds,
    };
    await tx.islemAnahtari.update({
      where: { anahtar: komut.clientRequestId },
      data: {
        sonucId: odemeIds[0] ?? komut.hisseIds[0],
        sonucJson: JSON.stringify(body),
      },
    });

    return body;
  });

  bagimliliklar.yayinla?.("hisse:atandi", {
    hisseIds: komut.hisseIds,
    musteriId: komut.musteriId,
  });
  if (sonuc.odemeIds.length > 0) {
    bagimliliklar.yayinla?.("tahsilat:olusturuldu", {
      musteriId: komut.musteriId,
      hisseIds: komut.hisseIds,
      odemeIds: sonuc.odemeIds,
    });
  }

  return sonuc;
}
