/**
 * Ayar servisi — Ayar tablosundan anahtar/değer çiftlerini okur/yazar.
 */

import { prisma } from "@/shared/lib/prisma";

export type AyarAnahtar =
  // Mevcut
  | "firma_adi"
  | "firma_telefon"
  | "firma_adres"
  | "dekont_alt_yazi"
  | "dekont_prefix"
  | "yedek_saatlik_aktif"
  // Ada Bereket genişlemesi
  | "firma_kisa_ad"
  | "firma_slogan"
  | "firma_whatsapp"
  | "firma_email"
  | "firma_web"
  | "firma_il"
  | "firma_ilce"
  | "firma_posta_kodu"
  | "firma_instagram"
  | "firma_tiktok"
  | "firma_youtube"
  | "firma_facebook"
  | "marka_rengi"
  | "yazilim_branding"
  | "public_url"
  | "firma_sube_aktif";

export async function ayarOku(
  anahtar: AyarAnahtar | string,
  varsayilan = "",
): Promise<string> {
  const k = await prisma.ayar.findUnique({ where: { anahtar } });
  return k?.deger ?? varsayilan;
}

export async function tumAyarlar(): Promise<Record<string, string>> {
  const liste = await prisma.ayar.findMany();
  const sonuc: Record<string, string> = {};
  for (const a of liste) sonuc[a.anahtar] = a.deger;
  return sonuc;
}

export async function ayarYaz(anahtar: string, deger: string): Promise<void> {
  await prisma.ayar.upsert({
    where: { anahtar },
    update: { deger, guncelTarih: new Date() },
    create: { anahtar, deger },
  });
}

export async function ayarlariToplu(degerler: Record<string, string>): Promise<void> {
  for (const [anahtar, deger] of Object.entries(degerler)) {
    await ayarYaz(anahtar, deger);
  }
}
