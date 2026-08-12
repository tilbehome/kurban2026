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

Faz hedef sırası ve çıkış kriterleri için görev yönlendirmesi [RMP-001](TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md), güncel gerçekleşme için [TRK-001](KURBAN2026-UYGULAMA-TAKIP.md)’dir; kaynak çelişkileri yalnız [GOV-003](../governance/GOV-003-KAYNAK-ONCELIGI-VE-KANIT-STANDARDI.md) ile çözülür. Bu dosyanın tek sahipliği kimlikli riskler ve geri dönüş desenleridir. Teknik borç ve açık kararlar [GOV-014](../governance/GOV-014-TEKNIK-BORC-VE-ACIK-KARAR-KAYDI.md) içinde tutulur.

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

Aşağıdaki kalıcı kayıtlar ancak bağlı iş açılıp telafi kontrolü ve kapanış EVD’si doğrulandıktan ve TRK-001 güncellendikten sonra `CLOSED` yapılabilir.

| ID | Durum | Risk | Sahip | Olasılık | Etki | Tetikleyici | Azaltım / telafi kontrolü | Hedef | Bağlı REQ / issue | Kapanış kanıtı / EVD |
|---|---|---|---|---|---|---|---|---|---|---|
| RSK-TECH-001 | OPEN | Float parasal model | Finance-and-Ledger | Yüksek | Çok yüksek | Yeni finans kaydında `Float` veya yuvarlama farkı | Kesin parasal tip, ledger invariantı ve mutabakat kapısı | Faz 6 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | PG parasal invariant ve mutabakat EVD’si |
| RSK-TECH-002 | OPEN | SQLite → PostgreSQL migration | Data-and-Migration | Yüksek | Yüksek | Üretim verisi taşıma dry-run’ında kayıp/fark | Yedek, dry-run, satır ve finans mutabakatı, geri dönüş provası | Faz 2C–2D | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Migration ve restore EVD’si |
| RSK-TECH-003 | OPEN | Tenant routing yanlış DB’ye bağlanır | Security-and-Tenancy | Orta | Çok yüksek | Request tenant bağlamı ile çözülen DB uyuşmaz | Request-local bağlama, fail-closed çözümleme ve iki-tenant negatif test | Faz 2C | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Tenant izolasyon EVD’si |
| RSK-TECH-004 | OPEN | Platform ve firma kimlikleri karışır | Security-and-IAM | Orta | Çok yüksek | Cookie, issuer veya yetki ailesi ortaklaşır | Ayrı host/cookie/issuer/rol alanı ve negatif erişim testi | Faz 2B–2C | REQ eşlemesi karar bekliyor; issue henüz açılmadı | IAM ayrım EVD’si |
| RSK-TECH-005 | OPEN | İş kuralları büyük route dosyalarında kalır | Architecture-and-Engineering | Yüksek | Yüksek | Route doğrudan iş durumu veya finans kuralı uygular | Use-case/domain portuna aşamalı taşıma ve import sınırı | Faz 2D–10 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Import grafiği, unit ve route smoke EVD’si |
| RSK-TECH-006 | OPEN | API yetkisi standardize değildir | Security-and-IAM | Yüksek | Çok yüksek | Auth/yetki kapısı olmayan veya UI’ya güvenen route | Merkezi policy, deny-by-default ve route envanteri | Faz 2D–12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Negatif auth/IDOR EVD’si |
| RSK-TECH-007 | OPEN | PII veya DB secret loga sızar | Security-and-Privacy | Orta | Çok yüksek | Log/hata/telemetride credential veya PII görülür | Redaction, güvenli hata gövdesi ve secret tarama | Faz 2B–12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Secret/PII negatif test ve log inceleme EVD’si |
| RSK-TECH-008 | OPEN | Legacy public belge dosyaları yetkisiz açılır | Security-and-Privacy | Orta | Çok yüksek | Hassas dosya `public` veya doğrudan URL’den erişilir | Korumalı depolama, yetkili indirme API’si ve taşınma envanteri | Faz 7 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Dosya erişim ve migration EVD’si |
| RSK-TECH-009 | OPEN | PWA offline/sync davranışı belirsizdir | Field-Operations | Yüksek | Yüksek | Ağ kesilince aynı iş tekrarlanır veya kaybolur | İşlem sınıfı, idempotent kuyruk ve çatışma UX’i | Faz 10–12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Offline yeniden senkronizasyon EVD’si |
| RSK-TECH-010 | OPEN | PDF/Excel Türkçe/Arapça fontları bozulur | I18n-and-Documents | Orta | Orta | Üretilen belgede glif veya yön kaybı | Gömülü font, UTF-8 ve TR/AR belge fixture’ı | Faz 7–12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Görsel belge kabul EVD’si |
| RSK-TECH-011 | OPEN | RTL sonradan yamalanır | UX-and-I18n | Yüksek | Yüksek | Bileşenler fiziksel yön değerlerine bağımlı kalır | Mantıksal CSS, RTL tasarım tokenı ve görsel test | Faz 12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | RTL cihaz/görsel EVD’si |
| RSK-TECH-012 | OPEN | Testler mock ağırlıklı kalır | Quality-Engineering | Yüksek | Yüksek | Kritik akış yalnız mock ile geçer | Gerçek PostgreSQL, route ve E2E kalite kapıları | Faz 2C–12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | PG/E2E koşu EVD’si |
| RSK-TECH-013 | OPEN | Gerçek concurrency PostgreSQL’de doğrulanmaz | Quality-and-Data | Yüksek | Çok yüksek | Eşzamanlı satış/tahsilat isteği aynı kaydı kazanır | Unique/lock/transaction/idempotency ve yarış testi | Faz 5–6 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | PG concurrency EVD’si |
| RSK-TECH-014 | OPEN | Yedek/restore provası eksiktir | Reliability-and-Operations | Yüksek | Çok yüksek | Restore süresi veya veri bütünlüğü bilinmez | Otomatik yedek, doğrulama ve izole restore provası | Faz 12–15 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Değişmez restore/WAL/PITR EVD’si |
| RSK-TECH-015 | OPEN | Placeholder modüller çekirdek ürünü karıştırır | Product-and-Architecture | Orta | Orta | Registry/menü hazır olmayan yüzeyi aktif gösterir | Runtime readiness ve placeholder dışlama kapısı | Faz 2D–11 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Registry/menü negatif test EVD’si |
| RSK-TECH-016 | OPEN | Platform session/cookie ayrımı zayıftır | Security-and-IAM | Orta | Çok yüksek | Platform oturumu tenant yüzeyinde kabul edilir | Ayrı cookie adı/domain/issuer ve süreli destek oturumu | Faz 2B | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Çapraz yüzey negatif oturum EVD’si |
| RSK-TECH-017 | OPEN | Kullanıcı rol modeli string kalır | Security-and-IAM | Yüksek | Yüksek | Serbest rol adı policy kontrolünü aşar | Tipli rol/izin sözleşmesi ve migration | Faz 2D–3 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Rol migration ve negatif yetki EVD’si |
| RSK-TECH-018 | OPEN | Domain olaylarında idempotency/retry eksiktir | Architecture-and-Engineering | Yüksek | Yüksek | Replay çift finans/operasyon kaydı üretir | Event kimliği, outbox, retry bütçesi ve replay testi | Faz 2D–10 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Replay/idempotency EVD’si |
| RSK-TECH-019 | OPEN | Güncelleme öncesi yedek otomatik değildir | Reliability-and-Operations | Orta | Çok yüksek | Migration yedeksiz başlatılır | Preflight yedek doğrulama ve fail-closed release kapısı | Faz 15 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Güncelleme/geri dönüş prova EVD’si |
| RSK-TECH-020 | OPEN | Windows/Linux path ve encoding farkı | Architecture-and-Quality | Orta | Yüksek | CI ile saha hostunda dosya/path sonucu ayrışır | Path API, UTF-8 kapısı ve iki işletim sistemi CI | Faz 1–12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Windows/Linux CI ve dosya EVD’si |
| RSK-TECH-021 | OPEN | Sezon durum makinesi olmadan akışlar karışır | Product-and-Domain | Yüksek | Çok yüksek | Kapalı/yanlış sezona satış, kesim veya mutabakat yazılır | Açık durum makinesi ve çapraz sezon negatif test | Faz 2D–8 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Sezon lifecycle PG/E2E EVD’si |
| RSK-TECH-022 | OPEN | Ağ/arıza anında tutarsız offline yazı oluşur | Field-Operations | Yüksek | Çok yüksek | O3 işlem offline başarılı gösterilir veya kuyruk yinelenir | O0–O3 sınıfı, read-only mod ve idempotent kuyruk | Faz 10–12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Kesinti/sync/readonly EVD’si |
| RSK-TECH-023 | OPEN | Yapay zekâ çıktısı onaysız kritik işleme dönüşür | Security-and-Operations | Orta | Çok yüksek | AI önerisi satış/finans/yetki durumunu doğrudan değiştirir | İnsan onayı, açık kapsam ve auditli öneri sınırı | Faz 12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Onaysız işlem negatif EVD’si |
| RSK-TECH-024 | OPEN | Donanım/dış entegrasyon domain koduna sızar | Architecture-and-Integration | Yüksek | Yüksek | Sağlayıcı SDK’sı veya cihaz protokolü domain bağımlılığı olur | Port/adapter, outbox ve idempotency sınırı | Faz 9–15 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Import sınırı ve adapter sözleşme EVD’si |
| RSK-TECH-025 | OPEN | Kurban Günü Provası olmadan canlı sezona geçilir | Operations-and-Quality | Orta | Çok yüksek | Go/no-go öncesi çok cihazlı tam gün EVD yoktur | Release kapısında zorunlu prova ve geri dönüş tatbikatı | Faz 12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | İmzalı Kurban Günü Provası EVD’si |

## Kritik iş akışı riskleri

Aşağıdaki kayıtların sahipleri risk bazında görünürdür; finans, tenant ve kesim risklerinin kapanışı ilgili uzmanlık sahibinin ortak onayını gerektirir.

| ID | Durum | Risk | Sahip | Olasılık | Etki | Tetikleyici | Azaltım / telafi kontrolü | Hedef | Bağlı REQ / issue | Kapanış kanıtı / EVD |
|---|---|---|---|---|---|---|---|---|---|---|
| RSK-WFL-001 | OPEN | Çifte satış | Sales-and-Shares | Yüksek | Çok yüksek | Aynı hisse için iki eşzamanlı satış kazanır | Transaction, unique/lock ve idempotency | Faz 5 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | PG yarış testi EVD’si |
| RSK-WFL-002 | OPEN | Kapora ile hisse ataması ayrışır | Sales-and-Finance | Yüksek | Çok yüksek | Kapora var/hisse yok veya tersi oluşur | Tek atomik use-case ve başarısızlık rollback’i | Faz 5–6 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Atomiklik PG EVD’si |
| RSK-WFL-003 | OPEN | Ödemeli hisse yanlış boşaltılır | Sales-and-Finance | Orta | Çok yüksek | Hareketli hisse doğrudan sahipsiz yapılır | Silme yasağı, onaylı iptal/transfer ve reversal | Faz 5–6 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Ödemeli hisse negatif EVD’si |
| RSK-WFL-004 | OPEN | İptalde ters kayıt/iade zinciri kopar | Finance-and-Ledger | Orta | Çok yüksek | İptal sonrası bakiye/kasa/satış ayrışır | Bağlı reversal/iade/mahsup ve mutabakat | Faz 6 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | İptal-iade ledger EVD’si |
| RSK-WFL-005 | OPEN | Müşteri mükerrerliği yanlış hissedar üretir | Customer-and-Sales | Yüksek | Yüksek | Arama yanlış müşteri kartını seçer | Kimlik bağlamı, uyarı ve manuel doğrulama | Faz 3–5 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Mükerrer müşteri E2E EVD’si |
| RSK-WFL-006 | OPEN | Ortak telefonlu aile üyeleri karışır | Customer-and-Sales | Yüksek | Yüksek | Telefon benzersizlik kuralı kişileri birleştirir | Telefonu uyarı alanı yap; ayrı müşteri/hissedar koru | Faz 3–5 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Ortak telefon pozitif/negatif EVD’si |
| RSK-WFL-007 | OPEN | Fiyat snapshot kaybolur | Sales-and-Finance | Orta | Çok yüksek | Liste fiyatı değişince satılmış hisse değişir | Anlaşılmış fiyat ve indirim immutable snapshot | Faz 5–6 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Satılmış/satılmamış fiyat EVD’si |
| RSK-WFL-008 | OPEN | Pazarlık/indirim audit izi eksiktir | Sales-and-Finance | Yüksek | Yüksek | Anlaşılmış fiyat farkı açıklamasız kalır | Liste, satış ve indirim ayrı alan/hareket/audit | Faz 5–6 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Fiyat/indirim audit EVD’si |
| RSK-WFL-009 | OPEN | POS vade farkı kasaya yanlış yansır | Finance-and-Ledger | Orta | Çok yüksek | Vade farkı toplam ödemeye uygulanır | Yalnız POS bileşenine kesin hesap ve dağıtım | Faz 6 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Karma ödeme/POS EVD’si |
| RSK-WFL-010 | OPEN | Eksik vekâletle kesim izni verilir | Proxy-and-Slaughter | Orta | Çok yüksek | Kesim geçişinde geçerli vekâlet önkoşulu yoktur | Kesim state guard ve açık istisna/onay izi | Faz 7–8 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Eksik vekâlet negatif EVD’si |
| RSK-WFL-011 | OPEN | Acil sıra değişiminde TV/mobil ayrışır | Slaughter-Operations | Yüksek | Yüksek | Projection ve istasyon farklı sıra sürümü gösterir | Sürümlü sıra olayı, idempotent projection ve refresh | Faz 8–10 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Eşzamanlı sıra değişimi E2E EVD’si |
| RSK-WFL-012 | OPEN | Tartım düzeltmesi geçmişsiz kalır | Processing-and-Audit | Orta | Yüksek | Ölçüm overwrite edilir | Append-only ölçüm/düzeltme ve audit | Faz 9 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Tartım düzeltme EVD’si |
| RSK-WFL-013 | OPEN | Paket kg farkı iadesi oluşmaz | Processing-and-Finance | Orta | Yüksek | Teslim miktarı ile fiyat/iade kuralı ayrışır | Değer/miktar dengesi ve onaylı fark akışı | Faz 9–10 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Paket farkı mutabakat EVD’si |
| RSK-WFL-014 | OPEN | Borçlu teslim override kontrolsüzdür | Delivery-and-Finance | Orta | Çok yüksek | Borç varken tek kullanıcılı teslim gerçekleşir | Policy, yeniden doğrulama, gerekçe ve ikinci onay | Faz 10 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Borçlu teslim negatif/onay EVD’si |
| RSK-WFL-015 | OPEN | QR belge tekrar kullanılır | Proxy-and-Security | Orta | Çok yüksek | Aynı token ikinci işlemi doğrular | Tek kullanımlık, süreli ve sürümlü token | Faz 7–10 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | QR replay negatif EVD’si |
| RSK-WFL-016 | OPEN | Yedi hisse teslim olmadan hayvan kapanır | Delivery-and-Slaughter | Orta | Çok yüksek | Hayvan kapanış guard’ı eksik teslimi atlar | Hisse bazlı teslim bütünlüğü ve state guard | Faz 10 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Eksik teslim kapanış negatif EVD’si |
| RSK-WFL-017 | OPEN | İnternet kesintisinde lisans sistemi durdurur | Platform-and-Operations | Orta | Çok yüksek | Lisans doğrulama servisine erişilemez | Kararı beklenen imzalı tolerans; kanıtsız anlık durdurma yok | Faz 12–15 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Kesinti/lisans toleransı EVD’si |
| RSK-WFL-018 | OPEN | Yedekten geri dönüş çalışmaz | Reliability-and-Operations | Orta | Çok yüksek | Restore provası başarısız veya veri mutabık değil | İzole restore, checksum ve RPO/RTO ölçümü | Faz 12–15 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | İmzalı restore EVD’si |
| RSK-WFL-019 | OPEN | Demo veri canlıya karışır | Training-and-Data | Orta | Yüksek | Sentetik profil production tenant’a yüklenir | Ortam/tenant etiketi ve production deny kapısı | Faz 9–12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Demo-canlı ayrımı negatif EVD’si |
| RSK-WFL-020 | OPEN | Destek kullanıcısı sessiz veri erişir | Security-and-Support | Orta | Çok yüksek | Firma onayı/süre/gerekçe olmadan destek oturumu açılır | Firma onaylı süreli kapsam ve değişmez audit | Faz 2B–12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | SupportSession negatif/audit EVD’si |
| RSK-WFL-021 | OPEN | Kritik işlem yeniden doğrulamasız/ikinci onaysız yürür | Security-and-Operations | Yüksek | Çok yüksek | Ödemeli iptal, teslim geri alma, kasa kapama, yetki/toplu işlem tek adımlıdır | Risk bazlı yeniden doğrulama ve ayrık ikinci onay | Faz 6–12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Kritik onay matrisi EVD’si |
| RSK-WFL-022 | OPEN | Operasyon/finans farkları otomatik denetime takılmaz | Audit-and-Data-Quality | Yüksek | Çok yüksek | Eksik paket/vekâlet veya kasa/sezon farkı kapanışı engellemez | Veri kalitesi kuralı, bulgu kuyruğu ve fail-closed kapanış | Faz 8–12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Otomatik bulgu ve kapanış negatif EVD’si |

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
