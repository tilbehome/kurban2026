/**
 * Tarih formatlama yardımcıları (Türkçe locale).
 */

import { format, formatDistanceToNow, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

const KISA_FORMAT = "dd.MM.yyyy";
const TAM_FORMAT = "dd.MM.yyyy HH:mm";
const SAAT_FORMAT = "HH:mm";

function toDate(deger: Date | string | null | undefined): Date | null {
  if (!deger) return null;
  if (deger instanceof Date) return deger;
  try {
    return parseISO(deger);
  } catch {
    return null;
  }
}

/** "23.05.2026" */
export function formatTarih(deger: Date | string | null | undefined): string {
  const tarih = toDate(deger);
  return tarih ? format(tarih, KISA_FORMAT, { locale: tr }) : "";
}

/** "23.05.2026 14:32" */
export function formatTarihSaat(deger: Date | string | null | undefined): string {
  const tarih = toDate(deger);
  return tarih ? format(tarih, TAM_FORMAT, { locale: tr }) : "";
}

/** "14:32" */
export function formatSaat(deger: Date | string | null | undefined): string {
  const tarih = toDate(deger);
  return tarih ? format(tarih, SAAT_FORMAT, { locale: tr }) : "";
}

/** "3 saat önce", "2 gün önce" */
export function gorelTarih(deger: Date | string | null | undefined): string {
  const tarih = toDate(deger);
  if (!tarih) return "";
  return formatDistanceToNow(tarih, { locale: tr, addSuffix: true });
}

/** Yedek dosyası için: "2026-05-23_14-32-15" */
export function dosyaTarihi(deger?: Date): string {
  const tarih = deger ?? new Date();
  return format(tarih, "yyyy-MM-dd_HH-mm-ss");
}
