/**
 * Uygulama hata sınıfları.
 *
 * Yeni kodlarda mümkün olduğunca `KatalogHatasi` ve merkezi hata kataloğu
 * kullanılmalıdır. Bu sınıflar eski modüllerle uyumluluk için korunur.
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
export class BulunamadiHatasi extends UygulamaHatasi {
  constructor(mesaj = "Kayıt bulunamadı") {
    super(mesaj, "SHARE_NOT_FOUND", 404);
    this.name = "BulunamadiHatasi";
  }
}

export class YetkiHatasi extends UygulamaHatasi {
  constructor(mesaj = "Bu işlem için yetkiniz yok") {
    super(mesaj, "PERMISSION_DENIED", 403);
    this.name = "YetkiHatasi";
  }
}

export class GirisYokHatasi extends UygulamaHatasi {
  constructor(mesaj = "Önce giriş yapmalısınız") {
    super(mesaj, "AUTH_REQUIRED", 401);
    this.name = "GirisYokHatasi";
  }
}

export class ValidasyonHatasi extends UygulamaHatasi {
  constructor(
    mesaj = "Geçersiz veri",
    public detaylar?: unknown[],
  ) {
    super(mesaj, "VALIDATION_INVALID", 400);
    this.name = "ValidasyonHatasi";
  }
}

export class CakismaHatasi extends UygulamaHatasi {
  constructor(mesaj = "Çakışan kayıt") {
    super(mesaj, "SHARE_CONCURRENT_ASSIGNMENT", 409);
    this.name = "CakismaHatasi";
  }
}

export class IsKuraliHatasi extends UygulamaHatasi {
  constructor(mesaj: string, kod = "VALIDATION_INVALID") {
    super(mesaj, kod, 422);
    this.name = "IsKuraliHatasi";
  }
}

export {
  BulunamadiHatasi as BulunamadıHatası,
  GirisYokHatasi as GirisYokHatası,
  ValidasyonHatasi as ValidasyonHatası,
  YetkiHatasi as YetkiHatası,
};
