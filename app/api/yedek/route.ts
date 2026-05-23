import { NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/permissions";
import { yedekAl } from "@/shared/lib/backup";

const Govde = z.object({
  neden: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum || !adminMi(oturum.rol)) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 403 });
  }

  let neden: string | undefined;
  try {
    const govde = (await req.json()) as unknown;
    neden = Govde.parse(govde).neden;
  } catch {
    neden = "manuel";
  }

  const sonuc = await yedekAl(neden ?? "manuel");
  if (!sonuc.basarili) {
    return NextResponse.json(
      { basarili: false, hata: sonuc.hata },
      { status: 500 },
    );
  }
  return NextResponse.json(sonuc);
}
