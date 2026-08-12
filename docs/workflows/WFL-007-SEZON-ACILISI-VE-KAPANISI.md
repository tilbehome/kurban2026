---
id: WFL-007
title: Sezon Açılışı ve Kapanışı Akışı
status: REVIEW
owner: Domain-and-Operations
source_of_truth: false
last_reviewed: 2026-08-12
related_requirements: [REQ-007, REQ-008, REQ-043, REQ-046, PRO-030, PRO-031, PRO-032]
---

# Sezon açılışı ve kapanışı

## Açılış

1. Firma/tenant, lisans toleransı ve yetkili admin doğrulanır.
2. Yıl, lokasyon, tarih ve kapasiteyle taslak sezon oluşturulur.
3. Fiyat/hisse, finans, belge, teslim ve operasyon politikaları sürümlenir.
4. Kullanıcı/rol, istasyon, vardiya, cihaz, terazi, yazıcı, TV ve ağ kontrolleri yapılır.
5. Sentetik veriyle satıştan teslime prova çalıştırılır; gerçek veri etkilenmez.
6. Yedek/restore, acil durum ve iletişim zinciri doğrulanır.
7. Açık hazırlık engeli yoksa Firma Admin onayıyla satışa geçilir.

## Kurban Günü’ne geçiş

Hayvan/tam yedi hisse, rezervasyon/kapora politikası, vekâlet, satılmamış işletme hissesi, sıra, personel/istasyon, cihaz ve sarf kontrolleri raporlanır. Satılmamış işletme hissesi için sahte kişi veya vekâlet üretilmez; kesim öncesi açık karar dâhil kritik engeller çözülmeden `SLAUGHTER` durumuna geçilmez.

## Kapanış

1. Açık hisse, borç, eksik vekâlet ve teslim edilmemiş paket raporu.
2. Kasa, banka/POS, ledger ve müşteri cari mutabakatı.
3. Hayvan, hisse, tartım/paket ve teslim sayılarının mutabakatı.
4. Açık incident, override ve düzeltmelerin yetkili kapanışı.
5. Son yedek, checksum ve restore doğrulama kanıtı.
6. Firma export ve saklama kararları.
7. Sezonu yazmaya kapatma ve arşivleme.
8. Operasyon sonrası değerlendirme ve backlog.

## Blokajlar

Kapanış; açıklanamayan finans farkı, açık kasa oturumu, teslim edilmemiş hisse/paket, çözülmemiş kritik incident, yedek/restore kanıtı eksikliği veya veri kalite bulgusu varken tamamlanmaz.

## Uygulama durumu

Sezon state machine, PostgreSQL modeli ve prova gate sözleşmesi `IMPLEMENTED_PENDING_VERIFICATION`; legacy uygulamada sezon UI/runtime ve kapanış orkestrasyonu `PLANNED` durumundadır. Mevcut `/musteriler/yeni-sezon` placeholder’dır.

## Kabul kanıtı

- Geçiş atlama ve arşiv sezona yazma negatif testleri.
- Sentetik prova verisinin canlıdan izolasyonu/reset testi.
- Kapanış finans/operasyon farkı blokaj testleri.
- Backup/restore raporu.
- Firma Admin ve rol bazlı UAT sign-off.

Domain sözleşmesi [DOM-003](../domains/DOM-003-FIRMA-TESIS-VE-SEZON.md) içindedir.
