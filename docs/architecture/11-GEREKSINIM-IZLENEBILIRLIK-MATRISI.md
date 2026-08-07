# 11 — Gereksinim İzlenebilirlik Matrisi

Bu matris ana yol haritasındaki kesin kararları kalıcı takip nesnelerine dönüştürür. Detaylar fazlarda genişletilecek; hiçbir madde sessizce kapsam dışına çıkarılamaz.

## Gereksinim matrisi

| ID | Kaynak karar | Modül | Veri modeli | Domain kuralı | API/use-case | Masaüstü | Mobil | Yetki | Normal akış | İptal/istisna | Audit | Otomatik test | Kullanıcı kabul testi | Mevcut durum | Planlanan faz |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| REQ-001 | Büyükbaş ve yedi hisse | Hayvan/Hisse | `Kurban`, `Hisse` | Büyükbaş varsayılan 7 hisse | Hayvan oluşturma | Hayvan kartı | Saha hisse | Hayvan yönetimi | 7 hisse üret | Yedinci hisse istisnası | Var | Kısmi | 7 hisse görünür | Kısmen var | Faz 5 |
| REQ-002 | Bir hisseye bir müşteri | Hisse | `Hisse.musteriId` | Dolu hisse tekrar satılamaz | `saha-satis`, `hisseler/ata` | Hisse atama | Saha satış | `hisseler.ata` | Boş hisse atanır | 409 dolu | Var | Var | Çifte tıklama engeli | P0 tamam | Faz 5 |
| REQ-003 | Müşterinin çoklu hissesi | Müşteri/Hisse | `Musteri`→`Hisse[]` | Müşteri birden fazla hisse alabilir | Saha satış | Müşteri detay | Saha satış | Satış | Çoklu seçim | Limit/uygunluk | Var | Kısmi | Aynı müşteri çok hisse | Var | Faz 5 |
| REQ-004 | Her gerçek hissedar ayrı müşteri kartı | Müşteri | `Musteri` | Ortak telefon olabilir, kart ayrı | Müşteri oluştur | Müşteri | Mobil müşteri | Müşteri oluştur | Yeni kart | Mükerrer uyarı | Var | Yok | Aynı telefonla iki kart | Kısmi | Faz 3 |
| REQ-005 | Ailede ortak telefon | Müşteri | `telefon` index | Telefon unique değildir | Müşteri oluştur/ara | Uyarı | Uyarı | Müşteri | Kayda izin | Güçlü uyarı | Var | Yok | Ortak telefon kabul | Var | Faz 3 |
| REQ-006 | Mükerrer müşteri uyarısı | Müşteri | arama read-model | Engelleme değil uyarı | Müşteri oluştur | Uyarı paneli | Uyarı | Müşteri | Benzerleri göster | Farklı kişi seç | Var | Yok | Aynı isim uyarısı | Kısmi | Faz 3 |
| REQ-007 | Sezonlar arası müşteri geçmişi | Sezon/Müşteri | `Sezon`, ilişki | Müşteri kimliği kalır, cari sezonlanır | Sezon geçişi | Geçmiş | Özet | Yönetici | Geçmiş görüntü | Arşiv | Var | Yok | Önceki sezon görünür | Yok | Faz 8 |
| REQ-008 | Sezon bazlı cari | Finans | `Cari`, `Sezon` | Borç/alacak sezon bazlı | Cari servis | Cari | Tahsilat | Finans | Sezon bakiyesi | Kapanış | Var | Yok | Sezon mutabakat | Yok | Faz 10 |
| REQ-009 | Tedarikçi ve alış faturası | Tedarik | `Tedarikci`, `AlisFaturasi` | Hayvan maliyeti belgeli | Alış kaydı | Tedarik | Yok | Tedarik | Fatura gir | İptal/ters | Var | Yok | Alış raporu | Yok | Faz 4 |
| REQ-010 | Hayvan başı gerçek alış bedeli | Hayvan/Finans | Hayvan maliyet | Karlılık gerçek maliyetle | Hayvan maliyet | Hayvan kartı | Yok | Finans | Maliyet bağla | Düzeltme | Var | Yok | Karlılık hesap | Kısmi/yok | Faz 4 |
| REQ-011 | Küpe ve kurban no ayrımı | Hayvan | `kupeNo`, `kesimSirasi` | Kimlik ve operasyon no ayrıdır | Hayvan servis | Hayvan kartı | Kesim | Hayvan | Ayrı göster | No değişimi | Var | Yok | İki no görünür | Var | Faz 4 |
| REQ-012 | Kurban no ve değişebilir operasyon sırası | Kesim | `kesimSirasi`, `operasyonSira` | Operasyon sırası değişebilir | TV sıra | TV kontrol | Mobil kesim | Kesim sorumlusu | Sıra değiştir | Acil durum | Var | Kısmi | Sıra değişimi | Kısmi | Faz 11 |
| REQ-013 | Tartım geçmişi | Tartım | Tartım kayıtları | Her tartım geçmişe yazılır | Tartım servis | Tartım | Tartım keypad | Tartım | Tartım ekle | Düzeltme | Var | Yok | Geçmiş görünür | Yok | Faz 11 |
| REQ-014 | Hayvan uygunluğu/pasifleştirme | Hayvan | uygunluk durumu | Uygunsuz hayvan satılmaz | Uygunluk use-case | Hayvan kartı | Saha uyarı | Yönetici | Pasifleştir | Transfer | Var | Yok | Uygunsuz satılamaz | Yok | Faz 4 |
| REQ-015 | Bağımsız hisse kartı | Hisse | Hisse kartı | Hisse satıştan bağımsız varlık | Hisse servis | Hisse kartı | Saha | Hisse | Kart aç | Transfer/iptal | Var | Kısmi | Kart geçmişi | Kısmi | Faz 5 |
| REQ-016 | Kg vaat aralığı | Hisse/Satış | vaat aralığı | Satışta kg aralığı snapshot | Satış | Satış ekranı | Saha satış | Satış | Vaat seç | Alt kg iade | Var | Yok | Belgede görünür | Yok | Faz 5 |
| REQ-017 | Fiyat sürümü ve satış snapshot | Satış | fiyat snapshot | Sonradan fiyat değişse satış değişmez | Satış | Satış | Saha | Satış | Snapshot | İptal | Var | Yok | Eski satış fiyatı korunur | Kısmi | Faz 5 |
| REQ-018 | Pazarlık/indirim/net fiyat | Satış/Finans | indirim | Net fiyat borç olur | Satış | Satış formu | Saha | Satış override | İndirim uygula | Limit/onay | Var | Yok | Net borç oluşur | Yok | Faz 5 |
| REQ-019 | Kapora ve son tarih | Satış/Tahsilat | kapora, vade | Kapora takip edilir | Saha satış | Satış | Mobil | Tahsilat | Kapora al | Süre aşımı | Var | Kısmi | Kapora raporu | Kısmi | Faz 6 |
| REQ-020 | Otomatik iptal | Satış | durum, vade | Süre aşınca aday iptal | Job/use-case | Liste | Uyarı | Yönetici | Aday üret | Manuel onay | Var | Yok | Süresi geçen aday | Yok | Faz 5 |
| REQ-021 | Yönetici iptali ve kesintisiz iade | Satış/Finans | ters kayıt | Kesinti yok, kayıt silinmez | İptal use-case | İptal ekranı | Yok | Yönetici | Ters kayıt | İade | Zorunlu | Kısmi | Borç/kasa kapanır | Kısmi | Faz 10 |
| REQ-022 | Hisse transferi | Hisse | transfer kaydı | Eski/yeni müşteri izlenir | Transfer | Hisse transfer | Mobil onay | Yönetici | Transfer et | Vekâlet/borç etkisi | Zorunlu | Yok | Geçmiş görünür | Kısmi | Faz 5 |
| REQ-023 | Yedinci hisse istisnası | Hisse | istisna flag | Normal kurala aykırıysa onay | Satış | Satış | Saha | Override | Onayla | Reddet | Zorunlu | Yok | Yetkisiz yapamaz | Yok | Faz 5 |
| REQ-024 | Karma ödeme | Tahsilat | `Odeme` | Nakit/havale/kart birlikte | Tahsilat | Tahsilat | Mobil | Tahsilat | Karma al | Hata rollback | Var | Var | Kasa ayrılır | Var | Faz 6 |
| REQ-025 | Ödeyen ve hissedar ayrımı | Tahsilat | payer | Ödeyen farklı olabilir | Tahsilat | Form | Mobil | Tahsilat | Ödeyen seç | Belirsiz ödeme | Var | Yok | Makbuzda görünür | Yok | Faz 6 |
| REQ-026 | Tahsilatın çoklu borca dağıtılması | Tahsilat | dağıtım | Çoklu hisseye dağıtım kayıtlı | Dagitim | Tahsilat | Mobil | Tahsilat | Dağıt | Artan tutar | Var | Var | Dağılım raporu | Kısmi | Faz 6 |
| REQ-027 | POS taksit/vade farkı | Finans | POS hareket | Vade farkı ayrı kalem | POS use-case | POS | Yok | Finans | POS al | İptal | Var | Yok | POS mutabakat | Yok | Faz 6 |
| REQ-028 | Cari/kasa/banka/POS mutabakat | Finans | Ledger | Alt defterler mutabık | Rapor | Rapor | Özet | Finans | Mutabakat | Fark inceleme | Var | Yok | Gün sonu tutar | Kısmi | Faz 10 |
| REQ-029 | Hisse bazlı vekâlet | Vekâlet | `Vekalet.hisseId` | Her hisse ayrı kontrol | Vekâlet API | Vekâlet | Mobil | Vekâlet | Yükle | Sil/yenile | Var | Var | Hisse bazlı belge | P0 kısmi | Faz 7 |
| REQ-030 | Çoklu vekâlet veren | Vekâlet | verenler | Bir hisse için çoklu veren | Vekâlet | Form | Mobil | Vekâlet | Veren ekle | Eksik | Var | Yok | Çoklu listelenir | Yok | Faz 7 |
| REQ-031 | WhatsApp/telefon/sözlü vekâlet | Vekâlet | kanal | Kanal kayıtlı | Vekâlet | Form | Mobil | Vekâlet | Kanal seç | Kanıt eksik | Var | Yok | Kanal görünür | Yok | Faz 7 |
| REQ-032 | A4 QR kesim ve teslim belgesi | Belge | belge snapshot | QR doğrulanabilir | Belge | Yazdır | Mobil QR | Belge | Üret | Yenile | Var | Yok | QR doğrula | Kısmi | Faz 7 |
| REQ-033 | Kayıp belge yenileme | Belge | belge versiyon | Yeni belge eskiyi auditler | Belge | Yenile | Yok | Yönetici | Yenile | Eski iptal | Zorunlu | Yok | Versiyon görünür | Yok | Faz 7 |
| REQ-034 | Borçlu belge override | Teslim/Belge | override | Borçlu teslim özel onay | Teslim | Teslim | QR | Yönetici | Onayla | Reddet | Zorunlu | Yok | Neden zorunlu | Yok | Faz 12 |
| REQ-035 | Kesim sırası ve acil değişiklik | Kesim | operasyon sıra | Acil sıra değişimi auditli | Kesim | TV kontrol | Kesim mobil | Kesim sorumlusu | Sıra değiş | Çakışma | Zorunlu | Kısmi | TV güncellenir | Kısmi | Faz 11 |
| REQ-036 | TV ve mobil takip | TV | read-model | PII minimize | TV API | TV | Müşteri PWA | Public/kısıtlı | Takip | Rate limit | Var | Kısmi | Müşteri dana bulur | Kısmi | Faz 13 |
| REQ-037 | Gerçek paket tartımı | Paket | paket tartım | Hisse gerçek kg alır | Tartım | Paket | Mobil | Paketleme | Tart | Düzeltme | Var | Yok | Paket kg görünür | Kısmi | Faz 11 |
| REQ-038 | Et parçalarının eşit dağıtımı | Paket | dağıtım | Parça türleri adil | Paket | Paket ekranı | Mobil | Paketleme | Dağıt | Eksik parça | Var | Yok | Paket listesi | Yok | Faz 11 |
| REQ-039 | Alt kg iadesi | Finans/Paket | kg fark | Alt kg iade üretir | Ledger | Rapor | Bildirim | Finans | İade hesapla | Yönetici onay | Var | Yok | İade kaydı | Yok | Faz 10 |
| REQ-040 | Üst kg ek ücret olmaması | Finans/Paket | kg fark | Üst kg ekstra borç doğurmaz | Ledger | Rapor | Yok | Finans | Sıfır ek ücret | Bilgi | Var | Yok | Ek borç yok | Yok | Faz 10 |
| REQ-041 | Çiftlik/adres teslim | Teslim | teslim tipi | Teslim noktası kayıtlı | Teslim | Teslim | Mobil | Teslim | Tip seç | Adres eksik | Var | Yok | Tip raporu | Kısmi | Faz 12 |
| REQ-042 | Tek seferlik teslim | Teslim | teslim kapatma | Tek QR kapanır | Teslim | Teslim | QR | Teslimat | Kapat | Tekrar deneme | Var | Yok | İkinci teslim engel | Kısmi | Faz 12 |
| REQ-043 | Yedi teslim olmadan hayvan kapanmaz | Teslim/Hayvan | kapanış | Tüm hisseler teslim olmalı | Kapanış | Hayvan | Mobil | Yönetici | Kapat | Eksik hisse | Var | Yok | Eksikte kapanmaz | Yok | Faz 12 |
| REQ-044 | Mobil PWA | PWA | cihaz/session | Offline temel akış | PWA | Yok | Mobil | Rol | Kurulum | Sync | Var | Yok | Telefonda çalışır | Kısmi | Faz 13 |
| REQ-045 | Bayram günü yüksek stres modu | UI | tercih | Az tık, büyük aksiyon | UI | Hızlı ekran | Mobil | Rol | Görev bitir | Geri al | Var | Yok | 20 cihaz prova | Kısmi | Faz 16 |
| REQ-046 | Yedek/geri yükleme | Sistem | backup | Yedek test edilir | Yedek | Ayarlar | Yok | Yönetici | Yedek al | Restore | Zorunlu | Yok | Restore prova | Kısmi | Faz 15 |
| REQ-047 | Demo/test veri yönetimi | Veri | seed profili | Demo canlıdan ayrı | Seed | Admin | Yok | Teknik | Seed reset | Canlı engeli | Var | Yok | Test reset | Kısmi | Faz 9 |
| REQ-048 | Firma başına ayrı PostgreSQL | Tenant | tenant DB | Operasyon veri izolasyonu | Provision | Platform | Yok | Platform | DB oluştur | Hata rollback | Zorunlu | Yok | İki firma izolasyon | Yok | Faz 5 |
| REQ-049 | Platform operasyon verisi tutmaz | Platform | Platform DB | PII/operasyon yok | Platform | Platform | Yok | Platform | Firma meta | Destek onayı | Zorunlu | Yok | PII yok | Yok | Faz 6 |
| REQ-050 | Platform Süper Admin ayrı | Platform IAM | PlatformUser | Firma rolü değildir | Auth | Platform | Yok | Platform | Giriş | MFA | Zorunlu | Yok | Ayrı cookie | Yok | Faz 6 |
| REQ-051 | Lisans toleransı | Lisans | License | Bayram günü aniden durmaz | Lisans | Platform | Yerel uyarı | Platform | Check | Offline grace | Var | Yok | İnternetsiz kullanım | Yok | Faz 15 |
| REQ-052 | UTF-8 kaynak | i18n | Yok | Mojibake engel | Build/test | Tüm UI | Tüm UI | Teknik | Tarama | Hata fail | Yok | Yok | Mojibake testi | Kısmi | Faz 1 |
| REQ-053 | Hata kodu + mesaj anahtarı | i18n/API | error code | Cümleyle iş mantığı yok | API helper | Tüm UI | Tüm UI | Teknik | Kod döner | Fallback | Var | Yok | Dil değişir | Yok | Faz 1 |
| REQ-054 | Türkçe/Arapça/İngilizce altyapı | i18n | dil tercihi | DB durum kodu saklar | i18n | UI | UI/TV | Firma | Çeviri | Eksik fallback | Yok | Yok | Dil seçimi | Yok | Faz 12 |
| REQ-055 | RTL | UI/i18n | Yok | Arapça gerçek RTL | Layout | UI | UI | Firma | dir rtl | Karma belge | Yok | Yok | RTL ekran | Yok | Faz 12 |
| REQ-056 | Firma marka ayrımı | Branding | Ayar | Ürün/firma ayrılır | Branding | Shell/belge | PWA | Firma admin | Logo ayarla | Snapshot | Var | Yok | Firma değişimi | Kısmi | Faz 4 |
| REQ-057 | Modüler monolit | Mimari | Yok | Route ince kalır | Use-case | Yok | Yok | Teknik | Servis çağır | Hata map | Yok | Kısmi | Route testleri | Kısmi | Faz 2 |
| REQ-058 | Domain olayları | Mimari | Event | Yan etkiler olaylı | Event bus | Yok | Yok | Teknik | Event publish | Retry | Var | Yok | Audit/event uyum | Kısmi | Faz 2 |
| REQ-059 | Destek erişimi onaylı | Platform | SupportAccess | Sessiz erişim yok | Support | Platform | Firma onay | Platform+firma | Onay aç | İptal | Zorunlu | Yok | Süreli erişim | Yok | Faz 6 |
| REQ-060 | Route yetkileri | Güvenlik | Permission | API her zaman kontrol eder | Middleware/use-case | Tüm | Tüm | Rol | İzinli | 403 | Zorunlu | Kısmi | Yetkisiz test | Kısmi | Faz 2 |
| REQ-061 | Dosya güvenliği | Belge | FileRef | Fiziksel yol sızmaz | Dosya API | Belge | Mobil | Vekâlet | Yetkili oku | 403/404 | Var | Var | Public erişim yok | P0 | Faz 7 |
| REQ-062 | PII loglara çıkmaz | Güvenlik | Log policy | Secret/DB URL yok | Logger | Yok | Yok | Teknik | Maskeli log | Hata | Zorunlu | Yok | Log inceleme | Kısmi | Faz 2 |
| REQ-063 | Migration dry-run | Veri | MigrationLog | Önce rapor | Script | Teknik | Yok | Teknik | Dry-run | Apply | Var | Kısmi | Rapor üretir | Kısmi | Faz 5 |
| REQ-064 | Yedek öncesi güncelleme | Sistem | BackupLog | Migration öncesi yedek | Update | Platform | Yok | Platform | Yedek al | Durdur | Zorunlu | Yok | Yedeksiz migrate yok | Yok | Faz 15 |
| REQ-065 | Placeholder kapsam denetimi | Ürün | FeatureFlag | Çekirdeğe karışmaz | Menü | Menü | Menü | Admin | Flag kapalı | Pilot | Yok | Yok | Çekirdek menü sade | Kısmi | Faz 3 |
| REQ-066 | Test PostgreSQL | Test | Test DB | Mock yetmez | Test infra | Yok | Yok | Teknik | CI test | Rollback | Yok | Yok | PG integration | Yok | Faz 3 |
| REQ-067 | 5–20 cihaz yük | Test | Senaryo | Bayram LAN provası | Load script | Yok | Cihazlar | Teknik | Prova | Kesinti | Var | Yok | Yük raporu | Yok | Faz 16 |
| REQ-068 | Denetim ve olay inceleme | Audit | Audit/Event | Kim, neyi, neden | Timeline | Timeline | Özet | Yetkili | İncele | Export | Var | Kısmi | Kayıt izi | Kısmi | Faz 14 |

## 68 iş akışı modeli

Ana yol haritasındaki 68 akış, yukarıdaki REQ kimlikleriyle takip edilecektir. Her akış için ayrıntılı state machine dokümanı uygulama fazında açılacaktır. Zorunlu alanlar:

- başlangıç
- durumlar
- geçişler
- önkoşullar
- yetkili rol
- istisnalar
- ters kayıt/iptal
- sonuç olayları
- diğer zincirlere etkisi
- mobil/masaüstü ekran
- testler

## Zincirler arası bağlantı kabulü

- Müşteri → hisse → satış → borç: `REQ-001..REQ-008`, `REQ-015..REQ-021`.
- Satış → kapora → tahsilat → kasa: `REQ-017..REQ-028`.
- Satış iptali → ters kayıt → iade → hisse açma: `REQ-021`, `REQ-028`.
- Hayvan uygunsuzluğu → hisse pasifleştirme/transfer: `REQ-014`, `REQ-022`.
- Vekâlet tamlığı → kesim izni: `REQ-029..REQ-034`.
- Kesim → gerçek tartım → paket: `REQ-035..REQ-038`.
- Paket → kg farkı → iade: `REQ-039..REQ-040`.
- Belge → teslim → QR kapatma: `REQ-032..REQ-034`, `REQ-041..REQ-043`.
- Yedi hisse teslimi → hayvan kapanışı: `REQ-043`.

## Hedef dizin ve modül karşılığı

Ana tablo 68 benzersiz gereksinimi korur. Hedef fiziksel dizinler şimdi oluşturulmayacak; aşağıdaki eşleştirme, taşıma zamanı geldiğinde hangi gereksinimlerin hangi modül/paket sınırına bağlanacağını gösterir.

| Gereksinim aralığı | Hedef iş modülü | Hedef paket/uygulama | Not |
|---|---|---|---|
| `REQ-001..REQ-003`, `REQ-015..REQ-023` | `share-sales` | `apps/tenant`, ileride `packages/contracts`, `packages/workflow-engine` | Saha satış modüler pilotunun ana kapsamı. |
| `REQ-004..REQ-008` | `customer-season-current` | `apps/tenant`, ileride `packages/database-tenant` | Müşteri kimliği, sezon ve cari ayrımı birlikte ele alınır. |
| `REQ-009..REQ-014` | `procurement-animal` | `apps/tenant`, ileride `packages/database-tenant` | Tedarikçi, alış faturası, hayvan kartı ve uygunluk. |
| `REQ-024..REQ-028`, `REQ-039..REQ-040` | `finance-ledger` | `packages/core`, `packages/database-tenant`, `packages/rules-engine` | Float dönüşümü ve ters kayıt mimarisi burada kanıtlanır. |
| `REQ-029..REQ-034`, `REQ-061` | `proxy-documents` | `packages/documents`, `packages/file-storage` | Vekâlet, belge snapshot, QR ve dosya güvenliği. |
| `REQ-035..REQ-038`, `REQ-041..REQ-043` | `slaughter-packaging-delivery` | `packages/workflow-engine`, `apps/tenant` | Kesim, tartım, paketleme ve teslim durum makineleri. |
| `REQ-044..REQ-045` | `mobile-pwa-task-ui` | `packages/ui`, `packages/i18n`, `apps/tenant` | Mobil PWA yüksek stres görev ekranları. |
| `REQ-046`, `REQ-051`, `REQ-063..REQ-064`, `REQ-067` | `operations-continuity` | `apps/worker`, `packages/observability`, `infrastructure`, `scripts` | Yedek, lisans toleransı, migration ve saha provası. |
| `REQ-047`, `REQ-066` | `test-data-quality` | `packages/testing`, `tests`, `scripts` | Demo/test veri yönetimi ve gerçek PostgreSQL test harness. |
| `REQ-048..REQ-050`, `REQ-059` | `platform-tenant-admin` | `apps/platform`, `packages/platform`, `packages/database-platform`, `packages/identity-platform` | Platform, Süper Admin, destek erişimi ve firma meta sınırı. |
| `REQ-052..REQ-055` | `i18n-encoding-rtl` | `packages/i18n`, `packages/ui`, `packages/core` | İlk uygulama fazının çekirdeği. |
| `REQ-056`, `REQ-065` | `branding-module-registry` | `packages/module-registry`, `packages/feature-flags`, `packages/ui` | Ürün/firma marka ayrımı ve üretim menü sadeleştirme. |
| `REQ-057..REQ-058`, `REQ-060`, `REQ-062`, `REQ-068` | `architecture-governance` | `packages/core`, `packages/event-bus`, `packages/observability`, `packages/contracts` | Modüler monolit, olay, yetki, log ve denetim omurgası. |

## Eksiksizlik kontrolü

- 68 iş akışı temsil ediliyor: `REQ-001` ile `REQ-068` arasında benzersiz kimlikler var.
- Her gereksinimde modül, veri modeli, domain kuralı, API/use-case, masaüstü, mobil, yetki, normal akış, istisna, audit, otomatik test, kullanıcı kabul testi, mevcut durum ve planlanan faz alanı bulunuyor.
- Çoklu firma, Süper Admin, Firma Admin, UTF-8, Türkçe/Arapça dil paketi, RTL, lisans, yerel/bulut ve yedekleme kararları matrise dahil edildi.
- Hedef dizin/modül karşılığı bu ek bölümde gösterildi; detaylı dizin standardı `13-HEDEF-DIZIN-ISKELETI-VE-MODUL-STANDARDI.md` belgesindedir.
- Birden fazla kritik iş kuralı tek belirsiz satırda eritilmedi; büyük zincirler ayrı REQ aralıklarıyla takip ediliyor.
