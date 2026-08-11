# 00 — Mevcut Durum Analizi

## Kaynak doğrulama

| Kaynak | Durum | Kanıt |
|---|---|---|
| Bağlayıcı ana mimari | Okundu / mevcut | `docs/architecture/TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md`, 2026-08-10 |
| Eski ana yol haritası | Tarihsel kaynak | `docs/archive/legacy/KURBAN2026-ANA-ANALIZ-VE-GELISTIRME-YOL-HARITASI.md`, 2026-08-07 |
| P0 takip defteri | Okundu / mevcut | `docs/architecture/KURBAN2026-UYGULAMA-TAKIP.md` |
| Mimari belge | Okundu / tarihsel | `docs/archive/legacy/MIMARI.md` |
| Veri yüzey audit | Okundu / tarihsel | `docs/archive/legacy/DATABASE_FACE_AUDIT.md` |
| README | Okundu / mevcut | `README.md` |
| Prisma şeması | Okundu / mevcut | `prisma/schema.prisma` |
| Testler | Okundu / mevcut | `shared/lib/*.test.ts`, `modules/tahsilat/lib/dagitim.test.ts`, `tests/*.test.ts` |
| Faz 1 kapanış commit’i | Okundu / mevcut | `a6720378123f01fb4e19db3fd782a910f18c0acf` |
| Repo yapısı | Taranmış | `app`, `modules`, `shared`, `components`, `scripts`, `public` |

Yeni ana mimari, eski yol haritasındaki kesinleşen iş kurallarını korur; çok firma veri izolasyonu, Platform Süper Admin, Platform PostgreSQL ve firma başına ayrı PostgreSQL kararlarını Faz 2 çekirdeğine alır. Eski “SaaS sonra” yaklaşımı yalnız self-service üyelik, otomatik abonelik/faturalama, gelişmiş çok şube ve ticari SaaS özellikleri için geçerlidir.

## Repo ölçeği

| Alan | Gözlem |
|---|---:|
| `app` dosyaları | 227 |
| App Router sayfaları | 126 |
| API route dosyaları | 74 |
| `modules` dosyaları | 166 |
| Test dosyaları | 7 |
| Test sayısı | 84 |

## Mevcut teknoloji

- Next.js 16.2.6, React 19, TypeScript.
- Prisma 6.19.3.
- Veri kaynağı hâlâ SQLite: `prisma/schema.prisma` içinde `datasource db { provider = "sqlite" }`.
- LAN kullanımı destekleniyor: `package.json` içinde `dev` ve `start` `--hostname 0.0.0.0`.
- PWA var: `next-pwa`, `public/manifest.json`, `public/sw-version.json`.
- Auth/session iron-session ile dosya içi yardımcılar üzerinden yürüyor.

## Mevcut mimari puanı

Genel puan: 6.2 / 10.

Güçlü taraflar:

- Local-first ve LAN odaklı kurulum zaten düşünülmüş.
- App Router yapısı ve modül klasörleri var.
- P0 ile hisse atama, saha satış, vekâlet dosya erişimi ve kritik yetkiler sertleşti.
- Audit modeli var.
- TV/personel/müşteri takip ekranları gerçek operasyon akışına yaklaşmış.
- Test altyapısı çalışıyor ve 84 test geçiyor.

Zayıf taraflar:

- Finansal tutarlar `Float`; kuruş/decimal veya ledger temeli yok.
- Platform/firma ayrımı yok.
- Firma başına ayrı PostgreSQL kararına uygun tenant/veritabanı yönlendirme yok.
- Platform Süper Admin ayrı kimlik, session/cookie, rol/izin ve audit alanıyla `apps/platform-admin` içinde uygulanmıştır; passkey/WebAuthn, canlı DNS/TLS/deployment ve tam platform operasyon sertleştirmesi henüz tamamlanmamıştır.
- API route dosyalarında iş kuralları büyümüş durumda; örnekler: `app/api/tahsilat/odeme/route.ts` 398 satır, `app/api/saha-satis/route.ts` 309 satır, `app/api/tv/kurban-asama/route.ts` 196 satır.
- Marka/firma kimliği karışık: `public/manifest.json`, `shared/components/sidebar/SidebarHeader.tsx`, `app/api/tahsilat/dekont/[id]/route.ts`, seed dosyaları.
- Çoklu dil/RTL temeli yok.
- Çok sayıda placeholder veya sonraki faz ekranı menüde görünür durumda.

## P0 geri dönüş noktası

- Faz 1 kapanış commit’i: `a6720378123f01fb4e19db3fd782a910f18c0acf`.
- Eski `e47bbe5` referansı tarihsel P0 ara noktasıdır; geçerli Faz 1 kapanış kanıtı değildir.
- Faz 2A workspace/sözleşme/sınır paketi başladı; tamamlandı olarak kabul edilmez. `b536078` yalnız erken saha satış modüler pilotudur; gerçek Faz 2A kanıtları `15-FAZ-2A-IMPORT-GRAFIGI-VE-TASIMA-MATRISI.md`, `packages/contracts` ve mimari sınır testleriyle izlenir.

## İlk önemli teknik kanıtlar

- `prisma/schema.prisma`: `Kurban.satisBedeli`, `Hisse.hisseFiyati`, `Odeme.nakit/havale/kart/toplamTutar`, `KasaHareketi.tutar` alanları `Float`.
- `prisma/schema.prisma`: platform/firma/tenant modeli yok.
- `prisma/schema.prisma`: `Kullanici.rol` string ve firma operasyon kullanıcısı ile platform kullanıcısı ayrımı yok.
- `public/manifest.json`: Ada Bereket adı ve `#DE0B1E` marka rengi sabit.
- `shared/components/sidebar/SidebarHeader.tsx`: Ada Bereket adı/logo sabit.
- `app/api/tahsilat/dekont/[id]/route.ts`: Ada Bereket fallback firma adı, logo ve TilbeCore footer aynı belge üretim alanında.
- `shared/lib/audit.ts`: UTF-8/mojibake taramasında bozuk Türkçe yorum örneği yakalandı; uygulama koduna bu analiz görevinde dokunulmadı.
- `shared/lib/sidebar-config.ts`: AI, ROI, GPS, entegrasyon ve personel alt modülleri gibi çekirdek dışı veya placeholder alanlar menüde bulunuyor.
