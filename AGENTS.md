# AGENTS.md — TilbeCore – Kurban Takip Codex Kuralları

Bu dosya kök çalışma talimatıdır. Codex bu projede çalışırken önce bu kuralları, sonra bağlayıcı ana mimari belgeyi ve göreve en yakın mimari/gereksinim belgelerini uygular. Ayrıntılı mimari kararları burada tekrar etme; kararın kaynağı olarak ilgili belgeye yönel.

## 1. Ürün kimliği

- Ürün adı `TilbeCore – Kurban Takip` olarak kabul edilir.
- Bu yazılım tek firmalık geçici bir uygulama olarak kalmayacak; birden fazla kurban işletmesine satılabilecek profesyonel bir ürün olacaktır.
- Masaüstü, tablet ve mobil kullanım birlikte desteklenecektir.
- Saha operasyonları mobil önceliklidir.
- Kurban Bayramı gibi yüksek yoğunluklu bir günde hızlı, kararlı, hataya dayanıklı ve geri alınabilir çalışmak zorundadır.
- Ürün markası ile müşteri firma markası birbirine karıştırılmayacaktır.

## 2. Bağlayıcı kaynak sırası

- İş kurallarını tahmin etme.
- Belgelenmiş kullanıcı kararlarını, ana yol haritasını, mimari belgeleri ve gereksinim matrisini kaynak kabul et.
- Her geliştirmeyi ilgili gereksinim kimliği veya iş akışıyla ilişkilendir.
- 68 iş akışının belgelenmiş olması, kodda tamamlandıkları anlamına gelmez.
- Gereksinim belirsizse kritik iş kuralı uydurma; kullanıcıdan karar iste.
- Mimari karar değişirse ilgili mimari belgeyi ve takip dokümanını güncelle.

Öncelikli kaynaklar:

- Birinci kaynak: `docs/architecture/TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md`
- `docs/architecture/00-MEVCUT-DURUM-ANALIZI.md`
- `docs/architecture/01-HEDEF-SISTEM-MIMARISI.md`
- `docs/architecture/02-MODULER-MONOLIT-VE-DOMAIN-SINIRLARI.md`
- `docs/architecture/03-COKLU-FIRMA-VE-VERITABANI-MIMARISI.md`
- `docs/architecture/04-PLATFORM-SUPER-ADMIN-VE-FIRMA-ADMIN.md`
- `docs/architecture/05-KIMLIK-YETKI-VE-DESTEK-ERISIMI.md`
- `docs/architecture/06-FINANS-VE-LEDGER-MIMARISI.md`
- `docs/architecture/07-UTF8-COKLU-DIL-VE-RTL.md`
- `docs/architecture/08-TASARIM-SISTEMI-VE-MOBIL-PWA.md`
- `docs/architecture/09-VERI-GOCU-YEDEK-VE-GUNCELLEME.md`
- `docs/architecture/10-TEST-KALITE-VE-KABUL-PLANI.md`
- `docs/architecture/11-GEREKSINIM-IZLENEBILIRLIK-MATRISI.md`
- `docs/architecture/12-FAZLAR-RISKLER-VE-GERI-DONUS.md`
- `docs/architecture/13-HEDEF-DIZIN-ISKELETI-VE-MODUL-STANDARDI.md`
- `docs/architecture/14-PROGRAM-TAM-KAPSAM-ENVANTERI.md`
- `docs/architecture/KURBAN2026-UYGULAMA-TAKIP.md`
- Eski ana yol haritası: `docs/archive/legacy/KURBAN2026-ANA-ANALIZ-VE-GELISTIRME-YOL-HARITASI.md`
- Tarihsel kaynaklar: `docs/archive/legacy/MIMARI.md`, `docs/archive/legacy/DATABASE_FACE_AUDIT.md`, `README.md`, `docs/archive/legacy/CLAUDE.md`

Yeni ana belgeyle eski belgeler çelişirse yeni ana belge uygulanır; eski karar sessizce silinmez, ilgili dokümanda “yerine geçen karar” ve gerekçesiyle işaretlenir.

## 3. Hedef mimari

- Modüler monolit kullanılacaktır.
- Tek kod tabanı korunacaktır.
- Faz 2’de çok firma ve veri izolasyonu temel mimari gereksinimdir; ayrıntılar birinci kaynak ana belgede tanımlıdır.
- Platform için ayrı PostgreSQL ve her firma için ayrı PostgreSQL operasyon veritabanı hedeflenecektir.
- Platform Süper Admin ile Firma Admin ayrı kimlik, oturum, yetki ve audit alanlarına sahip olacaktır.
- Firma verisi başka firmalardan kesin olarak izole edilecektir.
- Domain katmanı Next.js, React, Prisma, HTTP, dosya sistemi ve kullanıcı arayüzünden bağımsız olacaktır.
- Bağımlılık yönü kesin olarak şöyledir:

```text
UI/API → Application → Domain
```

- Infrastructure, domain portlarını uygular.
- Route dosyaları yalnızca doğrulama, kimlik/yetki, use-case çağrısı ve güvenli cevap koordinasyonu yapar.
- İş kuralları route dosyalarına veya React bileşenlerine yığılmaz.
- Boş veya göstermelik klasör açılmaz.
- Büyük dizin dönüşümü aşamalı, testli ve geri alınabilir yapılır.
- Fiziksel `apps/*` ve `packages/*` taşıması Faz 2A’da davranış değiştirmeyen mimari sözleşme, iskelet ve taşıma planı ile başlar; kaynak kod taşıma ve davranış değişikliği ayrıca onaylanmış uygulama paketlerinde yapılır.

## 4. Temel iş zincirleri

- Sistem tek doğrusal zincir değildir; birbirini tetikleyen çok sayıda iş akışından oluşur.
- Geliştirme kapsamı yalnızca görüşmelerde belirtilen gereksinimlerle sınırlanamaz. Codex; mevcut kaynak kodunu, tüm ekranları, API’leri, veri modellerini, altyapıyı ve profesyonel ürün gereksinimlerini bütünsel olarak incelemeli; keşfedilen eksik, hatalı, gereksiz ve belgelenmemiş alanları izlenebilirlik sistemine dâhil etmelidir.
- İşlemleri kopuk ekranlar olarak değil, zincirleme veri akışları olarak ele al.
- Ana omurga şunları kapsar: tedarikçi, alış faturası, hayvan kaydı, küpe numarası, tartım geçmişi, kurban uygunluğu, hisse kartı, hayvana hisse oluşturma, müşteri kaydı, hisse atama ve satış, kapora, cari hesap, tahsilat, karma ödeme, indirim, iptal, iade, mahsup, vekâlet, kesim sırası, kesim belgesi, kesim takibi, gerçek tartım, parçalama, paketleme, teslimat, adrese teslim, kasa, banka, POS, giderler, raporlama, sezon ve arşiv.
- Satış, tahsilat, kasa, vekâlet, kesim, paketleme ve teslimat olayları birbirinin verisini güvenli biçimde güncellemelidir.

## 5. Veri bütünlüğü

- Küpe numarası hayvanın benzersiz kimliğidir.
- Kurban numarası/kesim sırası daha sonra verilebilir ve yalnız kontrollü şekilde değiştirilebilir.
- Her büyükbaş hayvan en fazla yedi kurban hissesine sahip olabilir.
- Bir hisse yalnızca bir aktif hissedara ait olabilir.
- Bir müşteri birden fazla hisse satın alabilir.
- Aynı aile bireyleri ayrı müşteri ve ayrı hissedar kartları olarak kaydedilebilir.
- Aynı telefon numarasını kullanan farklı müşteriler olabilir; sistem engellemek yerine uyarı vermelidir.
- Satılan hissenin anlaşılmış fiyatı sonradan toplu fiyat değişikliklerinden etkilenmez.
- Satılmamış hisseler güncellenebilir.
- Ödemeli veya hareket görmüş kayıtlar doğrudan silinmez.
- Kritik işlemler transaction içinde atomik çalışır.
- Kısmi başarı sonucu yarım satış veya yarım finans kaydı oluşmaz.
- Tekrarlanan isteklerde idempotency uygulanır.
- Race condition kontrolleri yapılır.
- Durum geçişleri açıkça tanımlanır.
- Pasif kayıtlar fiziksel silinmez; gerekiyorsa yeniden aktifleştirme yolu tasarlanır.

## 6. Finans ve muhasebe

- Finansal doğruluk tasarımdan önce gelir.
- Yeni finansal modelde para hesapları için `Float` kullanılmaz; kesin parasal tip hedeflenir.
- Finansal hareketler doğrudan silinmez.
- Hatalar ters kayıt, iade, iptal veya mahsup ile düzeltilir.
- Satış fiyatı, liste fiyatı, indirim, hizmet bedeli, vade farkı, tahsilat ve kalan borç ayrı izlenir.
- Liste fiyatı 45.000 TL, anlaşılmış fiyat 44.000 TL ise 44.000 TL satış ve 1.000 TL indirim ayrı kaydedilir.
- Karma ödeme desteklenir: nakit + banka/havale + POS.
- Tahsilat bir veya birden fazla hisseye dağıtılabilir.
- Kullanıcı belirli bir hisseyi kapatabilir veya ödemeyi hisselere dağıtabilir.
- POS taksit vade farkı yalnız POS ile çekilen tutara uygulanır.
- Cari hesaplar müşteri ve sezon bazında ayrılır.
- Müşterinin yıllar içindeki geçmişi korunur; sezon ekstreleri birbirine karışmaz.
- Her finansal hareket için audit izi bulunur.

## 7. Güvenlik ve yetkilendirme

- Her API işlemi kimlik doğrulama ve yetki kontrolü içermelidir.
- Firma sınırı hiçbir zaman yalnız kullanıcı arayüzüne bırakılmaz.
- Firma veritabanı bağlantıları güvenli şekilde çözülür; bağlantı bilgileri istemciye, loglara veya hata mesajlarına çıkmaz.
- Platform Süper Admin erişimi kontrollü, süreli, gerekçeli ve denetlenebilir olmalıdır.
- Destek erişimleri firma onaylı, süreli, kapsamlı ve audit kayıtlı olmalıdır.
- Hassas dosyalar `public` klasöründe tutulmaz.
- Dosyalar yetki kontrollü API üzerinden sunulur.
- Ham hata, stack trace, Prisma hatası veya hassas sistem bilgisi kullanıcıya gönderilmez.
- API cevapları güvenli hata kodları ve mesaj anahtarları kullanır.
- `.env`, parolalar, anahtarlar, bağlantı bilgileri, yedekler ve gerçek kişisel veriler GitHub’a gönderilmez.
- Yetki yükseltme, firma verisi sızıntısı ve IDOR riskleri her değişiklikte düşünülür.

## 8. UTF-8 ve çoklu dil

- Kaynak kodu, veritabanı, API, belge ve dosya işlemleri UTF-8 kullanmalıdır.
- Bozuk Türkçe karakterler kabul edilmez.
- Kullanıcı mesajları kod içine dağınık biçimde yazılmaz.
- Hata kodu ile kullanıcı mesajı ayrılır.
- Mesaj anahtarı tabanlı i18n altyapısı hedeflenir.
- İlk temel dil Türkçedir.
- İngilizce ve Arapça dil paketleri eklenebilir olmalıdır.
- Arapça için yalnız çeviri değil gerçek RTL yerleşimi desteklenmelidir.
- Tarih, saat, para ve sayı biçimleri locale göre gösterilir.
- Veritabanındaki işletme verileriyle arayüz çeviri metinleri karıştırılmaz.

## 9. Tasarım, mobil ve PWA

- Arayüz mobil öncelikli tasarlanır.
- Masaüstü yönetim paneli yoğun işlemlere uygun olmalıdır.
- Saha ekranlarında minimum tıklama ve hızlı işlem hedeflenir.
- Kesim günü kritik işlemler kullanıcıyı ayrıntıya boğmaz.
- Büyük dokunma alanları, yüksek okunabilirlik ve güçlü durum renkleri kullanılır.
- Mobil görünüm küçültülmüş masaüstü kopyası değildir.
- PWA mimarisi çevrimdışı veya zayıf ağ senaryolarını dikkate alır.
- Çevrimdışı değişikliklerde çakışma ve senkronizasyon kuralları açıkça tanımlanır.
- Erişilebilirlik, klavye kullanımı ve ekran okuyucu uyumu gözetilir.
- Ürün markası ile firma markası ayrılır.

## 10. Test ve kalite kapıları

- Her anlamlı değişiklikten sonra riske uygun doğrulama çalıştırılır.
- Mevcut package scriptleri kullanılır; test komutları uydurulmaz.
- Uygun kontroller: `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm lint`, `pnpm build`.
- Gerekliyse entegrasyon testi, yetki ve firma izolasyonu testi, finansal invariant testi, race condition/idempotency testi, route/page smoke testi ve kritik mobil ekran kontrolü yapılır.
- Test başarısızsa gizlenmez, silinmez veya devre dışı bırakılmaz.
- Sadece mock testleri kritik finans, satış, firma izolasyonu ve migration işlemleri için yeterli sayılmaz.
- Gerçek PostgreSQL entegrasyon testleri hedef mimarinin zorunlu parçasıdır.

## 11. Değişiklik yönetimi

- Her görev başlamadan önce `git status --short --branch` kontrol edilir.
- Kullanıcının mevcut değişiklikleri korunur.
- İlgisiz dosyalar değiştirilmez.
- Büyük ve riskli dönüşümler küçük, geri alınabilir paketlere ayrılır.
- Migration öncesi geri dönüş ve yedekleme planı hazırlanır.
- Veritabanı migration işlemleri kendiliğinden çalıştırılmaz.
- Veri silme işlemleri açık kullanıcı talimatı olmadan yapılmaz.
- Bağımlılık/paket eklemek için gerçek ihtiyaç gösterilir.
- Gereksiz yeniden yazım ve toplu refactor yapılmaz.
- Mevcut çalışan iş akışları korunur.
- Geçici uyumluluk katmanları belgelenir ve kaldırılma fazı belirtilir.

## 12. Git ve GitHub kuralları

- Açık kullanıcı talimatı olmadan commit veya push yapılmaz.
- Force push yapılmaz.
- Kullanıcının commitleri değiştirilmez veya ezilmez.
- Her paket mantıksal ve anlaşılır commitlere ayrılır.
- Commit öncesi diff, test ve gizli bilgi kontrolü yapılır.
- Commit mesajı yapılan değişikliği açıkça anlatır.
- Build çıktıları, gizli bilgiler, veritabanları ve gereksiz üretilmiş dosyalar commitlenmez.
- Push sonrasında branch ve çalışma ağacı durumu raporlanır.

## 13. Belgeleme ve izlenebilirlik

- Her uygulama paketi sonrasında takip belgesi, gereksinim matrisi, faz durumu, test sonucu ve bilinen riskler güncellenir.
- Tamamlanmamış iş tamamlanmış gibi işaretlenmez.
- `Belgelendi`, `kodlandı`, `test edildi` ve `canlıya hazır` durumları ayrı tutulur.
- Mimari karar değişirse ilgili mimari belge güncellenir.
- Bu dosya mimari belgelerin tamamını tekrar etmez; onları bağlayıcı kaynak olarak gösterir.
- Aktif her belge benzersiz `id`, `status`, `owner`, `source_role`, `source_of_truth`, `last_reviewed` ve doğrulama varsa tam `verified_against_commit` alanlarını taşır.
- Belge durum dili ve kanıt standardının ana kaynağı `docs/governance/GOV-001-DOKUMANTASYON-POLITIKASI.md`; kaynak önceliğinin ana kaynağı `docs/governance/GOV-003-KAYNAK-ONCELIGI-VE-KANIT-STANDARDI.md` dosyasıdır.
- `APPROVED` kararın kabul edildiğini, `IMPLEMENTED_PENDING_VERIFICATION` kodun genel/canlı kabul beklediğini, `VERIFIED` ise yalnız belgede açıkça yazılan commit ve senaryo kapsamının doğrulandığını ifade eder.
- Mükerrer kural elle çoğaltılmaz; tek ana belgeye bağlanır. Sorumluluğu taşınan eski belge önce `SUPERSEDED`, aktarım ve bağlantı doğrulamasından sonra `ARCHIVED` yapılır.
- CI kanıtı değişmez commit SHA ve koşu bağlantısıyla tutulur. Başarılı CI tek başına canlı deployment, cihaz, restore, UAT veya Kurban Günü provası kanıtı sayılmaz.
- `docs/README.md` aktif çekirdek belgelerin tek ana indeksidir; belge kimliği, durum, sahiplik ve kaynak rolü değiştiğinde aynı pakette güncellenir.

## 14. Codex çalışma biçimi

- Görev başlamadan önce ilgili dosyaları incele.
- Önce sorunu ve etkilediği iş akışlarını belirle.
- Büyük görevlerde uygulama planı çıkar.
- Yetki verilmişse uygulamayı tamamla, test et ve sonuçları raporla.
- Kullanıcı sadece analiz istediğinde kod değiştirme.
- Kullanıcı sadece soru sorduğunda işlem yapma.
- Kritik bir iş kararı eksikse varsayım üretme.
- Güvenli ve geri alınabilir değişikliklere öncelik ver.
- Sonuç raporunda değişen dosyaları, testleri, kalan riskleri ve Git durumunu açıkça belirt.
- Kullanıcıya teknik olmayan, anlaşılır Türkçe özet ver.

## 15. Bu dosyanın bakımı

- Kök dosyanın adı tam olarak `AGENTS.md` kalmalıdır.
- Şimdilik alt klasörlerde ek `AGENTS.md` oluşturma.
- Gerçek modül dönüşümü başladığında, ihtiyaç olursa kapsamı daraltan alt `AGENTS.md` dosyaları ayrıca değerlendirilebilir.
- Bu dosyaya hızla eskiyecek test sayıları, geçici commit kimlikleri veya anlık durumlar yazma.
