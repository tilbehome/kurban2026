# Migration, Rollback ve Roll-Forward Planı

```yaml
id: REL-005
title: Migration, Rollback ve Roll-Forward Planı
status: PLANNED
owner: Release
source_role: release_policy_or_playbook
reviewers: [Data-Operations, QA, Security, Finance]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: HER_SCHEMA_VE_VERI_GOCUNDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-048, REQ-063, REQ-064, REQ-066, PRO-014, PRO-021, PRO-029]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [database-platform, database-tenant, provisioning, operations]
related_tests: [TST-004, TST-006, TST-013]
supersedes: []
superseded_by: null
```

## Kapsam

Schema migration, veri backfill/dönüşümü, SQLite/CSV/Excel importu ve tenant provisioning değişikliği için kullanılır. Kullanıcı talimatı ve onaylı plan olmadan migration çalıştırılmaz.

## Değişiklik sınıfları

| Sınıf | Örnek | Tercih edilen geri dönüş |
|---|---|---|
| Geriye uyumlu expand | Nullable alan/index/yeni tablo | App rollback mümkün; schema kalabilir |
| Backfill | Tip/durum dönüşümü | Checkpoint + idempotent resume veya ileri düzeltme |
| Contract | Eski alan/constraint kaldırma | Tüketici kalmadığı kanıtı; ayrı release |
| Destructive/veri etkili | Drop, tip daraltma, toplu düzeltme | Doğrulanmış restore veya ileri kurtarma |
| Provisioning | Yeni tenant DB/migration/marker | Yalnız sahipliği kanıtlı ve platform kaydı tamamlanmamış hedefte kontrollü rollback |

## Ön kontrol

1. Hedef environment/tenant/DB ref ve mevcut app/schema sürümünü iki kişi doğrula.
2. SQL/migration diff, lock/alan/çalışma süresi ve tenant izolasyon etkisini incele.
3. Geriye/ileriye uyumluluk matrisi ve worker/outbox etkisini çıkar.
4. Staging’de boş DB apply, eski sürüm upgrade, replay/drift ve constraint testlerini koş.
5. Veri dönüşümünde dry-run, satır hatası, kayıt sayısı, checksum ve finans toplamı al.
6. Güncel backup oluştur ve geçici restore ile doğrula.
7. Read-only/bakım, canary, durdurma ve iletişim planını onayla.

## Uygulama

- Önce expand, sonra uyumlu app rollout, kontrollü backfill ve doğrulama, en son ayrı contract.
- Her tenant sonucu ayrı izlenir; bir tenant başarısı diğerini kanıtlamaz.
- Idempotent/resumable adımlar ve progress checkpoint kullanılır.
- Hata çıktısında SQL, connection string veya tenant operasyon verisi gösterilmez.
- Migration sırasında gözlemlenen anomali veya eşik aşımında yeni tenant rollout’u durdurulur.

## Rollback kararı

- App hatası + uyumlu schema: önce app rollback/canary azaltma.
- Backfill hatası: işi durdur; doğrulanmış checkpoint’ten resume veya ileri düzeltme.
- Schema/constraint hatası: destructive down migration çalıştırma; ileri migration veya restore değerlendirmesi.
- Veri bozulması: read-only/full-stop, olay kanıtı ve [restore/PITR runbook’u](../operations/OPS-008-RESTORE-WAL-PITR.md).

## Son doğrulama

Migration status/drift, app health, tenant marker/ref, kayıt/FK/constraint, ledger/kasa mutabakatı, audit/outbox, kritik smoke ve başka tenantların değişmediği kontrol edilir. Eski alan ancak tüm tüketiciler ve rollback penceresi kapandığında contract edilir.

## Kanıt

Komut, ortam, migration hash/listesi, başlangıç/bitış sürümü, backup/restore ID’si, sonuç ve sapmalar saklanır. Secret ve gerçek PII kanıta yazılmaz. Başarısız migration gizlenmez veya “manuel düzeltildi” diye kanıtsız kapatılmaz.
