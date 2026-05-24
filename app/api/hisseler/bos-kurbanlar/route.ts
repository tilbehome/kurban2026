import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";

/**
 * Hisse atama modalı için: boş hissesi olan kurbanların özet listesi.
 */
export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "hisseler.ata")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }

  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    orderBy: { kesimSirasi: "asc" },
    include: {
      hisseler: {
        where: { silindiMi: false },
        select: { id: true, no: true, musteriId: true, hisseFiyati: true },
      },
    },
  });

  const aktif = kurbanlar
    .map((k) => {
      const bos = k.hisseler.filter((h) => h.musteriId === null);
      const ilkHisseFiyati =
        k.hisseler.find((h) => h.hisseFiyati > 0)?.hisseFiyati ?? 0;
      return {
        id: k.id,
        kesimSirasi: k.kesimSirasi,
        bosHisseIds: bos.map((h) => h.id),
        bosHisseNumaralari: bos.map((h) => h.no),
        hisseFiyati: ilkHisseFiyati,
      };
    })
    .filter((k) => k.bosHisseIds.length > 0);

  return NextResponse.json({ basarili: true, veri: aktif });
}
