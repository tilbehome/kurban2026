# Restore, WAL ve PITR Runbook’u

```yaml
id: OPS-008
title: Restore, WAL ve PITR Runbook'u
status: IMPLEMENTED_UNVERIFIED
owner: Data-Operations
source_role: operations_policy_or_playbook
reviewers: [Operations, Security, Finance, Tenant-Owner]
effective_date: 2026-08-12
last_reviewed: 2026-08-13
verified_against_commit: not_applicable
next_review: CANLI_PITR_TOPOLOJISI_SECIMINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-046, REQ-063, REQ-064, PRO-021, PRO-029]
related_adrs: [ADR-0003]
related_modules: [database-tenant, tenant-ops-cli, operations]
related_tests: [TST-013]
supersedes: []
superseded_by: null
```

## Güvenlik uyarısı ve mevcut sınır

Repo CLI’ı backup create/status/verify ile destructive olmayan restore plan/verify sağlar. Production DB üzerine restore uygulanmış değildir ve bu belgede çalıştırılabilir destructive komut verilmez. WAL arşivleme/PITR sağlayıcısı seçilmemiş, ayar ve ölçülmüş RPO/RTO yoktur.

`infrastructure/staging` paketi PostgreSQL 16 üzerinde staging-only `archive_mode`, ayrı WAL volume, `pg_basebackup` + `pg_verifybackup`, SHA-256 manifest ve izole PITR hedef hazırlığını tekrar üretilebilir hale getirir. Bu yerel sağlayıcı tatbikat paketidir; yönetilen sağlayıcı kararı veya production restore yetkisi değildir. Docker/staging sunucusu ve gerçek recovery target olmadan tatbikat `BLOCKED`, RPO/RTO `NOT_MEASURED` kalır.

## Karar noktası

Restore türü yalnız olay zaman çizelgesi ve veri doğruluğu incelemesiyle seçilir:

- Logical tenant dump restore: doğrulanmış bir backup noktasına dönüş.
- PITR: doğru recovery target time/LSN belirlenebiliyorsa ve sağlayıcı/topoloji destekliyorsa.
- İleri düzeltme: sınırlı, izlenebilir hata; eski noktaya dönüş daha fazla doğru işlemi kaybettirecekse.

Finans/tenant güvenlik olayında recovery target tek operatör tahminiyle seçilmez.

## Hazırlık

1. Incident aç, olay komutanı ve DB/tenant yetkililerini ata.
2. Hedef tenant, environment, opaque DB ref, kaynak backup/PITR noktası ve etki aralığını iki kişi doğrulasın.
3. Yeni yazıları bakım/read-only/full-stop politikasıyla güvenli duruma getir.
4. Mevcut bozuk/şüpheli durumu adli ve geri dönüş amaçlı koru; artefaktları değiştirme.
5. Backup checksum, migration/app sürümü, storage belgeleri ve secret erişimini doğrula.
6. Restore planı, kesinti/iletişim ve geri dönüş noktasını onaylat.

## İzole doğrulama

1. Kaynak artefaktı checksum ile doğrula.
2. Benzersiz, izole ve production trafiğine bağlı olmayan geçici hedef oluştur.
3. Tenant marker/ref, schema, migration ve app uyumluluğunu doğrula.
4. Kayıt sayıları, kritik FK/constraint, audit/outbox ve finans mutabakatını çalıştır.
5. Paket/teslim/satış gibi olay sonrası beklenen iş kaybını zaman çizelgesiyle karşılaştır.
6. Geçici hedef ve log/kanıt erişimini kontrol et; cleanup sahipliğini kaydet.

## Production geçişi

Production yürütme aracı ve sağlayıcı adımları onaylı canlı ek dokümanda tanımlanacaktır. Genel sıra: trafiği güvenli moda al, pool/worker drain et, son hedef doğrulaması, yetkili restore/PITR, credential/pool yenileme, migration/app uyumu, smoke + mutabakat, kademeli yazı açma ve yoğun gözlem.

## Başarı ve geri dönüş

Başarı; bağlantının açılması değil tenant/ref, schema/migration, kayıt sayısı, ledger dengesi, kritik akış smoke’u, audit/telemetry ve başka tenantların değişmediğinin doğrulanmasıdır. Doğrulama başarısızsa yazı açılmaz; restore öncesi korunan noktaya veya alternatif doğru recovery target’a dönülür.

Sonuç [EVD-005](../evidence/EVD-005-BACKUP-RESTORE-PITR-SABLONU.md) ile kaydedilir. `NOT_RUN` tatbikat canlıya hazır sayılmaz.
