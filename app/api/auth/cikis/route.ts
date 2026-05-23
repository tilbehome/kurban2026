import { NextResponse } from "next/server";
import { getOturum } from "@/shared/lib/session";

export async function POST(req: Request) {
  const session = await getOturum();
  session.destroy();
  const url = new URL("/giris", req.url);
  return NextResponse.redirect(url, { status: 303 });
}
