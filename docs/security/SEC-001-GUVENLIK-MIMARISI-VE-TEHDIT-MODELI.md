# Güvenlik Mimarisi ve Tehdit Modeli

```yaml
id: SEC-001
title: Güvenlik Mimarisi ve Tehdit Modeli
status: PLANNED
owner: Security
source_role: security_standard
reviewers: [Architecture, Platform, Operations, Privacy]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: ILK_CANLI_ALTYAPI_KARARI_ONCESI
version: 0.1
source_of_truth: false
related_requirements: [REQ-048, REQ-049, REQ-050, REQ-059, REQ-062, PRO-013, PRO-020, PRO-027]
related_adrs: [ADR-0001, ADR-0002, ADR-0003]
related_modules: [platform, tenant-runtime, database-platform, database-tenant, operations]
related_tests: [TST-004, TST-005, TST-012]
supersedes: []
superseded_by: null
```

## Amaç ve durum

Bu belge TilbeCore – Kurban Takip için güven sınırlarını, korunacak varlıkları, temel tehditleri ve release kapılarını tanımlar. OWASP ASVS Level 2 bir kabul hedefidir; sertifika veya bugün karşılandığı iddiası değildir.

Repo incelemesinde Platform Admin kimliği, passkey/recovery modelleri, tenant çözümleme, `SupportSession`, bakım ve acil durdurma çekirdeği görülmüştür. `74915b6f3f1f8d53116b760b6a6be9797111efa5` için [TilbeCore CI koşusu 31571606803](https://github.com/tilbehome/kurban2026/actions/runs/31571606803) `completed/success` sonucuyla bitmiştir. Koşu; UTF-8, Platform/Tenant Prisma validate-generate ve migration apply, Platform PostgreSQL integration, iki-tenant web/pool/backup-restore izolasyonu, TypeScript, unit/route, lint, ana ve Platform Admin build, PWA artefakt ve Git diff kontrollerini başarıyla çalıştırmıştır. Bu sonuç repository ve CI kapsamı kanıtıdır; canlı altyapı, fiziksel cihaz veya genel güvenlik kabulü değildir.

## Güven sınırları ve varlıklar

| Sınır | Korunan varlık | Zorunlu davranış |
|---|---|---|
| İnternet → gateway | Host, origin, token, istek gövdesi | Normalize et, allowlist uygula, oran sınırla, güvenli hata üret |
| Platform → tenant | Firma operasyon verisi ve DB referansı | Normal erişimi reddet; yalnız geçerli `SupportSession` ile kapsamlandır |
| Tenant A → Tenant B | Müşteri, finans, hayvan, hisse, dosya ve yedek | Host/session/ref/DB sahipliğini birlikte doğrula; fail-closed |
| Uygulama → PostgreSQL | Bağlantı sırrı, transaction ve veri | Opaque ref kullan; secret’ı istemciye/loga çıkarma |
| Uygulama → object storage | Vekâlet ve belgeler | Tenant prefix, yetkili indirme, şifreleme ve yaşam döngüsü |
| Cihaz/PWA → sunucu | Oturum, offline kuyruk ve QR | Amaç/süre/tenant/cihaz bağı; kritik yazıda sunucu onayı |
| Operasyon → yedek | Dump, WAL ve restore hedefi | Tenant eşleşmesi, checksum, çift onay ve izole doğrulama |

## Tehdit kataloğu

| Tehdit | Etki | Önleyici/tespit edici kontrol | Kabul kanıtı |
|---|---|---|---|
| Host/session karışması veya IDOR | Tenant veri sızıntısı | Registry çözümleme, değişmez request context, repository kapsamı | İki firma negatif PostgreSQL testi |
| Platform yetkisinin tenant yetkisi sayılması | Yetkisiz operasyon erişimi | Ayrı kimlik/cookie; `SupportSession` kapısı | Yetki negatif testi ve çift audit |
| Kimlik bilgisi ele geçirme | Platform kontrolü kaybı | MFA/passkey, session rotation, cihaz/oturum iptali, recovery audit | Tarayıcı ve fiziksel authenticator kabulü |
| Çift tıklama/yarış | Çifte satış, tahsilat veya teslim | Idempotency, transaction, unique constraint, version | Eşzamanlılık entegrasyon testi |
| Ledger veya kayıt kurcalama | Finans ve denetim kaybı | Append-only audit/ledger, ters kayıt, dönem kilidi | Sıfır fark ve ters kayıt testi |
| Secret sızıntısı | DB/sağlayıcı ele geçirilmesi | Vault/ref, redaction, kısa ömür, rotasyon | Secret taraması ve log/hata testi |
| Zararlı dosya veya path traversal | Kod çalıştırma/veri ifşası | Tür/boyut kontrolü, karantina, yetkili servis | Dosya güvenlik testi |
| Offline replay/çakışma | Sessiz mükerrer veya eski yazı | Beyaz liste, TTL, cihaz bağı, idempotency, görünür uzlaştırma | Kesinti/sync senaryosu |
| Yedek veya restore hatası | Veri kaybı/yanlış tenant | Checksum, marker/ref, geçici restore, çift onay | Restore/PITR prova kaydı |
| Log/telemetry sızıntısı | PII/secret ifşası | Alan allowlist’i, redaction, erişim ve saklama | Sentetik canary değerle sızıntı testi |

## Güvenli varsayılanlar

- Kimlik, tenant, izin veya DB referansı çözümlenemiyorsa işlem reddedilir.
- Kritik finans, satış, kesim ve teslim yazıları offline ortamda başarılı gösterilmez.
- Platform DB tenant operasyon verisini tutmaz; platform ekranı yalnız metadata gösterir.
- Finansal ve hareket görmüş kayıtlar fiziksel silinmez.
- Hata yanıtı stack, SQL, Prisma metni, dosya yolu, PII veya connection string içermez.
- Bakım/acil durdurma açmak da kapatmak da yetki, gerekçe ve audit ister.
- Güvenlik kontrolü devre dışı bırakılarak release yapılmaz; istisna süreli, sahipli ve risk kabul kayıtlıdır.

## Release engelleri

- Açık kritik/yüksek tenant izolasyonu, kimlik doğrulama veya finans bütünlüğü bulgusu.
- Fiziksel passkey kabulü yapılmadan passkey’in canlıya hazır ilan edilmesi.
- Secret taraması, iki firma negatif testi veya restore doğrulamasının kanıtsız olması.
- Production origin/TLS/cookie ve backup yetki sınırlarının staging üzerinde doğrulanmaması.
- Olay müdahale ve salt-okunur/acil durdurma runbook’unun prova edilmemesi.

## Bağlantılar

- [Ana mimari](../architecture/TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md)
- [Platform–tenant veri sınırı](../adr/ADR-0002-PLATFORM-TENANT-VERI-SINIRI-VE-ERISIM-STANDARDI.md)
- [IAM politikası](SEC-003-IAM-MFA-PASSKEY-VE-RECOVERY.md)
- [Tenant izolasyonu](SEC-005-TENANT-IZOLASYONU-VE-SUPPORTSESSION.md)
- [Secret standardı](SEC-006-SECRET-ANAHTAR-VE-GUVENLIK-LOGLAMA.md)
