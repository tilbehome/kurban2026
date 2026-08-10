# 04 — Platform Süper Admin ve Firma Admin

Birinci kaynak `TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md` belgesidir.

## Ayrım ilkesi

Platform Süper Admin, firma uygulamasındaki normal bir `SUPER_ADMIN` rolü değildir. Ayrı kullanıcı modeli, ayrı session/cookie, ayrı route alanı, ayrı yetki ve ayrı audit gerektirir.

## Platform alanı

Önerilen alan: `platform.tilbecore.com`.

Bilgi mimarisi:

- Dashboard: firma sayıları, lisans bitişleri, kurulum türleri, sürüm dağılımı, migration/yedek hataları, çevrimdışı kurulumlar, destek erişimleri, güvenlik olayları.
- Firma yönetimi: firma kodu, slug, provisioning, DB durumu, lisans, modül, kullanıcı/cihaz sınırı, aktif sezon, sürüm, yedek, son bağlantı, sağlık, geçmiş.
- Lisans/paket: sezonluk, yıllık, deneme, yerel/bulut, kullanıcı/cihaz limiti, modüller, destek paketi, tolerans süresi.
- Sürüm/migration: katalog, test firmaları, güncelleme halkaları, güncelleme öncesi yedek, sonuç ve kurtarma.
- Destek erişimi: firma onayı, neden, süre, erişen kişi, iptal, ayrıntılı audit.

## Firma admin alanı

Firma admini sadece kendi operasyon veritabanına bağlıdır.

Yönetebilecekleri:

- Firma bilgisi, logo, belge kimliği.
- Sezon.
- Kullanıcı ve rol.
- Müşteri/cari.
- Tedarikçi/alış.
- Hayvan/hisse.
- Satış/kapora.
- Finans.
- Vekâlet/belge.
- Kesim, tartım, paket, teslim.
- Firma raporları.
- TV/müşteri takip.
- Firma ayarları.
- Kendi veri dışa aktarma ve yedek talepleri.

Göremeyecekleri:

- Başka firmalar.
- Platform kullanıcıları.
- Global lisans politikası.
- Veritabanı şifreleri.
- Global migration sistemi.
- Kaynak kodu.

## Destek erişim modeli

Platform yöneticisi firma operasyon verilerine sessiz ve sınırsız erişemez.

10 Ağustos 2026 yerine geçen karar: Süper Admin normal şartlarda firma operasyon, müşteri ve finans verilerini görmez. Eski “platformdan her şeyi yönetme” veya firma içi `SUPER_ADMIN` ile karıştırılan yaklaşımlar geçerli değildir. Destek erişimi yalnız süreli, gerekçeli, denetlenebilir ve firma onaylı ya da politika ile açıkça yetkilendirilmiş oturumla mümkündür.

Destek oturumu alanları:

- `supportAccessId`
- firma kodu
- talep eden firma kullanıcısı
- erişen platform kullanıcısı
- neden
- süre
- başlangıç/bitiş
- kapsam: okuma/yazma, modül sınırı
- görülen/değiştirilen kayıt audit’i
- firma tarafından iptal
