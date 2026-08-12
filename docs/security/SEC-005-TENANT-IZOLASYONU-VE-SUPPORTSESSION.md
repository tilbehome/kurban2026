# Tenant İzolasyonu ve SupportSession Güvenlik Standardı

```yaml
id: SEC-005
title: Tenant İzolasyonu ve SupportSession Güvenlik Standardı
status: REVIEW
owner: Security
reviewers: [Architecture, Platform, QA, Privacy]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: HER_TENANT_RUNTIME_DEGISIKLIGINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-048, REQ-049, REQ-059, REQ-062, REQ-066, PRO-020, PRO-021]
related_adrs: [ADR-0001, ADR-0002, ADR-0003]
related_modules: [tenant-runtime, tenant-web-runtime, database-tenant, database-platform, platform]
related_tests: [TST-004, TST-005]
supersedes: []
superseded_by: null
```

## Değişmez sınır

Platform PostgreSQL yalnız platform metadata’sını; her firma PostgreSQL’i yalnız o firmanın operasyon verisini tutar. Platform ile tenant DB doğrudan join edilmez. İstemciden gelen `tenantId`, host veya DB adı tek başına güven kaynağı değildir.

## Request çözümleme zinciri

1. Host normalize edilir; port, geçersiz karakter, reserved ad ve ortam ayrımı doğrulanır.
2. Host veya doğrulanmış custom domain aktif organization kaydına çözülür.
3. Session kimlik türü ve tenant kimliği resolved tenant ile eşleştirilir.
4. Aktiflik, lisans toleransı, bakım, `read_only`, `full_stop` ve modül durdurma politikası değerlendirilir.
5. Opaque `TenantDatabaseRef` sahipliği ve hedef sınıfı doğrulanır.
6. Request-local tenant context bir kez oluşturulur ve istek boyunca değişmez.
7. Repository/transaction yalnız bu context’in pool anahtarını kullanır.
8. Yanlış veya eksik bir bağ güvenli hata ve requestId ile reddedilir.

## Veritabanı ve pool kontrolleri

- Pool anahtarı tenant + doğrulanmış DB ref bağına dayanır; kullanıcıdan connection string alınmaz.
- Platform DB hedefi tenant pool’una kabul edilmez.
- Idle kapatma, kapasite sınırı ve shutdown sırası tenantlar arası reuse üretmemelidir.
- Aynı ID’nin iki tenantta bulunması normaldir; erişim kimlikle değil context ile sınırlanır.
- Backup, restore, export, dosya ve telemetry de tenant sınırını taşır.
- Legacy route yeni runtime’a taşınmadıysa bu route için izolasyon ayrıca kanıtlanmadan canlı onay verilmez.

## SupportSession yaşam döngüsü

| Aşama | Zorunlu kayıt |
|---|---|
| Talep | Ticket, tenant, gerekçe, istenen modül/veri sınıfı ve okuma/yazma niyeti |
| Onay | Firma yetkilisi, politika dayanağı, başlangıç/bitiş ve kapsam |
| Açılış | Platform kullanıcısı, yeniden doğrulama, session kimliği ve request/audit bağı |
| Kullanım | Her gerçek veri erişiminin tenant audit’i; platform audit’te yalnız güvenli metadata |
| Değişiklik | Kapsam genişlemesinde yeni onay; sessiz uzatma yok |
| İptal/kapanış | Firma veya platform iptali, oturum sonlandırma, görünür faaliyet özeti |

Varsayılan erişim yoktur. Okuma yetkisi yazma yetkisi üretmez. SupportSession başka tenant, modül, veri sınıfı, işlem veya süre için kullanılamaz. Acil break-glass süreci ayrıca onaylı politika ve sonradan bağımsız inceleme olmadan tanımlanmış sayılmaz.

## Zorunlu negatif test matrisi

- Bilinmeyen/reserved host ve doğrulanmamış custom domain.
- Tenant A host + Tenant B session veya DB ref.
- Platform session ile SupportSession olmadan tenant operasyon erişimi.
- Süresi dolmuş, iptal edilmiş, onaysız, yanlış kapsamlı veya read-only SupportSession ile yazma.
- Aynı ID bulunan iki fiziksel DB’de çapraz okuma/yazma.
- Tenant A backup’ını Tenant B ref’iyle status/verify/restore etme.
- Pool eşzamanlılığı, idle reuse ve shutdown sırasında yanlış DB hedefi.
- Hata, log, trace ve CLI çıktısında connection string/secret sızıntısı.

Test ayrıntıları [tenant izolasyonu planındadır](../testing/TST-005-TENANT-IZOLASYONU.md). PostgreSQL migration kontrolleri [TST-004](../testing/TST-004-POSTGRESQL-MIGRATION-VE-TENANT-IZOLASYONU.md) içindedir. Kanıt [EVD-003 şablonuyla](../evidence/EVD-003-TENANT-IZOLASYON-SABLONU.md) tutulur.

## Mevcut kanıt ve açıklar

`74915b6f3f1f8d53116b760b6a6be9797111efa5`, tenant runtime bakım/read-only/full-stop politikasını genişletir. Bu commit’e ait [TilbeCore CI koşusu 31571606803](https://github.com/tilbehome/kurban2026/actions/runs/31571606803) `completed/success` sonucuyla Platform ve Tenant PostgreSQL migration apply, Platform PostgreSQL integration ve iki-tenant web/pool/backup-restore izolasyon testlerini çalıştırmıştır. Böylece iki fiziksel tenant DB, host/session/ref reddi, `SupportSession` kapsamı, ayrı pool, gerçek `pg_dump`/geçici `pg_restore` ve çapraz backup reddi CI düzeyinde doğrulanmıştır. Canlı DNS/TLS, bütün legacy route geçişi, production restore, gerçek OpenTelemetry ve kapasite alarmları açık kalır.
