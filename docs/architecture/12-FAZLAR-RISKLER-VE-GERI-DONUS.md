# 12 — Fazlar, Riskler ve Geri Dönüş

```yaml
id: GOV-007
status: IMPLEMENTING
owner: Product-and-Architecture
source_role: phase_risk_rollback_register
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

Faz hedef sırası ve çıkış kriterlerinin birinci kaynağı `TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md`, güncel gerçekleşme kaynağı TRK-001’dir. Bu dosyanın tek sahipliği kimlikli riskler ve geri dönüş desenleridir; ayrı faz durumu veya kaynak önceliği üretmez. Teknik borç ve açık kararlar [GOV-014](../governance/GOV-014-TEKNIK-BORC-VE-ACIK-KARAR-KAYDI.md) içinde tutulur.

## 12 Ağustos 2026 doğrulanmış faz durumu

- Faz 1 tamamlandı ve `origin/main` dalına gönderildi.
- Faz 1 commit: `a6720378123f01fb4e19db3fd782a910f18c0acf`.
- Faz 2A sözleşme/import grafiği çıkış şartları karşılandı; bu durum sonraki uygulama fazlarının tamamlandığı anlamına gelmez.
- `b536078` commit’i erken tamamlanan saha satış modüler pilotudur; Faz 2A kapanışı değildir.
- Gerçek Faz 2A workspace/sözleşme/sınır paketi `120afa16e8b635823a80b0967cbfe18e651bd2ad` başlangıç commit’i üzerinden yürütülür.
- Faz 2B ve Faz 2C uygulama paketleri Faz 2A sonrasında ilerlemiştir. `74915b6` ile Faz 2B kodu ve CI kapsamı doğrulandı; canlı/genel kabul bekliyor. Faz 2B kanıt sınırı [ARC-016](16-FAZ-2B-DOGRULANMIS-DURUM-VE-KAPSAM-SINIRI.md) belgesindedir.

## Yerine geçen faz kararı

Önceki tabloda çok firma, PostgreSQL, platform DB ve Süper Admin ayrı fazlara veya daha ileri SaaS aşamalarına yayılmıştı. Yerine geçen karar:

| Aşama | Geçerli kapsam | Eski kararın yerine geçme gerekçesi |
|---|---|---|
| Faz 2A | Mimari sözleşme, monorepo/dizin iskeleti, bağımlılık sınırları, kök dizin tasnifi ve taşıma matrisi | Çok firma çekirdeğine başlamadan önce davranış değiştirmeyen sözleşme gerekir. |
| Faz 2B | Platform Control Plane ve Süper Admin MVP | Platform kimliği firma admininden ayrı olmak zorunda. |
| Faz 2C | Firma başına ayrı PostgreSQL, güvenli tenant yönlendirme, isolation testleri | Veri izolasyonu sonraya bırakılacak SaaS özelliği değil, temel güvenlik şartı. |
| Faz 2D | Firma çekirdek şeması, sezon, müşteri, hayvan, hisse, satış ve ledger temeli | İş domainleri yeni platform/firma sınırına göre kurulmalı. |

Self-service üyelik, otomatik abonelik/faturalama, gelişmiş ticari SaaS, gelişmiş çok şube ve dış servis otomasyonları sonraki ürünleşme fazlarına bırakılır.

## Önerilen uygulama fazları

Aşağıdaki tablo eski faz planının tarihsel özetidir; yeni ana belgeyle çeliştiği yerlerde yukarıdaki “yerine geçen faz kararı” uygulanır.

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

## Profesyonel PRO kapsamının fazlara dağılımı

Bu dağılım `REQ-001..REQ-068` sayımını değiştirmez ve Faz 2A’nın mevcut kapsamını büyütmez. Yeni onaylanan profesyonel kapsam, bağımlı olduğu mevcut fazlara yerleştirilir.

| Faz | Bağlanan PRO kimlikleri | Gerekçe |
|---|---|---|
| Faz 2B | `PRO-012`, `PRO-013`, `PRO-015`, `PRO-016`, `PRO-017`, `PRO-018`, `PRO-019`, `PRO-020`, `PRO-026`, `PRO-028` | Platform DB, Süper Admin, güvenlik merkezi, provisioning, destek ve feature flag sözleşmeleri bu fazda doğar. |
| Faz 2C | `PRO-012`, `PRO-014`, `PRO-017`, `PRO-021`, `PRO-029` | Firma DB provisioning, migration ön kontrolü, kapasite ve restore/PITR kanıtı tenant DB sınırıyla birlikte doğrulanır. |

Faz 2B/2C uygulama notu: `apps/platform-admin` ayrı platform hostu, kimliği, oturumu, TOTP+passkey+recovery, rol/izinleri ve 360° operasyon sayfalarıyla gerçek Platform DB’ye bağlıdır. `0007` incident/bakım/acil durdurma, cihaz/oturum güvenliği ve onaylı firma operasyon işlerini ekler. UI komutları idempotent iş kayıtlarına yazar; `apps/provisioning-cli worker --once` ve `apps/tenant-ops-cli worker --once` gerçek DB/backup adapterlerini çalıştırır. `@tilbecore/tenant-runtime` ve `@tilbecore/tenant-web-runtime` request-local tenant bağlama, aktif read-only/full-stop/modül politikası, auditli SupportSession ve ayrı pool sınırını korur. Geri dönüş, `0007` kodunun feature flag/route kapısıyla devre dışı bırakılması ve migration’ın ileri düzeltme migration’ıyla ele alınmasıdır; veri taşıyan migration geriye otomatik düşürülmez. Fiziksel passkey cihaz kabulü, legacy route taşıması, canlı WAL/PITR ayarı/ölçümü, production restore onayı ve canlı DNS/TLS/deployment sonraki kapılarda kalır.
| Faz 2D | `PRO-003`, `PRO-030` | Import, veri kalitesi ve sezon durum makinesi sözleşmesi firma çekirdek şemasıyla birlikte hazırlanır; Faz 2A’ya kod olarak yığılmaz. |
| Faz 3 | `PRO-004`, `PRO-005`, `PRO-009` | Müşteri, telefon, KVKK, iletişim izni ve veri kalitesi müşteri/sezon/cari modeliyle ilişkilidir. |
| Faz 4 | `PRO-003`, `PRO-004`, `PRO-005` | Hayvan, küpe, tedarik ve toplu veri içe aktarma bu fazın veri sınırına bağlıdır. |
| Faz 5 | `PRO-002`, `PRO-005`, `PRO-032` | Hisse, rezervasyon/kesin satış ayrımı, satılmamış işletme envanteri, çifte satış denetimi ve kritik ödemeli satış onayları atomik satış fazında ele alınır. |
| Faz 6 | `PRO-002`, `PRO-032` | Finansal onaylar, tahsilat istisnaları, ödeme/kasa farkı ve ledger/tahsilat doğruluğu birlikte ele alınır. |
| Faz 8 | `PRO-001`, `PRO-006`, `PRO-032` | Operasyon istisnaları, tutarlılık bulguları ve vardiya devri kesim operasyon motoruyla birlikte anlam kazanır. |
| Faz 9 | `PRO-010`, `PRO-031`, `PRO-035` | Sentetik demo/prova verisi, paket/tartım ve donanım adapterleri gerçek üretim verisinden ayrılır. |
| Faz 10 | `PRO-006`, `PRO-007`, `PRO-008`, `PRO-011`, `PRO-023`, `PRO-024`, `PRO-025`, `PRO-032`, `PRO-033`, `PRO-034`, `PRO-035`, `PRO-036` | Mobil PWA, teslim, cihaz/oturum, bildirim, güvenli offline kuyruk, read-only mod, donanım ve entegrasyon kabulü bu yüzeylerde doğrulanır. |
| Faz 11 | `PRO-001`, `PRO-010`, `PRO-011`, `PRO-025` | Firma yönetim paneli, eğitim/demo ve erişilebilirlik hedefleri raporlama/panel fazında tamamlanır. |
| Faz 12 | `PRO-008`, `PRO-009`, `PRO-011`, `PRO-013`, `PRO-022`, `PRO-023`, `PRO-024`, `PRO-025`, `PRO-026`, `PRO-027`, `PRO-030`, `PRO-031`, `PRO-032`, `PRO-033`, `PRO-034`, `PRO-035`, `PRO-036` | Sertleştirme, güvenlik, E2E, observability, erişilebilirlik, Kurban Günü Provası, offline/readonly ve entegrasyon kabul kapıları canlıya hazırlıkta kapanır. |
| Faz 15 | `PRO-007`, `PRO-014`, `PRO-015`, `PRO-016`, `PRO-018`, `PRO-019`, `PRO-021`, `PRO-028`, `PRO-029`, `PRO-034`, `PRO-036` | Güncelleme, backup/restore, incident, bakım, güvenli sürüm geçişi, entegrasyon ve operasyon sürekliliği bu fazda kanıtlanır. |

## Kritik teknik riskler

Aşağıdaki sıralı kayıtların kalıcı kimliği `RSK-TECH-001..RSK-TECH-025`, durumu `OPEN`, sahibi aksi yazılmadıkça `Architecture-and-Engineering` kabul edilir. Kapanış; bağlı issue, telafi kontrolü, test/EVD ve TRK-001 güncellemesi olmadan yapılamaz.

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
21. Sezon durum makinesi olmadan satış/kesim/teslim/mutabakat akışlarının karışması.
22. Güvenli offline kuyruk ve read-only mod olmadan ağ/arıza anında tutarsız yazma riski.
23. Yapay zekâ çıktısının insan onayı olmadan kritik işlem gibi uygulanması.
24. Donanım ve dış entegrasyonların adapter/outbox/idempotency sınırı olmadan domain koduna sızması.
25. Kurban Günü Provası yapılmadan ilk canlı sezona geçilmesi.

## Kritik iş akışı riskleri

Aşağıdaki sıralı kayıtların kalıcı kimliği `RSK-WFL-001..RSK-WFL-022`, durumu `OPEN`, sahibi aksi yazılmadıkça `Product-and-Domain` kabul edilir. Finans, tenant ve kesim riskleri ilgili uzmanlık sahibinin ortak onayını gerektirir.

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
21. Ödemeli hisse iptali, teslimat geri alma, kasa kapatma, yetki değişikliği veya toplu işlemin yeniden doğrulama/ikinci yetkili onayı olmadan yapılması.
22. Teslim edilmeyen paket, eksik vekâlet, ödeme/kasa farkı veya sezon kapanış farklarının otomatik denetime takılmaması.

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

Faz 1 tamamlandı. İlk uygulanacak yeni aşama Faz 2A’dır ve bu aşama workspace/sözleşme/sınır paketiyle başlatılmıştır. Nedeni: Platform Süper Admin, ayrı firma PostgreSQL veritabanları ve tenant izolasyonu başlamadan önce bağımlılık sınırlarının davranış değiştirmeden belgelenmesi ve testlenebilir hale getirilmesi gerekir.

`b536078` commit’i bu sırada Faz 2A tamamlandı anlamına gelmez; yalnız erken tamamlanan saha satış modüler pilotudur.

### Faz 1 uygulama checkpoint'i

Bu paketle Faz 1'in ilk uygulama katmanı başlatıldı:

- Mojibake tarama scripti ve test kalite kapısı eklendi.
- Merkezi hata katalogu ve standart API hata gövdesi eklendi.
- Geriye uyum için `hata` alanı korunurken yeni `kod/mesajAnahtari/parametreler/requestId` alanları eklendi.
- `tr/en/ar` i18n iskeleti, Türkçe fallback, RTL yön bilgisi ve locale format yardımcıları eklendi.
- Pilot route kapsamı: saha satış, tekli/toplu hisse atama, hisse iptal ve vekâlet dosya route'u.

Kapsam dışı kalanlar: tüm UI metinlerinin i18n'e taşınması, tam Arapça/İngilizce çeviri seti, görsel RTL dönüşümü ve fiziksel `packages/i18n` taşıması.

## Hedef dizin dönüşümünün zamanı

Kesin kurallar:

- Bütün gelişmiş dizinler tek seferde kod taşıyarak oluşturulmayacak.
- UTF-8/i18n temeli Faz 1’de tamamlandı.
- Faz 2A’da önce mimari sözleşme, workspace/dizin iskeleti, kök dizin tasnifi ve taşıma matrisi davranış değiştirmeden hazırlanır.
- Profesyonel domain/origin standardı Faz 2A’da `packages/config`, `packages/contracts`, ADR ve testlerle davranış değiştirmeden sözleşmeye bağlanır; gerçek DNS, TLS, reverse proxy, deployment ve auth/session değişikliği yapılmaz.
- Platform uygulaması, firma sınırı ve ayrı veritabanı temeli tasarlanmadan Süper Admin kodlamasına başlanmayacak.
- Boş `apps/*` veya `packages/*` klasörleri açılmayacak; her klasör gerçek çalışan kod, test ve sahiplik kararıyla birlikte doğacak.

## Kök dizin tasnifi zorunluluğu

Faz 2A’nın çıkış şartlarından biri mevcut proje kökünün tamamen sınıflandırılmasıdır. Bu sınıflandırma `13-HEDEF-DIZIN-ISKELETI-VE-MODUL-STANDARDI.md` içindeki kök taşıma matrisiyle izlenir.

Zorunlu kararlar:

- `.env` Git’e eklenmez; yalnız `.env.example` şablon kalır.
- `.next`, `node_modules` ve `*.tsbuildinfo` kaynak kod değildir; `.gitignore` kapsamı doğrulanır.
- `backups` ve gerçek `data` repo dışında runtime volume/yedek alanı olarak tutulur.
- Örnek veya seed verisi canlı veri içermediği kanıtlandıktan sonra `fixtures/` altına alınır.
- `app`, `public`, `middleware.ts` ve tenant web kaynakları `apps/tenant-web` hedefine yalnız küçük `git mv` commitleriyle taşınır.
- `shared`, `components`, test yardımcıları ve veritabanı adapterleri `packages/*` altında yalnız sahipliği ve bağımlılık sınırı netleşince ayrıştırılır.
- Eski belgeler ve sprint/prompt dosyaları silinmeden önce `docs/archive` veya tarihsel belge statüsüyle korunur.
- İşlevi doğrulanmadan hiçbir eski dosya silinmez.
- Her taşıma sonrasında `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm lint`, `pnpm build` ve ilgili smoke testleri çalıştırılır.
- Geri dönüş yöntemi her taşıma için commit revert, alias/fallback revert veya runtime volume restore olarak önceden belirtilir.

Önerilen dizin dönüşüm sırası:

| Sıra | Dizin dönüşümü | Zaman | Giriş şartı | Commit noktası | Geri dönüş |
|---|---|---|---|---|---|
| 1 | UTF-8 ve i18n temeli | Faz 1 | P0 ve mimari belgeler tamam | Hata kodu/i18n temel commit’i | Commit revert |
| 2 | Kök dizin tasnifi ve taşıma matrisi | Faz 2A | Faz 1 commit’i ve ana belge uyumu | Dokümantasyon/plan commit’i | Commit revert |
| 3 | Davranış değiştirmeyen workspace/monorepo iskeleti | Faz 2A | Kök tasnif matrisi onaylı | İskelet commit’i | Commit revert |
| 3a | Profesyonel domain/origin config sözleşmesi | Faz 2A | Workspace ve contracts paketi mevcut | `feat(faz-2a): profesyonel domain ve origin sozlesmesini ekle` | Commit revert |
| 4 | Saha satış modüler pilotu | Erken pilot olarak tamamlandı | Hata mesajı altyapısı ve route ayrıştırma hedefi | `b536078` erken pilot commit’i | Route adaptörü revert |
| 5 | Müşteri/hayvan/hisse modülleri | Faz 3–5 | Pilot kalıbı kanıtlandı | Modül bazlı küçük commitler | Modül revert |
| 6 | Tahsilat ve finans modülleri | Faz 6/10 | PG test ve para modeli kararı | Finans checkpoint | Backup + revert |
| 7 | Vekâlet/kesim/paket/teslimat | Faz 7/11/12 | Dosya ve workflow portları hazır | Operasyon checkpoint | Feature flag kapatma |
| 8 | Ortak `shared` ayrıştırması | Faz 2A sonrası | Import graph çıkarıldı | Paket hazırlık commitleri | Alias revert |
| 9 | `packages/core`, `ui`, `i18n`, `contracts` | Faz 2A sonrası | Gerçek kod ayrıştırması var | Workspace/package commit’i | Workspace revert |
| 10 | Mevcut uygulamanın `apps/tenant-web` rolüne taşınması | Faz 2A sonrası taşıma paketi | App importları paketlerden besleniyor | Git move commit’i | Git move revert |
| 11 | Platform ve firma veritabanı sınırı | Faz 2C | Tenant app stabil, PG provisioning hazır | DB boundary commit’i | DB snapshot restore |
| 12 | `apps/platform-admin` Süper Admin | Faz 2B | Platform DB ve IAM hazır | Platform app commit’i | Feature flag kapatma |
| 13 | Worker ve ileri entegrasyon uygulamaları | Faz 15+ | Gerçek async/sync ihtiyaçları doğdu | Agent/worker commit’i | Agent kapatma |

## Geri dönüş planı

- Faz 1 geri dönüş noktası: `a6720378123f01fb4e19db3fd782a910f18c0acf` commit’i ayrı revert edilebilir.
- Eski `e47bbe5` referansı tarihsel nottur; artık geçerli kapanış commit’i değildir.
- Her faz küçük commitlerle uygulanır.
- DB etkili fazlarda önce yedek, sonra dry-run, sonra apply.
- Feature flag ile yeni mimari parçalar aşamalı açılır.
- Başarısız migration’da firma DB snapshot geri yüklenir.
