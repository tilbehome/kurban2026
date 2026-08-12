# PostgreSQL ve Veritabanı Sorunu Runbook’u

```yaml
id: OPS-RB-002
title: PostgreSQL ve Veritabanı Sorunu Runbook'u
status: REVIEW
owner: Data-Operations
reviewers: [Operations, Security, Finance, Tenant-Owner]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: ILK_DB_KESINTISI_PROVASINDA
version: 0.1
source_of_truth: false
related_requirements: [REQ-046, REQ-048, REQ-066, PRO-021, PRO-029, PRO-034]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [database-platform, database-tenant, tenant-runtime]
related_tests: [TST-004, TST-013]
supersedes: []
superseded_by: null
```

## Tetikleyici

Connection/pool hatası, timeout, deadlock artışı, migration drift, tenant marker/ref uyuşmazlığı, disk/WAL sorunu, veri bozulması veya DB’nin erişilememesi.

## İlk müdahale

1. Incident aç; platform mu belirli tenant DB mi olduğunu doğrula.
2. Tenant kimliği, environment ve opaque DB ref’i iki kişiyle doğrula; connection string’i kayıt/sohbete kopyalama.
3. Veri veya tenant sınırı şüphesinde ilgili tenant/modülü read-only/full-stop yap; worker/retry fırtınasını durdur.
4. Release/migration, pool, DB sağlık, storage/disk, bağlantı ve son başarılı transaction zamanını telemetry’den incele.
5. Yetkisiz SQL, schema değişikliği, restart döngüsü veya DB reset yapma.
6. Olay öncesi durumu, son doğrulanmış backup/checksum ve migration sürümünü koru.

## Karar ağacı

- Yalnız uygulama/pool: yeni istekleri durdur, pool drain/recycle planını uygula; tenant ref’i yeniden doğrula.
- Lock/deadlock/slow query: işlemi ve sahibini belirle; keyfi session kill yerine etki/onay kaydıyla müdahale et.
- Migration drift/uyumsuzluk: rollout’u durdur; [migration rollback planına](../releases/REL-005-MIGRATION-VE-ROLLBACK.md) geç.
- Veri bozulması/kayıp: yazıyı dondur; [restore/WAL/PITR runbook’una](../operations/OPS-008-RESTORE-WAL-PITR.md) geç.
- Yanlış tenant/ref: [tenant güvenlik olayı](OPS-RB-007-TENANT-GUVENLIK-OLAYI.md) olarak SEV-1 değerlendir.

## Kurtarma doğrulaması

- Doğru tenant/ref/marker ve başka tenantların değişmediği.
- App/schema/migration uyumu ve pool’un doğru hedefe bağlandığı.
- Kritik transaction smoke, audit/outbox ve worker işlerinin kontrollü devamı.
- Ledger/kasa ile hisse/paket/teslim mutabakatı.
- Read-only/full-stop’un kademeli, yetkili ve auditli kaldırılması.

## Kapanış

Sadece DB bağlantısının dönmesi yeterli değildir. Veri bütünlüğü ve tenant izolasyonu kanıtlanmadan riskli yazılar açılmaz. Restore/PITR kullanıldıysa [EVD-005](../evidence/EVD-005-BACKUP-RESTORE-PITR-SABLONU.md) zorunludur.
