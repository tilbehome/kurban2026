# 04 — Platform Süper Admin ve Firma Admin

```yaml
id: ARC-004
status: IMPLEMENTED_PENDING_VERIFICATION
owner: Architecture-and-Platform
source_role: platform_control_plane_architecture
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

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

Bu bölümün kanıt özeti ve kapsam sınırı [ARC-016](16-FAZ-2B-DOGRULANMIS-DURUM-VE-KAPSAM-SINIRI.md) belgesindedir. Aşağıdaki envanter uygulanan yüzeyleri açıklar; canlıya hazır olma beyanı değildir.

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
| `/security` | Passkey/recovery, cihaz, oturum ve kritik işlem yeniden doğrulaması |
| `/incidents` | Olay açma, güncelleme, çözme ve auditli zaman çizelgesi |
| `/maintenance` | Planlı bakım, read-only, tam ve modül bazlı acil durdurma |
| `/unauthorized` | Geçerli oturumda application izni bulunmayan kullanıcı için güvenli durum |

Yeni ince API yüzeyleri: `/api/auth/passkey/*`, `/api/auth/recovery`, `/api/security/passkeys/*`, `/api/security/recovery-codes`, `/api/security/reauthenticate`, `/api/security/devices/*`, `/api/security/sessions/revoke-all`, `/api/incidents/*`, `/api/maintenance/*`, `/api/emergency-stops`, `/api/organizations/[id]/operations`, `/api/organization-operations/[id]/*` ve `/api/organizations/[id]/admin-invitations`.

Route mutasyonları ince adaptördür; yetki, idempotency, lifecycle, support süresi/kapsamı ve secret-safe payload kuralları `@tilbecore/platform` application/domain katmanındadır. Platform DB erişimi `@tilbecore/database-platform` adaptöründedir. Firma Admin hazırlığı artık PlatformUser oluşturmaz; platform metadata’sında tenant’a bağlı `TenantAdminInvitation` olarak tutulur.

### Faz 2B kontrol düzlemi tamamlama kanıtı

- `0007_platform_control_plane_completion` migration’ı passkey credential/challenge, hashlenmiş tek kullanımlık recovery code, incident timeline, bakım durumu, emergency-stop modu ve onaylı firma operasyon işlerini ekler. Platform DB’ye tenant müşteri, hayvan, hisse, satış veya finans verisi eklenmez.
- WebAuthn RP ID ve allowed origin yalnız `packages/config` üzerinden üretilir. Kayıt ve doğrulama `@simplewebauthn/server` ile challenge tüketimi, user verification, origin ve RP doğrulamasına bağlıdır. Yerel gerçek cihaz kabulü HTTPS gerektirir; kod/unit/build kanıtı gerçek cihaz kabul kanıtı değildir.
- `/security`, `/incidents` ve `/maintenance` sayfaları ile ilgili ince API adaptörleri gerçek Platform DB repository/use-case akışlarına bağlıdır. Passkey iptali, cihaz/oturum sonlandırma, recovery yenileme, olay zaman çizelgesi, planlı bakım, firma/modül durdurma ve read-only politikası uygulanır.
- Tenant request runtime aktif Platform DB politikasını request öncesi çözer. `full_stop`, `read_only`, module scope engeli ve askıya alınmış firma fail-closed davranır; satış, finans, kesim ve teslimat yazıları sessizce devam etmez.
- Firma 360° görünümü plan/lisans, entitlement, limit, domain, release/migration, backup ve health metadata’sı için beklenen-gerçek farkını gösterir; secret veya tenant operasyon kaydı göstermez.
- Dondurma, yeniden etkinleştirme, kapatma ön kontrolü/talebi, export ve yönetim devri idempotent iş kaydıdır. Kritik işlemler son on dakikada yeniden doğrulama ister; kapatma, export ve devir farklı ikinci yetkili ister. Export içeriği Platform Admin’e dönmez ve tenant tarafı export üreticisi sonraki firma uygulaması paketine bağlıdır.
- Provisioning tamamlandığında ilk backup işi idempotent kuyruğa alınır. Başarılı backup metadata’sından sonra hazırlanan Firma Admin daveti süreli ve yeniden gönderilebilirdir; token yalnız hashlenmiş saklanır ve merkezi tenant domain config’inden üretilen aktivasyon bağlantısı sadece oluşturma yanıtında bir kez gösterilir.

Faz 2B uygulama kapsamı gerçek PostgreSQL migration/repository ve iki firma izolasyon testleriyle uygulanmıştır; genel doğrulama beklemektedir. Canlı DNS/TLS, deployment, production destructive restore, gerçek abonelik/faturalama, gerçek firma verisi, yerel HTTPS üzerinde fiziksel passkey cihaz kabulü ve genel Faz 2–12 E2E/güvenlik dönemi bu uygulama kanıtının parçası değildir.

### Yerel çalışma ve ilk kullanıcı

Yerel hosts kaydında `127.0.0.1 console.tilbecore.test` bulunmalıdır. Platform DB migration’ı yetkili operatör tarafından uygulandıktan sonra gerekli environment değerleri terminal oturumuna verilir ve `pnpm platform-admin:dev` çalıştırılır. Genel panel `http://console.tilbecore.test:3100` adresinde geliştirilebilir; WebAuthn cihaz kabulü için aynı doğrulanmış hostun güvenilir yerel sertifikalı HTTPS reverse proxy üzerinden sunulması gerekir. HTTP üzerinde passkey başarısı iddia edilmez.

İlk kullanıcı otomatik oluşmaz. Boş PlatformUser tablosunda yalnız açık onayla `pnpm platform-admin:bootstrap` çalışır. Bootstrap için gerekli environment adları: `PLATFORM_DATABASE_URL`, `PLATFORM_BOOTSTRAP_CONFIRM=CREATE_FIRST_SUPER_ADMIN`, `PLATFORM_BOOTSTRAP_EMAIL`, `PLATFORM_BOOTSTRAP_DISPLAY_NAME`, en az 14 karakterli `PLATFORM_BOOTSTRAP_PASSWORD`, Base32 `PLATFORM_BOOTSTRAP_MFA_SECRET` ve 32 byte Base64 `PLATFORM_MFA_ENCRYPTION_KEY`. Recovery kodu üretme/giriş çalışma zamanında ayrıca en az 32 karakterli `PLATFORM_RECOVERY_CODE_PEPPER` gerekir. Production’da bootstrap için `PLATFORM_BOOTSTRAP_PRODUCTION_ENABLED=true` açıkça verilmelidir. Parola, MFA secretı, recovery pepper ve şifreleme anahtarı komut argümanına veya çıktıya yazılmaz.

Async işler kontrollü süreç yöneticisi/operatör tarafından `pnpm provisioning:worker` ve `pnpm tenant:ops:worker` ile tek iş olarak yürütülebilir. Sürekli worker orchestration ve canlı deployment bu paketin kanıtı değildir.
