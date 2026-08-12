# PostgreSQL İşletim Standardı

```yaml
id: INF-006
title: PostgreSQL İşletim Standardı
status: PLANNED
owner: Data-Operations
source_role: infrastructure_operating_standard
reviewers: [Security, Architecture, QA]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: POSTGRESQL_SAGLAYICI_SECIMINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-048, REQ-063, REQ-064, REQ-066, PRO-017, PRO-021, PRO-029]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [database-platform, database-tenant, tenant-runtime, provisioning]
related_tests: [TST-004, TST-011, TST-013]
supersedes: []
superseded_by: null
```

## Topoloji ve sahiplik

- Platform PostgreSQL tenant operasyon verisi tutmaz.
- Her firma operasyonu ayrı fiziksel PostgreSQL veritabanındadır.
- DB hedefi aktif tenant + opaque `TenantDatabaseRef` + secret store çözümlemesiyle belirlenir.
- Yönetim rolü, migration rolü, runtime rolü, backup/restore rolü ve salt-okunur inceleme rolü görev ayrımına göre tanımlanır.
- Public internetten doğrudan PostgreSQL, Prisma Studio veya admin CLI erişimi açılmaz.

Canlı sağlayıcı/topoloji henüz seçilmediğinden sürüm, instance tipi, replika, failover ve bakım takvimi hedef olarak uydurulmaz.

## Runtime kontrolleri

- TLS ve sertifika doğrulaması canlı altyapı kararına göre zorunlu kılınır.
- Connection/application/statement/lock/idle transaction timeout değerleri ölçümle belirlenir.
- Pool tenant + DB ref sahipliğine bağlı, sınırlı ve gözlemlenebilirdir.
- Uzun transaction, idle-in-transaction, deadlock, connection doygunluğu, replica lag ve disk/WAL büyümesi alarm adaylarıdır.
- DDL ve migration normal uygulama rolünden çalışmaz.
- `search_path`, schema ve identifier kullanıcı girdisinden güvenilmeden üretilmez.

## Bakım

| İş | Ön koşul | Son kontrol |
|---|---|---|
| Minor upgrade | Destek matrisi, staging prova, backup | Sağlık, migration, sorgu ve tenant smoke |
| Major upgrade | Ayrı plan, uyumluluk, restore/rollback | Tam integration, yük ve PITR prova |
| VACUUM/analyze | Bloat ve sorgu ölçümü | Gecikme, IO ve tablo sağlığı |
| Index değişikliği | Kilit/alan etkisi | Query plan ve yazı gecikmesi |
| Pool değişikliği | Kapasite/yük kanıtı | Doygunluk ve tenant adaleti |
| Schema migration | Release/migration planı ve yedek | Drift, kayıt/mutabakat, app uyumu |

## Yasaklar

- Kullanıcı talebi olmadan migration çalıştırmak veya production DB resetlemek.
- Kimliği doğrulanmamış DB’de `DROP`, truncate veya toplu düzeltme.
- Connection string/parolayı komut argümanı, ticket veya kanıta yazmak.
- Başka tenant yedeğini hedef tenant üzerinde doğrulamak/restore etmek.
- Yedek ve geri dönüş planı olmadan destructive schema değişikliği.

## Olay sinyalleri

Bağlantı hatası, pool wait, deadlock, transaction rollback artışı, migration drift, backup yaşı/başarısızlığı, checksum hatası, WAL arşiv gecikmesi, disk büyümesi ve tenant marker/ref uyuşmazlığı izlenir. Eşikler baseline sonrası [SLO/alarm standardında](../reliability/OPS-003-SLI-SLO-ALARM-VE-HATA-BUTCESI.md) onaylanır.
