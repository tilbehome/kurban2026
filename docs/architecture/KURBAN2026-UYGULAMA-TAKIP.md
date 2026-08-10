# TilbeCore – Kurban Takip Uygulama Takip Defteri

Birinci kaynak sözleşme: `docs/architecture/TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md`

Eski ana yol haritası, yeni ana belgeyle çelişmeyen tarihsel analiz kaynağıdır: `docs/archive/legacy/KURBAN2026-ANA-ANALIZ-VE-GELISTIRME-YOL-HARITASI.md`

Bu defter, yol haritasındaki fazları ve 68 iş akışını kod değişikliklerine bağlamak için tutulur. Bir iş “tamamlandı” sayılmadan önce kod, yetki, hata senaryosu, test ve kabul kanıtı birlikte değerlendirilir.

## Faz 1 / P0 — güvenlik ve teknik stabilizasyon

**Durum:** Tamamlandı ve `origin/main` dalına gönderildi.

**Commit:** `a6720378123f01fb4e19db3fd782a910f18c0acf`

| İş | Bağlı akışlar | Durum | Kanıt |
|---|---:|---|---|
| Eksik API yetkileri | 60, 61 | Tamamlandı | `hisseler.ata`, `kasa.*`, `musteriler.*`, `hayvanlar.olustur`, `musteriler.vekalet.oku` kontrolleri eklendi. |
| Hisse atama race condition | 20, 21, 25 | Tamamlandı | Tekli ve toplu atama transaction + `musteriId=null` koşullu update kullanıyor; kısmi toplu atama kaldırıldı. |
| Ödemeli hisse iptal kilidi | 27, 33, 35 | Tamamlandı | Aktif tahsilat varsa hisse boşaltma 409 ile reddediliyor. |
| Hassas veri ignore kuralları | 62, 63 | Tamamlandı | SQLite WAL/SHM, seed kopyaları, `public/uploads/`, `data/uploads/` ignore ediliyor. |
| Korumalı vekâlet dosyası | 38, 62 | Tamamlandı | Yeni dosyalar `data/uploads/vekalet` altına yazılıyor, DB fiziksel yol göstermiyor, okuma `/api/vekaletler/[id]` üzerinden yetkili ve no-store. |
| Eski vekâlet taşıma hazırlığı | 38, 62 | Tamamlandı | `scripts/migrate-vekalet-files.mjs` eklendi; varsayılan dry-run, `--apply` verilmeden veri değiştirmiyor. |
| Saha satış + kapora atomikliği | 21, 22, 29, 30 | Tamamlandı | `/api/saha-satis` atama + opsiyonel kaporayı tek transaction içinde yapıyor, `clientRequestId` ile idempotent tekrarları engelliyor. |
| Build/start güvenliği | 63, 64, 65 | Tamamlandı | `baslat.bat` build yoksa loop'a girmiyor; `pnpm build` başarılı. |
| Lint kalite kapısı | 14, 23.2, 24.12 | Tamamlandı | `pnpm lint` 0 hata ile tamamlanıyor; kalan 41 warning sınıflandırıldı. |
| Node/pnpm sabitleme | 63, 65 | Tamamlandı | `packageManager` ve `engines` eklendi. |
| UTF-8 tarama kapısı | 52 | Faz 1 altyapısı eklendi | `scripts/check-utf8.mjs` ve `pnpm check:utf8` eklendi; aktif kaynaklarda mojibake kontrolü testle sabitlendi. |
| Merkezi hata katalogu | 53, 60, 62 | Faz 1 altyapısı eklendi | `shared/lib/hata-katalogu.ts`, `shared/lib/api-hata.ts`, geriye uyumlu `hata` alanı ve yeni `kod/mesajAnahtari/parametreler/requestId` alanları eklendi. |
| i18n/dil paketi temeli | 54, 55 | Faz 1 altyapısı eklendi | `tr/en/ar` locale iskeleti, TR fallback, parametreli mesaj çözümü, RTL yön bilgisi ve TRY format yardımcıları eklendi. |
| Pilot route hata dönüşümü | 2, 21, 24, 29, 52, 53, 60, 61, 62 | Faz 1 pilot uygulandı | `/api/saha-satis`, `/api/hisseler/ata`, `/api/hisseler/toplu-ata`, `/api/hisseler/[id]/iptal`, `/api/vekaletler/[id]` merkezi hata yanıtına bağlandı. |
| Program genel kapsam envanteri | Tüm program | Faz 1 analiz checkpoint'i eklendi | `docs/architecture/14-PROGRAM-TAM-KAPSAM-ENVANTERI.md` ile repo genelindeki sayfa, API, bileşen, Prisma modeli, placeholder ve dönüşüm listeleri izlenebilir hale getirildi. |

## Son doğrulama komutları

| Komut | Sonuç |
|---|---|
| `pnpm exec tsc --noEmit` | Geçti |
| `pnpm test` | Geçti — 7 dosya, 84 test |
| `pnpm lint` | Geçti — 0 hata, 38 warning |
| `pnpm build` | Geçti — Next.js production build başarılı, `.next/BUILD_ID` üretildi |
| `node scripts/migrate-vekalet-files.mjs` | Geçti — dry-run, taşınacak/başarısız kayıt yok |
| Local HTTP smoke | Geçti — `GET /giris` 200, `GET /uploads/vekalet/test.png` 403 |

## Eklenen test kapsamı

- `/api/saha-satis`: yetkisiz erişim, başarılı kaporalı satış, eşzamanlı hisse dolması, satılmış hisse, eksik müşteri/hisse, tutar validasyonları, idempotent tekrar, gizli hata sızdırmama.
- `/api/hisseler/toplu-ata`: hisselerden biri doluysa hiçbir atama yazmama.
- `/api/hisseler/[id]/iptal`: ödemesi olan hisseyi doğrudan boşaltmayı engelleme.
- `shared/lib/vekalet-dosya`: API URL üretimi, dosya adı/path traversal koruması, yeni ve legacy dosya çözümleme.
- `shared/lib/i18n`: Türkçe karakter koruması, TR fallback, eksik anahtar davranışı, `ar` RTL ve TRY para formatı.
- `shared/lib/api-hata`: katalog eşleşmesi, geriye uyumlu hata gövdesi, beklenmeyen hatada stack/secret sızdırmama.
- `scripts/check-utf8.mjs`: kaynak ağacında bilinen mojibake desenlerini yakalayan kalite kapısı.

## Lint warning sınıflandırması

- Kullanılmayan import/değişkenler: müşteri, rapor, tahsilat, hayvan, TV ve sidebar bileşenlerinde kozmetik/dead-code niteliğinde.
- Kullanılmayan `eslint-disable` satırları: bazı React hook uyarıları artık global Faz 1 ayarıyla bastırıldığı için etkisiz kalmış.
- Güvenlik veya veri bütünlüğü açısından P0 engelleyici warning görülmedi.

## Bilerek ertelenenler

1. Saha satış ekranında yeni müşteri oluşturma: P0 atomiklik kuruldu; yeni müşteri yaratma ayrı davranış ve UX kararı gerektirdiği için Faz 2 paketine bırakıldı.
2. Çoklu firma mimarisi: P0/Faz 1 kapanmadan başlanmadı; yeni ana belgeye göre veri izolasyonu ve çok firma temeli Faz 2’de zorunlu çekirdek kapsamdır.
3. Ürün kimliği/platform panelleri: Faz 1 dışında tutuldu; Platform Süper Admin ve Firma Admin ayrımı Faz 2B/2C paketlerinde ele alınacaktır.
4. Para modeli `Float` dönüşümü: Canlı veri migrasyon kararı ve yedek planı gerektirdiği için ayrı migrasyon paketi olarak ele alınacak.
5. Tüm UI metinlerinin i18n'e taşınması: Faz 1'de altyapı ve pilot API hataları tamamlandı; ekran bazlı metin taşıma sonraki dil/RTL fazına bırakıldı.
6. Tam Arapça/İngilizce çeviri seti: Faz 1'de `tr` ana kaynak ve `en/ar` genişleyebilir iskelet kuruldu; eksik çeviriler Türkçeye düşer.
7. Program genelindeki tüm route ve ekranların merkezi hata/i18n dönüşümü: Faz 1'de ortak altyapı ve beş pilot route tamamlandı; kalan route grupları program kapsam envanterinde dönüşüm listesine alındı.

## Geri alma notu

Bu P0 paketi tek commit olarak tutulur. Geri alma gerektiğinde commit revert edilerek kod geri alınabilir. Vekâlet migrasyon scripti dry-run varsayılanlıdır; `--apply` çalıştırılmadıkça gerçek dosya/DB taşıması yapmaz.

## Faz 2 durumu

**Durum:** Henüz başlamadı.

**Sıradaki aşama:** Faz 2A — mimari sözleşme, gelişmiş dizin/monorepo iskeleti ve taşıma planı.

Faz 2A başlamadan önce dokümantasyon uyumu, import grafiği, taşıma matrisi, platform/tenant veri sınırı ADR’si ve tenant isolation test planı hazırlanmalıdır. Faz 2A sırasında kaynak davranışı, Prisma şeması ve üretim verisi değiştirilmeden önce ayrıca uygulama kapsamı onaylanır.
