# 11 — Gereksinim İzlenebilirlik Matrisi

```yaml
id: REQ-003
status: IMPLEMENTING
owner: Product-and-QA
source_role: requirement_traceability_matrix
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

Bu matris ana yol haritasındaki kesin kararları kalıcı takip nesnelerine dönüştürür. Birinci kaynak `TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md` belgesidir. Detaylar fazlarda genişletilecek; hiçbir madde sessizce kapsam dışına çıkarılamaz.

## 10 Ağustos 2026 uyum notu

- Faz 1 tamamlandı ve `origin/main` dalına gönderildi: `a6720378123f01fb4e19db3fd782a910f18c0acf`.
- Faz 2A workspace/sözleşme/sınır çıkış şartları karşılandı; `b536078` yalnız erken saha satış modüler pilotudur.
- Faz 2B kontrol düzlemi `74915b6` ile kodlandı ve CI kapsamındaki PostgreSQL/migration/test/build kapılarında doğrulandı; canlı/genel kabul bekliyor.
- Eski belgelerde çok firma, SaaS veya PostgreSQL’in ileri faza bırakıldığı yerlerde yerine geçen karar şudur: çok firma veri izolasyonu, Platform Süper Admin ve firma başına ayrı PostgreSQL Faz 2’nin zorunlu çekirdeğidir; self-service üyelik, otomatik abonelik/faturalama ve gelişmiş ticari SaaS özellikleri sonraya bırakılır.
- Sistem yalnız büyükbaş kurban içindir; küçükbaş/adak/akika kapsam dışıdır.
- Placeholder/yakında sayfaları tamamlanmış özellik sayılmaz.

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
| REQ-045 | Kurban Günü Güvenli Modu | UI | tercih | Sade ekran, büyük işlem alanları, hızlı arama, kritik işlem uyarıları ve minimum menü | UI | Hızlı ekran | Mobil | Rol | Görev bitir | Geri al | Var | Yok | 20 cihaz prova ve saha rol testi | Kısmi | Faz 16 |
| REQ-046 | Yedek/geri yükleme | Sistem | backup | Yedek test edilir | Yedek | Ayarlar | Yok | Yönetici | Yedek al | Restore | Zorunlu | Yok | Restore prova | Kısmi | Faz 15 |
| REQ-047 | Demo/test veri yönetimi | Veri | seed profili | Demo canlıdan ayrı | Seed | Admin | Yok | Teknik | Seed reset | Canlı engeli | Var | Yok | Test reset | Kısmi | Faz 9 |
| REQ-048 | Firma başına ayrı PostgreSQL | Tenant | tenant DB | Operasyon veri izolasyonu | Provision | Platform | Yok | Platform | DB oluştur | Hata rollback | Zorunlu | Var | İki firma izolasyon | Uygulandı — genel doğrulama bekliyor | Faz 2C |
| REQ-049 | Platform operasyon verisi tutmaz | Platform | Platform DB | PII/operasyon yok | Platform | Platform | Yok | Platform | Firma meta | Destek onayı | Zorunlu | Var | PII yok | Uygulandı — genel doğrulama bekliyor | Faz 2B |
| REQ-050 | Platform Süper Admin ayrı | Platform IAM | PlatformUser | Firma rolü değildir | Auth | Platform | Yok | Platform | Giriş | MFA | Zorunlu | Var | Ayrı cookie | Uygulandı — fiziksel passkey kabulü bekliyor | Faz 2B |
| REQ-051 | Lisans toleransı | Lisans | License | Bayram günü aniden durmaz | Lisans | Platform | Yerel uyarı | Platform | Check | Offline grace | Var | Yok | İnternetsiz kullanım | Yok | Faz 15 |
| REQ-052 | UTF-8 kaynak | i18n | Yok | Mojibake engel | Build/test | Tüm UI | Tüm UI | Teknik | Tarama | Hata fail | Yok | Yok | Mojibake testi | Kısmi | Faz 1 |
| REQ-053 | Hata kodu + mesaj anahtarı | i18n/API | error code | Cümleyle iş mantığı yok | API helper | Tüm UI | Tüm UI | Teknik | Kod döner | Fallback | Var | Yok | Dil değişir | Yok | Faz 1 |
| REQ-054 | Türkçe/Arapça/İngilizce altyapı | i18n | dil tercihi | DB durum kodu saklar | i18n | UI | UI/TV | Firma | Çeviri | Eksik fallback | Yok | Yok | Dil seçimi | Yok | Faz 12 |
| REQ-055 | RTL | UI/i18n | Yok | Arapça gerçek RTL | Layout | UI | UI | Firma | dir rtl | Karma belge | Yok | Yok | RTL ekran | Yok | Faz 12 |
| REQ-056 | Firma marka ayrımı | Branding | Ayar | Ürün/firma ayrılır | Branding | Shell/belge | PWA | Firma admin | Logo ayarla | Snapshot | Var | Yok | Firma değişimi | Kısmi | Faz 4 |
| REQ-057 | Modüler monolit | Mimari | Yok | Route ince kalır | Use-case | Yok | Yok | Teknik | Servis çağır | Hata map | Yok | Kısmi | Route testleri | Kısmi | Faz 2A |
| REQ-058 | Domain olayları | Mimari | Event | Yan etkiler olaylı | Event bus | Yok | Yok | Teknik | Event publish | Retry | Var | Yok | Audit/event uyum | Kısmi | Faz 2A |
| REQ-059 | Destek erişimi onaylı | Platform | SupportAccess | Sessiz erişim yok | Support | Platform | Firma onay | Platform+firma | Onay aç | İptal | Zorunlu | Var | Süreli erişim | Uygulandı — genel doğrulama bekliyor | Faz 2B |
| REQ-060 | Route yetkileri | Güvenlik | Permission | API her zaman kontrol eder | Middleware/use-case | Tüm | Tüm | Rol | İzinli | 403 | Zorunlu | Kısmi | Yetkisiz test | Kısmi | Faz 2A |
| REQ-061 | Dosya güvenliği | Belge | FileRef | Fiziksel yol sızmaz | Dosya API | Belge | Mobil | Vekâlet | Yetkili oku | 403/404 | Var | Var | Public erişim yok | P0 | Faz 7 |
| REQ-062 | PII loglara çıkmaz | Güvenlik | Log policy | Secret/DB URL yok | Logger | Yok | Yok | Teknik | Maskeli log | Hata | Zorunlu | Yok | Log inceleme | Kısmi | Faz 2A |
| REQ-063 | Migration dry-run | Veri | MigrationLog | Önce rapor | Script | Teknik | Yok | Teknik | Dry-run | Apply | Var | Kısmi | Rapor üretir | Kısmi | Faz 2C |
| REQ-064 | Yedek öncesi güncelleme | Sistem | BackupLog | Migration öncesi yedek | Update | Platform | Yok | Platform | Yedek al | Durdur | Zorunlu | Yok | Yedeksiz migrate yok | Yok | Faz 15 |
| REQ-065 | Placeholder kapsam denetimi | Ürün | FeatureFlag | Çekirdeğe karışmaz | Menü | Menü | Menü | Admin | Flag kapalı | Pilot | Yok | Yok | Çekirdek menü sade | Kısmi | Faz 2A |
| REQ-066 | Test PostgreSQL | Test | Test DB | Mock yetmez | Test infra | Yok | Yok | Teknik | CI test | Rollback | Yok | Var | PG integration | Uygulandı — genel doğrulama bekliyor | Faz 2C |
| REQ-067 | 5–20 cihaz yük | Test | Senaryo | Bayram LAN provası | Load script | Yok | Cihazlar | Teknik | Prova | Kesinti | Var | Yok | Yük raporu | Yok | Faz 16 |
| REQ-068 | Denetim ve olay inceleme | Audit | Audit/Event | Kim, neyi, neden | Timeline | Timeline | Özet | Yetkili | İncele | Export | Var | Kısmi | Kayıt izi | Kısmi | Faz 14 |

## Profesyonel panel ve teknoloji gereksinimleri

Bu bölüm kullanıcı tarafından sonradan onaylanan profesyonel panel, teknoloji, ürün ve operasyon gereksinimlerini izler. `REQ-001..REQ-068` ve `68/68` açıklaması değiştirilmez; aşağıdaki `PRO-*` kimlikleri ek ürün/işletim kapsamıdır. Mevcut support session, audit, feature flag, backup, notification, observability, placeholder denetimi, finansal ledger ve Kurban Günü prova kararları yeni modül gibi çoğaltılmaz; ilgili PRO/REQ kayıtlarında kabul kriteri olarak genişletilir. `PRO-030` ve sonrası bu turda planlandı durumunda eklenmiştir.

| ID | Kapsam | Panel | Kullanıcı | Yetki | Audit | Test | Kabul kriteri | Planlanan faz |
|---|---|---|---|---|---|---|---|---|
| PRO-001 | Operasyon Kontrol Merkezi ve istisna kuyruğu | Firma Admin / operasyon | Firma sahibi, operasyon sorumlusu, kesim/muhasebe lideri | `operasyon.istisna.goruntule`, `operasyon.istisna.yonet` | Kuyruk olayı, atama, çözüm, override gerekçesi | Use-case, route, Playwright masaüstü/mobil, yetki testi | Vekâlet, borç, kesim, tartım, teslim ve sistem istisnaları tek kuyrukta yetkiye göre görülür; çözüm auditlenir | Faz 8, Faz 10, Faz 11 |
| PRO-002 | Merkezi Onay Kutusu | Firma Admin / operasyon | Firma sahibi, ana muhasebe, operasyon yöneticisi | `onay.kutusu.goruntule`, `onay.talep.onayla`, `onay.talep.reddet` | Talep, karar, gerekçe, önce/sonra değer | Unit, route, E2E, concurrency | İndirim, ödemeli hisse iptali, teslimat geri alma, kasa kapatma, yetki değişikliği, toplu işlem, borçlu teslim, yedinci hisse ve sıra değişikliği yeniden doğrulama veya ikinci yetkili onayı olmadan tamamlanamaz | Faz 5, Faz 6, Faz 8 |
| PRO-003 | Excel/CSV Veri İçe Aktarma Merkezi | Firma Admin | Firma admini, veri operatörü | `veri.import.dryrun`, `veri.import.uygula` | Dosya özeti, satır hata raporu, uygulama sonucu | Parser unit, dry-run integration, rollback testi | Müşteri/hayvan/hisse/tedarikçi/fiyat importu önce dry-run raporu üretir; hatalı satır canlı veriyi bozmaz | Faz 2D, Faz 3, Faz 4 |
| PRO-004 | Veri Kalitesi ve mükerrer kayıt merkezi | Firma Admin | Firma admini, müşteri/hayvan sorumlusu | `veri.kalite.goruntule`, `veri.kalite.duzelt` | Mükerrer aday, birleştirme/düzeltme kararı | Unit, route, veri kalite fixture testi | Ortak telefon engellenmez; benzer müşteri, mükerrer küpe ve eksik alanlar ayrı aday olarak yönetilir | Faz 3, Faz 4 |
| PRO-005 | Evrensel müşteri/telefon/küpe/kurban/hisse/QR araması | Firma Admin / saha | Yetkili firma kullanıcıları | `arama.evrensel.goruntule`, alan bazlı veri izinleri | Arama olayı, hassas alan erişimi | Search unit, route, yetki, E2E | Kullanıcı yalnız yetkili olduğu sonuçları görür; PII ve finans bilgisi role göre maskelenir | Faz 3, Faz 4, Faz 5, Faz 7 |
| PRO-006 | Günlük görev ve vardiya devir teslimi | Firma Admin / mobil PWA | Saha, kesim, tartım, paketleme, teslimat liderleri | `gorev.devir.goruntule`, `gorev.devir.teslim` | Devir notu, açık görev, kabul eden kullanıcı | Workflow unit, mobil E2E | Gün sonu açık işler, riskler ve teslim alınan görevler kaybolmadan sonraki vardiyaya geçer | Faz 8, Faz 10 |
| PRO-007 | Bildirim gönderim ve başarısızlık geçmişi | Firma Admin | Firma admini, iletişim sorumlusu | `bildirim.gecmis.goruntule`, `bildirim.tekrar_dene` | Kanal, hedef, şablon, hata, tekrar deneme | Notification adapter mock, route, rate-limit | Gönderim başarısızlıkları nedeni ve tekrar deneme sonucu ile izlenir; PII loglanmaz | Faz 10, Faz 15 |
| PRO-008 | Cihaz, oturum ve giriş güvenliği yönetimi | Firma Admin | Firma admini, güvenlik yetkilisi | `cihaz.oturum.goruntule`, `cihaz.oturum.iptal` | Giriş, cihaz, oturum iptali, şüpheli olay | Security route, session, E2E | Firma admini kendi firmasındaki aktif cihaz/oturumları görür ve iptal eder; başka firma görünmez | Faz 10, Faz 12 |
| PRO-009 | KVKK, iletişim izni, veri dışa aktarma ve saklama süreci | Firma Admin | Firma sahibi, veri sorumlusu | `kvkk.talep.yonet`, `veri.export.uret` | Talep, onay, export, saklama/anonimleştirme adayı | Policy unit, export test, security review | Müşteri verisi yasal süreçle dışa aktarılır; iletişim izni ve saklama kararı auditlidir | Faz 3, Faz 12, Faz 15 |
| PRO-010 | Kullanıcı eğitim, yardım ve sentetik demo modu | Firma Admin / tüm kullanıcılar | Eğitim alan kullanıcı, firma admini | `demo.modu.ac`, `egitim.icerik.goruntule` | Demo başlatma, veri profili, eğitim tamamlanma | Fixture, E2E, canlı veri izolasyon testi | Sentetik demo gerçek veriyle karışmaz; eğitim akışı üretim kaydı oluşturmaz | Faz 9, Faz 11 |
| PRO-011 | WCAG 2.2 AA erişilebilirlik hedefi | Firma Admin / tüm UI | Tüm kullanıcılar | Tasarım sistemi ve ekran sahipliği | Erişilebilirlik istisnası ve kabul kanıtı | axe, keyboard, screen reader smoke, Playwright | Kritik firma paneli, mobil görev ve TV ekranları WCAG 2.2 AA kabul listesine göre doğrulanır | Faz 10, Faz 11, Faz 12 |
| PRO-012 | Firma kurulum/provisioning sihirbazı | Platform Süper Admin | Platform operatörü | `platform.firma.provision` | Kurulum adımı, hata, rollback, admin daveti | Provisioning integration, rollback, tenant isolation | Firma DB, admin, modül hakları ve başlangıç ayarları kanıtlı kurulur veya geri alınır | Faz 2B, Faz 2C |
| PRO-013 | Platform güvenlik merkezi ve MFA/passkey politikası | Platform Süper Admin | Platform güvenlik yöneticisi | `platform.guvenlik.yonet` | MFA/passkey değişikliği, oturum, risk olayı | Security unit, E2E, ASVS kontrolü | Platform yöneticileri için MFA/passkey politikası uygulanır; firma kullanıcı oturumu ile karışmaz | Faz 2B, Faz 12 |
| PRO-014 | Güvenli sürüm geçişi ve migration ön kontrolü | Platform Süper Admin | Platform operatörü | `platform.migration.onkontrol` | Ön kontrol sonucu, blokaj, onay, pilot/canary sonucu | Dry-run, backup, migration, health check, rollback prova | Yedek, tenant health, kapasite, geriye uyumlu migration, bakım modu, pilot/canary yayın ve rollback kontrolü geçmeden migration uygulanmaz | Faz 2C, Faz 15 |
| PRO-015 | Firma/modül bazlı acil durdurma anahtarı | Platform Süper Admin | Platform operatörü, güvenlik yöneticisi | `platform.kill_switch.yonet` | Kapatma/açma, gerekçe, etkilenen firma/modül | Feature flag, E2E, rollback | Riskli modül firma bazında kapatılır; çekirdek bayram operasyonu gereksiz yere durmaz | Faz 2B, Faz 15 |
| PRO-016 | Olay, kesinti ve bakım yönetimi | Platform Süper Admin | Platform operatörü, destek ekibi | `platform.incident.yonet` | Incident, bakım, etki, bildirim, kapanış | Workflow, notification, audit testleri | Etkilenen firmalar, bakım penceresi ve kapanış raporu izlenebilir olur | Faz 2B, Faz 15 |
| PRO-017 | Kapasite, depolama, kullanıcı ve cihaz görünümü | Platform Süper Admin | Platform operatörü | `platform.kapasite.goruntule` | Kapasite ölçümü ve uyarı | Metric, dashboard, threshold testi | Firma bazında DB/storage/kullanıcı/cihaz sınırları görünür ve alarm üretir | Faz 2B, Faz 2C |
| PRO-018 | Firma yapılandırma ve sürüm karşılaştırması | Platform Süper Admin | Platform operatörü, destek ekibi | `platform.firma.karsilastir` | Konfigürasyon farkı, export | Snapshot/diff unit, UI test | İki firma veya iki sürüm arasındaki modül, flag, migration ve ayar farkları görülebilir | Faz 2B, Faz 15 |
| PRO-019 | Firma veri dışa aktarma, kapatma ve devir süreci | Platform Süper Admin | Platform operatörü, firma sahibi | `platform.firma.kapat`, `platform.firma.export` | Talep, onay, export, kapanış/devir | Export, backup, security, restore | Firma kapatma/devir işlemi operasyon verisini göstermeden, kanıtlı export ve saklama planıyla yürür | Faz 2B, Faz 15 |
| PRO-020 | Destek talebini `SupportSession` ile ilişkilendirme | Platform Süper Admin / Firma Admin | Destek ekibi, firma onay yetkilisi | `support.session.ac`, `support.session.onayla` | Talep, onay, kapsam, süre, erişim izi | Security, audit, route, tenant isolation | Destek erişimi her zaman talep ve `SupportSession` kaydıyla ilişkilidir; sessiz erişim yoktur | Faz 2B |
| PRO-021 | Yedekten dönüş provası ve doğrulama kanıtı | Platform Süper Admin / Firma Admin | Platform operatörü, firma admini | `backup.restore.prova`, `backup.restore.onay` | Backup, restore denemesi, checksum, kabul | Restore integration, checksum, rollback | Her kritik firma için restore provası raporlanır; restore ve Kurban Günü Provası doğrulama kanıtı olmadan canlıya hazır sayılmaz | Faz 2C, Faz 15 |
| PRO-022 | OpenTelemetry trace, metric ve log korelasyonu | Teknik / Platform | Geliştirici, platform operatörü | `observability.goruntule` | TraceId, requestId, auditId bağlantısı | Unit, integration, log redaction | Hata, audit ve metrikler PII sızdırmadan aynı işlem zincirine bağlanabilir | Faz 2A, Faz 12 |
| PRO-023 | Playwright masaüstü, mobil, locale ve RTL E2E | Test / CI | Geliştirici, QA | CI çalışma yetkisi | Test sonucu ve artefakt | Playwright E2E | Kritik akışlar masaüstü, mobil, Türkçe/İngilizce/Arapça ve RTL varyantlarında koşar | Faz 10, Faz 12 |
| PRO-024 | axe tabanlı otomatik erişilebilirlik testleri | Test / CI | Geliştirici, QA | CI çalışma yetkisi | Test sonucu, istisna gerekçesi | axe + Playwright | WCAG ihlali kritik ekranlarda bloklayıcı kabul edilir veya gerekçeli istisna kaydı ister | Faz 10, Faz 12 |
| PRO-025 | WCAG 2.2 AA kabul kriterleri | UI / kalite | Tasarımcı, geliştirici, QA | Ekran sahipliği | Kabul listesi ve istisna | Manual + automated a11y | Yeni firma/platform panel ekranları WCAG 2.2 AA kontrol listesini karşılar | Faz 10, Faz 11, Faz 12 |
| PRO-026 | Platform yöneticileri için WebAuthn/passkey ve MFA | Platform IAM | Platform yöneticisi | `platform.auth.mfa.yonet` | Enrollment, reset, recovery, giriş | Security, browser E2E | Platform admin oturumları güçlü kimlik doğrulama olmadan açılamaz; recovery auditlidir | Faz 2B, Faz 12 |
| PRO-027 | OWASP ASVS Level 2 güvenlik hedefi | Güvenlik / kalite | Geliştirici, security reviewer | Güvenlik inceleme yetkisi | Kontrol listesi, bulgu, istisna | Security test, review, dependency scan | Kimlik, yetki, dosya, hata, tenant izolasyonu ve destek erişimi ASVS L2 hedefiyle değerlendirilir | Faz 2A, Faz 12 |
| PRO-028 | OpenFeature uyumlu feature flag sözleşmesi | Platform / modül registry | Geliştirici, platform operatörü | `feature_flag.yonet` | Flag değişikliği, hedef firma/modül, gerekçe | Contract, unit, rollout E2E | Feature flag kararı kod içine dağılmaz; firma/modül bazlı rollout ve acil durdurma aynı sözleşmeyi kullanır | Faz 2B, Faz 15 |
| PRO-029 | Yönetilen PostgreSQL WAL/PITR değerlendirmesi | Veri / operasyon | Platform operatörü | `platform.db.kurtarma.planla` | Değerlendirme, RPO/RTO, test sonucu | Backup/restore, PITR prova | Yönetilen PG kullanılan firmalarda WAL/PITR kabiliyeti ve restore hedefleri belgelenir | Faz 2C, Faz 15 |
| PRO-030 | Planlandı: Sezon durum makinesi | Firma Admin / operasyon | Firma sahibi, operasyon sorumlusu, muhasebe sorumlusu | `sezon.durum.goruntule`, `sezon.durum.gecir` | Durum geçişi, gerekçe, önce/sonra değer, kilitlenen işlem | State machine unit, route, yetki, E2E, geri dönüş testi | Sezon yalnız hazırlık → satış → kesim → teslimat → mutabakat → arşiv sırasındaki yetkili ve auditli geçişlerle ilerler; uygunsuz geri dönüş veya atlama engellenir | Faz 2D, Faz 3, Faz 12 |
| PRO-031 | Planlandı: Sezon öncesi uçtan uca prova/simülasyon ortamı | Firma Admin / test | Firma sahibi, operasyon liderleri, QA | `prova.ortami.ac`, `prova.senaryo.calistir` | Prova başlatma, senaryo sonucu, kullanılan sentetik veri, temizleme kanıtı | E2E, fixture, veri izolasyonu, reset testi | Gerçek firma, müşteri ve finans verisini etkilemeden satıştan teslimata uçtan uca Kurban Günü Provası çalışır; ilk canlı sezon öncesi kabul kapısıdır | Faz 9, Faz 12, Faz 16 |
| PRO-032 | Planlandı: Otomatik operasyonel tutarlılık denetimleri | Firma Admin / operasyon kontrol | Firma sahibi, operasyon ve muhasebe sorumluları | `denetim.tutarlilik.calistir`, `denetim.istisna.yonet` | Denetim çalışması, bulgu, atama, çözüm, kapatma | Rules engine unit, integration, E2E, rapor testi | 7 hisse, mükerrer satış, eksik vekâlet, ödeme/kasa farkı, teslim edilmeyen paket ve sezon kapanış bulguları otomatik üretilir ve istisna kuyruğuna düşer | Faz 5, Faz 6, Faz 8, Faz 10, Faz 12 |
| PRO-033 | Planlandı: Güvenli çevrimdışı işlem kuyruğu | Mobil PWA / operasyon | Saha kullanıcısı, operasyon sorumlusu | `offline.kuyruk.yaz`, `offline.kuyruk.esitle` | Kuyruk kaydı, idempotency anahtarı, senkronizasyon sonucu, çakışma kararı | Offline queue unit, conflict, idempotency, mobile E2E | Bağlantı kesintisinde izin verilen işlemler yerelde güvenli kuyruğa alınır; bağlantı sonrası idempotent senkronize edilir, kritik finans/satış/kesim/teslim işlemleri sessiz tamamlanmış sayılmaz | Faz 10, Faz 12, Faz 16 |
| PRO-034 | Planlandı: Acil durum / yalnızca okuma modu | Firma Admin / saha PWA / TV | Firma sahibi, operasyon sorumlusu, platform operatörü | `operasyon.readonly.ac`, `operasyon.readonly.kapat` | Mod değişikliği, gerekçe, etkilenen ekranlar, çıktı alma | Feature flag, E2E, yetki, çıktı smoke | Arıza veya bakım sırasında güvenli görüntüleme, listeleme, çıktı alma ve operasyon devamlılığı sağlanır; yeni riskli yazma işlemleri kontrollü biçimde durur | Faz 10, Faz 12, Faz 15 |
| PRO-035 | Planlandı: Donanım adaptör katmanı | Firma Admin / saha cihazları | Firma admini, teknik operatör, saha personeli | `donanim.adapter.yonet`, `donanim.okuma.kaydet` | Cihaz kaydı, okuma/yazdırma olayı, hata, yeniden deneme | Adapter contract, mock cihaz, E2E smoke | Terazi, barkod/QR okuyucu, etiket yazıcısı, termal yazıcı ve TV cihazları domain koduna doğrudan bağlanmadan adapter sözleşmeleriyle yönetilir | Faz 9, Faz 10, Faz 12 |
| PRO-036 | Planlandı: Güvenli entegrasyon merkezi | Firma Admin / Platform | Firma admini, platform operatörü, entegrasyon sorumlusu | `entegrasyon.yonet`, `webhook.dogrula`, `outbox.tekrar_dene` | Webhook, imza doğrulama, outbox olayı, retry, idempotency, hata | Contract, webhook signature, outbox retry, rate-limit, security test | SMS, e-posta, ödeme ve muhasebe entegrasyonları imzalı, idempotent, retry edilebilir ve PII/secret sızdırmadan izlenebilir olur | Faz 10, Faz 12, Faz 15 |

### PRO-030..PRO-036 geri dönüş yöntemleri

Bu turda eklenen gereksinimler planlandı durumundadır; uygulama kodu başlatılmamıştır. Uygulama fazlarında her biri küçük feature flag, config veya adapter sınırıyla geri alınabilir şekilde tasarlanır.

| ID | Geri dönüş yöntemi |
|---|---|
| PRO-030 | Sezon geçiş paketi commit revert edilir; veri etkili migration varsa önce yedek restore ve sezon durum mutabakatı yapılır. |
| PRO-031 | Prova/simülasyon ortamı feature flag ile kapatılır; sentetik fixture ve prova kayıtları canlı veriden ayrı temizlenir. |
| PRO-032 | Tutarlılık denetimi önce rapor-only moda alınır; hatalı kural commit revert veya kural flag kapatma ile geri alınır. |
| PRO-033 | Offline kuyruk yazma özelliği flag ile kapatılır; bekleyen kuyruklar idempotency anahtarıyla raporlanır ve kullanıcı onayı olmadan canlıya uygulanmaz. |
| PRO-034 | Read-only mod toggle'ı kapatılır; bakım/arıza modundan çıkış auditli yönetici işlemiyle yapılır. |
| PRO-035 | Donanım adapteri cihaz bazlı devre dışı bırakılır; manuel giriş/yazdırma fallback'i korunur. |
| PRO-036 | Entegrasyon adapteri kanal bazlı durdurulur; outbox yeniden deneme kuyruğu dondurulur ve manuel mutabakat raporu üretilir. |

### Faz 2A platform–tenant sınır checkpoint'i

`REQ-048..REQ-050`, `REQ-059`, `REQ-062`, `REQ-066`, `PRO-012`, `PRO-020`, `PRO-021`, `PRO-027` ve `PRO-029` için platform–tenant veri sınırı kararı `docs/adr/ADR-0002-PLATFORM-TENANT-VERI-SINIRI-VE-ERISIM-STANDARDI.md` belgesine bağlıdır. Yedek, restore doğrulama ve WAL/PITR kararı `docs/adr/ADR-0003-TENANT-YEDEK-WAL-PITR-VE-RESTORE-DOGRULAMA.md`; tenant izolasyon test planı `docs/testing/TST-001-MASTER-TEST-PLANI.md` içinde tutulur. Faz 2B kod kanıtı ayrı Platform Admin app/host/kimlik/session, TOTP+passkey+recovery, platform rollerinin API düzeyi yetkisi, Firma 360°, provisioning, incident/bakım/acil durdurma, yapılandırma farkı, onaylı export/kapatma/devir işi ve backup sonrası Firma Admin davetini kapsar. Faz 2C kanıtı request-local tenant runtime, aktif read-only/full-stop/modül politikası, gözlemlenebilir ayrı pool ve iki firma gerçek dump/geçici restore izolasyonunu kapsar. HTTPS fiziksel passkey kabulü, canlı WAL/PITR ayarı/ölçümü, production restore onayı ve DNS/TLS/deployment tamamlanmış sayılmaz.

Faz 2C kanıt eşlemesi: `PRO-020` için platform `0005` migration’ı ve SupportSession auditli request testi; `PRO-021`/`REQ-046` için `PostgresTenantBackupService`, tenant ops CLI, checksum ve geçici restore testi; `PRO-022` için sağlayıcıdan bağımsız pool event/metric portu uygulanmıştır. `PRO-029` için bağlayıcı değerlendirme kararı yazılmış, canlı sağlayıcı yapılandırması ve ölçülmüş RPO/RTO kanıtı sonraya bırakılmıştır.

## 68 iş akışı modeli

## Faz 1 UTF-8 / hata kodu / i18n checkpoint'i

- `REQ-052`: `scripts/check-utf8.mjs`, `pnpm check:utf8` ve `tests/utf8-check.test.ts` ile otomatik mojibake kalite kapısı eklendi.
- `REQ-053`: Merkezi hata katalogu ve API hata gövdesi eklendi; pilot route'lar geriye uyumlu `hata` alanıyla birlikte `kod`, `mesajAnahtari`, `parametreler`, `requestId` döndürür.
- `REQ-054`: `tr` ana mesaj sözlüğü, `en/ar` genişletilebilir iskelet, Türkçe fallback ve istemci mesaj çözme yardımcısı eklendi.
- `REQ-055`: `ar` için RTL yön yardımcısı eklendi. Tam RTL layout ve görsel regresyon testleri Faz 12 kapsamındadır.

Bu checkpoint altyapı ve pilot uygulamadır; tüm UI metinlerinin taşındığı veya tam çeviri paketlerinin tamamlandığı anlamına gelmez.

Programın tamamına yayılan ekran/API/model envanteri ve 68 iş akışı dışında kalan kod/ürün kapsamı `14-PROGRAM-TAM-KAPSAM-ENVANTERI.md` belgesinde ayrıca takip edilir.

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
| `REQ-001..REQ-003`, `REQ-015..REQ-023` | `share-sales` | `apps/tenant-web`, ileride `packages/contracts`, `packages/workflow-engine` | Saha satış modüler pilotunun ana kapsamı. |
| `REQ-004..REQ-008` | `customer-season-current` | `apps/tenant-web`, ileride `packages/database-tenant` | Müşteri kimliği, sezon ve cari ayrımı birlikte ele alınır. |
| `REQ-009..REQ-014` | `procurement-animal` | `apps/tenant-web`, ileride `packages/database-tenant` | Tedarikçi, alış faturası, hayvan kartı ve uygunluk. |
| `REQ-024..REQ-028`, `REQ-039..REQ-040` | `finance-ledger` | `packages/core`, `packages/database-tenant`, `packages/rules-engine` | Float dönüşümü ve ters kayıt mimarisi burada kanıtlanır. |
| `REQ-029..REQ-034`, `REQ-061` | `proxy-documents` | `packages/documents`, `packages/file-storage` | Vekâlet, belge snapshot, QR ve dosya güvenliği. |
| `REQ-035..REQ-038`, `REQ-041..REQ-043` | `slaughter-packaging-delivery` | `packages/workflow-engine`, `apps/tenant-web`, `apps/tenant-mobile` | Kesim, tartım, paketleme ve teslim durum makineleri. |
| `REQ-044..REQ-045` | `mobile-pwa-task-ui` | `packages/ui`, `packages/i18n`, `apps/tenant-mobile` | Mobil PWA yüksek stres görev ekranları. |
| `REQ-046`, `REQ-051`, `REQ-063..REQ-064`, `REQ-067` | `operations-continuity` | `apps/worker`, `packages/observability`, `infrastructure`, `scripts` | Yedek, lisans toleransı, migration ve saha provası. |
| `REQ-047`, `REQ-066` | `test-data-quality` | `packages/testing`, `tests`, `scripts` | Demo/test veri yönetimi ve gerçek PostgreSQL test harness. |
| `REQ-048..REQ-050`, `REQ-059` | `platform-tenant-admin` | `apps/platform-admin`, `packages/platform`, `packages/database-platform`, `packages/identity-platform` | Platform, Süper Admin, destek erişimi ve firma meta sınırı. |
| `REQ-052..REQ-055` | `i18n-encoding-rtl` | `packages/i18n`, `packages/ui`, `packages/core` | İlk uygulama fazının çekirdeği. |
| `REQ-056`, `REQ-065` | `branding-module-registry` | `packages/module-registry`, `packages/feature-flags`, `packages/ui` | Ürün/firma marka ayrımı ve üretim menü sadeleştirme. |
| `REQ-057..REQ-058`, `REQ-060`, `REQ-062`, `REQ-068` | `architecture-governance` | `packages/core`, `packages/event-bus`, `packages/observability`, `packages/contracts` | Modüler monolit, olay, yetki, log ve denetim omurgası. |

## Eksiksizlik kontrolü

- 68 iş akışı temsil ediliyor: `REQ-001` ile `REQ-068` arasında benzersiz kimlikler var.
- Bu `68/68` ifadesi yalnızca kullanıcı görüşmelerinden ve ana yol haritasından çıkarılan iş gereksinimlerinin belgede temsil edildiğini gösterir; programın tüm kaynak kodunun, tüm ekranlarının, tüm API'lerinin veya profesyonel ürün kapsamının tamamlandığı anlamına gelmez.
- Her gereksinimde modül, veri modeli, domain kuralı, API/use-case, masaüstü, mobil, yetki, normal akış, istisna, audit, otomatik test, kullanıcı kabul testi, mevcut durum ve planlanan faz alanı bulunuyor.
- Çoklu firma, Süper Admin, Firma Admin, UTF-8, Türkçe/Arapça dil paketi, RTL, lisans, yerel/bulut ve yedekleme kararları matrise dahil edildi.
- Hedef dizin/modül karşılığı bu ek bölümde gösterildi; detaylı dizin standardı `13-HEDEF-DIZIN-ISKELETI-VE-MODUL-STANDARDI.md` belgesindedir.
- Birden fazla kritik iş kuralı tek belirsiz satırda eritilmedi; büyük zincirler ayrı REQ aralıklarıyla takip ediliyor.

## İzlenebilirlik kapsamları

Bundan sonra üç kapsam ayrı takip edilir:

1. Kullanıcı görüşmelerinden çıkan 68 iş akışı: Bu dosyadaki `REQ-001..REQ-068` satırlarıdır.
2. Kaynak kodundan keşfedilen sistem alanları: Sayfa, API, bileşen, modül, Prisma modeli, script, test, PWA ve altyapı envanteri `14-PROGRAM-TAM-KAPSAM-ENVANTERI.md` belgesindedir.
3. Kullanıcı tarafından onaylanan profesyonel ürün ve işletim gereksinimleri: Bu dosyadaki `PRO-001..PRO-036` satırlarıdır. Bunlar `REQ-001..REQ-068` sayımını değiştirmez ve ilgili fazlarda ayrı kabul kanıtı ister.

Programın tamamı analiz edilmeden veya test edilmeden “tüm sistem tamamlandı” ifadesi kullanılmaz.
