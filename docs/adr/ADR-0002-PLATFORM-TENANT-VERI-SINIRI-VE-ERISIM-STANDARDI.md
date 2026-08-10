# ADR-0002 — Platform–Tenant Veri Sınırı ve Erişim Standardı

Tarih: 10 Ağustos 2026

Durum: Kabul edildi

## Bağlam

TilbeCore – Kurban Takip tek kod tabanlı, çok firmalı ve modüler monolit bir üründür. Platform yönetimi ile firma operasyonu aynı ürün ailesinde yer alsa da veri sahipliği, oturum, yetki, audit ve veritabanı sınırları karıştırılamaz.

Bu ADR, Faz 2A kapanış paketi kapsamında davranış değiştirmeyen bağlayıcı mimari karar olarak yazılmıştır. Bu karar Prisma şeması, PostgreSQL kurulumu, tenant routing uygulaması veya fiziksel klasör taşıması yapmaz.

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

## Sonuçlar

- Platform ve tenant veri sınırı Faz 2A’da yazılı sözleşme haline gelir.
- Faz 2B Platform DB ve Süper Admin uygulaması bu ADR’ye göre tasarlanır.
- Faz 2C tenant DB routing, PostgreSQL ve isolation testleri bu ADR’ye göre uygulanır.
- Bu ADR tek başına PostgreSQL kurulumu, gerçek tenant routing veya uygulama taşıması yapmaz.

## Geri dönüş

Bu ADR dokümantasyon kararıdır. Geri dönüş gerektiğinde ilgili commit revert edilir. Kod, veritabanı, DNS, deployment veya secret state değişmediği için runtime geri alma gerektirmez.
