# 12 — Fazlar, Riskler ve Geri Dönüş

## Önerilen uygulama fazları

| Faz | Amaç | Kapsam | DB etkisi | Test | Geri dönüş | Çıkış kriteri | Risk |
|---|---|---|---|---|---|---|---|
| 1 | UTF-8 ve hata kodu temeli | Mojibake tarama, `.editorconfig`, hata kodu registry | Yok | Encoding + API hata testleri | Commit revert | Mojibake testleri geçer | Düşük |
| 2 | Domain/application iskeleti | Use-case servisleri, route inceltme | Yok | Unit + mock route | Route fallback | İlk 3 route taşındı | Orta |
| 3 | Test PostgreSQL altyapısı | Test DB, transaction rollback | Test DB | Integration | Test config revert | PG testleri CI/lokal geçer | Orta |
| 4 | Firma kimliği/ayar/branding | Ürün/firma ayrımı, manifest stratejisi | Ayar genişleme | UI/API | Ayar fallback | Ada Bereket sabitleri sınıflandı | Orta |
| 5 | Firma operasyon PostgreSQL | Firma DB şeması ve provisioning | Büyük | Migration | DB snapshot | Tek firma PG’de çalışır | Yüksek |
| 6 | Platform DB ve Süper Admin temeli | Ayrı platform IAM, lisans, destek | Yeni platform DB | Security | Feature flag | Platform firma meta tutar | Yüksek |
| 7 | Vekâlet/belge/QR tamamlama | Çoklu veren, belge snapshot | Orta | PDF/file/security | Eski API fallback | QR belge kabul | Orta |
| 8 | Sezon modeli | Sezon, sezon bazlı cari başlangıcı | Orta | Integration | Migration rollback | Sezon geçiş testi | Yüksek |
| 9 | Müşteri/hayvan/hisse migration | Veri ayrıştırma, seed profili | Büyük | Migration | Backup restore | Veri mutabakat | Yüksek |
| 10 | Finansal ledger | Kuruş/Decimal, ters kayıt | Büyük | Ledger + mutabakat | Backup restore | Kasa/cari mutabık | Çok yüksek |
| 11 | Operasyon durum makineleri | Kesim/tartım/paket state machine | Orta | State + E2E | Feature flag | Yetkisiz geçiş yok | Orta |
| 12 | Çoklu dil ve RTL | i18n, ar/en, RTL layout | Küçük | i18n + görsel | Dil flag | TR bozulmadan AR çalışır | Orta |
| 13 | Mobil/TV görev PWA | Rol bazlı mobil ekran | Küçük | E2E + cihaz | Menü flag | Saha görevleri mobil | Orta |
| 14 | Raporlama/read-model | Finans/operasyon raporları | Orta | Mutabakat | Read-model rebuild | Rapor tutarlı | Orta |
| 15 | Lisans/yedek/güncelleme | Tolerans, yedek, migration halkası | Orta | Restore + offline | Manuel paket | Offline durmaz | Yüksek |
| 16 | Saha provası/canlı | 5–20 cihaz, LAN, kesinti | Yok | Operasyon prova | P0 snapshot | Tam gün prova geçer | Yüksek |

## En kritik 20 teknik risk

1. Float parasal model.
2. SQLite → PostgreSQL migration riski.
3. Tenant routing yanlış DB’ye bağlanma riski.
4. Platform ve firma kimliklerinin karışması.
5. Büyük route dosyalarında saklı iş kuralları.
6. Yetkinin tüm API’lerde standardize olmaması.
7. PII veya DB secret log sızıntısı.
8. Vekâlet/belge dosya erişiminde legacy public dosyalar.
9. PWA offline/sync belirsizliği.
10. PDF/Excel Türkçe/Arapça font sorunları.
11. RTL tasarımın sonradan yamalanması.
12. Testlerin mock ağırlıklı kalması.
13. Gerçek concurrency’nin PostgreSQL’de doğrulanmaması.
14. Yedek/restore provasının eksikliği.
15. Placeholder modüllerin çekirdek ürünü karıştırması.
16. Session/cookie ayrımının platformda zayıf kurulması.
17. Kullanıcı rol modelinin string kalması.
18. Domain olaylarının idempotency/retry tasarımının eksikliği.
19. Güncelleme öncesi yedek zorunluluğunun otomatik olmaması.
20. Windows/Linux path ve encoding farkları.

## En kritik 20 iş akışı riski

1. Çifte satış.
2. Kapora alınıp hisse atanmaması veya tersi.
3. Ödemeli hissenin yanlış boşaltılması.
4. İptalde ters kayıt/iade zincirinin kopması.
5. Müşteri mükerrerliği nedeniyle yanlış hissedar.
6. Ortak telefonlu aile üyelerinin karışması.
7. Fiyat snapshot kaybı.
8. Pazarlık/indirim audit eksikliği.
9. POS vade farkının kasaya yanlış yansıması.
10. Vekâlet eksikken kesim izni.
11. Acil sıra değişiminde TV/mobil uyumsuzluğu.
12. Tartım düzeltmesinin geçmişsiz kalması.
13. Paket kg farkı iadesinin oluşmaması.
14. Borçlu teslim override’ın kontrolsüz yapılması.
15. QR belgenin tekrar kullanılması.
16. Yedi hisse teslim olmadan hayvan kapanması.
17. İnternet kesintisinde lisansın sistemi durdurması.
18. Yedek geri dönüşünün çalışmaması.
19. Demo verinin canlıya karışması.
20. Destek kullanıcısının sessiz veri erişimi.

## Kısa ADR önerileri

| ADR | Karar |
|---|---|
| ADR-001 | Tek kod tabanı, firma özel kod kopyası yok. |
| ADR-002 | Firma başına ayrı PostgreSQL operasyon DB. |
| ADR-003 | Modüler monolit; mikroservis yok. |
| ADR-004 | Platform kimliği firma kimliğinden ayrı. |
| ADR-005 | Domain olayları ve audit birlikte tasarlanır. |
| ADR-006 | Finansal kayıtlar silinmez; ters kayıt kullanılır. |
| ADR-007 | UTF-8, hata kodu ve mesaj anahtarı zorunlu. |
| ADR-008 | Arapça için gerçek RTL. |
| ADR-009 | Yerel ve bulut dağıtım aynı koddan çıkar. |
| ADR-010 | Lisans toleransı bayram operasyonunu durdurmaz. |

## İlk uygulanacak faz

Faz 1 önerilir: UTF-8 temizlik ve hata kodu/i18n mesaj anahtarı temeli. Nedeni: kod davranışını geniş çapta değiştirmeden, sonraki tüm fazların hata mesajı, dil, PDF, API ve test altyapısını güvenli hale getirir.

## Hedef dizin dönüşümünün zamanı

Kesin kurallar:

- Bütün gelişmiş dizinler şimdi oluşturulmayacak.
- Önce UTF-8/i18n temeli kurulacak.
- Ardından saha satış modüler pilotu yapılacak.
- Modüler sınırlar çalışan kod ve testlerle kanıtlandıktan sonra fiziksel monorepo taşıması başlayacak.
- Platform uygulaması, firma sınırı ve ayrı veritabanı temeli hazır olmadan `apps/platform` oluşturulmayacak.
- Boş `apps/*` veya `packages/*` klasörleri açılmayacak; her klasör gerçek çalışan kod, test ve sahiplik kararıyla birlikte doğacak.

Önerilen dizin dönüşüm sırası:

| Sıra | Dizin dönüşümü | Zaman | Giriş şartı | Commit noktası | Geri dönüş |
|---|---|---|---|---|---|
| 1 | UTF-8 ve i18n temeli | Faz 1 | P0 ve mimari belgeler tamam | Hata kodu/i18n temel commit’i | Commit revert |
| 2 | Saha satış modüler pilotu | Faz 2 | Hata mesajı altyapısı hazır | Pilot use-case commit’i | Route adaptörü revert |
| 3 | Müşteri/hayvan/hisse modülleri | Faz 3–5 | Pilot kalıbı kanıtlandı | Modül bazlı küçük commitler | Modül revert |
| 4 | Tahsilat ve finans modülleri | Faz 6/10 | PG test ve para modeli kararı | Finans checkpoint | Backup + revert |
| 5 | Vekâlet/kesim/paket/teslimat | Faz 7/11/12 | Dosya ve workflow portları hazır | Operasyon checkpoint | Feature flag kapatma |
| 6 | Ortak `shared` ayrıştırması | Faz 6–7 | Import graph çıkarıldı | Paket hazırlık commitleri | Alias revert |
| 7 | `packages/core`, `ui`, `i18n`, `contracts` | Faz 7 | Gerçek kod ayrıştırması var | Workspace/package commit’i | Workspace revert |
| 8 | Mevcut uygulamanın `apps/tenant` altına taşınması | Faz 8 | App importları paketlerden besleniyor | Git move commit’i | Git move revert |
| 9 | Platform ve firma veritabanı sınırı | Faz 9 | Tenant app stabil, PG provisioning hazır | DB boundary commit’i | DB snapshot restore |
| 10 | `apps/platform` Süper Admin | Faz 10 | Platform DB ve IAM hazır | Platform app commit’i | Feature flag kapatma |
| 11 | Worker ve ileri entegrasyon uygulamaları | Faz 15+ | Gerçek async/sync ihtiyaçları doğdu | Agent/worker commit’i | Agent kapatma |

## Geri dönüş planı

- Geri dönüş noktası: `e47bbe5`.
- Her faz küçük commitlerle uygulanır.
- DB etkili fazlarda önce yedek, sonra dry-run, sonra apply.
- Feature flag ile yeni mimari parçalar aşamalı açılır.
- Başarısız migration’da firma DB snapshot geri yüklenir.
