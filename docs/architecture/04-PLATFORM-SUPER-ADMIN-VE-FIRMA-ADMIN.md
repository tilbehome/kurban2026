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

## Faz 2B uygulama kanıtı ve route envanteri

`apps/platform-admin` ayrı Next.js uygulaması olarak oluşturulmuştur. Host sınırı merkezi domain config üzerinden ortam başına yalnız `console.tilbecore.com`, `console.staging.tilbecore.com` veya `console.tilbecore.test` kabul eder. Uygulamanın tenant private paketlerine ve tenant Prisma istemcisine bağımlılığı mimari testle yasaktır.

Gerçek sayfalar:

| Route | İşlev |
|---|---|
| `/login` | Ayrı PlatformUser parola + zorunlu TOTP MFA girişi |
| `/` | Gerçek Platform DB sinyalli komuta merkezi |
| `/organizations` | Aranabilir/filtrelenebilir firma listesi |
| `/organizations/[id]` | Platform metadata’sıyla Firma 360° kartı ve kontrollü yaşam döngüsü |
| `/provisioning/new` | On adımlı alanları kapsayan async firma kurulum sihirbazı |
| `/provisioning` | Kuyruk komutları ve provisioning job iş merkezi |
| `/plans` | Plan, lisans, kota, entitlement ve gelecek tarihli değişiklik |
| `/domains` | Custom domain talebi ve gerçek DNS/TLS doğrulama durumu |
| `/backups` | Backup/verify/restore doğrulama komutları; destructive restore yok |
| `/support` | Süreli, kapsamlı, gerekçeli SupportSession açma/sonlandırma |
| `/users` | Platform kullanıcı 360°, rol/durum ve session iptali |
| `/audit` | Secret-safe platform audit olayları |
| `/unauthorized` | Geçerli oturumda application izni bulunmayan kullanıcı için güvenli durum |

Route mutasyonları ince adaptördür; yetki, idempotency, lifecycle, support süresi/kapsamı ve secret-safe payload kuralları `@tilbecore/platform` application/domain katmanındadır. Platform DB erişimi `@tilbecore/database-platform` adaptöründedir. Firma Admin hazırlığı artık PlatformUser oluşturmaz; platform metadata’sında tenant’a bağlı `TenantAdminInvitation` olarak tutulur.

Bu kanıt tam Faz 2B kapanışı değildir. Tam WebAuthn/passkey, recovery, canlı DNS/TLS, production destructive restore, abonelik/faturalama, emergency-stop/incident/bakım davranışları ve genel E2E/güvenlik kabul dönemi sonraki bağlayıcı işlerde kalır.

### Yerel çalışma ve ilk kullanıcı

Yerel hosts kaydında `127.0.0.1 console.tilbecore.test` bulunmalıdır. Platform DB migration’ı yetkili operatör tarafından uygulandıktan sonra gerekli environment değerleri terminal oturumuna verilir ve `pnpm platform-admin:dev` çalıştırılır. Adres `http://console.tilbecore.test:3100` olur.

İlk kullanıcı otomatik oluşmaz. Boş PlatformUser tablosunda yalnız açık onayla `pnpm platform-admin:bootstrap` çalışır. Gerekli environment adları: `PLATFORM_DATABASE_URL`, `PLATFORM_BOOTSTRAP_CONFIRM=CREATE_FIRST_SUPER_ADMIN`, `PLATFORM_BOOTSTRAP_EMAIL`, `PLATFORM_BOOTSTRAP_DISPLAY_NAME`, en az 14 karakterli `PLATFORM_BOOTSTRAP_PASSWORD`, Base32 `PLATFORM_BOOTSTRAP_MFA_SECRET` ve 32 byte Base64 `PLATFORM_MFA_ENCRYPTION_KEY`. Production’da ayrıca `PLATFORM_BOOTSTRAP_PRODUCTION_ENABLED=true` açıkça verilmelidir. Parola, MFA secretı ve şifreleme anahtarı komut argümanına veya çıktıya yazılmaz.

Async işler kontrollü süreç yöneticisi/operatör tarafından `pnpm provisioning:worker` ve `pnpm tenant:ops:worker` ile tek iş olarak yürütülebilir. Sürekli worker orchestration ve canlı deployment bu paketin kanıtı değildir.
