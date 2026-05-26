/**
 * Dekont HTML üretim endpoint'i.
 *
 * GET /api/tahsilat/dekont/[odemeId]
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

export async function GET(_req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 401 });
  }

  const { id: odemeId } = await params;
  if (!odemeId) {
    return NextResponse.json({ hata: "Geçersiz id" }, { status: 400 });
  }

  const odeme = await prisma.odeme.findUnique({
    where: { id: odemeId },
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
  });

  if (!odeme) {
    return NextResponse.json({ hata: "Ödeme bulunamadı" }, { status: 404 });
  }

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

  const hisse = odeme.hisse;
  const hisseToplamOdenen = yuvarla(
    topla(...hisse.odemeler.map((o) => o.toplamTutar)),
  );
  const hisseKalan = yuvarla(hisse.hisseFiyati - hisseToplamOdenen);
  const oncekiOdemeler = yuvarla(hisseToplamOdenen - odeme.toplamTutar);

  // SPRINT-DEKONT-V3 fix: dekonttaki "Hisse Adedi" müşterinin sahip olduğu
  // toplam aktif hisse sayısı (hisse.no kurbandaki sıraydı, müşterinin adedi
  // değil). Aynı kurbandaki birden fazla hisse de dahil.
  const musteriHisseAdedi = hisse.musteri
    ? await prisma.hisse.count({
        where: {
          musteriId: hisse.musteri.id,
          silindiMi: false,
        },
      })
    : 1;

  const qrHedefUrl = dekontQrUrlOlustur({
    publicUrl,
    kesimSirasi: hisse.kurban.kesimSirasi,
  });
  const qrDataUrl = await dekontQrPngUret(qrHedefUrl);

  const dogrulamaKodu = dogrulamaKoduUret({
    dekontNo: odeme.dekontNo,
    tarih: odeme.tarih,
    toplamTutar: odeme.toplamTutar,
  });

  const tarih = formatTarih(odeme.tarih);
  const saat = formatSaat(odeme.tarih);

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

    dekontNo: odeme.dekontNo,
    dogrulamaKodu,

    musteriAdi: hisse.musteri?.adSoyad ?? "—",
    musteriTel: hisse.musteri?.telefon ?? "",
    kurbanNo: hisse.kurban.kesimSirasi,
    hisseNo: hisse.no,
    musteriHisseAdedi,
    kasiyer: odeme.kullanici.adSoyad,

    hisseBedeli: hisse.hisseFiyati,
    oncekiOdemeler,
    nakit: odeme.nakit,
    havale: odeme.havale,
    kart: odeme.kart,
    toplam: odeme.toplamTutar,
    kalan: hisseKalan,
    notlar: odeme.notlar ?? "",
    yontem: odeme.yontem ?? "nakit",

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
