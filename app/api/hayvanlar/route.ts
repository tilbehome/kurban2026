import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { yuvarla } from "@/shared/lib/para";
import { yayinla } from "@/shared/lib/events";

const KurbanSchema = z.object({
  kesimSirasi: z.number().int().positive("Kesim sırası gerekli"),
  kupeNo: z.string().trim().max(40).optional(),
  kesimSaati: z.string().trim().max(8).optional(),
  hisseSayisi: z.number().int().min(1).max(7).default(7),
  satisBedeli: z.number().min(0).default(0),
  notlar: z.string().trim().max(500).optional(),
  hisseGrubu: z
    .enum(["30-35", "35-40", "40-45", "45-50", "50-55"])
    .nullable()
    .optional(),
});

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 401 });
  }

  let veri: z.infer<typeof KurbanSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = KurbanSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const mevcut = await prisma.kurban.findUnique({
    where: { kesimSirasi: veri.kesimSirasi },
  });
  if (mevcut) {
    return NextResponse.json(
      { basarili: false, hata: `#${veri.kesimSirasi} kesim sırası zaten kayıtlı` },
      { status: 409 },
    );
  }

  const hisseFiyati = yuvarla(veri.satisBedeli / veri.hisseSayisi);

  const yeni = await prisma.kurban.create({
    data: {
      kesimSirasi: veri.kesimSirasi,
      kupeNo: veri.kupeNo ?? null,
      kesimSaati: veri.kesimSaati ?? null,
      hisseSayisi: veri.hisseSayisi,
      satisBedeli: yuvarla(veri.satisBedeli),
      notlar: veri.notlar ?? null,
      hisseGrubu: veri.hisseGrubu ?? null,
      hisseler: {
        create: Array.from({ length: veri.hisseSayisi }, (_, i) => ({
          no: i + 1,
          hisseFiyati,
        })),
      },
    },
  });

  yayinla("kurban:olusturuldu", { id: yeni.id, kesimSirasi: yeni.kesimSirasi });
  return NextResponse.json({ basarili: true, id: yeni.id });
}
