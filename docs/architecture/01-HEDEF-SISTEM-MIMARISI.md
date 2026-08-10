# 01 — Hedef Sistem Mimarisi

## Ürün kimliği

| Alan | Kesin değer |
|---|---|
| Ana marka | TilbeCore |
| Kısa ürün adı | TilbeCore Kurban |
| Giriş adı | TilbeCore – Kurban Takip |
| Resmî ürün adı | TilbeCore – Kurban Takip |
| Açıklama | Kurban satış, finans ve operasyon yönetim platformu |
| Slogan | Kurban satışından teslimata, tüm süreç tek merkezde. |
| Teknik ürün kodu | `tilbecore-kurban` |

## Hedef ilke

TilbeCore – Kurban Takip tek kod tabanlı, modüler monolit bir ürün olacaktır. Birinci kaynak `TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md` belgesidir.

10 Ağustos 2026 yerine geçen karar: Çok firma veri izolasyonu sonraki SaaS hedefi değildir; Faz 2’nin zorunlu çekirdeğidir. Platform için ayrı PostgreSQL, her firma için ayrı PostgreSQL operasyon veritabanı ve ayrı Platform Süper Admin/Firma Admin sınırı hedef mimarinin temelidir. Self-service üyelik, otomatik abonelik/faturalama ve gelişmiş ticari SaaS özellikleri sonraya bırakılır.

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

## Profesyonel erişim mimarisi

Production ana domain `tilbecore.com` olarak belirlenmiştir ve sahipliği kullanıcı tarafından satın alma + domain kayıt panelinde aktiflik kontrolüyle doğrulanmıştır. Production değeri taslak değildir: `BASE_DOMAIN=tilbecore.com`. Kullanıcıya açık platform adresi `https://console.tilbecore.com`, firma origin standardı `https://{tenantSlug}.tilbecore.com` biçimindedir. Firma paneli, saha PWA, TV, takip, QR, davet ve tenant API aynı tenant origin altında sırasıyla `/panel`, `/saha`, `/tv`, `/takip/{opaqueToken}`, `/q/{opaqueToken}`, `/davet/{opaqueToken}` ve `/api/v1` path’leriyle sahiplenilir.

Staging `staging.tilbecore.com`, local development `tilbecore.test` temel domainini kullanır. `.test` canlı ortamda kullanılmaz. Kullanıcıya gösterilen adreslerde port bulunmaz; HTTPS ve doğru origin zorunludur.

Domain hard-code edilmez; ortam, base domain, platform origin, tenant origin üretimi, reserved subdomain listesi, trusted host ve cookie politikası `packages/config` sözleşmesinden yönetilir. Bu fazda DNS, nameserver, SSL veya canlı deployment değişikliği yapılmaz. Kararın ayrıntısı ADR-0001’dedir.

## Marka ayrıştırma sınıfları

| Sınıf | Mevcut örnek | Hedef |
|---|---|---|
| TilbeCore ürün kimliği | `shared/components/AppShell.tsx` içinde TilbeCore | Ürün shell/footer/girişte kontrollü görünür. |
| Firmaya özel kimlik | `public/manifest.json` Ada Bereket, `SidebarHeader.tsx` | Firma ayarlarından gelir; manifest üretimi veya kurulum profiliyle ayrılır. |
| Demo/test verisi | `prisma/seed.ts`, `fixtures/seed/seed-data.example.json` | Demo profili açıkça işaretlenir, canlı ile karışmaz. |
| Kaldırılacak eski sabit | `modules/musteriler/components/borclular/BorclularClient.tsx` içinde Ada Bereket mesajları | `{firmaAdi}` ve mesaj şablonu anahtarıyla değişir. |
| Belge snapshot değeri | Dekont ve kesim belgesi üst bilgileri | Belge üretildiği anki firma adı/logo/adres snapshot olarak saklanır. |

## Hedef kalite kapıları

- Her iş akışı için domain kuralı, API/use-case, audit, test ve kabul senaryosu.
- Parasal kayıtlar silinmez; ters kayıtla düzeltilir.
- Kullanıcı mesajları metne bağlı iş mantığı üretmez; hata kodu + mesaj anahtarı kullanılır.
- Firma veritabanı bağlantısı istemciye, loga veya hata mesajına çıkmaz.
- Platform Süper Admin, firma içi `SUPER_ADMIN` rolü değildir ve normal şartlarda firma operasyon, müşteri veya finans verilerini görmez.
