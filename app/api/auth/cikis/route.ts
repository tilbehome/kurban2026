import { NextResponse } from "next/server";
import { getOturum } from "@/shared/lib/session";
import { auditLog, ipCikar } from "@/shared/lib/audit";

export async function POST(req: Request) {
  const session = await getOturum();
  const oturum = session.oturum;
  if (oturum) {
    await auditLog({
      eylem: "cikis",
      kullaniciId: oturum.kullaniciId,
      model: "Kullanici",
      kayitId: oturum.kullaniciId,
      ip: ipCikar(req),
    });
  }
  session.destroy();
  const url = new URL("/giris", req.url);
  return NextResponse.redirect(url, { status: 303 });
}
