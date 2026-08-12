# ADR-0003 — Tenant Yedek, WAL/PITR ve Restore Doğrulama Standardı

```yaml
id: ADR-0003
status: IMPLEMENTED_UNVERIFIED
owner: Architecture-and-Operations
source_role: tenant_backup_restore_pitr_decision
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

Tarih: 11 Ağustos 2026

Durum: Kabul edildi; canlı WAL/PITR yapılandırması bekliyor

## Bağlam

Her firma ayrı PostgreSQL veritabanına sahiptir. Yedekleme ve geri yükleme işlemleri bu fiziksel ayrımı korumalı; parola, connection string veya başka firmanın verisi süreç argümanlarına, loglara, audit kayıtlarına ya da yedek metadata’sına sızmamalıdır. Henüz canlı deployment topolojisi ve yönetilen PostgreSQL sağlayıcısı seçilmediği için WAL/PITR ayarları uygulanmış sayılamaz.

## Karar

- Yedek hedefi kullanıcıdan DB adı veya SQL alınarak değil, Platform DB’de doğrulanmış aktif tenant ile opaque `TenantDatabaseRef` eşleşmesinden belirlenir.
- Firma yedeği PostgreSQL custom format ile `pg_dump`; doğrulama ise `pg_restore` ile yapılır. Araçlar shell açmadan sabit executable ve ayrı process argümanlarıyla çalıştırılır.
- Parola yalnız child process ortamındaki `PGPASSWORD` alanına verilir. Komut argümanına, stdout/stderr’e, hata koduna, metadata’ya veya audit’e yazılmaz.
- Yedekler repository dışında mutlak bir runtime storage kökünde tutulur. Kısmi dosyalar hata halinde temizlenir; metadata atomik yazılır.
- Metadata tenant kimliği, `TenantDatabaseRef` kimliği, oluşturulma zamanı, son migration sürümü, SHA-256 checksum, dosya boyutu, durum ve doğrulama sonucunu taşır. Fiziksel DB adı ve connection string taşımaz.
- Restore doğrulaması checksum kontrolünden sonra benzersiz geçici DB’ye yapılır. `TenantProvisioningMarker`, tenant/ref sahipliği, migration sürümü ve asgari şema tabloları doğrulanır; geçici DB başarıda ve hatada temizlenir.
- Firma A’ya ait yedek Firma B tenant/ref eşleşmesiyle açılamaz veya doğrulanamaz.
- Production DB üzerine destructive restore bu fazda uygulanmaz. Restore planı `destructiveRestoreEnabled: false` ve `explicitApprovalRequired: true` üretir; son adım manuel yetkili onayıdır.
- Yedek/restore olayları güvenli kod, tenant kimliği, backup kimliği, request kimliği, zaman ve sonuçla auditlenir; secret veya operasyon verisi audit’e kopyalanmaz.

## Kontrollü CLI

CLI yalnız aşağıdaki komutları kabul eder:

```text
pnpm tenant:ops -- tenant backup create --tenant-id <TENANT_ID> --request-id <REQUEST_ID>
pnpm tenant:ops -- tenant backup status --tenant-id <TENANT_ID> --backup-id <BACKUP_ID>
pnpm tenant:ops -- tenant backup verify --tenant-id <TENANT_ID> --backup-id <BACKUP_ID> --request-id <REQUEST_ID>
pnpm tenant:ops -- tenant restore plan --tenant-id <TENANT_ID> --backup-id <BACKUP_ID> --request-id <REQUEST_ID>
pnpm tenant:ops -- tenant restore verify --tenant-id <TENANT_ID> --backup-id <BACKUP_ID> --request-id <REQUEST_ID>
```

CLI ham SQL, connection string, parola, token veya secret flag’i kabul etmez. Ortam değerleri deployment secret mekanizmasından sağlanır ve komut çıktısında gösterilmez. `restore plan` dry-run niteliğindedir; `restore verify` yalnız geçici doğrulama DB’sini kullanır.

## WAL/PITR kararı

WAL arşivleme ve PITR, yönetilen PostgreSQL veya eşdeğer güvenli işletim katmanı seçildiğinde tenant izolasyonunu koruyacak şekilde zorunlu olarak değerlendirilir. Bu repository paketi WAL arşivleme, base backup, retention veya canlı PITR ayarı yapmaz.

Canlı topoloji belirlenince aşağıdaki kararlar ölçüm ve prova kanıtıyla tamamlanacaktır:

- sağlayıcı, bölge ve tenant başına fiziksel/mantıksal izolasyon modeli,
- WAL archive hedefi, şifreleme, erişim politikası ve saklama süresi,
- base backup sıklığı ve bütünlük doğrulaması,
- recovery target time/LSN seçimi ve tenant’a özgü geri yükleme yöntemi,
- failover, bağlantı yenileme ve tenant pool kapatma/açma sırası,
- yedek başarısızlığı, WAL gecikmesi, storage kapasitesi ve restore alarm politikası,
- gerçek restore provalarıyla ölçülen RPO/RTO ve kabul eden yetkili,
- kanıt saklama, audit korelasyonu ve periyodik prova planı.

Ölçülmüş kanıt bulunmadan RPO/RTO değeri ilan edilmez ve WAL/PITR tamamlandı sayılmaz.

## Uygulama ve test kanıtı

- `packages/database-tenant/src/postgres-tenant-backup.ts`: güvenli dump, metadata, checksum, geçici restore doğrulaması ve temizlik.
- `apps/tenant-ops-cli`: beş kontrollü backup/restore komutu; destructive production restore yoktur.
- `packages/database-tenant/tests/tenant-isolation.integration.test.ts`: iki gerçek tenant DB, çapraz tenant yedek reddi, gerçek `pg_dump`/`pg_restore`, tekrar doğrulama ve geçici DB temizliği.
- `packages/operations/src/tests/backup-restore.test.ts`: tenant/ref bağlama ve restore planı güvenlik kapıları.

## Geri dönüş

Kod paketi commit revert ile geri alınabilir. Repository dışındaki doğrulanmış yedek artefaktları otomatik silinmez. Başlatılmış geçici doğrulama DB’leri benzersiz `tc_verify_*` adıyla tanımlanır ve runbook kontrollü temizlik adımıyla kaldırılır. Canlı WAL/PITR ayarı bu paket tarafından değiştirilmediğinden altyapı geri dönüşü gerektirmez.
