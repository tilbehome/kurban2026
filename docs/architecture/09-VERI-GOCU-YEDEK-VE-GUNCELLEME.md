# 09 — Veri Göçü, Yedek ve Güncelleme

```yaml
id: ARC-009
status: IMPLEMENTED_UNVERIFIED
owner: Architecture-and-Data
source_role: migration_backup_update_architecture
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

## Veri politikası

Mevcut yerel veriler geliştirme/test verisi kabul edilmiştir. Buna rağmen dönüşümler script/migration olarak, dry-run ve raporla yapılmalıdır. Harici yedeklere ve `backups` klasörüne rastgele dokunulmaz.

## Mevcut yedek kanıtı

- Legacy SQLite akışında `shared/lib/backup.ts` ve `app/api/yedek/*` route’ları mevcuttur; bunlar PostgreSQL tenant yedek standardının yerine geçmez.
- `packages/database-tenant/src/postgres-tenant-backup.ts`, doğrulanmış `TenantDatabaseRef` üzerinden repo dışı storage’a PostgreSQL custom-format yedek alır; migration sürümü, SHA-256, boyut ve durum metadata’sı üretir.
- `apps/tenant-ops-cli`, backup create/status/verify ile destructive olmayan restore plan/verify komutlarını sağlar.
- Restore doğrulaması geçici PostgreSQL DB’sinde tenant/ref marker, migration ve şema kontrolü yapar. Production DB’ye otomatik restore uygulanmaz.
- `scripts/migrate-vekalet-files.mjs` dry-run varsayılanlı P0 scriptidir.

Bağlayıcı yedek, WAL/PITR ve restore kararı: `docs/adr/ADR-0003-TENANT-YEDEK-WAL-PITR-VE-RESTORE-DOGRULAMA.md`.

## PostgreSQL geçiş planı

1. SQLite şemasındaki tipler ve indeksler listelenir.
2. Para alanları için kuruş/Decimal kararı verilir.
3. Firma operasyon DB şeması PostgreSQL migration olarak hazırlanır.
4. Platform DB ayrı migration setiyle hazırlanır.
5. SQLite → PostgreSQL export/import scripti yazılır.
6. Dry-run: kayıt sayısı, hash, foreign key, parasal toplam mutabakatı.
7. Test DB reset yöntemi belgelenir.
8. Uygulama sadece doğrulanmış connection referansıyla başlar.
9. Excel/CSV içe aktarma merkezi aynı dry-run, satır hata raporu ve geri alma ilkelerini kullanır; gerçek import canlı veriye doğrudan yazmadan önce rapor üretir (`PRO-003`).
10. Yönetilen PostgreSQL kullanılan kurulumlarda WAL/PITR kabiliyeti, RPO/RTO hedefi ve restore provası değerlendirilir (`PRO-029`).

Faz 2C’de firma bazlı dump ve geçici restore doğrulaması uygulanmıştır. Canlı sağlayıcı/topoloji belirlenmediği için WAL arşivleme ve PITR ayarları uygulanmamış; RPO/RTO değeri ilan edilmemiştir. Sağlayıcı, şifreli WAL hedefi, retention, base backup, recovery target, alarm ve ölçülmüş restore kanıtı canlı altyapı paketinde tamamlanır.

## Güncelleme modeli

Yerel kurulum:

- Güncelleme öncesi otomatik yedek.
- Migration dry-run.
- Uygulama sürümü ve migration durumu platforma raporlanır.
- İnternet yoksa temel operasyon durmaz; lisans toleransı devrededir.

Bulut:

- Sürüm halkaları: internal → pilot firma → erken erişim → genel.
- Firma bazlı migration sonucu.
- Hata halinde tenant bazlı durdurma/rollback.
- Güncelleme ve migration ön kontrolü; yedek, dry-run, tenant health, storage, kapasite, sürüm uyumu ve rollback hazır olma durumunu kanıtlar (`PRO-014`).
- Firma/modül bazlı acil durdurma anahtarı feature flag sözleşmesiyle yürür; çekirdek operasyonu gereksiz yere durdurmadan riskli modülü kapatır (`PRO-015`, `PRO-028`).

## Veri teslimi

Firma istediğinde:

- Operasyon DB dump.
- Belge/dosya arşivi.
- Audit export.
- Okunabilir CSV/Excel rapor paketi.
- Firma kapatma, devir ve KVKK talepleri için export, saklama ve kapanış kanıtı ayrı auditlenir (`PRO-009`, `PRO-019`).
- Yedekten dönüş provası checksum, kayıt sayısı ve kabul raporuyla kanıtlanır; sadece yedek dosyasının varlığı yeterli değildir (`PRO-021`).
