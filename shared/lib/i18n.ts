export const DESTEKLENEN_LOCALELER = ["tr", "en", "ar"] as const;
export type Locale = (typeof DESTEKLENEN_LOCALELER)[number];

export const VARSAYILAN_LOCALE: Locale = "tr";

type MesajParametreleri = Record<string, string | number | boolean | null | undefined>;

type MesajSozlugu = Record<string, string>;

const TR: MesajSozlugu = {
  "error.auth.required": "Önce giriş yapmalısınız.",
  "error.permission.denied": "Bu işlem için yetkiniz yok.",
  "error.validation.invalid": "Geçersiz veri.",
  "error.notFound.customer": "Müşteri bulunamadı.",
  "error.notFound.share": "Hisse bulunamadı.",
  "error.notFound.shares": "Hisseler bulunamadı.",
  "error.notFound.proxy": "Vekâlet bulunamadı.",
  "error.conflict.requestProcessing": "Bu istek işleniyor. Lütfen sonucu kontrol edin.",
  "error.share.alreadyAssigned": "Hisse #{shareLabel} zaten dolu.",
  "error.share.alreadyAssignedReleaseFirst": "Hisse #{shareLabel} zaten dolu. Önce serbest bırakın.",
  "error.share.concurrentAssignment":
    "Hisselerden biri eşzamanlı başka kullanıcı tarafından dolduruldu. Listeyi yenileyip tekrar deneyin.",
  "error.share.alreadyEmpty": "Bu hisse zaten boş.",
  "error.finance.downPaymentExceedsSale": "Kapora toplamı satış bedelini aşamaz.",
  "error.finance.shareHasActivePayment":
    "Bu hissede aktif tahsilat var. Önce tahsilatı iptal/iade edin veya mahsup sürecini tamamlayın.",
  "error.tenant.postgresNotEnabled": "Tenant PostgreSQL iş akışı bu ortamda açık değil.",
  "error.pricing.itemRequired": "Fiyat tarifesinde en az bir kalem olmalı.",
  "error.reservation.windowInvalid": "Rezervasyon bitiş zamanı geçerli ve ileri tarihli olmalı.",
  "error.share.countInvalid": "Satış için 1 ile 7 arasında hisse seçilmelidir.",
  "error.finance.discountExceedsListPrice": "İndirim liste fiyatını aşamaz.",
  "error.finance.positiveAmountRequired": "Tutar sıfırdan büyük olmalı.",
  "error.finance.allocationMismatch": "Tahsilat dağılımı toplam tutarla eşleşmiyor.",
  "error.finance.receiptMethodRequired": "Tahsilat için en az bir ödeme yöntemi girilmeli.",
  "error.finance.posFieldsRequirePos": "POS taksit veya vade farkı yalnız POS yöntemiyle girilebilir.",
  "error.finance.moneyInvalid": "Para tutarı geçerli değil.",
  "error.share.qurbanEligibilityBlocked": "Bu hayvan için açık uygunluk engeli varken satış yapılamaz.",
  "error.share.notSellable": "Hisse satışa uygun değil.",
  "error.season.archivedReadOnly": "Arşivlenmiş sezona yazılamaz.",
  "error.season.operationNotAllowed": "Sezonun mevcut durumunda bu işlem yapılamaz.",
  "error.notFound.season": "Sezon bulunamadı.",
  "error.share.seasonMismatch": "Hisse seçilen sezona ait değil.",
  "error.conflict.idempotencyReused": "Aynı işlem anahtarı farklı içerikle tekrar kullanılamaz.",
  "error.finance.accountNotFound": "Finans hesabı bulunamadı.",
  "error.notFound.sale": "Satış bulunamadı.",
  "error.sale.notCancellable": "Bu satış doğrudan iptal edilemez.",
  "error.sale.paymentRequiresReversal": "Tahsilat görmüş satış için ters kayıt/iade akışı kullanılmalıdır.",
  "error.share.sourceNotTransferable": "Kaynak hisse transfer edilebilir durumda değil.",
  "error.share.targetNotAvailable": "Hedef hisse boş ve kullanılabilir durumda değil.",
  "error.share.sequenceOutOfRange": "Hisse sıra numarası 1 ile 7 arasında olmalıdır.",
  "error.file.invalidProxyPath": "Vekâlet dosya yolu geçersiz.",
  "error.file.proxyFileNotFound": "Vekâlet dosyası bulunamadı.",
  "error.internal.generic": "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
  "error.internal.saleCouldNotComplete": "Satış işlemi tamamlanamadı.",
  "success.generic": "İşlem tamamlandı.",
};

const EN: MesajSozlugu = {
  "success.generic": "The operation was completed.",
};

const AR: MesajSozlugu = {
  "success.generic": "تمت العملية.",
};

const MESAJLAR: Record<Locale, MesajSozlugu> = {
  tr: TR,
  en: EN,
  ar: AR,
};

export function localeGecerliMi(locale: string | null | undefined): locale is Locale {
  return Boolean(locale && DESTEKLENEN_LOCALELER.includes(locale as Locale));
}

export function localeCoz(locale: string | null | undefined): Locale {
  if (!locale) return VARSAYILAN_LOCALE;
  const sade = locale.toLowerCase().split("-")[0];
  return localeGecerliMi(sade) ? sade : VARSAYILAN_LOCALE;
}

export function localeYon(locale: string | null | undefined): "ltr" | "rtl" {
  return localeCoz(locale) === "ar" ? "rtl" : "ltr";
}

export function rtlMi(locale: string | null | undefined): boolean {
  return localeYon(locale) === "rtl";
}

export function mesajCoz(
  anahtar: string,
  locale: string | null | undefined = VARSAYILAN_LOCALE,
  parametreler: MesajParametreleri = {},
): string {
  const aktif = localeCoz(locale);
  const sablon = MESAJLAR[aktif][anahtar] ?? MESAJLAR[VARSAYILAN_LOCALE][anahtar];
  if (!sablon) {
    return process.env.NODE_ENV === "production"
      ? "İşlem tamamlanamadı. Lütfen tekrar deneyin."
      : `[missing:${anahtar}]`;
  }

  return sablon.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (_eslesme, ad: string) => {
    const deger = parametreler[ad];
    return deger === null || deger === undefined ? `{${ad}}` : String(deger);
  });
}

export function eksikMesajAnahtarlari(locale: Locale): string[] {
  if (locale === VARSAYILAN_LOCALE) return [];
  return Object.keys(MESAJLAR[VARSAYILAN_LOCALE]).filter((anahtar) => !MESAJLAR[locale][anahtar]);
}

export function tarihBicimlendir(
  tarih: Date | string | number,
  locale: string | null | undefined = VARSAYILAN_LOCALE,
): string {
  return new Intl.DateTimeFormat(localeCoz(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(tarih));
}

export function sayiBicimlendir(
  sayi: number,
  locale: string | null | undefined = VARSAYILAN_LOCALE,
): string {
  return new Intl.NumberFormat(localeCoz(locale)).format(sayi);
}

export function paraBicimlendir(
  tutar: number,
  locale: string | null | undefined = VARSAYILAN_LOCALE,
  paraBirimi = "TRY",
): string {
  return new Intl.NumberFormat(localeCoz(locale), {
    style: "currency",
    currency: paraBirimi,
    maximumFractionDigits: 2,
  }).format(tutar);
}
