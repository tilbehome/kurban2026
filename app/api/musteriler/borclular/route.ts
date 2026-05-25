/**
 * Borçlular listesi endpoint'i.
 *
 * GET /api/musteriler/borclular?telefon=hepsi|var|yok&etiket=A,B&minBorc=0&sirala=borc|isim
 *
 * Müşteriden alınan hisselerin toplam bedel/ödenen/kalan hesabı yapılır,
 * kalan > minBorc olanlar borçlu kabul edilir.
 *
 * Sprint 2 WhatsApp toplu eylem için kullanılır.
 */

import { NextRequest, NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";

export const dynamic = "force-dynamic";

interface BorcluKayit {
  musteriId: string;
  adSoyad: string;
  telefon: string | null;
  etiketler: string[];
  hisseSayisi: number;
  toplamBedel: number;
  toplamOdenen: number;
  kalan: number;
  enYuksekHisse: {
    kurbanKesimSirasi: number;
    no: number;
    kalan: number;
  } | null;
}

const MAX_LIMIT = 500;

export async function GET(req: NextRequest) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ basarili: false, hata: "Yetkisiz" }, { status: 401 });
  }
  if (!izinKontrol(oturum, "musteriler.goruntule")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const telefonFiltre = sp.get("telefon") ?? "hepsi";
  const etiketParam = sp.get("etiket") ?? "";
  const minBorc = Math.max(0, Number.parseFloat(sp.get("minBorc") ?? "0") || 0);
  const sirala = sp.get("sirala") === "isim" ? "isim" : "borc";
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(sp.get("limit") ?? "500", 10) || 500),
  );

  const aranlanEtiketler = etiketParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const musteriler = await prisma.musteri.findMany({
    where: { silindiMi: false },
    include: {
      hisseler: {
        where: { silindiMi: false },
        include: {
          odemeler: {
            where: { iptal: false },
            select: { toplamTutar: true },
          },
          kurban: { select: { kesimSirasi: true } },
        },
      },
    },
  });

  const borclular: BorcluKayit[] = musteriler
    .map((m) => {
      const toplamBedel = yuvarla(topla(...m.hisseler.map((h) => h.hisseFiyati)));
      const toplamOdenen = yuvarla(
        topla(
          ...m.hisseler.flatMap((h) => h.odemeler.map((o) => o.toplamTutar)),
        ),
      );
      const kalan = yuvarla(toplamBedel - toplamOdenen);

      const hisseKalanlar = m.hisseler.map((h) => {
        const odenmis = yuvarla(
          topla(...h.odemeler.map((o) => o.toplamTutar)),
        );
        return {
          hisseNo: h.no,
          kurbanKesimSirasi: h.kurban.kesimSirasi,
          kalan: yuvarla(h.hisseFiyati - odenmis),
        };
      });
      const enYuksek = hisseKalanlar
        .filter((h) => h.kalan > 0)
        .sort((a, b) => b.kalan - a.kalan)[0];

      return {
        musteriId: m.id,
        adSoyad: m.adSoyad,
        telefon: m.telefon,
        etiketler: etiketleriParse(m.etiketler),
        hisseSayisi: m.hisseler.length,
        toplamBedel,
        toplamOdenen,
        kalan,
        enYuksekHisse: enYuksek
          ? {
              kurbanKesimSirasi: enYuksek.kurbanKesimSirasi,
              no: enYuksek.hisseNo,
              kalan: enYuksek.kalan,
            }
          : null,
      };
    })
    .filter((b) => b.kalan > minBorc && b.hisseSayisi > 0)
    .filter((b) => {
      if (telefonFiltre === "var") return Boolean(b.telefon?.trim());
      if (telefonFiltre === "yok") return !b.telefon?.trim();
      return true;
    })
    .filter((b) => {
      if (aranlanEtiketler.length === 0) return true;
      return aranlanEtiketler.some((e) => b.etiketler.includes(e));
    });

  borclular.sort((a, b) =>
    sirala === "isim"
      ? a.adSoyad.localeCompare(b.adSoyad, "tr")
      : b.kalan - a.kalan,
  );

  const sinirli = borclular.slice(0, limit);

  const toplamAlacak = yuvarla(topla(...borclular.map((b) => b.kalan)));
  const ortalamaBorc =
    borclular.length > 0 ? yuvarla(toplamAlacak / borclular.length) : 0;
  const enYuksekBorc =
    borclular.length > 0 ? Math.max(...borclular.map((b) => b.kalan)) : 0;

  return NextResponse.json({
    basarili: true,
    toplam: borclular.length,
    borclular: sinirli,
    ozet: {
      toplamBorclu: borclular.length,
      toplamAlacak,
      ortalamaBorc,
      enYuksekBorc,
    },
  });
}

function etiketleriParse(metin: string | null): string[] {
  if (!metin) return [];
  try {
    const j = JSON.parse(metin) as unknown;
    if (Array.isArray(j))
      return j.filter((s): s is string => typeof s === "string");
  } catch {
    return metin
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}
