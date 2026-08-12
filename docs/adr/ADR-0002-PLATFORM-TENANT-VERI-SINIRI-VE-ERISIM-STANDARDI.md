# ADR-0002 — Platform–Tenant Veri Sınırı ve Erişim Standardı

```yaml
id: ADR-0002
status: IMPLEMENTED_UNVERIFIED
owner: Architecture-and-Security
source_role: platform_tenant_data_boundary_decision
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

Tarih: 10 Ağustos 2026

Durum: Kabul edildi

## Bağlam

TilbeCore – Kurban Takip tek kod tabanlı, çok firmalı ve modüler monolit bir üründür. Platform yönetimi ile firma operasyonu aynı ürün ailesinde yer alsa da veri sahipliği, oturum, yetki, audit ve veritabanı sınırları karıştırılamaz.

Bu ADR, Faz 2A kapanış paketinde bağlayıcı mimari karar olarak yazılmıştır. Faz 2C uygulama paketleri bu kararı gerçek PostgreSQL provisioning adapteri, devam ettirilebilir iş kaydı, tenant-aware request runtime ve connection pool, kontrollü CLI’lar, platform metadata bridge’i ve iki firma izolasyon entegrasyon testiyle uygulamaya bağlamıştır. DNS, TLS, canlı deployment ve Süper Admin ekranı bu ADR güncellemesinin kapsamı değildir.

## Karar

Platform veritabanı yalnız platformun firmaları güvenli biçimde kurması, yönetmesi, lisanslaması, izleyebilmesi ve destek süreçlerini denetleyebilmesi için gereken metadata’yı tutar. Firma operasyon verisinin gerçek kaynağı her firmanın kendi tenant veritabanıdır.

### Platform DB’de tutulabilecek metadata

Platform DB aşağıdaki veri sınıflarını tutabilir:

- firma/organization kimliği, ticari ad, slug ve durum metadata’sı,
- tenant lifecycle durumu: kurulum, provisioning, askıya alma, kapatma, devir,
- lisans, paket, modül hakları, feature flag hedefleri,
- tenant DB referansı için opaque `TenantDatabaseRef`,
- migration, backup, restore, sağlık ve kapasite metadata’sı,
- platform kullanıcıları, rolleri, oturumları ve MFA/passkey politika metadata’sı,
- firma admin davetleri ve provisioning görev kayıtları,
- platform audit kayıtları,
- support request ve süreli `SupportSession` metadata’sı,
- incident, bakım, kill switch ve operasyonel uyarı metadata’sı.

### Platform DB’de tutulmayacak firma operasyon verileri

Platform DB normal şartlarda aşağıdaki firma operasyon verilerini tutmaz:

- müşteri, hissedar, telefon, adres ve KVKK/iletişim izin içeriği,
- hayvan, küpe, kurban, hisse, satış, rezervasyon ve fiyat snapshot verisi,
- tahsilat, kasa, banka/POS, cari, ledger, iade, mahsup ve gider hareketleri,
- vekâlet, belge, QR token içeriği, dosya fiziksel yolu ve belge snapshot içeriği,
- kesim, tartım, paketleme, teslimat, rota ve saha görev olayları,
- firma kullanıcılarının tenant içi işlem detayları,
- ham operasyon raporları veya firma içi finansal özetler.

Platform ekranları firma operasyon verisini doğrudan listelemez. Platformda gereken görünürlük metadata, sağlık, kapasite, sürüm, destek kapsamı ve kanıt kayıtlarıyla sınırlıdır.

## Kimlik, oturum ve cookie ayrımı

- Platform kullanıcıları ve firma kullanıcıları ayrı kimlik alanlarıdır.
- Platform oturumu firma oturumu yerine geçmez.
- Firma oturumu platform yetkisi üretmez.
- Platform ve tenant cookie adları, domain/scope değerleri ve imzalama bağlamları ayrıdır.
- `console.{baseDomain}` platform yüzeyidir; `{tenantSlug}.{baseDomain}` tenant yüzeyidir.
- Yanlış origin, host, session veya cookie kombinasyonu fail-closed reddedilir.

## TenantDatabaseRef ve secret sınırı

`TenantDatabaseRef` opaque bir referanstır; bağlantı parolası, token, secret veya açık connection string taşımaz. Platform DB’de saklanan referans, tenant DB’ye bağlanmak için doğrudan yeterli olmamalıdır.

Gerçek bağlantı bilgileri yalnız güvenli secret store veya eşdeğer kontrollü runtime mekanizmasından çözümlenir. Secret değerleri API yanıtına, loglara, hata mesajlarına, audit dışa aktarımına veya istemci bundle’ına çıkamaz.

Faz 2C adapteri `TenantDatabaseRef` değerinden doğrulanmış ve uzunluğu sınırlı bir PostgreSQL identifier üretir; kullanıcıdan ham SQL veya connection string almaz. Admin bağlantısı yalnız process ortamından composition root’a verilir. Migration alt süreci sabit executable ve sabit argümanlarla, shell açmadan çalışır; hata ve iş durumu kayıtlarına yalnız güvenli hata kodu yazılır.

`TenantDatabaseRef` şu durumlarda reddedilir:

- beklenen tenant kimliğiyle eşleşmiyorsa,
- bilinmeyen, askıda, kaldırılmış veya kapatılmış tenant’a aitse,
- secret çözümleme başarısızsa,
- bağlantı hedefi platform DB veya başka firmanın DB’si olarak sınıflandırılmışsa,
- bağlantı doğrulaması tenant kimliğiyle mutabık değilse.

## Süper Admin ve SupportSession sınırı

Platform Süper Admin normal şartlarda firma müşteri, finans, vekâlet, hisse, kesim, paketleme ve teslimat operasyon verilerini göremez.

Firma operasyon verisine platform tarafından erişim yalnız süreli, gerekçeli, kapsamlı ve auditli `SupportSession` ile mümkündür. `SupportSession` için asgari koşullar:

- firma tarafında yetkili onay,
- erişim gerekçesi,
- kapsam: modül, veri sınıfı ve işlem türü,
- başlangıç ve bitiş zamanı,
- erişen platform kullanıcısı,
- görüntüleme/yazma ayrımı,
- iptal ve kapanış kaydı,
- platform ve tenant audit korelasyonu.

Onaylayan firma kullanıcısının kimliği Platform DB’de yalnız opaque onay metadata’sıdır; `PlatformUser` ilişkisi veya platform yetkisi üretmez. Destek işlemini yapan platform kullanıcısı ayrı `platformUserId` ile izlenir.

`SupportSession` yoksa veya süresi/kapsamı uygun değilse operasyon verisi erişimi fail-closed reddedilir.

## Audit sorumlulukları

Platform audit şunları kaydeder:

- platform kullanıcı girişi, MFA/passkey olayı ve oturum yönetimi,
- firma lifecycle, provisioning, migration, backup/restore metadata işlemleri,
- feature flag, kill switch, incident ve bakım işlemleri,
- `SupportSession` talep, onay, kapsam değişikliği, erişim başlangıcı ve kapanışı.

Tenant audit şunları kaydeder:

- firma kullanıcılarının operasyonel işlemleri,
- müşteri/hayvan/hisse/satış/tahsilat/kasa/vekalet/kesim/paket/teslim olayları,
- tenant içi yetki değişiklikleri,
- support session kapsamındaki gerçek operasyon verisi erişimleri.

Platform ve tenant audit kayıtları `requestId`, `auditId`, `tenantId` ve varsa `supportSessionId` ile korele edilebilir; ancak tenant operasyon içeriği platform audit’e kopyalanmaz.

## Fail-closed davranış

Aşağıdaki durumlarda sistem güvenli biçimde reddeder:

- bilinmeyen veya reserved subdomain,
- host header ile tenant kaydının uyuşmaması,
- custom domain doğrulamasının tamamlanmamış olması,
- session/cookie tenant kimliğinin resolved tenant ile uyuşmaması,
- yanlış veya çözülemeyen `TenantDatabaseRef`,
- platform kullanıcısının tenant operasyon yetkisi gibi kullanılması,
- support session olmadan firma operasyon verisi erişimi,
- tenant connection pool içinde yanlış firma veya yanlış DB hedefi.

Reddedilen istekler güvenli hata kodu ve requestId döndürür; DB secret, connection string, stack trace veya PII sızdırmaz.

## Faz 2C uygulama kanıtı

- `packages/database-tenant`: gerçek DB create/exists/migrate/verify/rollback adapteri ve tenant Prisma connection factory. Migration öncesi sahiplik kanıtı PostgreSQL DB metadata'sında, migration sonrası ikinci kanıt tenant içindeki `TenantProvisioningMarker` tablosunda tutulur; böylece Prisma boş şema şartı bozulmaz.
- `packages/provisioning`: adım durumları, idempotency fingerprint’i, güvenli resume ve yalnız aynı işin oluşturduğu kayıt edilmemiş DB için rollback kuralı.
- `packages/database-platform`: `0004_resumable_tenant_provisioning` ve `0005_tenant_request_runtime_metadata` migration’ları; provisioning job, custom domain, SupportSession ve platform audit metadata’sı.
- `packages/tenant-runtime`: doğrulanmış host/session’dan tipli request context üreten runtime; tenant+opaque DB ref anahtarlı pool, eşzamanlı reuse, referans sahipliği kontrolü, idle kapatma, shutdown temizliği ve sağlayıcıdan bağımsız event/metric portu.
- `packages/tenant-web-runtime`: Platform DB’deki tenant, custom domain ve SupportSession metadata’sını public package sınırlarından request runtime’a bağlayan Prisma adapteri; platform support erişimini güvenli metadata ile auditler.
- `apps/provisioning-cli`: `dry-run`, `create`, `status`, `resume` ve `rollback` komutları.
- `apps/tenant-ops-cli`: tenant/ref doğrulamalı backup create/status/verify ve destructive olmayan restore plan/verify komutları.
- `packages/database-tenant/tests/tenant-isolation.integration.test.ts`: iki fiziksel tenant DB, aynı kayıt ID’leri, eşzamanlı web request izolasyonu, host/session/ref reddi, SupportSession sınırı ve audit’i, pool metrikleri, gerçek dump/geçici restore doğrulaması, secret redaction ve tenant-bağımsız rollback kanıtı.
- `tests/architecture-boundaries.test.ts`: platform DB ile tenant DB altyapısının private import veya doğrudan join bağımlılığı kurmaması.

Bu kanıtlar tenant provisioning ve doğrulanmış tenant-web request composition çekirdeğini uygular. Mevcut legacy Next.js route’larının toplu olarak yeni runtime’a taşınması sonraki iş modülü fazlarında yapılır. Canlı WAL/PITR yapılandırması ve ölçümü, DNS/TLS/deployment, production restore yetkilendirmesi ve Süper Admin UI hâlâ tamamlanmamıştır. Backup/restore kararı ADR-0003’te bağlayıcıdır.

## PlatformUser firma sınırı

Platform kullanıcısı doğrudan `organizationId` alanıyla tenant operasyon yetkisi kazanmaz. Firma kapsamı gerektiren platform işlemleri ayrı metadata, audit ve gerekiyorsa süreli `SupportSession` kapsamı üzerinden izlenir. Bu nedenle platform temel şemasında `PlatformUser.organizationId` alanı tenant yetki kaynağı olarak kullanılmaz.

## Sonuçlar

- Platform ve tenant veri sınırı Faz 2A’da yazılı sözleşme haline gelmiştir.
- Faz 2B Platform DB ve Süper Admin uygulaması bu ADR’ye göre tasarlanır.
- Faz 2C tenant DB provisioning, tenant-aware pool ve iki firma PostgreSQL izolasyon otomasyonunu bu ADR’ye göre uygular.
- Yeni tenant-web composition bridge’i çalışır; mevcut legacy Next.js route’larının fiziksel taşıması bu paketle yapılmaz.

## Geri dönüş

Kod geri dönüşü ilgili Faz 2C commit’inin revert edilmesiyle yapılır. Platform `0004`/`0005` ve tenant `0003` migration’ları uygulanmış ortamlarda şema geri alma doğrudan destructive SQL ile yapılmaz; test ortamı yeniden kurulur, kalıcı ortamda snapshot/restore veya ileri düzeltme migration’ı kullanılır. Provisioning rollback yalnız PostgreSQL DB metadata sahiplik kanıtı aynı provisioning işini doğrulayan ve platform tenant kaydı tamamlanmamış DB’yi düşürebilir. DNS, deployment ve secret state bu paket tarafından değiştirilmez.
