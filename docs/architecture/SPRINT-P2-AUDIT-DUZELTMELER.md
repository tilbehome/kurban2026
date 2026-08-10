# 🔧 SPRINT-P2 — AUDIT BULGULARI 8 KRİTİK DÜZELTME

**Kaynak:** ChatGPT 2. bağımsız audit raporu (26 May 2026 11:30)
**Bayrama:** 18 saat
**Süre:** ~2 saat
**Hedef:** Bayram günü gerçek değer katacak 8 düzeltme

---

## 🎯 ÇÖZÜLECEK 8 SORUN

| # | Sorun | Risk | Süre |
|---|---|---|---|
| 1 | Dashboard auth redirect sonra çalışıyor (veri sızıntısı) | 🔴 KRİTİK | 5 dk |
| 2 | Kasa KPI yetkisize de gidiyor | 🔴 KRİTİK | 15 dk |
| 3 | Dekont doğrulama 4 hex + sabit tuz | 🟠 SAHTE DEKONT | 30 dk |
| 4 | Eşit dağıtımda hisse limit kontrolü yok | 🟠 MUHASEBE | 10 dk |
| 5 | `kurbanAsamaGuncelle` transaction değil | 🟠 YARIM GEÇİŞ | 15 dk |
| 6 | `siralamaGuncelle` transaction değil | 🟠 YARIM SIRA | 10 dk |
| 7 | Paketleme "Paketlendi" yazıyor (yanlış) | 🟢 ETIKET | 5 dk |
| 8 | Dashboard kesim akışı demo veri | 🔴 YANILTICI | 20 dk |

**Toplam: ~1 saat 50 dakika** + 30 dk test = **2 saat 20 dk**

---

## ⛔ DOKUNMA — KIRMIZI ÇİZGİLER

- KUTSAL `/api/tahsilat/odeme` ana akış mantığı
- SPRINT-P0 Sayac modeli + atomic counter
- SPRINT-P1 backup + WAL + rate limit
- SPRINT-12 TV ekranı 4 sütun yapısı
- SPRINT-11 sayaç + otomatik ilerleme
- iron-session yapılandırması
- Migration mevcut sırası

---

## 📋 İŞ 1 — DASHBOARD AUTH SIRASI (5 dk)

### Sorun
`app/page.tsx` içinde `aktifOturum()` çağrılıyor ama redirect AppShell'de yapılıyor. Bu arada `Promise.all` ile KPI, trend, kasa verileri çekiliyor — **yetkisiz kullanıcıya veri sızar**.

### Çözüm

`app/page.tsx` dosyasının en başına ekle:

```ts
import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";

export default async function DashboardPage() {
  // 🔴 EN BAŞA — Diğer her şeyden ÖNCE
  const oturum = await aktifOturum();
  if (!oturum) {
    redirect("/giris?yonlendir=/");
  }

  // Artık güvenli — yetkisiz kullanıcı buraya gelemez
  // ... mevcut Promise.all sorguları
  const [kpi, trend, kesimAkisi, sonIslemler, kasa, whatsapp, yedek] = await Promise.all([
    kpiVerileri(oturum), // 🆕 oturum geçir (İŞ 2 için)
    // ...
  ]);
```

**ÖNEMLİ:** Bu sayede `Promise.all` çağrısı **sadece auth varsa** çalışır.

---

## 📋 İŞ 2 — KASA KPI YETKİ KORUMASI (15 dk)

### Sorun
`kpiVerileri()` her durumda `kasaNetBakiye()` çağırıyor. İzleyici/misafir rolü olan kullanıcı bile **"Kasa Bakiyesi" kartı** görüyor.

### Çözüm

`modules/dashboard/lib/dashboard.service.ts` içindeki `kpiVerileri()` fonksiyonunu güncelle:

```ts
import { izinKontrol } from "@/shared/lib/izinler";
import type { AuthOturum } from "@/shared/types/auth.types";

export async function kpiVerileri(oturum: AuthOturum): Promise<DashboardKpiKart[]> {
  // 🆕 Kasa yetkisi kontrolü
  const kasaYetkisi = izinKontrol(oturum, "kasa.goruntule");

  // Mevcut kartlar
  const musteriKart: DashboardKpiKart = { /* ... mevcut kod ... */ };
  const kurbanKart: DashboardKpiKart = { /* ... */ };
  const hisseKart: DashboardKpiKart = { /* ... */ };
  const tahsilatKart: DashboardKpiKart = { /* ... */ };
  const borcKart: DashboardKpiKart = { /* ... */ };

  const kartlar = [musteriKart, kurbanKart, hisseKart, tahsilatKart, borcKart];

  // 🆕 Sadece yetkili kullanıcıya kasa kartı
  if (kasaYetkisi) {
    const kasaKart: DashboardKpiKart = {
      // ... mevcut kasa kart kodu (kasaNetBakiye çağrısı dahil)
    };
    kartlar.push(kasaKart);
  }

  return kartlar;
}
```

**ÖNEMLİ:** `kasaNetBakiye()` çağrısını **sadece yetki varsa** içeri al — yetki yoksa bile çağrılırsa DB yükü olur.

---

## 📋 İŞ 3 — HMAC DEKONT DOĞRULAMA (30 dk)

### Sorun

Mevcut `dekont-dogrulama-kodu.ts`:
- 4 hex karakter (çok kısa, 65536 olasılık)
- Tuz kod içinde sabit: `ada-bereket-dekont-2026`
- Repo public → tuz herkesçe görülebilir → sahte dekont üretilebilir

### Çözüm

#### A) `.env.example` dosyasına ekle:

```env
# Dekont doğrulama HMAC secret (32+ karakter, rastgele üret)
# Örnek üretim: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DEKONT_DOGRULAMA_SECRET=DEGISTIRILECEK_32_KARAKTERLIK_RASTGELE_HEX
```

#### B) `.env` dosyasına gerçek secret yaz:

Kullanıcı yapacak:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Çıktıyı .env'e ekle: DEKONT_DOGRULAMA_SECRET=...
```

#### C) `modules/tahsilat/dekont/dekont-dogrulama-kodu.ts` rewrite:

```ts
import { createHmac } from "node:crypto";

const SECRET = process.env.DEKONT_DOGRULAMA_SECRET;

// Boot-time kontrol
if (!SECRET || SECRET.length < 32) {
  throw new Error(
    "DEKONT_DOGRULAMA_SECRET .env'de tanımlı değil veya 32 karakterden kısa. " +
    "Üretmek için: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}

interface DogrulamaGirdisi {
  dekontNo: string;
  tarih: Date;
  toplamTutar: number;
}

/**
 * HMAC-SHA256 ile dekont doğrulama kodu üretir.
 * Format: ABH-XXXXXXXXXX (10 hex karakter) — 1 trilyon olasılık
 * Eski format: ABH-XXXX (4 hex, 65K olasılık) - güvensiz
 */
export function dogrulamaKoduUret(g: DogrulamaGirdisi): string {
  const veri = [
    g.dekontNo,
    g.tarih.toISOString().slice(0, 10), // YYYY-MM-DD
    Math.round(g.toplamTutar * 100).toString(), // kuruş
  ].join("|");

  const hash = createHmac("sha256", SECRET!).update(veri).digest("hex");
  // 10 karakter = 16^10 = 1 trilyon olasılık
  return `ABH-${hash.slice(0, 10).toUpperCase()}`;
}

/**
 * Doğrulama kodunu kontrol eder (timing-safe karşılaştırma).
 */
export function dogrulamaKoduDogrula(g: DogrulamaGirdisi, gelenKod: string): boolean {
  const beklenenKod = dogrulamaKoduUret(g);
  // Timing-safe karşılaştırma
  if (beklenenKod.length !== gelenKod.length) return false;
  let fark = 0;
  for (let i = 0; i < beklenenKod.length; i++) {
    fark |= beklenenKod.charCodeAt(i) ^ gelenKod.charCodeAt(i);
  }
  return fark === 0;
}
```

#### D) `/api/dekont/dogrula` endpoint'ine rate limit ekle:

`app/api/dekont/dogrula/route.ts`:

```ts
import { rateLimitKontrol, rateLimitKaydet } from "@/shared/lib/rate-limit";
import { ipCikar } from "@/shared/lib/audit";

const DOGRULAMA_RATE_LIMIT = {
  maxDeneme: 20,
  pencereMs: 60 * 1000,      // 1 dakika
  kilitMs: 5 * 60 * 1000,    // 5 dakika kilit
};

export async function POST(req: Request) {
  const ip = ipCikar(req);

  // 🆕 RATE LIMIT
  const rl = rateLimitKontrol(`dekont-dogrula:${ip}`, DOGRULAMA_RATE_LIMIT);
  if (!rl.izinli) {
    return NextResponse.json(
      { gecerli: false, hata: "Çok fazla deneme. Lütfen biraz bekleyin." },
      { status: 429 },
    );
  }

  // ... mevcut doğrulama mantığı ...

  if (!gecerli) {
    rateLimitKaydet(`dekont-dogrula:${ip}`, false, DOGRULAMA_RATE_LIMIT);
  } else {
    rateLimitKaydet(`dekont-dogrula:${ip}`, true, DOGRULAMA_RATE_LIMIT);
  }
}
```

#### E) Geriye uyumluluk

Mevcut 12 ABH-2026 dekont **eski 4-hex tuzu** ile üretilmiş. Yeni HMAC ile uyumsuz.

İki seçenek:

**Seçenek A (güvenli):** Eski dekontları "ABH-2026-000001 ... 000012" doğrulama kodu yeniden hesaplanır ve DB'de güncellenir (yeni HMAC ile). Migration script:

```ts
// scripts/dekont-dogrulama-kodu-yenile.ts (YENİ)
import { PrismaClient } from "@prisma/client";
import { dogrulamaKoduUret } from "@/modules/tahsilat/dekont/dekont-dogrulama-kodu";

const prisma = new PrismaClient();

async function yenile() {
  const odemeler = await prisma.odeme.findMany({
    where: { dekontNo: { startsWith: "ABH-2026-" } },
    select: { id: true, dekontNo: true, tarih: true, toplamTutar: true },
  });

  console.log(`${odemeler.length} dekont doğrulama kodu yenileniyor...`);

  for (const o of odemeler) {
    // Yeni dekont doğrulama kodu Ödeme tablosunda saklanmıyor — runtime'da üretiliyor
    // Bu durumda script gereksiz, ama eski URL'leri test etmek için faydalı
    const yeniKod = dogrulamaKoduUret({
      dekontNo: o.dekontNo,
      tarih: o.tarih,
      toplamTutar: o.toplamTutar,
    });
    console.log(`  ${o.dekontNo}: yeni kod = ${yeniKod}`);
  }

  await prisma.$disconnect();
}

yenile().catch(console.error);
```

**Seçenek B (kolay):** Doğrulama kodu DB'de tutulmuyor zaten — runtime'da üretiliyor. O yüzden tüm eski QR kodları **artık doğrulamaz** ama:
- Yeni dekontlar (bayram günü üretilecek) yeni HMAC ile çalışır
- Eski 12 dekont test verisi, bayram sonrası temizlenecek
- Risk: SIFIR

**Önerim: Seçenek B** — basit, hızlı, bayram için yeterli.

---

## 📋 İŞ 4 — EŞİT DAĞITIMDA HİSSE LİMİT KONTROLÜ (10 dk)

### Sorun

`app/api/tahsilat/odeme/route.ts` içindeki `hisselereDagit()`:

- Manuel: ✅ hisse bazlı kontrol var
- Sırayla: ✅ kontrol var (SPRINT-P0)
- **Eşit: ❌ hâlâ kontrol yok!**

Örnek:
```
Hisse 1 kalan: 100 TL
Hisse 2 kalan: 10.000 TL
Ödeme: 5.000 TL → Eşit: 2.500+2.500
Hisse 1'e 2.500 yazılır (kalan 100 TL'yi aşar)
```

### Çözüm

`hisselereDagit()` fonksiyonunda **eşit dağıtım branch'inin sonuna** kontrol ekle:

```ts
// Eşit dağıtım
const her = yuvarla(toplam / kalanlar.length);
const sonuc = kalanlar.map((k) => ({ hisseId: k.id, tutar: her }));
const fark = yuvarla(toplam - her * kalanlar.length);
if (fark !== 0 && sonuc.length > 0) {
  sonuc[sonuc.length - 1]!.tutar = yuvarla(sonuc[sonuc.length - 1]!.tutar + fark);
}

// 🆕 HISSE LIMIT KONTROLÜ (eşit dağıtımda da)
for (const t of sonuc) {
  const k = kalanlar.find((x) => x.id === t.hisseId);
  if (!k) continue;
  const maxIzin = Math.max(k.kalan, 0);
  if (t.tutar > maxIzin + 0.01) {
    throw new Error(
      `Eşit dağıtım Hisse ${k.no} kalanını aşıyor. Hisse'ye düşen: ${t.tutar.toFixed(2)} TL, Kalan: ${maxIzin.toFixed(2)} TL. "Sırayla" veya "Manuel" dağıtım deneyin.`
    );
  }
}

return sonuc;
```

**ÖNEMLİ:** Hata UI'da gösterilebilir hale gelir (POST'taki try/catch zaten yakalıyor).

---

## 📋 İŞ 5 — KURBAN AŞAMA TRANSACTION (15 dk)

### Sorun

`modules/tv/lib/kurban-asama.service.ts` içindeki `kurbanAsamaGuncelle()`:

```ts
// MEVCUT (RİSKLİ)
await prisma.kurban.update({ where: { id }, data: kurbanData });
// HATA ÇIKARSA BURADA...
await prisma.hisse.updateMany({ where: { kurbanId }, data: hisseUpdate });
// Hisseler güncellenmedi, kurban güncel — TUTARSIZ DURUM
```

### Çözüm

`prisma.$transaction` ile sar:

```ts
const result = await prisma.$transaction(async (tx) => {
  // 1) Kurban güncelle
  const kurban = await tx.kurban.update({
    where: { id: params.kurbanId },
    data: kurbanData,
  });

  // 2) Hisseleri senkronize et (tartıma kadar)
  if (!hisseSeviyesindeMi(params.yeniDurum)) {
    await tx.hisse.updateMany({
      where: {
        kurbanId: params.kurbanId,
        silindiMi: false,
        musteriId: { not: null },
      },
      data: hisseUpdate,
    });
  }

  // 3) Audit log (transaction içinde değil — kritik değil, ayrı işlem)
  return { kurban, asamaBaslangic: kurbanData.asamaBaslangic };
});

// Audit log transaction dışında (yan etki, tutarlılık şart değil)
await auditYaz({
  eylem: "tv-kurban-asama",
  // ...
});

return result;
```

**ÖNEMLİ:** Audit log transaction dışında çünkü `auditYaz` zaten kendi prisma client'ını kullanıyor (transaction dışı) ve tutarsızlık olsa bile fark etmez.

---

## 📋 İŞ 6 — SIRALAMA TRANSACTION (10 dk)

### Sorun

`modules/tv/lib/tv-sira.service.ts` (veya benzer) içindeki `siralamaGuncelle()`:

```ts
// MEVCUT (RİSKLİ)
for (const item of sira) {
  await prisma.kurban.update({  // Bir update başarısız olursa diğerleri yarım
    where: { id: item.kurbanId },
    data: { operasyonSira: item.operasyonSira },
  });
}
```

### Çözüm

`prisma.$transaction([...])` array versiyonu kullan:

```ts
// 🆕 DUPLICATE KONTROL
const uniq = new Set(sira.map((x) => x.operasyonSira));
if (uniq.size !== sira.length) {
  throw new Error("Operasyon sıra numaraları tekrar edemez");
}

// 🆕 TRANSACTION — hepsi başarılı olur veya hiçbiri olmaz
await prisma.$transaction(
  sira.map((item) =>
    prisma.kurban.update({
      where: { id: item.kurbanId },
      data: { operasyonSira: item.operasyonSira },
    })
  )
);
```

---

## 📋 İŞ 7 — PAKETLEME ETİKET DÜZELTME (5 dk)

### Sorun

`kurbanAsamaGuncelle()` içinde:

```ts
// MEVCUT (YANLIŞ)
if (yeniDurum === "paketleme") {
  hisseUpdate.paketDurumu = "Paketlendi"; // ❌ Bu aşamaya geçilince henüz paketlenmedi!
}
```

Paketleme aşamasına geçen kurban **henüz paketlenmemiştir**, paketlenmekte/paketleniyor durumdadır.

### Çözüm

```ts
if (yeniDurum === "paketleme") {
  hisseUpdate.paketDurumu = "Paketleniyor"; // ✅
}

if (yeniDurum === "teslime_hazir") {
  hisseUpdate.paketDurumu = "Paketlendi"; // ✅ Artık paketlendi
}
```

---

## 📋 İŞ 8 — DASHBOARD KESİM AKIŞI GERÇEK VERİ (20 dk)

### Sorun

`modules/dashboard/lib/dashboard.service.ts` içindeki `kesimAkisiVerisi()` fonksiyonu **hâlâ demo veri üretiyor**. Yorumunda "Gerçek kesim modülü henüz yok" yazıyor. Ama artık SPRINT-12'de gerçek `Kurban.kesimDurumu` mevcut!

### Çözüm

Tüm `kesimAkisiVerisi()` fonksiyonunu rewrite et:

```ts
export async function kesimAkisiVerisi(): Promise<KesimAkisi> {
  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    select: { kesimDurumu: true },
  });

  const toplam = kurbanlar.length;

  // Yardımcı: belirli durumlardaki kurbanları say
  const say = (...durumlar: string[]) =>
    kurbanlar.filter((k) => durumlar.includes(k.kesimDurumu)).length;

  // Yardımcı: aşama objesi üret
  const asama = (
    id: string,
    ad: string,
    sayi: number,
    renk: string,
  ): KesimAsamaSatiri => ({
    id,
    ad,
    sayi,
    oran: toplam > 0 ? Math.round((sayi / toplam) * 100) : 0,
    renk,
  });

  return {
    asamalar: [
      asama("bekleyen", "Bekleyen", say("beklemede"), "stone"),
      asama("vekalet", "Vekalet / Onay", say("vekalet_bekliyor"), "amber"),
      asama("siradaki", "Sırada", say("siradaki", "hazirlik"), "sari"),
      asama("kesimde", "Kesimde", say("kesimde", "deri_yuzme"), "kirmizi"),
      asama("parcalama", "Parçalama", say("parcalama"), "mor"),
      asama("tartim", "Tartım", say("tartimda"), "mavi"),
      asama("paketleme", "Paketleniyor", say("paketleme"), "yesil-koyu"),
      asama("teslim-hazir", "Teslim Hazır", say("teslime_hazir"), "yesil"),
      asama("tamamlandi", "Tamamlandı", say("tamamlandi"), "turkuaz"),
    ],
    sonGuncelleme: new Date().toISOString(),
    canli: true,
    toplamKurban: toplam,
  };
}
```

**ÖNEMLİ NOTLAR:**
- `KesimAkisi` ve `KesimAsamaSatiri` tipleri zaten var, sadece gerçek veri kaynağı kullanıyoruz
- `KesimAkisi` interface'ine `toplamKurban: number` eklenmesi gerekebilir
- "demo veri" yorumunu sil

### UI Tarafı

`modules/dashboard/components/KesimAkisiKart.tsx` (veya benzeri) — yorum güncelle, eğer "demo veri" işareti varsa kaldır.

---

## ✅ TEST ADIM ADIM

```bash
# 1. Type check
pnpm tsc --noEmit

# 2. Build
pnpm build

# 3. .env kontrol
cat .env | grep DEKONT_DOGRULAMA_SECRET
# Yoksa üret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# .env'e ekle: DEKONT_DOGRULAMA_SECRET=...

# 4. Dev
pnpm dev
```

### Tarayıcı Testleri

**Test 1 — Dashboard auth (İŞ 1):**
1. Logout
2. `/` (ana sayfa) doğrudan aç
3. ✅ Hemen `/giris` yönlendirilmeli (Network'te 200 sorgu YOK)
4. ❌ Beklenmedik: KPI'lar console'da Promise.all çalışıyor

**Test 2 — Kasa KPI yetki (İŞ 2):**
1. Admin olarak gir → KPI'da "Kasa Bakiyesi" var ✅
2. Yeni kullanıcı oluştur: "izleyici" rolü, **kasa.goruntule izni YOK**
3. İzleyici ile gir → KPI'da "Kasa Bakiyesi" **YOK** ✅
4. 5 kart görünmeli (Müşteri, Kurban, Hisse, Tahsilat, Borç)

**Test 3 — Dekont HMAC (İŞ 3):**
1. Yeni ödeme al → ABH-2026-NNN
2. Dekontta QR koduna bak: doğrulama kodu **10 karakter**
3. `/dogrula/ABH-2026-NNN` aç → ✅ Doğrulandı
4. Kod manuel değiştir → ❌ "Geçersiz dekont"
5. 25 kez ardarda yanlış kod dene → 429 rate limit

**Test 4 — Eşit dağıtım kontrol (İŞ 4):**
1. Müşteri: 2 hisse var
   - Hisse 1: kalan 100 TL
   - Hisse 2: kalan 10.000 TL
2. Eşit dağıtım seç → 5.000 TL gir
3. ✅ Hata: "Eşit dağıtım Hisse 1 kalanını aşıyor. Hisse'ye düşen: 2500 TL, Kalan: 100 TL"

**Test 5 — Kurban aşama transaction (İŞ 5):**
1. DANA-X seç → "İlerlet"
2. Kurban + 7 hisse aynı anda güncellenmeli
3. Prisma Studio'da kontrol: hepsinin `kesimDurumu` aynı

**Test 6 — Sıralama transaction (İŞ 6):**
1. Kontrol panelinde 2 kurbanın sırasını değiştir
2. ✅ İkisi birlikte güncellendi
3. Aynı sıra no 2 kez verirsen → hata "tekrar edemez"

**Test 7 — Paketleme etiketi (İŞ 7):**
1. DANA-X paketleme aşamasına geçirildi
2. Prisma Studio: hisselerin `paketDurumu` = **"Paketleniyor"** ✅
3. Sonra teslime_hazir aşamasına geçince → `paketDurumu` = **"Paketlendi"** ✅

**Test 8 — Dashboard gerçek veri (İŞ 8):**
1. Dashboard'da "Kesim Akışı" kartı
2. ✅ Gerçek `Kurban.kesimDurumu` sayılarını göstermeli
3. Bir kurban aşaması değiştirildikten sonra refresh → sayılar değişmeli
4. "demo" işareti hiçbir yerde yok

### KUTSAL Kontrolü

- [ ] `/api/tahsilat/odeme` çalışıyor → ABH-2026-NNN
- [ ] Atomic counter çalışıyor (sayaç)
- [ ] Fazla tahsilat hâlâ engelli
- [ ] Manuel dağıtım hisse limit kontrolü
- [ ] Login rate limit çalışıyor
- [ ] Backup VACUUM INTO çalışıyor

---

## 📊 RAPOR FORMATI

Bittiğinde:

```
✅ Commit SHA: ...
✅ pnpm tsc + build temiz

İŞ 1 (Dashboard auth):
✅ aktifOturum → redirect en başta
✅ Logout sonrası direkt erişim → /giris yönlendirme

İŞ 2 (Kasa KPI yetki):
✅ kpiVerileri(oturum) yetki bazlı
✅ İzleyici rolü: 5 kart (kasa YOK)
✅ Admin rolü: 6 kart (kasa VAR)

İŞ 3 (HMAC dekont):
✅ DEKONT_DOGRULAMA_SECRET .env kontrolü
✅ 10 karakter HMAC kod
✅ /api/dekont/dogrula rate limit (20/dk)
✅ Geçersiz kod → 400, doğru kod → 200
✅ 25 yanlış deneme → 429

İŞ 4 (Eşit dağıtım):
✅ Hisse limit aşımı engelleniyor
✅ Hata mesajı net (hangi hisse + tutarlar)

İŞ 5 (Kurban aşama transaction):
✅ Kurban + 7 hisse atomic güncelleniyor
✅ Hata olursa rollback

İŞ 6 (Sıralama transaction):
✅ Tüm sıra updates atomic
✅ Duplicate sıra no engelli

İŞ 7 (Paketleme etiket):
✅ "Paketleme" aşaması → paketDurumu "Paketleniyor"
✅ "Teslime Hazır" aşaması → paketDurumu "Paketlendi"

İŞ 8 (Dashboard gerçek veri):
✅ kesimAkisiVerisi() gerçek Kurban.kesimDurumu kullanıyor
✅ "demo" yorumu silindi
✅ Aşama sayıları gerçek DB'den

KUTSAL:
✅ ABH-2026-000XXX dekont oluştu
✅ Tüm önceki düzeltmeler korunuyor
```

---

## 🎯 BAYRAM GÜNÜ ETKİSİ

**ÖNCESİ:**
- Logout sonra ana sayfa açılınca veri sızıyor
- İzleyici kullanıcı kasa bakiyesi görüyor
- Sahte dekont üretilebilir (tuz public)
- Hisse 1'e fazla tutar yazılabilir
- Aşama geçişi yarım kalabilir
- Sıra değişimi yarım kalabilir
- Paketleme etiketi yanlış
- Dashboard demo veri gösteriyor

**SONRASI:**
- ✅ Auth garanti (veri sızıntısı yok)
- ✅ Yetki bazlı KPI
- ✅ HMAC dekont (1 trilyon olasılık + rate limit)
- ✅ Eşit dağıtım da güvenli
- ✅ Atomic aşama geçişleri
- ✅ Atomic sıra değişiklikleri
- ✅ Doğru etiketler
- ✅ Dashboard %100 gerçek veri

**Risk seviyesi:** 🔴 ORTA → 🟢 DÜŞÜK

---

## 🚨 KULLANICI YAPACAĞI EYLEMLER (TAMAMLANDIKTAN SONRA)

1. **`.env` dosyasına `DEKONT_DOGRULAMA_SECRET` ekle:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Çıktıyı `.env`'e ekle.

2. **Dev server'ı yeniden başlat** (env değişikliği için)

3. **Yeni ödeme al, dekont kodunu test et**

---

## ⏰ SÜRE BREAKDOWN

| İş | Süre |
|---|---|
| İŞ 1: Dashboard auth | 5 dk |
| İŞ 2: Kasa KPI yetki | 15 dk |
| İŞ 3: HMAC dekont | 30 dk |
| İŞ 4: Eşit dağıtım | 10 dk |
| İŞ 5: Kurban aşama tx | 15 dk |
| İŞ 6: Sıralama tx | 10 dk |
| İŞ 7: Paketleme etiket | 5 dk |
| İŞ 8: Dashboard veri | 20 dk |
| **Test + commit** | **30 dk** |
| **TOPLAM** | **~2 saat 20 dk** |

---

## 💡 ÖNEMLİ NOTLAR

1. **Migration YOK:** Tüm değişiklikler sadece TS/JS kod. Schema dokunulmuyor.
2. **Geriye uyumlu:** Eski dekontlar çalışıyor (sadece doğrulama kodu yeni HMAC ile uyumsuz, ama eski 12 dekont test verisi).
3. **Performans nötr:** Transaction eklemeler hızı etkilemez (SQLite WAL ile zaten hızlı).
4. **KUTSAL korundu:** Hiçbir tahsilat akışı bozulmuyor, sadece eklemeler.

Bittikten sonra **bayram günü çok daha sağlam** sistem olacak. 🎯
