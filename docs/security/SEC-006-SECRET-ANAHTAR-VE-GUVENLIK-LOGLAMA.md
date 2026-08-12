# Secret, Anahtar ve Güvenlik Loglama Standardı

```yaml
id: SEC-006
title: Secret, Anahtar ve Güvenlik Loglama Standardı
status: PLANNED
owner: Security
source_role: security_standard
reviewers: [Platform, Operations, Privacy]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: SECRET_STORE_SECIMINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-059, REQ-062, PRO-007, PRO-022, PRO-027]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [config, security, observability, database-platform, database-tenant]
related_tests: [TST-004, TST-012]
supersedes: []
superseded_by: null
```

## İlke

Secret kaynak kod, Git geçmişi, Markdown, fixture, istemci bundle’ı, URL, komut argümanı, log, trace, audit, hata yanıtı veya export içinde bulunmaz. Canlı secret store/sağlayıcı henüz seçilmemiştir; bu belge hedef kontrolü tanımlar, uygulanmış vault iddiasında bulunmaz.

## Sınıflar

| Sınıf | Örnek | Saklama ve erişim |
|---|---|---|
| Platform altyapı sırrı | Platform DB credential, imzalama/şifreleme anahtarı | Production secret store; yalnız ilgili workload |
| Tenant bağlantı sırrı | Firma PostgreSQL credential | Opaque `TenantDatabaseRef`; tenant ve ortam kapsamı |
| Tenant entegrasyon sırrı | SMS/e-posta/POS API credential | `TenantSecretRef`; firma kapsamında ve maskeli metadata |
| Kullanıcı doğrulama sırrı | Parola hash’i, TOTP secret, recovery hash | Kimlik deposu; düz metin geri okunmaz |
| Geçici token | Davet, QR, takip, challenge | Amaç bağlı, süreli/tek kullanımlık, hash veya güvenli token modeli |

## Yaşam döngüsü

1. Sahip, amaç, ortam, tenant kapsamı ve rotasyon tetikleyicisi tanımlanır.
2. Güvenli üretim ve yetkili kanaldan workload’a dağıtım yapılır.
3. Uygulama yalnız ref üzerinden çözer; UI değeri geri okuyamaz.
4. Kullanım olayı değer içermeyen audit/metric üretir.
5. Planlı rotasyonda eski ve yeni credential kontrollü geçişle doğrulanır.
6. Sızıntıda credential iptal edilir, etki kapsamı belirlenir, log/artefaktlar korunur ve incident açılır.
7. Offboarding’de erişim ve kopyalar iptal edilir; gerekli metadata saklama politikasına göre korunur.

Rotasyon periyodu ve kriptografik algoritma canlı sağlayıcı/uyum kararı olmadan uydurulmaz. Acil rotasyon tatbikatı canlı öncesi yapılır.

## Log ve telemetry allowlist’i

Kaydedilebilir: güvenli olay kodu, zaman, ortam, service, release, requestId, traceId, auditId, opaque tenant/user/device/session kimliği, sonuç, gecikme ve sınırlı hata sınıfı.

Kaydedilemez: parola/TOTP/recovery/passkey challenge, cookie/JWT/API key, connection string, `PGPASSWORD`, tam request/response body, müşteri adı/telefon/adres, finans/belge içeriği, dosya fiziksel yolu, SQL/Prisma ham hatası.

Redaction tek başına yeterli değildir; önce alan allowlist’i uygulanır. Geliştirme ortamı da gerçek kişisel veri veya production secret loglamaz.

## Doğrulama

- Repo ve Git diff secret taraması.
- Sentetik canary secret ile API/log/trace/audit/export sızıntı testi.
- Child process komut satırı ve hata çıktısı incelemesi.
- Frontend bundle ve source map taraması.
- Recovery/passkey listeleme uçlarında hassas alan yokluğu.
- Backup metadata ve CLI çıktısında DB adı/connection string yokluğu.
- Rotasyon ve iptal sonrası eski credential ile erişimin reddi.

Gerçek bir değer bulunursa çıktıda tekrar edilmez; dosya/commit konumu güvenli kanaldan incident sorumlusuna iletilir ve [tenant güvenlik olayı runbook’u](../runbooks/OPS-RB-007-TENANT-GUVENLIK-OLAYI.md) başlatılır.
