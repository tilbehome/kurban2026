# 00 — Mevcut Durum Analizi

## Kaynak doğrulama

| Kaynak | Durum | Kanıt |
|---|---|---|
| Ana yol haritası | Okundu / mevcut | `C:\Users\PC\Downloads\2026kuban\KURBAN2026-ANA-ANALIZ-VE-GELISTIRME-YOL-HARITASI.md`, 76 KB, 2026-08-07 |
| P0 takip defteri | Okundu / mevcut | `docs/KURBAN2026-UYGULAMA-TAKIP.md` |
| Mimari belge | Okundu / mevcut | `MIMARI.md` |
| Veri yüzey audit | Okundu / mevcut | `DATABASE_FACE_AUDIT.md` |
| README | Okundu / mevcut | `README.md` |
| Prisma şeması | Okundu / mevcut | `prisma/schema.prisma` |
| Testler | Okundu / mevcut | `shared/lib/*.test.ts`, `modules/tahsilat/lib/dagitim.test.ts`, `tests/*.test.ts` |
| P0 diff | Okundu / mevcut | `e47bbe5 fix: harden P0 security and atomic saha sales` |
| Repo yapısı | Taranmış | `app`, `modules`, `shared`, `components`, `scripts`, `public` |

Ana yol haritasında istenen bölümler mevcut: kesinleşen iş kuralları, zorunlu modül envanteri, kapsam sadeleştirme, gereksinim–faz–kabul testi izlenebilirliği, çoklu iş akışı mimarisi ve 68 ayrı iş akışı.

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
- Platform Süper Admin ayrı kimlik alanı olarak yok.
- API route dosyalarında iş kuralları büyümüş durumda; örnekler: `app/api/tahsilat/odeme/route.ts` 398 satır, `app/api/saha-satis/route.ts` 309 satır, `app/api/tv/kurban-asama/route.ts` 196 satır.
- Marka/firma kimliği karışık: `public/manifest.json`, `shared/components/sidebar/SidebarHeader.tsx`, `app/api/tahsilat/dekont/[id]/route.ts`, seed dosyaları.
- Çoklu dil/RTL temeli yok.
- Çok sayıda placeholder veya sonraki faz ekranı menüde görünür durumda.

## P0 geri dönüş noktası

- HEAD: `e47bbe5`.
- Commit mesajı: `fix: harden P0 security and atomic saha sales`.
- Branch `main`, `origin/main` üzerinde 1 commit ileride.
- Bu commit mimari dönüşüm için güvenli geri dönüş noktasıdır.

## İlk önemli teknik kanıtlar

- `prisma/schema.prisma`: `Kurban.satisBedeli`, `Hisse.hisseFiyati`, `Odeme.nakit/havale/kart/toplamTutar`, `KasaHareketi.tutar` alanları `Float`.
- `prisma/schema.prisma`: platform/firma/tenant modeli yok.
- `prisma/schema.prisma`: `Kullanici.rol` string ve firma operasyon kullanıcısı ile platform kullanıcısı ayrımı yok.
- `public/manifest.json`: Ada Bereket adı ve `#DE0B1E` marka rengi sabit.
- `shared/components/sidebar/SidebarHeader.tsx`: Ada Bereket adı/logo sabit.
- `app/api/tahsilat/dekont/[id]/route.ts`: Ada Bereket fallback firma adı, logo ve TilbeCore footer aynı belge üretim alanında.
- `shared/lib/audit.ts`: UTF-8/mojibake taramasında bozuk Türkçe yorum örneği yakalandı; uygulama koduna bu analiz görevinde dokunulmadı.
- `shared/lib/sidebar-config.ts`: AI, ROI, GPS, entegrasyon ve personel alt modülleri gibi çekirdek dışı veya placeholder alanlar menüde bulunuyor.
