---
id: ARCH-A4BD18EE7008
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# 🔍 SPRINT-AUDIT-VERILER — GERÇEK VERİ DENETİMİ

**Amaç:** Tüm sayfalar, kartlar, KPI'lar, grafikler, listeler, raporlar ve bildirimler **gerçek Prisma sorgusu ile** veri çekiyor mu kontrol et. Hiçbir yerde:

- ❌ Math.random()
- ❌ Hard-coded sayılar (örn. "Toplam: 63", "Borç: 100.000 TL")
- ❌ Mock/dummy/sample/fake data
- ❌ Sahte trend, grafik, ya da chart verisi
- ❌ Statik müşteri/kurban/ödeme örnekleri
- ❌ Placeholder array'leri (boş `[]` defaultlardan farklı, içinde sahte item olanlar)
- ❌ Geliştirme aşamasından kalmış `const fakeOdemeler = [...]` benzeri

olmamalı. **Her yüzey gerçek DB'ye dayanmalı.**

---

## ⛔ DOKUNMA

- Bu sprint **SADECE DENETİM**. Hiçbir kod değiştirme.
- Sadece sorunlu yerleri **rapor olarak yaz**.
- Eğer sorun bulunursa ayrı bir mini-prompt için liste hazırla.

---

## 📋 İŞ 1 — KOD TABANI TARAMA

Aşağıdaki komutları çalıştır ve her birinin **bulgu sayısını** + **dosya listesini** raporla:

### A) Random veri üreten kod

```bash
grep -rn "Math.random" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  app/ modules/ shared/ scripts/ 2>/dev/null
```

### B) Faker/mock library import'ları

```bash
grep -rn "from ['\"]\\(@faker-js\\|faker\\|@mswjs\\|msw\\)" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules app/ modules/ shared/ 2>/dev/null
```

### C) "fake", "mock", "dummy", "demo", "sample" değişkenler

```bash
grep -rEn "(const|let|var)\\s+(fake|mock|dummy|demo|sample|test|sahte|ornek)[A-Z]" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=scripts \
  app/ modules/ shared/ 2>/dev/null
```

(scripts/ klasörü hariç çünkü test scriptleri olabilir — bayram günü çalışmazlar)

### D) Hard-coded büyük sayı dizileri (chart/trend verisi)

```bash
grep -rEn "\\[\\s*[0-9]+\\s*,\\s*[0-9]+\\s*,\\s*[0-9]+\\s*,\\s*[0-9]+" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  app/ modules/ shared/ 2>/dev/null
```

### E) TODO/FIXME/HACK yorumları (eksik implementasyon işareti)

```bash
grep -rEn "//\\s*(TODO|FIXME|HACK|XXX|MOCK|TEMP|GERÇEKVERI|GERCEKVERI|PLACEHOLDER)" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  app/ modules/ shared/ 2>/dev/null
```

### F) `useState` veya `useMemo` ile statik dizi

```bash
grep -rEn "(useState|useMemo)\\(.*\\[\\{.*name.*:.*['\"]" \
  --include="*.tsx" \
  --exclude-dir=node_modules \
  app/ modules/ 2>/dev/null
```

(Initial state olarak hard-coded müşteri/kurban objesi var mı?)

---

## 📋 İŞ 2 — KRİTİK YÜZEYLERİ MANUEL DENETLE

Aşağıdaki **15 sayfanın her birinin server query'sini** kontrol et. Her sayfa için:

1. `prisma.X.findMany()` veya `prisma.X.count()` çağırıyor mu?
2. Çağırdığı veri **gerçek tabloya** mı yoksa **hard-coded constant'a** mı bağlanıyor?
3. Sayfada görünen **her sayı**, **her isim**, **her TL tutarı** DB'den mi geliyor?

### Sayfalar:

| # | Sayfa | Beklenen DB Sorgusu |
|---|---|---|
| 1 | `app/page.tsx` (Dashboard) | KPI'lar: `prisma.musteri.count`, `prisma.kurban.count`, `prisma.odeme.aggregate({_sum: {toplamTutar}})`, vb. |
| 2 | `app/musteriler/page.tsx` | `prisma.musteri.findMany({where: {silindiMi: false}})` |
| 3 | `app/musteriler/[id]/page.tsx` | `prisma.musteri.findUnique` + hisseler + ödemeler |
| 4 | `app/hayvanlar/page.tsx` | `prisma.kurban.findMany` + hisseler |
| 5 | `app/hayvanlar/[id]/page.tsx` | `prisma.kurban.findUnique` |
| 6 | `app/tahsilat/page.tsx` | Müşteri arama + bekleyen ödemeler |
| 7 | `app/tahsilat/dekontlar/page.tsx` | `prisma.odeme.findMany` |
| 8 | `app/kasa/page.tsx` | Kasa özet — `prisma.kasaHareketi.aggregate` |
| 9 | `app/kasa/hareketler/page.tsx` | `prisma.kasaHareketi.findMany` |
| 10 | `app/raporlar/*` (TÜM rapor sayfaları) | Hiçbirinde mock olmamalı |
| 11 | `app/tv/page.tsx` (Canlı ekran) | `getTumVeriler()` — kontrol edildi ✅ |
| 12 | `app/tv/kontrol/page.tsx` | `prisma.kurban.findMany` — kontrol edildi ✅ |
| 13 | `app/tv/personel/page.tsx` | `/api/tv/personel-gorevler` |
| 14 | `app/whatsapp/*` (WhatsApp sayfaları) | `prisma.musteri.findMany` filtreli |
| 15 | `app/ayarlar/*` | `prisma.ayar` + `prisma.kullanici` |

Her sayfa için **dosya yolu + bulgu** formatında raporla:

```
✅ app/page.tsx → Tüm KPI'lar prisma sorgusundan (4 query paralel)
⚠️ app/raporlar/grafik/page.tsx → "trendVerisi" prop hard-coded sayı dizisi (mock?)
❌ app/dashboard/components/PerformansKart.tsx → const veriler = [100, 200, 350] (FAKE!)
```

---

## 📋 İŞ 3 — TV CANLI EKRAN ÖZEL DENETIM (en kritik)

TV ekranı bayram günü herkes görecek. **Hiçbir** sahte veri olmamalı:

### A) `/tv` (Canlı ekran)

- [ ] Üst KPI 5 kart → `getKpiVerileri()` Prisma sorgu mu? (commit 19b7e83 evet diyor)
- [ ] 4 sütun → `getSutunVerileri()` Prisma sorgu mu?
- [ ] Operasyon istatistik kartı → `getOperasyonIstatistik()`
- [ ] Alt şerit metinleri → `prisma.tvAyari.findMany()`
- [ ] Acil durum mesajı → `prisma.tvAyari.findUnique`
- [ ] Firma adı → `prisma.ayar` ("firma_adi")
- [ ] Saat/Tarih → `Date.now()` (gerçek sistem saati — OK)

### B) Müşteri takip ekranı `/tv/m`

- [ ] Müşteri arama → `prisma.musteri.findMany` (rate limit ile)
- [ ] Kurban listesi → gerçek hisse-müşteri ilişkisi
- [ ] Aşama durumu → `prisma.kurban.kesimDurumu`

### C) Personel paneli `/tv/personel`

- [ ] Görev listesi → `/api/tv/personel-gorevler` (gerçek Kurban sorgusu)
- [ ] Aktif iş → `prisma.kurban.findUnique`
- [ ] Boş hisse uyarısı → gerçek `Hisse.musteriId IS NULL` sayımı

---

## 📋 İŞ 4 — DASHBOARD KPI DENETİMİ

`app/page.tsx` (ana sayfa) — bayram günü ilk açılan ekran. **Her bir sayı** DB'den gelmeli.

### Kontrol edilecek KPI'lar:

```
- Toplam Müşteri sayısı            → prisma.musteri.count({where: {silindiMi: false}})
- Toplam Kurban sayısı             → prisma.kurban.count({where: {silindiMi: false}})
- Bugünkü Tahsilat                 → prisma.odeme.aggregate({sum, where: tarih})
- Toplam Tahsilat                  → prisma.odeme.aggregate({sum})
- Borçlu Müşteri sayısı            → Hisse.kalan > 0 olanlar
- Toplam Borç                      → kalanların toplamı
- Vekalet Eksik sayısı             → Hisse.vekaletAlindi = false
- Boş Hisse sayısı                 → Hisse.musteriId IS NULL
- Bayram'a kalan gün sayısı        → 2026-05-27 - bugün (gerçek hesap)
```

Her birinin **gerçek tablodan** geldiğini doğrula. Eğer **`const toplamMusteri = 240`** gibi hard-coded varsa **HATA**.

### Trend/Grafik

Eğer dashboard'da bir **grafik/chart** varsa (örn. saatlik tahsilat grafiği):
- [ ] X ekseni veri → `prisma.odeme.groupBy({by: ['tarih'], _sum: {toplamTutar}})`
- [ ] Y ekseni veri → gerçek toplamlar
- [ ] **`const grafikVeri = [{saat: '09:00', tutar: 5000}, ...]`** olmamalı

---

## 📋 İŞ 5 — RAPORLAR DENETIMI

`app/raporlar/*` altındaki **tüm rapor sayfaları** kontrol edilmeli:

### Sayfalar:

| Rapor | DB Kaynağı |
|---|---|
| `/raporlar/genel-bakis` | Toplam müşteri/kurban/ödeme aggregate |
| `/raporlar/tahsilat` | `prisma.odeme.findMany` |
| `/raporlar/borclu` | Hisse.kalan > 0 hesabı |
| `/raporlar/kurban-doluluk` | Hisse.musteriId sayımı |
| `/raporlar/operasyon` | Kurban.kesimDurumu dağılımı |
| `/raporlar/kasa` | KasaHareketi.findMany |
| `/raporlar/kesim-listesi` | `prisma.kurban.findMany` (kontrol edildi ✅) |
| `/raporlar/kasa-teslim` | `prisma.odeme + kasaHareketi` (kontrol edildi ✅) |

Excel export endpoint'leri:
- `/api/raporlar/excel/*` — XLSX library kullanır ama VERİ DB'den geliyor mu?

---

## 📋 İŞ 6 — SEED + TEST VERİSİ DURUMU

Bayram için son kontrol:

### A) Mevcut DB içeriği

```bash
pnpm tsx scripts/bayram-hazirlik-kontrol.ts
```

**Önceki çıktıya göre:**
- 240 müşteri
- 63 kurban
- 441 hisse (63 × 7)
- 5 ABH-2026 dekont (KUTSAL testlerden)

**Bunlar TEST VERİLERİ mi yoksa gerçek mi?** Eğer test verisi ise:
- ⚠️ Bayram öncesi **silinmeli** ve gerçek veri yüklenmeli
- ✅ Audit log + Ayar tablosu + Kullanıcı tablosu KORUNMALI

### B) Seed dosyası kontrolü

`prisma/seed.ts` veya benzeri dosya var mı?

```bash
ls -la prisma/seed* prisma/*.ts 2>/dev/null
```

İçerikte:
- [ ] Sadece **sistem ayarları** (Ayar tablosu, varsayılan WhatsApp şablonları, ilk admin) olmalı
- [ ] **HİÇ örnek müşteri/kurban** olmamalı (yoksa bayram öncesi prod'a yanlışlıkla gider)

Eğer seed'de örnek veri varsa:
```ts
// ❌ KÖTÜ
await prisma.musteri.create({
  data: { adSoyad: "Test Müşteri", telefon: "0555..." }
});

// ✅ İYİ
// (sadece Ayar + Kullanici + WhatsAppSablonu seed edilir)
```

### C) `seed-data.json` veya benzeri dosya

```bash
find . -name "seed-data*" -o -name "fake-data*" -o -name "test-data*" 2>/dev/null \
  | grep -v node_modules
```

Bulunursa:
- Repo'ya commit edilmiş mi? `git ls-files | grep seed-data`
- `.gitignore`'da mı?

---

## 📋 İŞ 7 — BİLDİRİM / WHATSAPP DENETIMI

WhatsApp gönderim sayfaları:

### Kontrol edilecek:

- [ ] `/whatsapp/borclular` → `prisma.hisse + odeme` ile gerçek borç hesabı
- [ ] `/whatsapp/sablonlar` → `prisma.whatsAppSablonu`
- [ ] `/whatsapp/gecmis` → `prisma.whatsAppGonderim`

**Bekleyen müşteri sayısı**, **telefon listesi**, **borç tutarları** — hepsi gerçek olmalı.

### Push bildirim

- [ ] `/api/tv/push-gonder` → gerçek `prisma.pushAbonelik` listesi
- [ ] Push mesaj içeriği → gerçek `Kurban.kesimDurumu` durum mu, yoksa sabit metin mi?

---

## 📋 İŞ 8 — API ENDPOINT DENETİMİ

Tüm API endpoint'leri (app/api/**/*.ts):

```bash
find app/api -name "*.ts" -type f 2>/dev/null
```

Her endpoint için:

1. `prisma.X` çağrısı yapıyor mu?
2. Yanıt JSON'unda hard-coded veri var mı? (`return NextResponse.json({ data: [{...mock}] })`)
3. Eğer endpoint **istatistik** dönüyorsa, gerçek aggregate sorgusu mu?

Özel risk noktaları:

- `/api/dashboard/*` — istatistik endpoint'leri
- `/api/tv/*` — TV verileri
- `/api/raporlar/*` — rapor verileri

---

## 📊 RAPOR FORMATI

Çıktıyı **DATABASE_FACE_AUDIT.md** olarak kaydet (repo'ya commit etmeden, sadece kök klasöre):

```md
# 🔍 GERÇEK VERİ DENETİMİ RAPORU

## Özet

| Kategori | Bulgu Sayısı |
|---|---|
| Math.random kullanımı | 0 / N |
| Faker/mock library | 0 / N |
| Hard-coded test data | 0 / N |
| TODO/FIXME yorumu | X |
| Sahte chart verisi | X |
| **TOPLAM SORUN** | **Y** |

## Bulgular

### 🔴 KRİTİK (Bayramdan önce düzeltilmeli)

#### 1. [Dosya adı]:[satır]
**Sorun:** [açıklama]
**Etki:** [hangi yüzeyde fake veri gösteriyor]
**Çözüm önerisi:** [ne yapılmalı]

### 🟠 ORTA (Bayram sonrası yeterli)
...

### 🟢 BİLGİLENDİRME (Sorun değil ama dikkat)
...

## Yüzey Bazlı Kontrol

### ✅ TEMİZ (gerçek DB verisi)
- app/page.tsx (Dashboard)
- app/musteriler/page.tsx
- ...

### ⚠️ KISMÎ
- ...

### ❌ SORUNLU
- ...

## Sonuç

Sistem [%X] gerçek veri kullanıyor.
Bayram için [HAZIR / DÜZELTME GEREKİR].
```

---

## ✅ EYLEM PLANI

1. **`pnpm tsc --noEmit && pnpm build`** çalıştır (mevcut sistem temiz mi?)
2. Yukarıdaki **8 iş**'i sırayla yap
3. **DATABASE_FACE_AUDIT.md** raporunu hazırla
4. Eğer **kritik bulgu** varsa:
   - Bulguları listele
   - Her biri için **mini düzeltme prompt'u** öneri olarak yaz
   - Ben sonra ayrı bir SPRINT olarak hazırlarım

**Süre tahmini: 30-45 dakika denetim + 15 dakika rapor = ~1 saat**

---

## 🎯 BEKLENEN SONUÇ

Bayrama 23 saat kala net cevap:

| Soru | Beklenen |
|---|---|
| Math.random var mı? | ❌ Hayır (önceki taramada da temizdi) |
| Mock veri var mı? | ❌ Hayır |
| Hard-coded sayı var mı? | ❌ Hayır |
| Tüm KPI'lar DB'den mi? | ✅ Evet |
| Tüm trend/grafik DB'den mi? | ✅ Evet |
| TV ekranı %100 gerçek mi? | ✅ Evet (SPRINT-12'de teyit edildi) |
| Seed dosyası temiz mi? | ✅ Sadece sistem ayarları |

**Eğer her şey ✅ ise:** Sistem gerçek operasyona %100 hazır.

**Eğer sorun bulunursa:** Mini düzeltme prompt'u ben hazırlarım (5-10 dakika iş).

---

## 🚨 ÖNEMLİ

Bu sprint sadece **DENETİM**. **HİÇBİR KOD DEĞİŞİKLİĞİ YAPMA**. Sadece:

1. Grep komutları çalıştır
2. Bulguları kaydet
3. `DATABASE_FACE_AUDIT.md` raporu oluştur
4. Bana raporu paylaş

Sonra ne yapacağımıza birlikte karar veririz.
