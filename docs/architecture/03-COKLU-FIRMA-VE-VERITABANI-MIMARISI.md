# 03 — Çoklu Firma ve Veritabanı Mimarisi

## Kesin karar

Tek kod tabanı kullanılacak; her firmanın operasyon verisi kendisine ait ayrı PostgreSQL veritabanında tutulacaktır. Firma özel kod kopyaları oluşturulmayacaktır.

## Dağıtım karşılaştırması

| Kriter | İlk ticari sürüm: firma özel uygulama + ayrı DB | İleri aşama: ortak bulut runtime + tenant DB yönlendirme |
|---|---|---|
| Güvenlik | İzolasyon güçlü, yanlış tenant routing riski düşük | Routing, secret yönetimi ve connection pool kritik |
| Maliyet | Firma başı kurulum/VM maliyeti yüksek olabilir | Ortak runtime maliyeti düşürür |
| Performans | Firma yükü ayrıdır | Pool ve tenant yoğunluğu yönetilmeli |
| Yedekleme | Firma bazlı basit | Merkezi otomasyon gerekir |
| Güncelleme | Firma firma dağıtım | Merkezi sürüm halkaları |
| Teknik destek | Kurulum bazlı erişim gerekir | Platformdan kontrollü destek daha kolay |
| İnternet kesintisi | Yerel kurulum temel operasyonu sürdürür | Bulut internete bağlıdır |
| Ölçeklenme | Firma başına bağımsız ölçek | Merkezi ölçek ve tenant limitleri gerekir |
| Veri teslimi | Firma DB dump/backup ile net | Tenant bazlı export aracı gerekir |
| KVKK | Fiziksel/lojik ayrım güçlü | Platform veri minimizasyonu ve audit şart |

## Platform veritabanı

Tutulacaklar:

- Firma kimliği, kod, ticari ad, slug.
- Kurulum türü: yerel/bulut.
- Lisans, paket, modül hakları.
- Deployment ve sürüm.
- Veritabanı bağlantı referansı; bağlantı sırrı doğrudan UI/logda görünmez.
- Sağlık, yedek, migration durumu.
- Destek erişim onayları.
- Platform audit.

Tutulmayacaklar:

- Müşteri, hayvan, hisse, tahsilat, vekâlet, kesim, cari veya firma operasyon verisi.

## Firma veritabanı

Her firma DB’sinde:

- Firma ayarları ve sezon.
- Kullanıcı/rol/yetki.
- Müşteri, tedarikçi, alış faturası, gider.
- Hayvan, tartım, uygunluk.
- Hisse kartı, satış, cari.
- Tahsilat, kasa/banka/POS.
- Vekâlet, belge, kesim, paket, teslimat.
- Rapor kaynakları ve firma audit.

## Tenant çözümleme

Yerel sürüm:

- Kurulum profili `tilbecore-kurban`.
- Tek firma konfigürasyonu.
- `.env` veya şifreli yerel secret store firma DB referansını tutar.
- İnternet yokken lisans toleransı çalışır.

Bulut sürüm:

- `firma-slug.tilbecore.com` veya `/f/{firmaKodu}`.
- Request başında tenant resolver.
- Resolver yalnız platform DB’den bağlantı referansını alır.
- Uygulama logları bağlantı stringi yazmaz.
- Prisma client pool tenant-aware cache ile sınırlanır ve idle temizlenir.

## Geçiş yolu

1. SQLite şemasını PostgreSQL uyumlu hale getirme planı.
2. Firma operasyon DB şemasını çıkarma.
3. Platform DB şemasını ayrı migration seti olarak tasarlama.
4. Mevcut tek firma verisini firma DB’sine taşıma scripti: dry-run + checksum + rapor.
5. Yerel kurulum için provisioning komutu.
6. Bulut için tenant resolver sadece test tenantlarında açılır.
