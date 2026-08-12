# 14 — Program Tam Kapsam Envanteri

```yaml
id: INV-001
status: IMPLEMENTING
owner: Product-and-Architecture
source_role: program_scope_inventory
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

Bu belge, TilbeCore – Kurban Takip yazılımını yalnızca görüşmelerde geçen 68 iş akışıyla değil, mevcut repo, veritabanı şeması, altyapı ve profesyonel ürün beklentileriyle birlikte izlemek için oluşturuldu.

Bu belge bir tamamlanma beyanı değildir. Amaç, bulunan alanları görünür kılmak, durumlarını sınıflandırmak ve sonraki fazlara güvenli dönüşüm listesi vermektir.

Bu envanterin görev bağlamı [RMP-001](TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md), kaynak ve kanıt değerlendirme kuralı [GOV-003](../governance/GOV-003-KAYNAK-ONCELIGI-VE-KANIT-STANDARDI.md)’tür. Bu envanterde görünen kod, ekran veya route varlığı tek başına ürün kararını veya tamamlanmış özelliği kanıtlamaz.

## 12 Ağustos 2026 uyum notu

- Ürün adı TilbeCore – Kurban Takip’tir.
- Faz 1 tamamlandı: `a6720378123f01fb4e19db3fd782a910f18c0acf`.
- Faz 2A workspace/sözleşme/sınır çıkış şartları karşılandı. `b536078` yalnız erken saha satış modüler pilotudur.
- `74915b6` ile Faz 2B kontrol düzlemi kodlandı ve CI kapsamındaki PostgreSQL senaryolarında doğrulandı; canlı/genel kabul bekliyor.
- Çok firma veri izolasyonu, Platform Süper Admin ve firma başına ayrı PostgreSQL Faz 2’nin zorunlu temelidir.
- Çok şube, self-service üyelik, otomatik abonelik/faturalama ve gelişmiş ticari SaaS özellikleri sonraya bırakılmıştır.
- Sistem yalnız büyükbaş kurban içindir.
- Placeholder/yakında sayfaları, menüde görünse bile tamamlanmış özellik sayılmaz.

## Kapsam kaynakları

Program kapsamı dört kaynaktan birlikte çıkarılır:

1. Kullanıcı tarafından verilen ve belgelenmiş iş kuralları.
2. Mevcut kaynak kodunda bulunan sayfa, API, bileşen, script ve altyapı.
3. Prisma şemasındaki veri modelleri ve ilişkiler.
4. Profesyonel bir kurban yönetim sisteminde bulunması gereken ama henüz konuşulmamış veya kodlanmamış alanlar.

Bir alan kodda var diye doğru kabul edilmez. Bir alan görüşmelerde geçmedi diye kapsam dışı bırakılmaz.

## İzlenebilirlik ayrımı

Bu envanter üç ayrı kapsamı karıştırmadan takip eder:

1. Görüşmelerden çıkan 68 iş akışı: `11-GEREKSINIM-IZLENEBILIRLIK-MATRISI.md` içindeki `REQ-001..REQ-068` satırları.
2. Kaynak kodundan keşfedilen sistem alanları: Bu belgedeki sayfa, API, bileşen, modül, Prisma modeli, script, PWA ve altyapı alanları.
3. Profesyonel ürün aday gereksinimleri: Sektör araştırması, kullanıcı kararı ve mimari değerlendirme sonrası kesinleşecek alanlar.

`68/68 temsil edildi` ifadesi yalnız görüşme gereksinimlerini kapsar. Bu ifade, programın tüm kod alanlarının tamamlandığı veya tüm profesyonel ürün kapsamının bitirildiği anlamına gelmez.

Kaynak kodda şube, SaaS, entegrasyon, personel, AI/ROI veya benzeri ekranların bulunması bu alanların ilk canlı kapsamına alındığı anlamına gelmez. Yeni ana belgeye göre bunlar ya Faz 2 çekirdeğinin veri izolasyonu/provisioning tarafına bağlanır ya da sonraki ürünleşme fazlarına ertelenir.

## Repo envanter özeti

| Tür | Bulgu | Not |
|---|---:|---|
| App Router sayfa/layout/error dosyası | 130 | Çalışan sayfalar, yazdırma sayfaları, müşteri takip ekranı ve placeholder sayfalar birlikte sayıldı. |
| API route | 74 | Faz 1 hata/i18n pilotu 5 route'a uygulandı; kalan route'lar dönüşüm listesinde. |
| TSX bileşen | 142 | `app`, `modules` ve `shared` altındaki client/server bileşenleri. |
| Ana modül dizini | 10 | `dashboard`, `hayvanlar`, `kasa`, `kesim`, `musteriler`, `raporlar`, `tahsilat`, `tv`, `vekalet`, `whatsapp`. |
| Yardımcı/örnek modül | 2 | `_core`, `_example`; hedef mimariyle karşılaştırılarak kalıcı/örnek ayrımı yapılmalı. |
| Prisma modeli | 18 | SQLite üzerinde mevcut operasyon modeli; hedef PostgreSQL/tenant mimarisi için yeniden değerlendirilecek. |
| Test dosyası | 10 | Mock ağırlıklı; gerçek PostgreSQL entegrasyon testi henüz yok. |
| Script | 10 | Yedek, migration hazırlığı, sayaç, PWA sürümü, UTF-8 kontrolü ve bakım scriptleri. |

## Prisma model envanteri

| Model | Alan | Durum | Mevcut sorun / not | Hedef durum | Öncelik |
|---|---|---|---|---|---|
| `Kullanici` | Kullanıcı, rol, görev | Mevcut fakat eksik | Rol string; platform/firma kimliği ayrımı yok. | Firma IAM ve Platform IAM ayrımı; typed rol/yetki. | P0/P1 |
| `Ayar` | Firma/sistem ayarları | Mevcut fakat eksik | Anahtar-değer yapı var; marka, sezon, tenant ve lisans ayrımı sınırlı. | Firma ayarları, ürün markası ve lisans ayrımı. | P1 |
| `ModulDurum` | Modül durumu | Mevcut fakat eksik | Modül registry hedefiyle tam bağlı değil. | Feature flag/module registry standardı. | P2 |
| `AuditLog` | Denetim izi | Mevcut fakat eksik | Her kritik işlemde kapsama ve maskeleme standardı aynı değil. | PII/secret maskeli, domain olaylarıyla ilişkili audit. | P0 |
| `Musteri` | Müşteri kartı | Mevcut fakat eksik | Sezon/cari geçmiş modeli yok; ortak telefon politikası UI/iş kuralı tamamlanmalı. | Sezon bazlı müşteri geçmişi ve cari bağlantı. | P1 |
| `Kurban` | Hayvan/kesim operasyonu | Mevcut fakat eksik | Tedarikçi, alış faturası, uygunluk ve tartım geçmişi ayrı model değil. | Hayvan, tedarik, tartım ve durum makinesi ayrımı. | P1 |
| `Hisse` | Hisse kartı/satış/teslim | Mevcut fakat eksik | Satış snapshot, fiyat sürümü, transfer geçmişi ve teslim state machine eksik. | Bağımsız hisse yaşam döngüsü ve auditli transfer/teslim. | P0/P1 |
| `Not` | Müşteri notları | Mevcut ve kısmi çalışıyor | Yetki ve sahiplik kontrolleri route bazında dağınık. | Standart not use-case ve hata kodları. | P2 |
| `Vekalet` | Hisse bazlı belge | Mevcut ve kısmi çalışıyor | Tek belge modeli; çoklu vekâlet veren ve belge snapshot yok. | Çoklu veren, kanal, belge versiyonu ve güvenli dosya portu. | P1 |
| `Odeme` | Tahsilat | Mevcut fakat eksik | `Float`; ters kayıt/ledger yok; iptal modeli sınırlı. | Decimal/kuruş tabanlı ledger, iade/mahsup/ters kayıt. | P0/P1 |
| `KasaHareketi` | Kasa/banka/POS etkisi | Mevcut fakat eksik | Banka/POS alt defteri ve mutabakat modeli sınırlı. | Kasa, banka, POS ve mutabakat ayrımı. | P1 |
| `WhatsAppSablonu` | İletişim şablonu | Mevcut fakat eksik | Kanal sağlayıcı ve izin/opt-in stratejisi net değil. | Çok kanallı iletişim, izin ve teslimat takibi. | P2 |
| `WhatsAppGonderim` | Toplu gönderim | Mevcut fakat eksik | Hedefler JSON; denetlenebilir tekil gönderim modeli sınırlı. | Tekil alıcı kayıtları, tekrar/iptal/başarısızlık yönetimi. | P2 |
| `TvAyari` | TV ayarları | Mevcut ve kısmi çalışıyor | Firma/ekran profili ayrımı yok. | Firma bazlı TV profil ve yayın ayarları. | P2 |
| `PushAbonelik` | PWA push | Mevcut fakat eksik | Auth secret alanı hassas veri yönetimi ve yaşam döngüsü gerektirir. | Güvenli abonelik, TTL, iptal ve müşteri onayı. | P1 |
| `BildirimLog` | Bildirim izi | Mevcut fakat eksik | Kanal sonuçları ve retry politikası sınırlı. | Merkezi bildirim logu ve tekrar stratejisi. | P2 |
| `Sayac` | Atomik sayaç | Mevcut ve çalışıyor | SQLite/Prisma eşzamanlılık sınırı PostgreSQL'de yeniden test edilmeli. | PostgreSQL transaction ile garantili sayaç. | P0 |
| `IslemAnahtari` | İdempotency | Mevcut ve kısmi çalışıyor | Bazı kritik route'larda kullanılıyor; tüm finansal işlemlere yayılmalı. | Standart idempotency portu ve temizleme politikası. | P0 |

## Program kapsam matrisi

| Alan/modül | İlgili sayfa | İlgili API | Prisma modeli | Durum sınıfı | Mevcut sorun | Hedef durum | Faz | Öncelik | Kabul kriteri |
|---|---|---|---|---|---|---|---|---|---|
| Dashboard | `/` | `/api/dashboard/*`, `/api/sidebar/bildirimler` | Çeşitli read-model | Mevcut fakat eksik | Hata yanıtları merkezi değil; read-model sınırı net değil. | Yetkili, hızlı ve güvenli özet ekranı. | Faz 2/14 | P1 | Dashboard verileri yetkiye göre gelir, hata kodları standarttır. |
| Müşteri yönetimi | `/musteriler`, `/musteriler/[id]`, `/musteriler/yeni` | `/api/musteriler/*` | `Musteri`, `Not`, `Hisse`, `Odeme` | Mevcut fakat eksik | Sezon/cari ayrımı yok; bazı ekranlar placeholder. | Sezon geçmişli müşteri ve cari görünümü. | Faz 3/8 | P1 | Ortak telefon desteklenir, sezon ekstreleri ayrıdır. |
| Müşteri import/export/etiket | `/musteriler/excel-*`, `/musteriler/etiketler` | `/api/musteriler/[id]/excel`, `/api/musteriler/[id]/etiketler` | `Musteri` | Yalnızca arayüzü var / kısmi backend | Birçok sayfa placeholder; export/import kabul kriteri yok. | Güvenli Excel ve etiket akışı. | Faz 9 | P2 | Şablon, validasyon, dry-run ve audit bulunur. |
| Hayvan yönetimi | `/hayvanlar`, `/hayvanlar/yeni`, `/hayvanlar/[id]` | `/api/hayvanlar`, `/api/hisseler/bos-kurbanlar` | `Kurban`, `Hisse` | Mevcut fakat eksik | Tedarikçi/alış/uygunluk/tartım geçmişi model ayrımı yok. | Tedarik, hayvan kartı ve uygunluk state machine. | Faz 4 | P1 | Küpe ve operasyon no ayrı, uygun olmayan hayvan satılamaz. |
| Hisse atama/satış | `/hayvanlar/hisse-atama`, `/saha-satis` | `/api/hisseler/ata`, `/api/hisseler/toplu-ata`, `/api/saha-satis` | `Hisse`, `Musteri`, `Odeme`, `KasaHareketi`, `IslemAnahtari` | Mevcut ve kısmi çalışıyor | `/api/saha-satis` Faz 2A pilotuyla domain/use-case ayrımına alındı; tekli/toplu hisse atama route'ları hâlâ ayrı pilot bekliyor. | İnce route, domain kuralı, idempotent satış. | Faz 1/2/5 | P0 | Çifte satış olmaz; hata kodları standart; testler geçer. |
| Hisse transfer/iptal | `/hayvanlar/hisse-transfer` | `/api/hisseler/[id]/transfer`, `/api/hisseler/[id]/iptal` | `Hisse`, `Odeme`, `Vekalet` | Mevcut fakat eksik | İptal pilot hata standardında; transfer merkezi hata/use-case değil. | Auditli transfer ve finans etkisi açık iptal. | Faz 5/10 | P0 | Ödemeli hisse güvenli engellenir; transfer geçmişi korunur. |
| Tahsilat ve kapora | `/tahsilat`, `/tahsilat/musteri/[id]`, `/tahsilat/dekontlar` | `/api/tahsilat/odeme`, `/api/tahsilat/dekont/[id]`, `/api/tahsilat/iptal/[id]` | `Odeme`, `KasaHareketi`, `Sayac`, `IslemAnahtari` | Mevcut fakat veri bütünlüğü riski taşıyan | `Float`, route içinde yoğun iş kuralı, ham hata riski. | Ledger, Decimal/kuruş ve standart hata. | Faz 6/10 | P0 | Tahsilat/kasa atomik; iptal ters kayıtla olur. |
| Kasa, banka, POS | `/kasa/*` | `/api/kasa/hareket`, dashboard kasa API'leri | `KasaHareketi`, `Odeme` | Mevcut fakat eksik | Nakit/havale/kart var; banka/POS alt defteri ve mutabakat kısıtlı. | Ayrı kasa/banka/POS defterleri ve gün sonu mutabakat. | Faz 10 | P1 | Kasa raporu tahsilat ve dekontlarla mutabık olur. |
| Tedarikçi, alış faturası, giderler | `/hayvanlar/tedarik`, `/kasa/gider` | Kısmi kasa/hayvan API'leri | Yok / `Kurban`, `KasaHareketi` | Gereksinimde var fakat kodlanmamış / placeholder | Tedarikçi ve alış faturası modeli yok. | Tedarikçi, alış faturası, hayvan maliyeti. | Faz 4 | P1 | Hayvan kârlılığı gerçek alış maliyetiyle hesaplanır. |
| Vekâlet ve belge | `/hayvanlar/vekalet`, müşteri/hisse vekâlet tabları | `/api/vekaletler`, `/api/vekaletler/[id]`, `/api/hisseler/[id]/vekalet` | `Vekalet`, `Hisse` | Mevcut ve kısmi çalışıyor | Dosya güvenliği pilot iyi; çoklu veren/kanal/belge versiyonu yok. | Belge snapshot, QR ve çoklu vekâlet veren. | Faz 7 | P1 | Dosya public sızmaz; yetkisiz erişim yok. |
| Kesim, tartım, paket, teslim | `/kesim/*`, `/tv/personel`, `/tv/kontrol` | `/api/kesim/*`, `/api/hisseler/[id]/paket`, `/api/hisseler/[id]/teslim`, `/api/tv/*` | `Kurban`, `Hisse`, `TvAyari`, `BildirimLog` | Mevcut fakat yeniden tasarlanması gereken | Durumlar string; route ve UI içinde iş akışı dağınık. | State machine ve görev bazlı mobil akış. | Faz 11/12/13 | P1 | Yetkisiz durum geçişi olmaz; TV/mobil senkron kalır. |
| Raporlar ve yazdırma | `/raporlar/*` | `/api/raporlar/*`, müşteri excel API'leri | Çeşitli | Mevcut fakat eksik / placeholder | Çok sayıda rapor sayfası placeholder; veri mutabakatı testi yok. | Mutabık finans/operasyon raporları ve belge çıktıları. | Faz 14 | P2 | Raporlar ledger ve operasyon kayıtlarıyla tutarlı olur. |
| Kullanıcı, rol, yetki | `/ayarlar/kullanicilar`, `/ayarlar/roller` | `/api/kullanicilar/*`, auth API'leri | `Kullanici`, `AuditLog` | Mevcut fakat eksik | Rol string; roller sayfası placeholder; platform/firma ayrımı yok. | Typed RBAC, platform/firma IAM ayrımı. | Faz 2/6 | P0 | Her API server-side yetki kontrolünden geçer. |
| Firma ayarları ve branding | `/ayarlar`, `/ayarlar/*` | `/api/ayarlar` | `Ayar`, `ModulDurum` | Mevcut fakat eksik | Birçok alt sayfa placeholder; ürün/firma marka sınırı zayıf. | Firma ayarı, ürün markası ve lisans ayrımı. | Faz 4/15 | P1 | Firma logosu ürün markasını ezmez. |
| Platform/Süper Admin | `apps/platform-admin` | Ayrı platform login, dashboard, firma/provisioning/plan/domain/backup/support/kullanıcı/audit route’ları | Platform DB repository ve async worker komutları | Uygulandı — genel doğrulama ve kalan Faz 2B sertleştirmeleri bekliyor | Tam passkey, incident/emergency-stop davranışı, canlı DNS/TLS ve production restore onayı eksik. | Ayrı platform uygulaması/veritabanı/kimlik sınırını koru. | Faz 2B, Faz 12/15 | P1 | Firma operasyon verisi platform DB'ye taşmaz. |
| TV takip ve müşteri takip | `/tv`, `/tv/m`, `/tv/m/k/[kesimSirasi]` | `/api/tv/*` | `TvAyari`, `PushAbonelik`, `BildirimLog`, `Kurban`, `Hisse` | Mevcut ve kısmi çalışıyor | Public/kısıtlı veri sınırı ve PII minimizasyonu tekrar incelenmeli. | PII minimize, hızlı, mobil uyumlu takip ekranı. | Faz 13 | P1 | Müşteri yalnız kendi/izinli takip bilgisini görür. |
| WhatsApp ve iletişim | `/whatsapp/*` | `/api/whatsapp/*` | `WhatsAppSablonu`, `WhatsAppGonderim`, `BildirimLog` | Mevcut fakat eksik / placeholder | Çok sayıda kanal sayfası placeholder; sağlayıcı entegrasyonu net değil. | Çok kanallı izinli iletişim ve denetlenebilir gönderim. | Faz 8/14 | P2 | Gönderim hedefleri, hata ve audit tekil izlenir. |
| Personel ve ekip | `/personel/*`, `/tv/personel` | `/api/tv/personel-gorevler`, `/api/tv/sorun-bildir` | `Kullanici`, `AuditLog` | Yalnızca arayüzü var / kısmi backend | Personel ekranları çoğunlukla placeholder; görev modeli yok. | Görev, vardiya, performans ve olay bildirimi modeli. | Faz 13/14 | P2 | Personel görevleri rol ve operasyon durumuyla bağlıdır. |
| Lojistik ve adrese teslim | `/lojistik/*` | Yok | Yok | Yalnızca arayüzü var / konuşulmamış fakat gerekli | Rota, araç, şoför ve teslimat modeli yok. | Adrese teslim, rota, araç ve teslim belgesi akışı. | Faz 12 | P2 | Teslimat tek seferlik ve auditli kapanır. |
| Dosya, PDF, yazdırma | Yazdırma sayfaları, vekâlet dosya API | `/api/vekaletler/[id]`, rapor/müşteri excel API'leri | `Vekalet`, çeşitli | Mevcut fakat eksik | PDF font/i18n/RTL stratejisi yok; bazı dosya akışları legacy. | Güvenli dosya portu, belge snapshot ve UTF-8/RTL fontlar. | Faz 7/12 | P1 | Fiziksel yol sızmaz; TR/AR karakterler doğru çıkar. |
| Yedekleme ve geri yükleme | `/ayarlar/yedekleme` | `/api/yedek/*` | Dosya sistemi, SQLite | Mevcut fakat güvenlik riski taşıyan | Bazı hata mesajları dosya yolu döndürebilir; DB restore yüksek riskli. | Dry-run, yedek zorunluluğu, güvenli restore ve audit. | Faz 15 | P0 | Restore prova edilir; yol/secret sızmaz. |
| PWA/offline/service worker | `/offline`, PWA bileşenleri | `/api/audit/pwa-yukleme`, push API'leri | `PushAbonelik`, `BildirimLog` | Mevcut fakat eksik | Offline iş kuralı ve çakışma stratejisi açık değil. | Kontrollü offline, sync ve çakışma çözümü. | Faz 13/15 | P1 | Zayıf ağda kritik ekranlar güvenli davranır. |
| i18n, UTF-8, RTL | Tüm UI/API | Pilot route'lar | Yok | Faz 1 altyapısı eklendi | Tüm UI metinleri taşınmadı; yalnız pilot API dönüşümü var. | Mesaj anahtarı, TR/EN/AR paketleri ve gerçek RTL. | Faz 1/12 | P0/P1 | Mojibake testi geçer; AR yön bilgisi ve fallback çalışır. |
| Middleware, session, güvenlik | App shell, auth, API'ler | `/api/auth/*`, tüm korumalı API'ler | `Kullanici`, `AuditLog` | Mevcut fakat eksik | Firma sınırı yok; bazı public route sınırları yeniden incelenmeli. | Tenant-aware session, RBAC ve PII/secret maskeleme. | Faz 2/6 | P0 | Ham stack/secret istemciye ve loga çıkmaz. |
| Audit, olaylar, bildirimler | Ortak altyapı | Çeşitli API'ler | `AuditLog`, `BildirimLog` | Mevcut fakat eksik | Olay standardı ve audit kapsamı tüm route'larda eşit değil. | Domain event + audit + bildirim portları. | Faz 2/14 | P1 | Kritik işlerde kim/ne/neden görülebilir. |
| Scriptler, başlangıç, bakım | `scripts/*`, batch/start | Yedek/maintenance API'leri | Dosya sistemi, DB | Mevcut fakat eksik | Scriptlerin apply/dry-run/audit standardı değişken. | Dry-run varsayılan, açık apply ve geri dönüş planı. | Faz 15 | P1 | Bakım scripti güvenli rapor üretir. |
| Test, lint, build, dağıtım | `tests`, Vitest, ESLint, Next build | Yok | Yok | Mevcut fakat eksik | Mock ağırlıklı; 38 lint warning; PG integration yok. | Unit + route + integration + smoke + load prova. | Faz 3/16 | P0/P1 | Kritik finans/satış PG testleri geçer. |

## Placeholder ve yarım kalmış alanlar

Repo içinde `placeholderSayfaUret` veya `YakindaSayfasi` kullanan çok sayıda ekran bulundu. Bunlar “menüde/rotada var” sayılır ama iş akışı tamamlandı kabul edilmez.

Öne çıkan placeholder grupları:

- Lojistik: araçlar, şoförler, rota, GPS, program, onaylar, fotoğraflar, rapor.
- Personel: ana ekran, yeni personel, vardiya, sohbet, sesli, performans, ödemeler, aktivite, konum.
- WhatsApp/iletişim: ana ekran, otomatik, zamanlı, SMS, e-posta, entegrasyon, arama.
- Finans/kasa: POS, nakit, havale yakın sayfaları; banka mutabakat, gelir-gider ve kârlılık placeholder.
- Tahsilat: toplu, taksit, indirim, iadeler ve fiyat placeholder.
- Kesim/hayvan/rapor: birçok operasyon ve rapor alt ekranı placeholder veya yakın sayfa.
- Ayarlar: entegrasyon, tema, şube, SaaS, roller, profil gibi alanlar placeholder.

Bu alanların her biri sonraki fazlarda ya gerçek iş akışına bağlanmalı ya da ürün menüsünden kaldırılması/değiştirilmesi değerlendirilmelidir. Placeholder sayfalar “kodda var” diye tamamlandı sayılmaz; veri modeli, yetki, hata, test ve kabul kanıtı olmadan canlı ürün kapsamı değildir.

## Faz 1 hata/i18n dönüşüm kapsamı

Faz 1'de merkezi hata ve i18n altyapısı tüm program için ortak kullanılabilir şekilde kuruldu; ancak riskli toplu dönüşüm yapılmadı.

Pilot dönüşen route'lar:

- `/api/saha-satis`
- `/api/hisseler/ata`
- `/api/hisseler/toplu-ata`
- `/api/hisseler/[id]/iptal`
- `/api/vekaletler/[id]`

Kalan route grupları dönüşüm listesi:

- Auth ve ayarlar: `/api/auth/*`, `/api/ayarlar`.
- Dashboard ve sidebar: `/api/dashboard/*`, `/api/sidebar/bildirimler`.
- Hayvan/hisse operasyonları: `/api/hayvanlar`, `/api/hisseler/[id]/atama`, `transfer`, `paket`, `teslim`, `vekalet`, `bos-kurbanlar`, `atama-istatistik`.
- Müşteri ve cari görünüm: `/api/musteriler/*`.
- Tahsilat/kasa/dekont: `/api/tahsilat/*`, `/api/kasa/hareket`, `/api/dekont/dogrula`.
- Kesim/TV/push: `/api/kesim/*`, `/api/tv/*`.
- WhatsApp: `/api/whatsapp/*`.
- Vekâlet yükleme: `/api/vekaletler`.
- Yedekleme/restore: `/api/yedek/*`.
- Kullanıcı/rol: `/api/kullanicilar/*`.
- Rapor/export: `/api/raporlar/*`.

Bu liste, kalan route'ların hatalı olduğu anlamına gelmez; yalnızca merkezi hata kodu, mesaj anahtarı, requestId, secret-safe log ve i18n dönüşümünün henüz uygulanmadığını gösterir.

## Kodda olup yol haritasında zayıf temsil edilen alanlar

- Lojistik, GPS, araç/şoför ve adrese teslim operasyonu.
- Personel vardiya, performans, konum, sohbet ve sesli işlem ekranları.
- WhatsApp dışı SMS/e-posta iletişim ekranları.
- PWA push abonelikleri ve müşteri takip bildirimi.
- TV personel görev ekranları ve sorun bildirimi.
- Modül durumu/feature flag iskeleti.
- AI/ROI/özel rapor gibi ürünleşme ekranları.

Bu alanlar otomatik olarak doğru kabul edilmez. Her biri iş değeri, veri modeli, güvenlik ve hedef mimari açısından ayrıca doğrulanmalıdır.

## Yol haritasında olup kodda zayıf veya eksik olan alanlar

- Firma başına ayrı PostgreSQL operasyon veritabanı.
- Platform DB, Süper Admin, destek erişimi ve lisans toleransı.
- Sezon bazlı cari ve müşteri geçmişi.
- Tedarikçi, alış faturası, hayvan gerçek maliyeti.
- Finansal ledger, Decimal/kuruş para modeli, ters kayıt/iade/mahsup.
- Satış snapshot, pazarlık/indirim ayrımı, fiyat sürümü.
- Çoklu vekâlet veren, belge snapshot, QR belge versiyonu.
- Paket kg farkı, alt kg iadesi, üst kg ek ücret kuralı.
- Gerçek PostgreSQL integration testleri ve saha yük provası.
- Tam i18n çeviri setleri ve görsel RTL dönüşümü.

Bu eksiklerden platform/firma ayrımı, firma başına ayrı PostgreSQL ve izolasyon testleri artık “ileri SaaS” değil Faz 2B/2C çekirdek mimari kapsamıdır; self-service abonelik/faturalama ve gelişmiş çok şube ise sonraya bırakılmıştır.

## Profesyonel ürün için konuşulmamış ama gerekli görülen alanlar

- Firma onboarding ve sezon açılış sihirbazı.
- Cihaz/kullanıcı oturum yönetimi ve saha cihaz yetkilendirme.
- Envanter, sarf malzeme ve kesimhane ekipman takibi.
- Sağlık/veteriner belge ve kurban uygunluk kanıtları.
- Bildirim izinleri, KVKK/açık rıza ve veri saklama politikası.
- Operasyon prova modu, demo veri profilleri ve canlı veri kilidi.
- Observability: health check, metrik, performans ve hata izleme.
- Erişilebilirlik testleri ve mobil cihaz gerçek kullanım senaryoları.

Bu maddeler sonraki analizde kullanıcı kararı, sektör araştırması ve mimari değerlendirme ile gerçek gereksinime dönüştürülmelidir.

## Kabul ve dönüşüm ilkesi

- Bütün sistemi tek pakette dönüştürme.
- Ortak altyapı önce program genelinde tasarlanır.
- Kritik ve temsilî route/ekranlarda pilot uygulanır.
- Kalan alanlar bu envanterde dönüşüm listesine alınır.
- Bir alan incelenmeden “tamamlandı” olarak işaretlenmez.
- Placeholder, backend-only, model-only ve konuşulmamış ama gerekli alanlar ayrı statülerle takip edilir.
