/**
 * Basit in-memory sliding-window rate limit.
 *
 * Public endpoint'leri (TV müşteri arama, dekont doğrulama) DoS'a karşı korur.
 * Process restart'ında temizlenir (Redis yok, küçük çiftlik için yeterli).
 */

const istek = new Map<string, number[]>();

interface LimitSonuc {
  izinli: boolean;
  kalanSn?: number;
}

export function rateLimitKontrol(
  anahtar: string,
  maxIstek: number,
  pencereSn: number,
): LimitSonuc {
  const simdi = Date.now();
  const pencereSinir = simdi - pencereSn * 1000;
  const liste = istek.get(anahtar) ?? [];
  const yeni = liste.filter((t) => t > pencereSinir);

  if (yeni.length >= maxIstek) {
    const enErken = Math.min(...yeni);
    const kalanSn = Math.ceil((enErken + pencereSn * 1000 - simdi) / 1000);
    return { izinli: false, kalanSn };
  }
  yeni.push(simdi);
  istek.set(anahtar, yeni);
  return { izinli: true };
}

/**
 * Bir anahtarın deneme sayacını sıfırlar.
 *
 * Login akışında: yanlış denemeler `rateLimitKontrol` ile sayaca eklenir,
 * başarılı girişte bu fonksiyon çağrılıp brute-force koruması yenilenir.
 */
export function rateLimitSifirla(anahtar: string): void {
  istek.delete(anahtar);
}

// Periyodik temizleme — memory leak engelleme.
const TEMIZ_ARALIK_MS = 60 * 1000;
const ESKI_ANAHTAR_MS = 5 * 60 * 1000;

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const simdi = Date.now();
    const eskiSinir = simdi - ESKI_ANAHTAR_MS;
    for (const [anahtar, liste] of istek) {
      const yeni = liste.filter((t) => t > eskiSinir);
      if (yeni.length === 0) istek.delete(anahtar);
      else istek.set(anahtar, yeni);
    }
  }, TEMIZ_ARALIK_MS);
}
