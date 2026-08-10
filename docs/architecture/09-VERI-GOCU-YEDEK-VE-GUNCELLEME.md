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

## Veri teslimi

Firma istediğinde:

- Operasyon DB dump.
- Belge/dosya arşivi.
- Audit export.
- Okunabilir CSV/Excel rapor paketi.
