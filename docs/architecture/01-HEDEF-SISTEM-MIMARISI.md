# 01 — Hedef Sistem Mimarisi

## Ürün kimliği

| Alan | Kesin değer |
|---|---|
| Ana marka | TilbeCore |
| Kısa ürün adı | TilbeCore Kurban |
| Giriş adı | TilbeCore – Kurban Takip |
| Resmî ürün adı | TilbeCore – Kurban Yönetim ve Takip Sistemi |
| Açıklama | Kurban satış, finans ve operasyon yönetim platformu |
| Slogan | Kurban satışından teslimata, tüm süreç tek merkezde. |
| Teknik ürün kodu | `tilbecore-kurban` |

## Hedef ilke

TilbeCore Kurban tek kod tabanlı, modüler monolit bir ürün olacaktır. İlk ticari sürümde firma başına ayrı uygulama kurulumu + ayrı PostgreSQL veritabanı desteklenecek; sonraki aşamada ortak bulut runtime + güvenli tenant veritabanı yönlendirmesi eklenecektir.

## Sistem sınırları

```text
TilbeCore Platform
  ├─ Firma kaydı / lisans / paket / modül
  ├─ Deployment / sürüm / migration / sağlık
  ├─ Destek erişim onayı ve audit
  └─ Operasyon verisi tutmaz

Firma Uygulaması
  ├─ Firma ayarları ve sezon
  ├─ Kullanıcı/rol/yetki
  ├─ Müşteri, hayvan, hisse, satış
  ├─ Tahsilat, kasa, belge, kesim, teslim
  └─ Sadece kendi PostgreSQL veritabanına bağlanır
```

## Marka ayrıştırma sınıfları

| Sınıf | Mevcut örnek | Hedef |
|---|---|---|
| TilbeCore ürün kimliği | `shared/components/AppShell.tsx` içinde TilbeCore | Ürün shell/footer/girişte kontrollü görünür. |
| Firmaya özel kimlik | `public/manifest.json` Ada Bereket, `SidebarHeader.tsx` | Firma ayarlarından gelir; manifest üretimi veya kurulum profiliyle ayrılır. |
| Demo/test verisi | `prisma/seed.ts`, `seed-data.example.json` | Demo profili açıkça işaretlenir, canlı ile karışmaz. |
| Kaldırılacak eski sabit | `modules/musteriler/components/borclular/BorclularClient.tsx` içinde Ada Bereket mesajları | `{firmaAdi}` ve mesaj şablonu anahtarıyla değişir. |
| Belge snapshot değeri | Dekont ve kesim belgesi üst bilgileri | Belge üretildiği anki firma adı/logo/adres snapshot olarak saklanır. |

## Hedef kalite kapıları

- Her iş akışı için domain kuralı, API/use-case, audit, test ve kabul senaryosu.
- Parasal kayıtlar silinmez; ters kayıtla düzeltilir.
- Kullanıcı mesajları metne bağlı iş mantığı üretmez; hata kodu + mesaj anahtarı kullanılır.
- Firma veritabanı bağlantısı istemciye, loga veya hata mesajına çıkmaz.
- Platform Süper Admin, firma içi `SUPER_ADMIN` rolü değildir.

