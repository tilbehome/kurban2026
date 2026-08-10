# Kurban Günü Acil Durum Runbook

Durum: Uygulandı — genel doğrulama bekliyor.

Bu runbook production açılışı değildir. Canlı sezon öncesinde genel doğrulama döneminde tekrar test edilecektir.

## Kabul kapıları

- Kurban Günü simülasyonu yürütülür.
- Backup/restore provası kanıtlanır.
- Bakım modu ve yalnızca okuma modu denenir.
- Placeholder ve demo veri temizliği tamamlanır.
- Kritik finans, satış, teslimat ve vekâlet akışları uçtan uca doğrulanır.

## Acil durum sınıfları

- Bağlantı kesintisi
- Veritabanı erişim hatası
- Yanlış tenant/yanlış DB şüphesi
- Tahsilat veya ledger tutarsızlığı
- Teslimat geri alma
- Kesim sırası/TV ekranı kesintisi

## Geri dönüş ilkesi

Finansal ve operasyonel kayıtlar fiziksel silinmez. Düzeltmeler ters kayıt, iptal, iade, mahsup veya auditli geri alma ile yapılır.
