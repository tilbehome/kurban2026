# 03 — Çoklu Firma ve Veritabanı Mimarisi

```yaml
id: ARC-003
status: IMPLEMENTED_PENDING_VERIFICATION
owner: Architecture-and-Data
source_role: tenant_database_architecture
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

## Kesin karar

Tek kod tabanı kullanılacak; platform için ayrı PostgreSQL, her firmanın operasyon verisi için kendisine ait ayrı PostgreSQL veritabanı bulunacaktır. Firma özel kod kopyaları oluşturulmayacaktır.

10 Ağustos 2026 yerine geçen karar: Çok firma veri izolasyonu ileri SaaS hedefi değildir; Faz 2’nin zorunlu çekirdeğidir. Self-service firma kaydı, otomatik abonelik/faturalama ve gelişmiş ticari SaaS özellikleri sonraya bırakılır.

## Dağıtım karşılaştırması

Bu tablo iki dağıtım modelini karşılaştırır; hangi model seçilirse seçilsin platform DB ve firma başına ayrı PostgreSQL kararı değişmez.

| Kriter | Yönetilen/yerel firma runtime + ayrı DB | Ortak bulut runtime + güvenli tenant DB yönlendirme |
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
- Kullanıcı adresi local development için `https://{tenantSlug}.tilbecore.test`, yerel/hibrit canlı kurulum için firma tarafından yönetilen domain veya split-DNS ile çözülen profesyonel HTTPS adresidir.

Bulut sürüm:

- `https://{tenantSlug}.tilbecore.com`; path tabanlı `/f/{firmaKodu}` ana tenant çözümleme yöntemi değildir.
- Request başında tenant resolver.
- Resolver yalnız platform DB’den bağlantı referansını alır.
- Uygulama logları bağlantı stringi yazmaz.
- Prisma client pool tenant-aware cache ile sınırlanır ve idle temizlenir.

Tenant yalnız Host header metnine güvenilerek seçilmez. Host normalize edilir, port ve geçersiz karakterler ayrıştırılır, reserved subdomain ve trusted host kontrolü yapılır, platform hostları tenant hostlarından ayrılır, tenant slug doğrulanır ve tenant platform registry üzerinden aktif tenant + DB referansına çözülür. Bilinmeyen host, hatalı slug, doğrulanmamış custom domain, Host header enjeksiyonu ve başka firmaya ait session/cookie reddedilir.

Ayrılmış tenant slug isimleri merkezi config sözleşmesinde tutulur: `console`, `status`, `help`, `updates`, `assets`, `api`, `hooks`, `www`, `staging`.

Custom domain desteği hedef mimariye dahildir. Durumlar `PENDING`, `VERIFYING`, `VERIFIED`, `ACTIVE`, `FAILED`, `SUSPENDED`, `REMOVED` olarak izlenir. DNS sahipliği ve TLS hazır olmadan custom domain aktif sayılmaz; domain değişikliği tenant veya DB kimliğini değiştirmez.

## Süper Admin veri sınırı

Platform Süper Admin normal şartlarda firma operasyon, müşteri ve finans verilerini görmez. Platform tarafında firma/lisans/provisioning/sürüm/sağlık/yedek metadata’sı tutulur. Operasyon verisine destek amacıyla erişim gerekiyorsa süreli, gerekçeli, firma onaylı veya politika ile açıkça yetkilendirilmiş ve hem platform hem firma audit’ine yazılan bir destek oturumu gerekir.

## Geçiş yolu

1. SQLite şemasını PostgreSQL uyumlu hale getirme planı.
2. Firma operasyon DB şemasını çıkarma.
3. Platform DB şemasını ayrı migration seti olarak tasarlama.
4. Mevcut tek firma verisini firma DB’sine taşıma scripti: dry-run + checksum + rapor.
5. Yerel kurulum için provisioning komutu.
6. Bulut için tenant resolver sadece test tenantlarında açılır.
