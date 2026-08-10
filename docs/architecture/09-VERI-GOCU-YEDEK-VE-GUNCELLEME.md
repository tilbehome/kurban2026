# 09 — Veri Göçü, Yedek ve Güncelleme

## Veri politikası

Mevcut yerel veriler geliştirme/test verisi kabul edilmiştir. Buna rağmen dönüşümler script/migration olarak, dry-run ve raporla yapılmalıdır. Harici yedeklere ve `backups` klasörüne rastgele dokunulmaz.

## Mevcut yedek kanıtı

- `backups/` klasörü var.
- `shared/lib/backup.ts` ve `app/api/yedek/*` route’ları mevcut.
- `scripts/migrate-vekalet-files.mjs` dry-run varsayılanlı P0 scriptidir.

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
