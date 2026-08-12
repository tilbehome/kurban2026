# 18 — Güvenli Eklenti Omurgası

```yaml
id: EXT-001
status: PLANNED
owner: Product-Security-and-Architecture
source_role: secure_extension_platform_target
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
```

`EXT-001` mevcut marketplace, SDK veya çalışan eklenti sistemi değildir. WordPress benzeri kurulum/kullanım kolaylığı hedeflenebilir; tenant web/worker process’ine denetimsiz üçüncü taraf kod yüklemek hedef değildir.

## Hedef sözleşme

- İmzalı ve sürümlü manifest; paket hash’i, publisher, minimum platform sürümü, modül/dependency ve veri sınıfı.
- Publisher kimlik ve sahiplik doğrulaması; anahtar rotasyonu/iptali ve imza şeffaflık kaydı.
- Plan/lisans entitlement ile tenant bazlı açık aktivasyon; entitlement tek başına runtime hazır demek değildir.
- En az ayrıcalıklı permission/capability beyanı; ağ, veri, dosya, secret, event ve kullanıcı eylemleri default-deny.
- Kurulum, doğrulama, etkinleştirme, askıya alma, yükseltme, geri alma ve kaldırma yaşam döngüsü.
- Sürümlü SDK ve desteklenen portlar; internal DB, Prisma client, process/env veya tenant connection string erişimi yok.
- Migration ledger, dry-run, checksum, ileri düzeltme/rollback ve tenant bazlı backup/restore kapısı.
- Transactional outbox, sürümlü event ve imzalı webhook; idempotency, retry, dead-letter ve rate limit.
- Firma başına veri/iş kuyruğu/secret izolasyonu; çapraz tenant kimliği veya global mutable state yok.
- Secret store referansı, kullanım kapsamı, rotasyon ve redacted telemetry; secret manifestte/logda bulunmaz.
- Platform ve tenant düzeyinde acil durdurma; modül yazılarını fail-closed kesme ve audit.
- Uninstall öncesi export; veri sahipliği, retention, legal hold ve güvenli silme/anonimleştirme politikası.
- SBOM, provenance, bağımlılık/lisans/vulnerability taraması ve marketplace güvenlik incelemesi.

## Çalıştırma sınırı

İlk güvenli tercih; imzalı declarative entegrasyonlar, dış servis/webhook adapterleri veya ayrı kısıtlı worker sınırıdır. In-process arbitrary code, dinamik `eval`, tenant DB’ye doğrudan migration veya geniş platform token’ı yasaktır. Daha güçlü sandbox modeli ancak `DEC-003` kabul edilmiş ADR, tehdit modeli ve kaçış/izolasyon testleriyle seçilebilir.

## Kabul kapısı

Publisher/manifest imzası, entitlement + runtime bağı, capability negatifleri, iki tenant izolasyonu, secret redaction, kötü migration dry-run/rollback, replay/webhook imzası, emergency stop, uninstall/export/retention ve SBOM/vulnerability senaryoları gerçek entegrasyon ortamında kanıtlanmadan `IMPLEMENTED_UNVERIFIED` durumuna geçmez.
