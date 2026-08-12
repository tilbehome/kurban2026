# Yedekleme Politikası

```yaml
id: OPS-007
title: Yedekleme Politikası
status: REVIEW
owner: Operations
reviewers: [Data-Operations, Security, Privacy]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: CANLI_BACKUP_SAGLAYICI_SECIMINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-046, REQ-063, REQ-064, PRO-021, PRO-029]
related_adrs: [ADR-0003]
related_modules: [database-tenant, tenant-ops-cli, operations]
related_tests: [TST-004, TST-013]
supersedes: []
superseded_by: null
```

## Durum ve kapsam

Tenant PostgreSQL için custom-format `pg_dump`, SHA-256 metadata ve geçici restore doğrulaması kaynak kod/testlerinde vardır. Production zamanlaması, şifreli uzak hedef, immutability, retention ve canlı otomatik restore kanıtı yoktur. WAL/PITR ayrı açık kapsamdır.

Korunacaklar: platform DB metadata’sı, her tenant DB, tenant object storage belgeleri, gerekli config/secret referans metadata’sı ve sürüm/migration kataloğu. Credential veya connection string backup metadata’sına yazılmaz.

## Politika

- Yedek tenant + opaque DB ref sahipliği doğrulandıktan sonra alınır.
- Tenantlar ayrı artefakt ve erişim sınırına sahiptir; çapraz status/verify/restore reddedilir.
- Artefakt repository dışında, aktarımda ve depoda şifreli, erişim kontrollü ve bütünlük doğrulamalıdır.
- Backup başarı durumu yalnız dosya oluşumu değildir: boyut, checksum, migration metadata ve doğrulama sonucu gerekir.
- Kısmi/hatalı artefakt yayınlanmaz; cleanup ve hata audit’i yapılır.
- Platform DB ve tenant DB/object storage kurtarma sırası/consistency noktası restore planında belirtilir.
- Retention ve yedek sıklığı RPO, mevzuat ve maliyet onayıyla belirlenir; bu belgede tahmin edilmez.

## İşler ve alarmlar

| İş | Başarı ölçütü | Alarm adayı |
|---|---|---|
| Backup create | Completed + checksum/size/migration metadata | Zamanında tamamlanmama, boyut anomalisi |
| Backup verify | Checksum ve okunabilir archive | Checksum/format hatası |
| Restore verify | Geçici DB, marker/ref/schema/migration kontrolü | Cleanup veya doğrulama hatası |
| Retention | Onaylı politika ve legal hold | Kapasite/yaş sapması |
| Inventory | Tenantların beklenen backup kapsamı | Korunmayan tenant veya orphan artefakt |

## Erişim ve görev ayrımı

Backup operatörü artefakt içeriğini keyfi okuyamaz; restore planlamak production’a yazma yetkisi vermez. Production restore ayrı onay, hedef doğrulama, bakım/read-only ve veri sahibi/operasyon kararı gerektirir.

## Kanıt

Her kritik tenant için periyodik restore doğrulaması [EVD-005](../evidence/EVD-005-BACKUP-RESTORE-PITR-SABLONU.md) ile kaydedilir. Başarı iddiası checksum, geçici restore, tenant marker/ref, migration ve seçilmiş veri/ledger kontrolleri olmadan yapılamaz.
