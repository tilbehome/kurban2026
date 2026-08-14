# TilbeCore EVO — Kurumsal Güvenlik, Ölçek ve Ekosistem Yol Haritası

```yaml
id: EVO-ROADMAP-001
title: TilbeCore EVO — Kurumsal Güvenlik, Ölçek ve Ekosistem Yol Haritası
status: PLANNED
activation_status: NOT_ACTIVE
owner: TilbeCore Platform
source_role: post_yn_enterprise_evolution_roadmap
version: 1.0
effective_date: YN_26_KAPANISI_SONRASI
activation_gate: YN_26_PASSED_AND_USER_APPROVED
source_of_truth: false
last_reviewed: 2026-08-14
verified_against_commit: 885b55e2cc027cb7782e625d84c1073b74107e8c
source_integrity_sha256: 07ECCD988F9A4A3C8CEBE905CF8B88C1430AC923132FE8DB3B239CA468434C99
supersedes: []
superseded_by: null
```

## Yönetişim entegrasyon notu

Bu kalıcı belge, kullanıcı tarafından hazırlanan kök kaynak dosyasının `07ECCD988F9A4A3C8CEBE905CF8B88C1430AC923132FE8DB3B239CA468434C99` SHA-256 özetiyle doğrulanan 31.986 baytlık içeriğini eksiksiz korur. Özgün `EVO-00–EVO-15` kapsamı, kullanıcı kararları, kabul ölçütleri ve bilinçli redler değiştirilmemiştir; yalnız zorunlu yönetişim metadata alanları, mevcut repo kanıtını gelecek hedeften ayıran bu not ve Teknoloji Radarı eklenmiştir. Dönüşüm izi [GOV-011](../governance/GOV-011-BELGE-DONUSUM-KAYDI.md) belgesindedir.

- Belge durumu: `PLANNED`.
- Aktivasyon durumu: `NOT_ACTIVE`.
- Kaynak rolü: Faz 1–12 ve YN programlarından sonra değerlendirilecek, bağlayıcı olmayan kurumsal evrim yol haritası.
- Öncelik: Bu belge [RMP-001](TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md), YN geçiş kapısı veya [GOV-003](../governance/GOV-003-KAYNAK-ONCELIGI-VE-KANIT-STANDARDI.md) yerine geçmez.
- Zorunlu bağımlılık: **Mevcut Faz 2D–12 tamamlanmadan ve YN-00–YN-26 bitmeden uygulamaya alınmaz.**
- Repo kanıt fotoğrafı: `885b55e2cc027cb7782e625d84c1073b74107e8c`; başarılı ana CI: [TilbeCore CI 31778819919](https://github.com/tilbehome/kurban2026/actions/runs/31778819919).

Bu entegrasyon hiçbir EVO veya YN uygulama işini başlatmaz; yeni paket, dependency, migration, altyapı veya çalışma zamanı davranışı oluşturmaz.

## Teknoloji Radarı — EVO öncesi kanıt sınırı

Radar, teknoloji hedefini dört halkayla yönetir:

- `ADOPT`: Repoda temel/sözleşme vardır ve korunur; tabloda açıkça yazılan gerçek kabul eksikleri kapanmış sayılmaz.
- `TRIAL`: İzole pilot ve ölçüm yapılabilir; genel mimariye veya production akışına doğrudan alınmaz.
- `ASSESS`: Yalnız kanıtlı ihtiyaç, ADR, güvenlik/işletim maliyeti ve geri dönüş planıyla değerlendirilir.
- `HOLD`: Bu program döneminde kabul edilmez; yeni kanıt ve açık kullanıcı kararı olmadan uygulanmaz.

### ADOPT — mevcut temeller, yeniden planlanmayacak

| Başlık | Repo kanıtı | Korunan kabul sınırı |
|---|---|---|
| OpenTelemetry temeli | `packages/observability`, `infrastructure/staging/otel-collector.yml` | Gerçek collector/export çalışma zamanı henüz kabul edilmedi (`NOT_RUN`). |
| Playwright + axe altyapısı | `playwright.config.ts`, `e2e/support/acceptance.ts`, `e2e/*` | Gerçek HTTPS staging E2E/axe henüz kabul edilmedi (`NOT_RUN`). |
| k6 altyapısı | `performance/k6`, `ADR-0004` | Gerçek load/spike/soak koşuları henüz kabul edilmedi (`NOT_RUN`). |
| IndexedDB tabanlı offline çekirdek | `packages/offline/src/browser-indexeddb-repository.ts`, offline testleri | Fiziksel cihaz, ağ kesintisi ve uçtan uca senkron kabulü tamamlanmadı. |
| Staging Compose paketi | `infrastructure/staging/compose.yml` ve doğrulama scriptleri | Production deployment kanıtı değildir ve production gibi sunulmaz. |
| PostgreSQL backup/restore ve PITR temeli | `packages/database-tenant/src/postgres-tenant-backup.ts`, `infrastructure/staging/scripts/base-backup.sh`, `pitr-prepare.sh`, `ADR-0003` | Yönetilen production PITR/failover ve production restore kabulü açık kalır. |
| Secret taraması | `scripts/scan-secrets.mjs`, ana CI kapısı | Gerçek secret depoya veya örnek dosyalara konulmaz; tarama tek başına tam güvenlik kabulü değildir. |
| Tenant izolasyon testleri | `packages/database-tenant/tests/tenant-isolation.integration.test.ts`, `e2e/tenant-isolation.spec.ts` | Mevcut negatif/test kapsamı korunur; production izolasyon provası yerine geçmez. |
| Passkey/MFA/RBAC temeli | `apps/platform-admin/src/passkey.ts`, auth route/testleri, tenant yetki domaini | Fiziksel Windows Hello/passkey ve gerçek cihaz kabulü henüz tamamlanmadı (`NOT_RUN`). |

### TRIAL — kontrollü pilotlar

| Başlık | Pilot sınırı |
|---|---|
| Property-based testler | Önce finansal invariant, durum makinesi veya tenant sınırı gibi saf ve ölçülebilir bir alanda; mevcut örnek testler kaldırılmadan pilotlanır. |
| Görsel regresyon testleri | Kararlı tasarım sistemi ve sentetik veriyle sınırlı pilot; erişilebilirlik testinin yerine geçmez. |
| SBOM üretimi | Önce gerçek TilbeCore release artefaktı, format, saklama ve doğrulama sahibi belirlenir; bağımlılık ekleme ayrı onaylı pakettir. |
| Blue-green/canary yayınlama | Gerçek staging health/rollback ölçümü ve veri uyumluluğu kanıtıyla pilotlanır; Faz 12 canlıya geçiş kapısını atlamaz. |
| Next.js Cache Components/PPR | Tenant, yetki, kişisel veri ve güncellik sınırları doğrulanan tek bir salt-okunur yüzeyde pilotlanır. |
| Turbopack/PWA uyumluluğu | Mevcut `next build --webpack` ve `next-pwa` davranışı korunarak ayrı uyumluluk pilotu yapılır; ölçüm olmadan varsayılan yapılmaz. |

### ASSESS — yalnız kanıtlı ihtiyaçla

| Başlık | Değerlendirme kapısı |
|---|---|
| SLSA provenance ve yayın imzalama | Mevcut `.github/workflows/generator-generic-ossf-slsa3-publish.yml` yalnız `artifact1`/`artifact2` üreten genel örnektir; TilbeCore ürün/release kanıtı sayılmaz. Gerçek artefakt, sabitlenmiş tedarik zinciri, minimal izin ve doğrulama akışı tasarlanmadan etkin kabul edilmez. |
| CQRS read-model | Yalnız ölçülmüş sorgu darboğazı ve tutarlılık ihtiyacı varsa; yazma modelini veya ledger gerçeğini bölmez. |
| PostgreSQL partition | Yalnız veri hacmi, sorgu planı ve bakım ölçümleri gerektirirse; erken partition yapılmaz. |
| ABAC | RBAC ve mevcut policy katmanı kanıtlı gereksinimi karşılamazsa; tenant sınırını gevşetmez. |
| Valkey | Cache/rate-limit/geçici iş yükünde ölçülmüş ihtiyaç varsa; finansal veya kalıcı doğru kaynak olmaz. |
| eBPF gözlemleme | İleri işletim aşamasında, veri minimizasyonu ve operasyon yetkinliği kanıtıyla değerlendirilir. |
| WASM/WASI eklenti izolasyonu | Güvenli eklenti omurgası için Ar-Ge; kaçış, kaynak kotası, capability ve imza modeli kanıtlanmadan ürün runtime’ına alınmaz. |

### HOLD — şimdilik kabul edilmeyecekler

| Başlık | Karar |
|---|---|
| Tüm sistemi Event Sourcing’e dönüştürmek | Modüler monolit, ledger/audit/outbox geçmişi korunur; tüm sistem dönüşümü reddedilir. |
| Erken Kafka/RabbitMQ | Ölçülmüş ayrıştırma veya dayanıklılık ihtiyacı olmadan mesajlaşma altyapısı eklenmez. |
| Erken Kubernetes | İşletim ölçeği ve ekip yetkinliği kanıtlanmadan zorunlu platform yapılmaz. |
| Gereksiz sharding | Firma başına PostgreSQL ve ölçüm temelli ölçekleme tükenmeden uygulanmaz. |
| Zorunlu çoklu bulut | Taşınabilirlik hedefi, gereksiz çoklu bulut işletim karmaşasına dönüştürülmez. |
| Yapay zekâyı karar verici merkez yapmak | AI yalnız öneri/destek rolündedir; finans, yetki, sahiplik, vekâlet ve kritik operasyon kararını kesinleştiremez. |

Radar halkası bir kabul sonucu değildir. Her teknoloji için gerçek uygulama ancak yukarıdaki program kapısı açıldıktan, gereksinim/ADR onaylandıktan ve ilgili test/geri dönüş kanıtı üretildikten sonra başlar.

## 1. Belgenin konumu ve kesin sınırı

Bu belge mevcut **Faz 1–12** programının veya **YN-00–YN-26** yeni nesil yol haritasının parçası değildir. TilbeCore EVO, yalnız bu iki program kanıtla kapatıldıktan sonra başlayacak bağımsız kurumsal evrim programıdır.

Bağlayıcı sıra:

```text
Faz 1–12
  ↓ kabul ve kapanış
YN-00–YN-26
  ↓ ikinci genel doğrulama ve kullanıcı onayı
EVO-00–EVO-15
  ↓ kurumsal sürüm ve sürekli olgunluk döngüsü
```

Bu belgenin repoda bulunması, EVO programının başladığı veya özelliklerinin uygulanmış olduğu anlamına gelmez. Başlangıç için `YN-26 = PASSED`, açık P0/P1 bulunmaması, değişmez bir kabul commit’i ve açık kullanıcı onayı birlikte gerekir.

## 2. Programın amacı

YN programı TilbeCore’un ürün, domain, operasyon, 360° sayfa, cihaz ve temel SaaS yeteneklerini ileri seviyeye taşır. EVO programı ise doğrulanmış ürünü aşağıdaki kurumsal seviyeye yükseltir:

- dış ve iç tehditlere karşı merkezi savunma,
- lisans, modül ve yazılım tedarik zinciri bütünlüğü,
- ölçülebilir yüksek erişilebilirlik ve felaket dayanıklılığı,
- kontrollü eklenti ve entegrasyon ekosistemi,
- veri yönetişimi, analitik ve güvenli yapay zekâ,
- merkezi cihaz, edge ve donanım filosu yönetimi,
- ticari SaaS işletimi, müşteri başarısı ve uluslararası genişleme,
- sürekli doğrulanan ve kanıt üreten kurumsal operasyon modeli.

Amaç ürünü gereksiz mikroservis, moda teknoloji veya kontrolsüz otomasyonla karmaşıklaştırmak değildir. Her yeni bileşen ölçülmüş ihtiyaç, açık sahiplik, güvenlik sınırı ve geri dönüş planıyla eklenir.

## 3. Değişmez EVO ilkeleri

1. **Kanıtsız tamamlanma yoktur.** Kod, ekran veya belge tek başına bitiş değildir.
2. **Zero Trust uygulanır.** Kullanıcı, cihaz, servis veya ağ konumu kendiliğinden güvenilir sayılmaz.
3. **Tenant sınırı değişmezdir.** Bir firmanın verisi, lisansı, cihazı, anahtarı ve olayları başka firmayla karışamaz.
4. **Kritik karar sunucudadır.** Secret, lisans kararı, finans ve yetki mantığı istemciye bırakılmaz.
5. **Finansın doğru kaynağı ledger’dır.** Yapay zekâ veya otomasyon doğrudan finans gerçeğini değiştiremez.
6. **Ağır otomasyon geri alınabilir olmalıdır.** Firma kapatma, veri silme veya kalıcı engel tek sinyalle uygulanamaz.
7. **Gizlilik güvenliğin parçasıdır.** Güvenlik merkezi sınırsız gözetim aracı değildir.
8. **Modüler monolit varsayılandır.** Ölçüm kanıtlamadan mikroservis ayrıştırması yapılmaz.
9. **Tek kod tabanı, kontrollü genişleme.** Firma özel fork üretilmez; feature flag, politika ve eklenti sınırı kullanılır.
10. **İleri teknoloji amaç değil araçtır.** Ölçülebilir fayda sağlamayan teknoloji eklenmez.
11. **İnsan onayı kritik alanlarda korunur.** Sahiplik, vekâlet, finans, kalıcı güvenlik yaptırımı ve veri silme kararları yalnız AI’a verilmez.
12. **Her özellik kapatılabilir ve geri döndürülebilir olmalıdır.** Feature flag, rollout ve rollback sözleşmesi bulunur.

## 4. Program akışları

EVO fazları altı ana akışta yönetilir:

| Akış | Fazlar | Sonuç |
|---|---|---|
| Güvenlik ve güven | EVO-01–EVO-05 | Tehdit, iç risk, lisans, gizlilik ve tedarik zinciri koruması |
| Dayanıklılık ve ölçek | EVO-06–EVO-07 | Çok bölgeli süreklilik, performans ve maliyet kontrolü |
| Ekosistem ve entegrasyon | EVO-08–EVO-09 | Güvenli modül pazarı ve geliştirici platformu |
| Veri ve karar desteği | EVO-10–EVO-11 | Analitik, güvenli AI ve dijital ikiz |
| Fiziksel dünya ve ticari işletim | EVO-12–EVO-14 | Cihaz filosu, müşteri başarısı ve uluslararası genişleme |
| Nihai kabul | EVO-15 | Bağımsız kanıt, tam prova ve kurumsal sürüm kapısı |

## 5. EVO-00 — Kurumsal olgunluk ve geçiş kapısı

### Amaç

YN-26 sonunda ortaya çıkan gerçek ürünü varsayımsız biçimde dondurmak ve EVO yatırım sırasını kanıtla belirlemek.

### Kapsam

- YN-00–YN-26 kabul kanıtlarının doğrulanması.
- Aktif uygulama, paket, modül, route, veri modeli, worker, entegrasyon ve cihaz envanteri.
- Güvenlik, performans, kullanılabilirlik, maliyet ve operasyon olgunluk değerlendirmesi.
- Veri sınıfları, tenant sınırları ve kritik varlık envanteri.
- Açık teknik borç, operasyon borcu ve belge borcu kaydı.
- Mevcut SLO, RPO, RTO ve yük baseline’larının gerçek ölçümleri.
- Ürün, platform, güvenlik, veri ve operasyon sahiplik matrisi.
- EVO yatırım önceliği ve bütçe/kapasite seçenekleri.

### Teslimatlar

- Değişmez YN kabul commit’i.
- `EVO Baseline Envanteri`.
- Kurumsal olgunluk puan kartı.
- Tehdit ve iş etkisi öncelik matrisi.
- EVO ADR ve kanıt kayıt şablonları.
- Faz aktivasyon sırası ve açık bağımlılık grafiği.

### Kabul kriterleri

- YN-26 gerçekten `PASSED` olmalıdır.
- Açık P0/P1 bulunmamalı veya kullanıcı tarafından süreli/risk sahipli istisna verilmelidir.
- Envanter gerçek kod, çalışma ortamı ve kanıtlarla eşleşmelidir.
- Ölçülmemiş sayısal hedef başarı ölçütü olarak yazılmamalıdır.
- Her EVO fazının sahibi, bütçe bağımlılığı ve geri dönüş yaklaşımı belirlenmelidir.

## 6. EVO-01 — Güvenlik olay ve tehdit omurgası

### Amaç

Uygulama, kullanıcı, cihaz, API, veritabanı, altyapı ve yazılım tedarik zinciri sinyallerini ortak, tenant güvenli ve kanıtlanabilir güvenlik olay modelinde birleştirmek.

### Kapsam

- Normalleştirilmiş `SecurityEvent` sözleşmesi.
- Kullanıcı, cihaz, servis hesabı, API anahtarı, tenant, lisans ve release kimlikleri.
- `requestId`, `traceId`, oturum, cihaz ve tenant korelasyonu.
- Güvenlik olay sınıfları: kimlik, yetki, veri, API, lisans, dosya, entegrasyon, altyapı ve tedarik zinciri.
- Olay önem seviyesi, güven puanı, kanıt kaynağı ve saklama politikası.
- PII/secret içermeyen güvenli loglama.
- Değiştirilemez veya kurcalama kanıtlı audit deposu.
- SIEM uyumlu aktarım sözleşmesi.
- Kural motoru ve risk değerlendirme girişleri.

### Teslimatlar

- Güvenlik olay kataloğu ve JSON schema.
- Olay üretici SDK’sı.
- Audit bütünlük zinciri.
- Güvenlik telemetry dashboard temeli.
- Alarm yönlendirme ve sessizleştirme politikası.
- False-positive ve olay deduplikasyon modeli.

### Kabul kriterleri

- Tenant A olayı Tenant B görünümünde bulunamaz.
- Secret, parola, connection string, belge içeriği veya gereksiz PII loglanamaz.
- Kritik işlemler kullanıcı, cihaz, tenant, sebep ve sonuçla korele edilebilir.
- Olay saati, kaynak bütünlüğü ve saklama kuralları doğrulanır.
- Güvenlik olay deposunun arızası ana işlemi sessizce güvensiz hâle getiremez.

## 7. EVO-02 — TilbeCore Güvenlik Komuta Merkezi

### Amaç

Dış saldırıları ve platform güvenlik bozulmalarını merkezi olarak algılayan, önceliklendiren ve kontrollü müdahale eden güvenlik komuta merkezi kurmak.

### Kapsam

- Canlı tehdit ve olay görünümü.
- WAF, DDoS, bot, brute-force ve credential stuffing sinyalleri.
- API keşfi, endpoint tarama, veri kazıma ve anormal sorgu kalıpları.
- Zararlı dosya, şüpheli webhook ve entegrasyon trafiği.
- IP, ASN, ülke, cihaz ve oturum risk korelasyonu.
- Impossible travel ve olağandışı oturum davranışı.
- Risk puanı ve açıklanabilir kural sonucu.
- Olay yaşam döngüsü: açık, incelemede, sınırlandı, çözüldü, yanlış alarm.
- Otomatik ve insan onaylı müdahale oyun kitapları.

### Müdahale seçenekleri

- Ek doğrulama veya passkey/MFA isteme.
- Token, oturum, cihaz veya API anahtarını iptal etme.
- Hız sınırı, geçici IP/istemci engeli veya CAPTCHA.
- Toplu dışa aktarma ve şüpheli webhook’u durdurma.
- Hesap veya tenantı kontrollü salt okunur moda alma.
- Olay komutanı, bildirim, kanıt paketi ve geri dönüş süreci başlatma.

### Güvenlik merkezi ekranları

- Genel güvenlik durumu.
- Aktif tehditler ve risk trendleri.
- Firma, kullanıcı, cihaz ve entegrasyon riskleri.
- Oturum, token ve API anahtarı yönetimi.
- Güvenlik olay kuyruğu.
- Otomatik müdahale geçmişi.
- Audit ve adli inceleme.
- Politika, alarm ve istisna yönetimi.

### Kabul kriterleri

- Kritik saldırı senaryoları staging’de tekrar üretilebilir ve kanıtlanabilir.
- Otomatik müdahalenin gerekçesi, süresi ve geri dönüşü görünürdür.
- Tek düşük güvenli sinyal kalıcı firma kapatamaz veya veri silemez.
- Yanlış alarm ölçülür ve kural iyileştirme akışı bulunur.
- Komuta merkezi arızalandığında temel kimlik ve tenant izolasyonu çalışmaya devam eder.

## 8. EVO-03 — İç tehdit, ayrıcalıklı erişim ve kötüye kullanım merkezi

### Amaç

Platform personeli, firma yöneticisi, çalışan, servis hesabı veya ele geçirilmiş yetkili hesabın sisteme içeriden zarar vermesini önlemek ve tespit etmek.

### Kapsam

- Least privilege ve görev ayrımı.
- Just-in-time ve süreli ayrıcalıklı erişim.
- Kritik işlemlerde yeniden doğrulama ve çift onay.
- Yetki yükseltme, rol değiştirme ve politika sapması tespiti.
- Toplu veri okuma, dışa aktarma, silme ve yapılandırma değişikliği sinyalleri.
- Ayrılan personel için otomatik offboarding.
- Servis hesapları ve insan hesaplarının kesin ayrımı.
- SupportSession kapsam, süre, sebep, onay ve audit denetimi.
- Firma içi güvenlik görünümü; platformun normal şartlarda firma içeriğini görmemesi.
- Fraud/abuse vaka yönetimi.

### Teslimatlar

- Ayrıcalıklı erişim yönetim paneli.
- Görev ayrımı politika matrisi.
- İç tehdit risk kuralları.
- Yönetici işlem onay kutusu.
- Kullanıcı/cihaz erişim inceleme kampanyaları.
- Offboarding ve erişim geri alma orkestrasyonu.

### Kabul kriterleri

- Tek yönetici kritik güvenlik politikasını iz bırakmadan değiştiremez.
- SupportSession olmadan platform personeli tenant operasyon verisine erişemez.
- İşten ayrılan kullanıcının oturumları, cihazları, anahtarları ve delegasyonları kapanır.
- Güvenlik incelemesi veri minimizasyonu ve yetkili erişim sınırlarına uyar.
- Normal iş akışı yanlışlıkla kötü niyetli davranış sayılmaz; açıklanabilir inceleme bulunur.

## 9. EVO-04 — Lisans, kopyalama, modül ve yazılım tedarik zinciri koruması

### Amaç

TilbeCore yazılımını, lisanslarını, modüllerini, build/release hattını ve bağımlılıklarını yetkisiz kullanım, kurcalama ve sahte artefaktlara karşı korumak.

### Kapsam

- Sunucu taraflı entitlement ve lisans doğrulama.
- Firma, plan, modül, süre ve özellik kapsamlı imzalı lisans iddiaları.
- Lisans paylaşımı ve anormal kullanım sinyalleri.
- İmzalı build, container ve release manifestleri.
- SBOM, provenance ve bağımlılık bütünlüğü.
- Secret, dependency, SAST, DAST ve container tarama kapıları.
- Güvenilir yayın anahtarları ve rotasyon.
- Kritik iş mantığının istemciye taşınmaması.
- On-premise ürün oluşursa kurcalama kanıtı, süreli offline grace ve imzalı güncelleme.
- Açık kaynak lisans uyumluluğu ve üçüncü taraf bileşen envanteri.

### Kabul kriterleri

- Yetkisiz modül açma isteği sunucu tarafından reddedilir ve audit üretir.
- İmzası veya provenance’ı doğrulanamayan artefakt yayınlanamaz.
- Tarayıcı paketi secret veya lisans karar anahtarı içeremez.
- Lisans servisi geçici kesildiğinde onaylı grace politikası dışında sınırsız kullanım oluşmaz.
- Meşru veri dışa aktarımı, yazılım kopyalama saldırısıyla karıştırılmaz.
- Bağımlılık riski release kapısında görünür ve sahipli olur.

## 10. EVO-05 — Gizlilik, KVKK ve kurumsal veri yönetişimi

### Amaç

TilbeCore’daki verinin ne olduğunu, neden işlendiğini, kimlerin eriştiğini, ne kadar saklandığını ve nasıl güvenli şekilde silindiğini yönetmek.

### Kapsam

- Veri kataloğu ve sınıflandırma: public, internal, confidential, restricted.
- Amaç, hukuki dayanak, veri sahibi ve saklama süresi metadata’sı.
- Veri minimizasyonu ve alan bazlı erişim.
- Veri sahibi talep süreçleri.
- Dışa aktarma, düzeltme, anonimleştirme ve silme orkestrasyonu.
- Legal hold ve audit koruma istisnaları.
- Test/staging ortamlarında sentetik veya maskeli veri.
- Yedek ve telemetry verilerinde gizlilik yaşam döngüsü.
- Üçüncü taraf entegrasyon ve alt işleyen kaydı.
- Veri kaybı/sızıntısı olay akışı.

### Kabul kriterleri

- Her hassas veri alanının sahibi, amacı ve saklama politikası bulunur.
- Silme talebi finansal/audit yükümlülüklerini bozmadan uygulanır veya gerekçeli sınır üretir.
- Staging’e kontrolsüz production verisi taşınamaz.
- Firma dışa aktarımı yalnız kendi tenant kapsamını içerir.
- Destek ve güvenlik ekranları gereksiz müşteri içeriği göstermez.

## 11. EVO-06 — Çok bölgeli dayanıklılık, felaket kurtarma ve kendini iyileştirme

### Amaç

Uygulama, veritabanı, queue, object storage, DNS veya bölge arızasında ölçülmüş hedeflerle hizmet sürekliliği sağlamak.

### Kapsam

- Tek hata noktası envanteri.
- Uygulama health/readiness/liveness kontrolleri.
- Worker drain, retry, outbox ve poison queue güvenliği.
- PostgreSQL HA, replika, WAL/PITR ve kontrollü failover.
- Object storage sürümleme ve cross-region kopya.
- DNS, reverse proxy ve trafik yönlendirme dayanıklılığı.
- Immutable backup ve periyodik restore tatbikatı.
- Chaos testleri: servis, ağ, DB, disk, queue ve bölge kesintisi.
- Otomatik iyileşme sınırları ve insan onay kapıları.
- Kurban Günü için degraded/read-only/offline çalışma planı.

### Kabul kriterleri

- RPO/RTO tahmin değil gerçek tatbikat ölçümüyle onaylanır.
- Failover sırasında tenant karışması, çift finans kaydı veya kayıp teslim oluşmaz.
- Backup yalnız oluşmakla değil izole restore ile doğrulanır.
- Arıza senaryosunda gözlemlenebilirlik ve olay komutası çalışır.
- Otomatik iyileşme veri kaybı riskinde kontrolsüz yeniden deneme yapmaz.

## 12. EVO-07 — Performans, kapasite, otomatik ölçekleme ve FinOps

### Amaç

TilbeCore’un hızlı çalışmasını, yoğun Kurban Günü yükünü ve altyapı maliyetini ölçülebilir biçimde yönetmek.

### Kapsam

- Tenant ve işlem türü bazlı performans baseline’ı.
- p50/p95/p99 gecikme, hata, throughput ve kaynak doygunluğu.
- DB sorgu planı, index, pool ve lock görünürlüğü.
- Next.js build/runtime, cache ve asset optimizasyonu.
- API, worker, queue ve object storage kapasite modeli.
- Yük, spike, soak ve concurrency testleri.
- Yatay/dikey ölçekleme ve güvenli autoscaling.
- Tenant adaleti, noisy-neighbor kontrolü ve kota.
- Firma/modül/işlem bazlı maliyet görünürlüğü.
- Kapasite tahmini ve sezon öncesi rezervasyon planı.

### Kabul kriterleri

- Sayısal hedefler gerçek baseline ve iş ihtiyacına dayanır.
- Ölçekleme finansal idempotency ve queue bütünlüğünü bozmaz.
- Tek tenant diğer tenantları kaynak tüketimiyle durduramaz.
- Performans iyileştirmesi veri doğruluğu veya audit’i azaltamaz.
- Kurban Günü tahmini kapasitesi tam prova ve soak testiyle kanıtlanır.

## 13. EVO-08 — Güvenli Eklenti SDK’sı ve TilbeCore Modül Pazarı

### Amaç

TilbeCore’u sonradan güvenli modül eklenebilen, sürümlü, izin kontrollü ve geri alınabilir bir platforma dönüştürmek.

### Modül standardı

```text
modules/<module-name>/
├── domain/
├── application/
├── infrastructure/
├── presentation/
├── contracts/
├── events/
├── permissions/
├── migrations/
├── i18n/
├── tests/
└── manifest.ts
```

### Manifest kapsamı

- Modül kimliği, yayıncı ve sürüm.
- Platform uyumluluk aralığı.
- Talep edilen permission ve veri sınıfları.
- Sağlanan/ tüketilen contract ve event’ler.
- Migration ve geri dönüş bilgisi.
- Feature flag ve lisans gereksinimi.
- UI menü/route katkıları.
- Network, storage, webhook ve secret ihtiyaçları.
- İmza, hash, SBOM ve güvenlik inceleme sonucu.

### Kapsam

- Resmî Module SDK ve örnek modül.
- Sandbox ve capability tabanlı izinler.
- Modül yükleme, etkinleştirme, yükseltme, durdurma ve kaldırma yaşam döngüsü.
- Migration ön kontrolü, backup ve rollback.
- Modül bağımlılık grafiği.
- Marketplace inceleme, imza ve yayın süreci.
- Firma planı ve lisansına göre entitlement.
- Modül sağlık, performans ve hata izolasyonu.
- Acil kill switch.

### Kabul kriterleri

- Modül başka modülün private iç yapısını import edemez.
- İzin bildirmeyen modül veriye, ağa veya secret’a erişemez.
- Modül hatası çekirdek finans ve tenant izolasyonunu bozamaz.
- Kaldırma işlemi veri sahipliğini ve audit’i kaybetmez.
- İmzasız veya uyumsuz modül production’da etkinleştirilemez.
- Marketplace yayını güvenlik ve lisans incelemesinden geçer.

## 14. EVO-09 — Entegrasyon bulutu, API ve geliştirici platformu

### Amaç

Haricî sistemlerin TilbeCore’a güvenli, belgeli, sürümlü ve gözlemlenebilir biçimde bağlanmasını sağlamak.

### Kapsam

- OpenAPI 3.1 geliştirici portalı.
- TypeScript ve gerekli diğer SDK’lar.
- OAuth/service account/API key kimlik modeli.
- Scope, tenant, rate limit ve kota politikaları.
- Sürümlü API ve deprecation politikası.
- İmzalı webhook, retry, replay koruması ve dead-letter görünümü.
- Event kataloğu ve schema registry.
- Sandbox tenant ve sentetik test verisi.
- Entegrasyon sertifikasyon paketi.
- SMS, WhatsApp, e-posta, ödeme, muhasebe, kargo ve cihaz connector standardı.
- Firma başına secret ve sağlayıcı konfigürasyonu.

### Kabul kriterleri

- Bir firmanın entegrasyon anahtarı başka tenantta çalışamaz.
- Webhook tekrarları finans veya sahiplikte çift işlem üretemez.
- API değişikliği geriye uyumluluk kanıtı olmadan yayınlanamaz.
- Secret UI, log, audit veya destek çıktısında düz metin görünmez.
- Entegrasyon hatası ana operasyonu sessizce tamamlanmış göstermez.

## 15. EVO-10 — Kurumsal veri platformu, analitik ve güvenli yapay zekâ

### Amaç

Operasyonel veritabanlarını ağır analitikten ayırmak ve açıklanabilir karar desteği üretmek.

### Kapsam

- CDC/outbox tabanlı güvenli veri akışı.
- Veri ambarı/lakehouse kararı için ölçüm ve ADR.
- Semantik metrik katmanı ve tek KPI sözlüğü.
- Tenant güvenli raporlama ve platform toplulaştırması.
- Veri kalitesi, lineage ve freshness kontrolleri.
- Tahmin: satış, kapasite, darboğaz, personel ve stok.
- Anomali ve tutarsızlık tespiti.
- AI model/envanter, prompt, veri ve çıktı yönetişimi.
- İnsan onaylı öneri ve açıklanabilirlik.
- Model drift, maliyet, doğruluk ve güvenlik izlemesi.

### Yapay zekâya verilmeyecek yetkiler

- Finans kaydı veya ledger gerçeğini değiştirme.
- Hisse sahipliği, vekâlet veya teslim kararı oluşturma.
- Kullanıcıyı kanıtsız kalıcı engelleme.
- Firmayı kapatma veya veriyi silme.
- Dinî/hukuki uygunluğu tek başına kesinleştirme.
- Güvenlik alarmını insan incelemesi olmadan geri döndürülemez yaptırıma dönüştürme.

### Kabul kriterleri

- Analitik sorgular operasyonel DB’yi kabul dışı yavaşlatamaz.
- Tenant toplulaştırması yeniden kimliklendirme riski üretmez.
- AI çıktısı öneri, kaynak, güven puanı ve sınırlama gösterir.
- Finans ve operasyon KPI’ları kaynak ledger/event ile mutabıktır.
- Model hatasında güvenli klasik iş akışı kullanılabilir.

## 16. EVO-11 — Dijital ikiz, sezon simülasyonu ve karar laboratuvarı

### Amaç

Gerçek Kurban Günü başlamadan tesis, personel, hayvan, kesim, paketleme, cihaz ve teslimat kapasitesini senaryolarla sınamak.

### Kapsam

- Tesis/istasyon kapasite modeli.
- Hayvan, hisse ve müşteri yoğunluk simülasyonu.
- Kesim ve parçalama süre dağılımları.
- Personel vardiyası ve görev kapasitesi.
- Terazi, yazıcı, QR, ağ ve cihaz arıza senaryoları.
- Soğuk oda, yükleme ve teslimat darboğazı.
- İnternet, elektrik, DB ve entegrasyon kesintisi.
- Alternatif sıra, vardiya ve istasyon planı karşılaştırması.
- Sentetik tam sezon ve Kurban Günü prova veri üretimi.

### Kabul kriterleri

- Simülasyon production verisini değiştiremez.
- Varsayımlar açık, sürümlü ve ölçüm kaynaklıdır.
- Sonuçlar gerçek prova ölçümleriyle kalibre edilir.
- Öneriler operasyon yöneticisi tarafından onaylanmadan planı değiştirmez.
- Darboğaz ve başarısızlık senaryoları somut kapasite/iyileştirme çıktısı üretir.

## 17. EVO-12 — Donanım, IoT, edge ve cihaz filosu yönetimi

### Amaç

Terazi, yazıcı, QR okuyucu, kiosk, TV, tablet, sensör ve edge bileşenlerini merkezi, güvenli ve gözlemlenebilir biçimde yönetmek.

### Kapsam

- Cihaz kimliği, kayıt, sahiplik ve tenant bağlama.
- Sertifika/anahtar üretme, rotasyon ve iptal.
- Firmware/agent sürümü ve imzalı güncelleme.
- Cihaz sağlığı, bağlantı, pil, depolama ve hata telemetry’si.
- Uzaktan tanılama; açık kullanıcı onayı ve audit.
- Offline komut kuyruğu ve yeniden senkronizasyon.
- Donanım adapter SDK’sı ve uyumluluk programı.
- Cihaz envanteri, konum ve sorumlu personel.
- Kayıp/çalıntı cihaz kilidi.
- Kurban Günü yedek cihaz devralma prosedürü.

### Kabul kriterleri

- Kayıtlı olmayan cihaz kritik işlem yapamaz.
- Cihaz anahtarı başka tenant veya cihazda kullanılamaz.
- İmzasız firmware/agent güncellemesi reddedilir.
- Offline tekrarlar çift teslim, tartım veya tahsilat üretmez.
- Uzaktan erişim gizli, sınırsız veya audit dışı olamaz.

## 18. EVO-13 — Ticari SaaS, müşteri başarısı ve destek işletim sistemi

### Amaç

TilbeCore’un yalnız teknik olarak çalışan değil, sürdürülebilir biçimde satılan, desteklenen ve ölçülen kurumsal ürün olmasını sağlamak.

### Kapsam

- Plan, abonelik, faturalama ve entitlement senkronizasyonu.
- Deneme, aktivasyon, yükseltme, düşürme, askıya alma ve kapatma yaşam döngüsü.
- Kullanım ve limit ölçümü.
- SLA, destek paketi ve önceliklendirme.
- Firma sağlık puanı ve onboarding ilerlemesi.
- Eğitim, yardım merkezi ve rol bazlı rehberlik.
- Destek ticket, incident ve problem yönetimi.
- Güvenli tanılama paketi ve SupportSession.
- Yenileme, churn riski ve müşteri başarı görevleri.
- Veri taşınabilirliği ve sözleşme sonu devir paketi.

### Kabul kriterleri

- Faturalama hatası tenant verisini silmez veya geri dönüşsüz kapatmaz.
- Lisans/ödeme durumu auditli ve geri döndürülebilir durum makinesiyle yönetilir.
- Destek personeli gerekenden fazla tenant verisi göremez.
- Firma kendi verisini standart biçimde dışa aktarabilir.
- Modül ve limit davranışı plan/entitlement ile tutarlıdır.

## 19. EVO-14 — Uluslararasılaşma, ülke paketleri ve kurumsal özelleştirme

### Amaç

Tek kod tabanını koruyarak farklı ülke, dil, para birimi, mevzuat ve kurumsal marka ihtiyaçlarını yönetmek.

### Kapsam

- TR/EN/AR temelinin ülke paketlerine genişletilmesi.
- RTL/LTR, locale, tarih, sayı, saat dilimi ve adres formatları.
- Çok para birimi ve kur dönüşüm politikası.
- Ülkeye özel vergi, belge ve saklama adapterleri.
- White-label tema token’ları ve marka yönetimi.
- Özel domain ve kurumsal e-posta şablonları.
- Bölgesel veri yerleşimi ve altyapı politikaları.
- İçerik çeviri yaşam döngüsü ve kalite kabulü.
- Accessibility ve cihaz matrisinin ülke/locale bazlı doğrulanması.

### Kabul kriterleri

- Ülke özelleştirmesi çekirdek kodda firma fork’u üretmez.
- Para birimi ve finans kayıtları yuvarlama/kur kaynağıyla izlenebilir.
- Çeviri eksikliği teknik anahtar veya hatalı RTL göstermez.
- Ülke paketi hukukî uygunluk iddiasını kanıtsız yapamaz.
- Özel marka güvenlik, erişilebilirlik ve güncelleme mekanizmasını bozamaz.

## 20. EVO-15 — Sürekli doğrulama, bağımsız denetim ve kurumsal sürüm kapısı

### Amaç

EVO programının tüm iddialarını bağımsız, tekrarlanabilir ve değişmez kanıtlarla doğrulamak.

### Zorunlu kabul alanları

- Bağımsız güvenlik mimarisi incelemesi.
- Sızma testi ve düzeltme doğrulaması.
- OWASP ASVS hedef kontrolü.
- İç tehdit ve ayrıcalıklı erişim provası.
- Lisans/entitlement ve imzalı release doğrulaması.
- Tenant izolasyonu ve çapraz erişim negatifleri.
- Tam backup, restore, WAL/PITR ve bölgesel DR tatbikatı.
- Yük, spike, soak, failover ve chaos testleri.
- Eklenti sandbox ve kötü niyetli modül testleri.
- API/webhook replay ve entegrasyon hata senaryoları.
- AI güvenlik, gizlilik, doğruluk ve insan onayı değerlendirmesi.
- Gerçek cihaz/edge filosu ve offline senkronizasyon provası.
- Tam Kurban Günü simülasyonu.
- KVKK/veri yönetişimi ve veri taşınabilirliği kabulü.
- Müşteri destek, olay yönetimi ve iletişim tatbikatı.

### Go/No-Go kuralları

- Açık P0 bulunamaz.
- P1 yalnız süreli, sahipli, geri dönüşlü ve kullanıcı onaylı istisnayla kalabilir.
- Kritik kanıt `NOT_RUN` ise kurumsal hazır denemez.
- Test ortamı, commit, sürüm, veri seti ve araç sürümleri kaydedilir.
- Başarı kanıtı başka commit veya ortama taşınmış sayılmaz.
- Geri dönüş planı çalıştırılmadan yalnız yazılı olması yeterli değildir.

### Çıkış

EVO-15 tamamlandığında TilbeCore için değişmez kurumsal sürüm adayı, kanıt indeksi, açık risk kaydı, runbook seti, kullanıcı/developer belgeleri ve go/no-go kararı üretilir.

## 21. Güvenlik risk motoru standardı

Risk kararı tek işarete dayanmaz. Örnek korelasyon:

```text
yeni cihaz
+ olağandışı ülke veya ağ
+ başarısız MFA
+ kısa sürede yüksek hacimli API taraması
+ yetkisiz endpoint denemeleri
= yüksek riskli oturum adayı
```

Her karar şu alanları taşır:

- kullanılan sinyaller,
- sinyal güven seviyesi,
- tenant ve kullanıcı kapsamı,
- kural/model sürümü,
- önerilen müdahale,
- uygulanan müdahale,
- insan onayı,
- son kullanma ve geri dönüş,
- yanlış alarm sonucu.

Risk seviyeleri: `INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. Seviye adları tek başına işlem yetkisi vermez; müdahale politikası ayrıca sürümlenir.

## 22. Hedef platform dizin genişlemesi

EVO programı başladığında mevcut profesyonel monorepo üzerine ihtiyaca göre aşağıdaki sınırlar eklenebilir:

```text
apps/
├── security-command-center/
├── developer-portal/
├── marketplace-console/
├── device-fleet-console/
└── simulation-lab/

packages/
├── security-events/
├── risk-engine/
├── policy-engine/
├── privileged-access/
├── license-entitlements/
├── supply-chain-security/
├── plugin-sdk/
├── plugin-runtime/
├── integration-sdk/
├── event-catalog/
├── data-governance/
├── ai-governance/
├── device-management/
└── simulation-core/

modules/
└── <module>/
    ├── domain/
    ├── application/
    ├── infrastructure/
    ├── presentation/
    ├── contracts/
    ├── events/
    ├── permissions/
    ├── migrations/
    ├── i18n/
    └── tests/
```

Bu dizinler ihtiyaç doğmadan boş klasör olarak oluşturulmaz. Her fiziksel dizin, gerçek sahiplik ve çalışan kodla birlikte açılır.

## 23. Faz tamamlama tanımı

Bir EVO fazı ancak aşağıdaki maddeler uygulanabilir olduğu ölçüde tamamlanır:

- Gereksinim ve açık kapsam.
- Threat model ve güvenlik etkisi.
- Tenant veri sınırı incelemesi.
- Domain, sözleşme ve event etkisi.
- Veri modeli ve migration planı.
- Feature flag ve rollout planı.
- Rollback/roll-forward kanıtı.
- Normal, hata, iptal, tekrar ve eşzamanlılık testleri.
- Negatif yetki ve çapraz tenant testleri.
- Audit, telemetry ve alarm doğrulaması.
- Performans ve kapasite etkisi.
- Backup/restore etkisi.
- Erişilebilirlik, çok dil ve cihaz kontrolü.
- Kullanıcı, geliştirici ve operasyon belgeleri.
- Kanıt kaydı ve değişmez commit.
- Açık risk ve kullanıcı onayı.

## 24. Kanıt durumları

Yalnız aşağıdaki durumlar kullanılmalıdır:

- `NOT_RUN`
- `RUNNING`
- `PASSED`
- `FAILED`
- `BLOCKED`
- `SKIPPED_WITH_REASON`

`Hazır`, `güvenli`, `kurumsal`, `yüksek erişilebilir` veya `tamamlandı` ifadeleri ilgili kanıt `PASSED` olmadan kullanılmaz.

## 25. Program riskleri ve koruma önlemleri

| Risk | Koruma |
|---|---|
| Güvenlik merkezinin aşırı gözetim aracına dönüşmesi | Veri minimizasyonu, tenant görünürlük sınırı, SupportSession ve audit |
| Yanlış alarmın firmayı durdurması | Kademeli müdahale, süre, geri dönüş ve insan onayı |
| Plugin pazarının çekirdeği bozması | Sandbox, capability izinleri, imza, kill switch ve uyumluluk testleri |
| Mikroservis karmaşası | Ölçüm olmadan servis ayrıştırmama |
| AI’ın yanlış karar vermesi | Öneri modu, açıklanabilirlik, insan onayı ve klasik fallback |
| Maliyetin kontrolsüz büyümesi | FinOps, bütçe alarmı, tenant maliyet görünümü ve kapasite ölçümü |
| Çok bölgenin veri tutarsızlığı üretmesi | Açık consistency modeli, failover tatbikatı ve ledger mutabakatı |
| Lisans korumasının müşteriyi cezalandırması | Açık grace politikası, self-service çözüm ve destekli itiraz |
| Ülke özelleştirmelerinin fork üretmesi | Adapter, feature flag ve ülke paketi sınırı |
| Belgelerin koddan kopması | CI belge doğrulaması, kanıt commit’i ve sürümlü sözleşmeler |

## 26. Bilinçli olarak yapılmayacaklar

- YN-26 tamamlanmadan EVO fazı etkinleştirmek.
- Güvenlik gerekçesiyle firma operasyon verisini sınırsız izlemek.
- Tarayıcı kodunu tamamen gizlenebilir varsaymak.
- Tek sinyalle kalıcı kullanıcı/firma kapatmak.
- Kritik finans, sahiplik veya vekâlet kararını AI’a devretmek.
- İmzasız üçüncü taraf modül çalıştırmak.
- Her domaini ölçümsüz mikroservise bölmek.
- Production verisini kontrolsüz test ortamına kopyalamak.
- Restore denemeden yedeği başarılı saymak.
- Gerçek kanıt olmadan mevzuata uyum veya saldırılmazlık iddia etmek.
- Firma başına kod fork’u oluşturmak.
- Boş gelecek dizinleri profesyonellik görüntüsü için çoğaltmak.

## 27. Nihai başarı tanımı

TilbeCore EVO programı tamamlandığında:

- dış ve iç tehditler merkezi ve açıklanabilir biçimde izlenir,
- riskli olaylar geri alınabilir politikalarla sınırlandırılır,
- tenant, lisans, modül ve release bütünlüğü kanıtlanır,
- yedek, PITR, failover ve bölgesel kurtarma tatbikatı geçer,
- yük ve maliyet tenant bazında ölçülür ve yönetilir,
- güvenli modül/entegrasyon ekosistemi kuruludur,
- veri yönetişimi ve AI sınırları uygulanır,
- cihaz ve edge filosu merkezi yönetilir,
- ticari SaaS, destek ve müşteri başarısı işletilebilir durumdadır,
- uluslararası genişleme tek kod tabanıyla yapılabilir,
- bağımsız denetim ve tam Kurban Günü provası değişmez kanıtla geçer.

Bu sonuç yalnız teknik özelliklerin varlığıyla değil; gerçek kullanıcı, cihaz, tenant, altyapı ve olay senaryolarının kanıtlanmış biçimde tamamlanmasıyla kabul edilir.
