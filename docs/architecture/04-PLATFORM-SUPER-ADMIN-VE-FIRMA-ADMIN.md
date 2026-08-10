# 04 — Platform Süper Admin ve Firma Admin

Birinci kaynak `TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md` belgesidir.

## Ayrım ilkesi

Platform Süper Admin, firma uygulamasındaki normal bir `SUPER_ADMIN` rolü değildir. Ayrı kullanıcı modeli, ayrı session/cookie, ayrı route alanı, ayrı yetki ve ayrı audit gerektirir.

## Platform alanı

Kesin platform origin: `https://console.tilbecore.com`.

`platform.tilbecore.com` eski öneridir ve yerine `console.tilbecore.com` geçmiştir. Gerekçe: platform yönetimi ile firma tenant originlerini açık biçimde ayırmak, cookie/session namespace sınırını netleştirmek ve production/staging/local adres sözleşmesini tek merkezde yönetmek.

Bilgi mimarisi:

- Dashboard: firma sayıları, lisans bitişleri, kurulum türleri, sürüm dağılımı, migration/yedek hataları, çevrimdışı kurulumlar, destek erişimleri, güvenlik olayları.
- Firma yönetimi: firma kodu, slug, provisioning, DB durumu, lisans, modül, kullanıcı/cihaz sınırı, aktif sezon, sürüm, yedek, son bağlantı, sağlık, geçmiş.
- Lisans/paket: sezonluk, yıllık, deneme, yerel/bulut, kullanıcı/cihaz limiti, modüller, destek paketi, tolerans süresi.
- Sürüm/migration: katalog, test firmaları, güncelleme halkaları, güncelleme öncesi yedek, sonuç ve kurtarma.
- Destek erişimi: firma onayı, neden, süre, erişen kişi, iptal, ayrıntılı audit.

Profesyonel Platform Süper Admin genişletmeleri `PRO-012..PRO-021`, `PRO-026`, `PRO-028` ve `PRO-029` kimlikleriyle izlenir. Bunlar mevcut Platform Control Plane kapsamını genişletir; ayrı mikroservis veya ayrı ürün kararı değildir:

- Firma kurulum/provisioning sihirbazı: DB, admin daveti, modül hakları ve rollback adımlarını kanıtlı yürütür.
- Platform güvenlik merkezi: MFA/passkey politikası, cihaz, oturum, şüpheli giriş ve destek erişimi görünümü sağlar.
- Güncelleme ve migration ön kontrolü: yedek, dry-run, tenant health, sürüm uyumu, kapasite ve rollback hazır olma durumunu doğrular.
- Firma/modül bazlı acil durdurma anahtarı: OpenFeature uyumlu feature flag sözleşmesiyle modülü firma bazında kapatır.
- Olay, kesinti ve bakım yönetimi: incident, bakım penceresi, etkilenen firmalar, bildirim ve kapanış raporunu auditli tutar.
- Kapasite, depolama, kullanıcı ve cihaz görünümü: limitleri, tüketimi ve alarm eşiklerini platformdan izlenebilir kılar.
- Firma yapılandırma ve sürüm karşılaştırması: modül, flag, migration, lisans, ayar ve deployment farklarını gösterir.
- Firma veri dışa aktarma, kapatma ve devir süreci: firma talebi, saklama, export, kapatma ve devir adımlarını kayıt altına alır.
- Yedekten dönüş provası ve doğrulama kanıtı: backup metadata’sını gerçek restore/checksum kabul kanıtıyla tamamlar.

## Firma admin alanı

Firma admini sadece kendi operasyon veritabanına bağlıdır.

Yönetebilecekleri:

- Firma bilgisi, logo, belge kimliği.
- Sezon.
- Kullanıcı ve rol.
- Müşteri/cari.
- Tedarikçi/alış.
- Hayvan/hisse.
- Satış/kapora.
- Finans.
- Vekâlet/belge.
- Kesim, tartım, paket, teslim.
- Firma raporları.
- TV/müşteri takip.
- Firma ayarları.
- Kendi veri dışa aktarma ve yedek talepleri.

Profesyonel Firma Admin genişletmeleri `PRO-001..PRO-011` kimlikleriyle izlenir:

- Operasyon Kontrol Merkezi ve istisna kuyruğu.
- Merkezi Onay Kutusu.
- Excel/CSV Veri İçe Aktarma Merkezi.
- Veri Kalitesi ve mükerrer kayıt merkezi.
- Evrensel arama.
- Günlük görev ve vardiya devir teslimi.
- Bildirim gönderim/başarısızlık geçmişi.
- Cihaz, oturum ve giriş güvenliği yönetimi.
- KVKK, iletişim izni, veri dışa aktarma ve saklama süreci.
- Kullanıcı eğitim, yardım ve sentetik demo modu.
- WCAG 2.2 AA erişilebilirlik hedefi.

Göremeyecekleri:

- Başka firmalar.
- Platform kullanıcıları.
- Global lisans politikası.
- Veritabanı şifreleri.
- Global migration sistemi.
- Kaynak kodu.

## Destek erişim modeli

Platform yöneticisi firma operasyon verilerine sessiz ve sınırsız erişemez.

10 Ağustos 2026 yerine geçen karar: Süper Admin normal şartlarda firma operasyon, müşteri ve finans verilerini görmez. Eski “platformdan her şeyi yönetme” veya firma içi `SUPER_ADMIN` ile karıştırılan yaklaşımlar geçerli değildir. Destek erişimi yalnız süreli, gerekçeli, denetlenebilir ve firma onaylı ya da politika ile açıkça yetkilendirilmiş oturumla mümkündür.

Destek oturumu alanları:

- `supportAccessId`
- firma kodu
- talep eden firma kullanıcısı
- erişen platform kullanıcısı
- neden
- süre
- başlangıç/bitiş
- kapsam: okuma/yazma, modül sınırı
- görülen/değiştirilen kayıt audit’i
- firma tarafından iptal
- destek talebi ve `SupportSession` ilişki kimliği
- erişim sonrası kapanış ve firma görünür özet
