import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";

interface AramaSonucu {
  id: number;
  adSoyad: string;
  telefon: string | null;
  hisseSayisi: number;
  kalan: number;
  kurbanlar: { kesimSirasi: number; hisseNo: number }[];
}

export async function GET(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) return NextResponse.json({ hata: "Yetki yok" }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(
    Math.max(Number.parseInt(url.searchParams.get("limit") ?? "12", 10), 1),
    50,
  );

  if (q.length < 2) {
    return NextResponse.json<{ sonuclar: AramaSonucu[] }>({ sonuclar: [] });
  }

  const ozelKurbanArama = /^#?(\d+)(?:[.\s]?(\d+))?$/.exec(q);

  const musteriler = await prisma.musteri.findMany({
    where: {
      OR: [
        { adSoyad: { contains: q } },
        { telefon: { contains: q } },
        { tcKimlik: { contains: q } },
        ...(ozelKurbanArama
          ? [
              {
                hisseler: {
                  some: {
                    kurban: { kesimSirasi: Number.parseInt(ozelKurbanArama[1]!, 10) },
                    ...(ozelKurbanArama[2]
                      ? { no: Number.parseInt(ozelKurbanArama[2]!, 10) }
                      : {}),
                  },
                },
              },
            ]
          : []),
      ],
    },
    take: limit,
    orderBy: { adSoyad: "asc" },
    include: {
      hisseler: {
        include: {
          kurban: { select: { kesimSirasi: true } },
          odemeler: {
            where: { iptal: false },
            select: { toplamTutar: true },
          },
        },
      },
    },
  });

  const sonuclar: AramaSonucu[] = musteriler.map((m) => {
    const toplamBedel = yuvarla(topla(...m.hisseler.map((h) => h.hisseFiyati)));
    const toplamOdenen = yuvarla(
      topla(
        ...m.hisseler.flatMap((h) => h.odemeler.map((o) => o.toplamTutar)),
      ),
    );
    return {
      id: m.id,
      adSoyad: m.adSoyad,
      telefon: m.telefon,
      hisseSayisi: m.hisseler.length,
      kalan: yuvarla(toplamBedel - toplamOdenen),
      kurbanlar: m.hisseler.map((h) => ({
        kesimSirasi: h.kurban.kesimSirasi,
        hisseNo: h.no,
      })),
    };
  });

  return NextResponse.json({ sonuclar });
}
