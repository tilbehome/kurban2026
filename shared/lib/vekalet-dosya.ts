import path from "node:path";

export const VEKALET_DOSYA_KLASOR = path.join(
  process.cwd(),
  "data",
  "uploads",
  "vekalet",
);

const LEGACY_PUBLIC_PREFIX = "/uploads/vekalet/";
const API_PREFIX = "/api/vekaletler/";

export function vekaletDosyaApiUrl(vekaletId: string): string {
  return `${API_PREFIX}${vekaletId}`;
}

export function vekaletDosyaDepoUrl(dosyaAdi: string): string {
  return `vekalet://${dosyaAdi}`;
}

export function guvenliVekaletDosyaAdi(dosyaAdi: string): string | null {
  if (!/^[a-zA-Z0-9_-]+\.(pdf|jpg|jpeg|png)$/i.test(dosyaAdi)) return null;
  return dosyaAdi;
}

export function vekaletDosyaYoluBul(dosyaUrl: string): string | null {
  if (dosyaUrl.startsWith("vekalet://")) {
    const dosyaAdi = guvenliVekaletDosyaAdi(dosyaUrl.slice("vekalet://".length));
    return dosyaAdi ? path.join(VEKALET_DOSYA_KLASOR, dosyaAdi) : null;
  }

  if (dosyaUrl.startsWith(LEGACY_PUBLIC_PREFIX)) {
    const dosyaAdi = guvenliVekaletDosyaAdi(
      dosyaUrl.slice(LEGACY_PUBLIC_PREFIX.length),
    );
    return dosyaAdi
      ? path.join(process.cwd(), "public", "uploads", "vekalet", dosyaAdi)
      : null;
  }

  return null;
}

export function vekaletMimeTipi(dosyaTipi: string): string {
  if (dosyaTipi === "pdf") return "application/pdf";
  if (dosyaTipi === "jpg" || dosyaTipi === "jpeg") return "image/jpeg";
  if (dosyaTipi === "png") return "image/png";
  return "application/octet-stream";
}
