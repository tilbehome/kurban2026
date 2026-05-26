/**
 * Dekont HTML üretim endpoint'i.
 *
 * GET /api/tahsilat/dekont/[odemeId]
 *
 * Tek tahsilat işlemi backend tarafından her hisseye AYRI Odeme kaydı
 * olarak yazılıyor (her birinin kendi dekontNo'su). Bu endpoint
 * verilen odemeId için aynı batch'teki KARDEŞ Odeme'leri bulup
 * BIRLEŞTIRILMIŞ tek dekont gösterir — yani 100K girilen iki-hisseli
 * tahsilatta dekont 100K görünür, 50K değil.
 *
 * Kardeş Odeme'ler IslemAnahtari.sonucJson içindeki odemeIds array'inden
 * okunur. Eski (idempotency öncesi) ödemeler için fallback: tek Odeme.
 *
 * Tüm firma bilgisi, QR ve doğrulama kodu Ayar tablosundan
 * dinamik olarak okunur. Modüler dekont parçaları
 * `modules/tahsilat/dekont/` altında.
 */

import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { prisma } from "@/shared/lib/prisma";
import { tumAyarlar } from "@/modules/_core/ayarlar/ayar.service";
import { topla, yuvarla } from "@/shared/lib/para";
import { formatTarih, formatSaat } from "@/shared/lib/tarih";
import { dekontHtmlUret } from "@/modules/tahsilat/dekont/dekont-html";
import {
  dekontQrUrlOlustur,
  dekontQrPngUret,
} from "@/modules/tahsilat/dekont/dekont-qr-uret";
import { dogrulamaKoduUret } from "@/modules/tahsilat/dekont/dekont-dogrulama-kodu";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Verilen odemeId için aynı batch'teki tüm Odeme.id'lerini döner.
 * IslemAnahtari.sonucJson içindeki odemeIds array'ini parse eder.
 * Bulamazsa fallback: sadece verilen id.
 */
async function batchOdemeIdleri(odemeId: string): Promise<string[]> {
  const anahtar = await prisma.islemAnahtari.findFirst({
    where: {
      islemTipi: "odeme",
      OR: [{ sonucId: odemeId }, { sonucJson: { contains: odemeId } }],
    },
    select: { sonucJson: true },
  });

  if (!anahtar?.sonucJson) return [odemeId];

  try {
    const parsed = JSON.parse(anahtar.sonucJson) as { odemeIds?: unknown };
    if (Array.isArray(parsed.odemeIds) && parsed.odemeIds.length > 0) {
      const ids = parsed.odemeIds.filter(
        (v): v is string => typeof v === "string",
      );
      return ids.length > 0 ? ids : [odemeId];
    }
  } catch {
    // JSON parse hatası — fallback
  }
  return [odemeId];
}

export async function GET(_req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 401 });
  }

  const { id: odemeId } = await params;
  if (!odemeId) {
    return NextResponse.json({ hata: "Geçersiz id" }, { status: 400 });
  }

  const kardesIds = await batchOdemeIdleri(odemeId);

  const odemeler = await prisma.odeme.findMany({
    where: { id: { in: kardesIds }, iptal: false },
    include: {
      hisse: {
        include: {
          kurban: true,
          musteri: true,
          odemeler: { where: { iptal: false } },
        },
      },
      kullanici: { select: { adSoyad: true } },
    },
    orderBy: { tarih: "asc" },
  });

  if (odemeler.length === 0) {
    return NextResponse.json({ hata: "Ödeme bulunamadı" }, { status: 404 });
  }

  const ilkOdeme = odemeler[0]!;
  const hisse = ilkOdeme.hisse;
  const musteri = hisse.musteri;

  // Batch toplamları
  const batchToplam = yuvarla(topla(...odemeler.map((o) => o.toplamTutar)));
  const batchNakit = yuvarla(topla(...odemeler.map((o) => o.nakit)));
  const batchHavale = yuvarla(topla(...odemeler.map((o) => o.havale)));
  const batchKart = yuvarla(topla(...odemeler.map((o) => o.kart)));

  // Batch'teki UNIQUE hisseler (aynı hisseye iki ayrı kardeş kaydı
  // teorik olarak çıkarsa 2 kez sayılmasın diye Map kullanılıyor).
  const benzersizHisseler = new Map<
    string,
    {
      id: string;
      no: number;
      hisseFiyati: number;
      kurbanNo: number;
      tumOdemeler: { toplamTutar: number }[];
    }
  >();
  for (const o of odemeler) {
    if (benzersizHisseler.has(o.hisse.id)) continue;
    benzersizHisseler.set(o.hisse.id, {
      id: o.hisse.id,
      no: o.hisse.no,
      hisseFiyati: o.hisse.hisseFiyati,
      kurbanNo: o.hisse.kurban.kesimSirasi,
      tumOdemeler: o.hisse.odemeler,
    });
  }
  const hisseListesi = Array.from(benzersizHisseler.values()).sort(
    (a, b) => a.kurbanNo - b.kurbanNo || a.no - b.no,
  );

  // Bu batch'te yer alan hisselerin toplam bedeli
  const hisseBedelToplam = yuvarla(
    topla(...hisseListesi.map((h) => h.hisseFiyati)),
  );

  // Bu hisselerin TÜM iptal=false ödemelerinin toplamı (bu batch dahil)
  const tumOdenenToplam = yuvarla(
    topla(
      ...hisseListesi.flatMap((h) =>
        h.tumOdemeler.map((o) => o.toplamTutar),
      ),
    ),
  );

  // Bu batch'ten ÖNCE yapılan ödemeler = tüm ödenen - bu batch toplamı
  const oncekiOdemeler = yuvarla(tumOdenenToplam - batchToplam);

  // Kalan bakiye = toplam bedel - tüm ödenen
  const kalan = yuvarla(hisseBedelToplam - tumOdenenToplam);

  // Tek kurban mı, çoklu kurban mı?
  const kurbanNoSet = new Set(hisseListesi.map((h) => h.kurbanNo));
  const tekKurban = kurbanNoSet.size === 1;
  const anaKurbanNo = hisseListesi[0]!.kurbanNo;

  const ayarlar = await tumAyarlar();

  const firmaAdi = ayarlar.firma_adi ?? "Ada Bereket Hayvancılık";
  const firmaKisaAd = ayarlar.firma_kisa_ad ?? "Ada Bereket";
  const firmaSlogan =
    ayarlar.firma_slogan ?? "Güvenilir Hizmet, Bereketli Kazanç";
  const firmaTel = ayarlar.firma_telefon ?? "";
  const firmaEmail = ayarlar.firma_email ?? "";
  const firmaWeb = ayarlar.firma_web ?? "";
  const firmaAdres = ayarlar.firma_adres ?? "";
  const firmaIl = ayarlar.firma_il ?? "";
  const firmaIlce = ayarlar.firma_ilce ?? "";
  const firmaWhatsapp = ayarlar.firma_whatsapp ?? "";
  const firmaInstagram = ayarlar.firma_instagram ?? "";
  const firmaSubeAktif = ayarlar.firma_sube_aktif ?? "Merkez Kesim Alanı";
  const altYazi =
    ayarlar.dekont_alt_yazi ??
    "Ada Bereket'e güvendiğiniz için teşekkür ederiz.";
  const yazilimBranding =
    ayarlar.yazilim_branding ??
    "Bu sistem TilbeCore Kurban Yönetim Sistemi tarafından sağlanmaktadır.";
  const publicUrl =
    ayarlar.public_url ?? "https://adaberekethayvancilik.com.tr";

  // Müşterinin sahip olduğu toplam aktif hisse sayısı (tüm kurbanlar)
  const musteriHisseAdedi = musteri
    ? await prisma.hisse.count({
        where: { musteriId: musteri.id, silindiMi: false },
      })
    : 1;

  // QR ana kurbana yönlendir (tek kurbansa, çoklu kurban senaryosunda ilki).
  const qrHedefUrl = dekontQrUrlOlustur({
    publicUrl,
    kesimSirasi: anaKurbanNo,
  });
  const qrDataUrl = await dekontQrPngUret(qrHedefUrl);

  // Doğrulama kodu batch toplam tutarı + batch ilk dekontNo + ilk ödeme tarihi
  // ile üretilir. Eski tek-hisse ödemeler için batch=tek odeme olduğundan
  // kod değişmez (geriye dönük uyumlu).
  const dogrulamaKodu = dogrulamaKoduUret({
    dekontNo: ilkOdeme.dekontNo,
    tarih: ilkOdeme.tarih,
    toplamTutar: batchToplam,
  });

  const tarih = formatTarih(ilkOdeme.tarih);
  const saat = formatSaat(ilkOdeme.tarih);

  // UI için hisse listesi — sadece 2+ hisse varsa özet kartta gösterilecek
  const odenenHisseler = hisseListesi.map((h) => ({
    kurbanNo: h.kurbanNo,
    hisseNo: h.no,
    fiyat: h.hisseFiyati,
  }));

  const html = dekontHtmlUret({
    firmaAdi,
    firmaKisaAd,
    firmaSlogan,
    firmaTel,
    firmaEmail,
    firmaWeb,
    firmaAdres,
    firmaIl,
    firmaIlce,
    firmaWhatsapp,
    firmaInstagram,
    firmaSubeAktif,
    logoUrl: "/icons/logo-tam.png",
    altYazi,
    yazilimBranding,

    tarih,
    saat,

    dekontNo: ilkOdeme.dekontNo,
    dogrulamaKodu,

    musteriAdi: musteri?.adSoyad ?? "—",
    musteriTel: musteri?.telefon ?? "",
    kurbanNo: anaKurbanNo,
    hisseNo: hisse.no,
    musteriHisseAdedi,
    kasiyer: ilkOdeme.kullanici.adSoyad,

    hisseBedeli: hisseBedelToplam,
    oncekiOdemeler,
    nakit: batchNakit,
    havale: batchHavale,
    kart: batchKart,
    toplam: batchToplam,
    kalan,
    notlar: ilkOdeme.notlar ?? "",
    yontem: ilkOdeme.yontem ?? "nakit",

    odenenHisseler,
    tekKurban,

    qrDataUrl,
    qrHedefUrl,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
