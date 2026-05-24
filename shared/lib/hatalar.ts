/**
 * Custom hata sınıfları — MIMARI.md §11.1
 *
 * Tüm uygulama hataları UygulamaHatasi'ndan türer.
 * API katmanı bu hataları yakalayıp uygun HTTP status'a çevirir (api-helpers.ts).
 */

export class UygulamaHatasi extends Error {
  constructor(
    mesaj: string,
    public kod: string,
    public statusCode: number = 500,
  ) {
    super(mesaj);
    this.name = "UygulamaHatasi";
  }
}

export class BulunamadıHatası extends UygulamaHatasi {
  constructor(mesaj = "Kayıt bulunamadı") {
    super(mesaj, "BULUNAMADI", 404);
    this.name = "BulunamadıHatası";
  }
}

export class YetkiHatası extends UygulamaHatasi {
  constructor(mesaj = "Bu işlem için yetkiniz yok") {
    super(mesaj, "YETKI_YOK", 403);
    this.name = "YetkiHatası";
  }
}

export class GirisYokHatası extends UygulamaHatasi {
  constructor(mesaj = "Önce giriş yapmalısınız") {
    super(mesaj, "GIRIS_YOK", 401);
    this.name = "GirisYokHatası";
  }
}

export class ValidasyonHatası extends UygulamaHatasi {
  constructor(
    mesaj = "Geçersiz veri",
    public detaylar?: unknown[],
  ) {
    super(mesaj, "VALIDASYON", 400);
    this.name = "ValidasyonHatası";
  }
}

export class CakismaHatasi extends UygulamaHatasi {
  constructor(mesaj = "Çakışan kayıt") {
    super(mesaj, "CAKISMA", 409);
    this.name = "CakismaHatasi";
  }
}

export class IsKuraliHatasi extends UygulamaHatasi {
  constructor(mesaj: string, kod = "IS_KURALI") {
    super(mesaj, kod, 422);
    this.name = "IsKuraliHatasi";
  }
}
