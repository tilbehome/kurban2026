# 🚨 SPRINT-P0 — 3 KRİTİK BAYRAM HAZIRLIK DÜZELTMESİ

**Kaynak:** ChatGPT bağımsız audit raporu (25 May 2026)
**Bayrama:** 33 saat
**Hedef:** Bayram günü çakışma + brute force + muhasebe karmaşası riskini SIFIRLAMAK

---

## 🎯 ÇÖZECEĞIMIZ 3 KRİTİK SORUN

| # | Sorun | Bayram Riski | Süre |
|---|---|---|---|
| 1 | **Dekont numarası atomik değil** | 2 kasiyer aynı anda → biri P2002 hatası, müşteri 5dk bekler | 30 dk |
| 2 | **Login rate limit yok** | LAN'da brute force riski (admin/tilbe2026 README'de yazılı) | 20 dk |
| 3 | **Fazla tahsilat sessizce yazılıyor** | Yanlış girilen tutar gece muhasebe karmaşası | 10 dk |

**Toplam: 60 dakika + 30 dakika test = 1.5 saat**

---

## ⛔ DOKUNMA — KIRMIZI ÇİZGİLER

- KUTSAL `/api/tahsilat/odeme` ana mantığı — sadece **kontrol eklemeleri** yapılacak, akış aynı
- Mevcut `Odeme` schema'sı dokunulmaz (sadece yeni `Sayac` modeli eklenir)
- Mevcut TKR-2026 ve ABH-2026 dekontlar **geriye uyumlu** kalır
- `iron-session` mekanizması
- Audit log akışı
- Mevcut RateLimit kullanılan public endpoint'ler (`/api/tv/musteri-bul` rate limit'i bozma)

---

## 📋 İŞ 1 — DEKONT NUMARASI ATOMIK SAYAÇ

### Sorun

`modules/tahsilat/lib/tahsilat.service.ts` içindeki `sonrakiDekontNo()`:

```ts
// MEVCUT (RİSKLİ)
const son = await prisma.odeme.findFirst({...});  // Transaction DIŞINDA
// ...
return prefix + String(sira).padStart(6, "0");
```

İki kasiyer aynı anda → ikisi de "son=5" okur → ikisi "6" üretir → biri `P2002 unique constraint` hatası alır.

### Çözüm — Atomic Counter

**A) Schema'ya `Sayac` modeli ekle:**

`prisma/schema.prisma` en alta:

```prisma
/// Atomik sayaçlar — dekont numarası ve benzeri (concurrent-safe)
model Sayac {
  anahtar String @id        // "dekont_ABH-2026-" gibi
  deger   Int    @default(0)

  guncelTarih DateTime @updatedAt
}
```

Migration:
```bash
pnpm prisma migrate dev --name add_sayac_modeli
pnpm prisma generate
```

**B) `sonrakiDekontNo()` rewrite (transaction parametresi alacak):**

```ts
import type { Prisma } from "@prisma/client";

/**
 * Sıradaki dekont no'yu atomik olarak üretir.
 * Transaction client'ı zorunlu — concurrent kasiyerler arasında çakışma olmaz.
 */
export async function sonrakiDekontNo(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const prefix = await ayarOku("dekont_prefix", "ABH-2026-");
  const anahtar = `dekont_${prefix}`;

  // Atomic upsert + increment
  const sayac = await tx.sayac.upsert({
    where: { anahtar },
    create: {
      anahtar,
      deger: await ilkSayacDegeri(tx, prefix),
    },
    update: { deger: { increment: 1 } },
  });

  return prefix + String(sayac.deger).padStart(6, "0");
}

/**
 * Mevcut max dekont numarasından başla (geriye uyumluluk).
 * Sadece ilk upsert'te çağrılır.
 */
async function ilkSayacDegeri(
  tx: Prisma.TransactionClient,
  prefix: string,
): Promise<number> {
  const son = await tx.odeme.findFirst({
    where: { dekontNo: { startsWith: prefix } },
    orderBy: { id: "desc" },
    select: { dekontNo: true },
  });

  if (!son?.dekontNo) return 1;

  const m = son.dekontNo.slice(prefix.length).match(/^(\d+)$/);
  if (!m) return 1;

  return parseInt(m[1]!, 10) + 1;
}
```

**ÖNEMLİ:** Eski signature `sonrakiDekontNo(): Promise<string>` → yeni `sonrakiDekontNo(tx): Promise<string>`. Bu **breaking change**, çağıran yerleri güncelle.

**C) `/api/tahsilat/odeme/route.ts` güncelle:**

Mevcut transaction içindeki çağrı:
```ts
const dekontNo = await sonrakiDekontNo();  // ❌ ESKİ
```

Yeni:
```ts
const dekontNo = await sonrakiDekontNo(tx);  // ✅ YENİ - tx parametresi
```

Tüm `sonrakiDekontNo()` çağrılarını ara (probably sadece odeme endpoint'inde), hepsine `tx` parametresi geçir.

**D) Diğer çağıran yerler:**

Kod tabanında `sonrakiDekontNo` çağrısı aramak için:
```bash
grep -r "sonrakiDekontNo" --include="*.ts" --include="*.tsx"
```

Bulunan her yerde `tx` parametresi eklenmelidir. Eğer transaction dışında bir yerde kullanılıyorsa (test scriptleri vb.), `prisma.$transaction` içine al.

**E) İlk seed/backfill (mevcut DB için):**

Migration sonrası mevcut DB'de `Sayac` boş. İlk ödeme alındığında `upsert`'in `create` branch'i çalışır ve `ilkSayacDegeri()` ile son dekont numarasını bulur → doğru başlangıç sayısı. **Manuel backfill gerekmez.**

İstersen kontrol için:
```bash
pnpm tsx scripts/sayac-kontrol.ts
```

(Aşağıda `sayac-kontrol.ts` script'i var)

---

## 📋 İŞ 2 — LOGIN RATE LIMIT

### Sorun

`app/api/auth/giris/route.ts` IP veya kullanıcı bazlı deneme sayma yok. README'de `admin/tilbe2026` yazılı + repo public → brute force riski.

### Çözüm — Mevcut RateLimit Helper'ı Kullan

Sistemde zaten public endpoint'ler için rate limit var (bkz. `/api/tv/musteri-bul`). Aynı mekanizmayı login'e uygula.

**A) `shared/lib/rate-limit.ts` mevcut yapıyı kontrol et:**

Eğer mevcut helper varsa kullan. Yoksa basit bir in-memory yapı kur:

```ts
// shared/lib/rate-limit.ts (varsa güncelle, yoksa yeni)

interface DenemeKaydi {
  sayac: number;
  ilkDeneme: number;       // ms timestamp
  kilitliTo: number | null; // ms timestamp
}

// In-memory store (production'da Redis daha iyi, ama LAN için yeterli)
const denemeler = new Map<string, DenemeKaydi>();

interface RateLimitConfig {
  maxDeneme: number;     // İzin verilen maksimum deneme
  pencereMs: number;     // Pencere süresi (ms)
  kilitMs: number;       // Kilit süresi (ms)
}

export function rateLimitKontrol(
  anahtar: string,
  config: RateLimitConfig,
): { izinli: boolean; kalanDeneme: number; kilitliKalan: number } {
  const simdi = Date.now();
  const kayit = denemeler.get(anahtar);

  // Kilitli mi?
  if (kayit?.kilitliTo && kayit.kilitliTo > simdi) {
    return {
      izinli: false,
      kalanDeneme: 0,
      kilitliKalan: Math.ceil((kayit.kilitliTo - simdi) / 1000),
    };
  }

  // Pencere geçmiş mi? (sıfırla)
  if (kayit && simdi - kayit.ilkDeneme > config.pencereMs) {
    denemeler.delete(anahtar);
    return { izinli: true, kalanDeneme: config.maxDeneme - 1, kilitliKalan: 0 };
  }

  // Yeni kayıt
  if (!kayit) {
    return { izinli: true, kalanDeneme: config.maxDeneme - 1, kilitliKalan: 0 };
  }

  // Limit aşıldı mı?
  if (kayit.sayac >= config.maxDeneme) {
    return {
      izinli: false,
      kalanDeneme: 0,
      kilitliKalan: Math.ceil(config.kilitMs / 1000),
    };
  }

  return {
    izinli: true,
    kalanDeneme: config.maxDeneme - kayit.sayac - 1,
    kilitliKalan: 0,
  };
}

export function rateLimitKaydet(anahtar: string, basarili: boolean, config: RateLimitConfig) {
  if (basarili) {
    // Başarılı giriş → kayıt sil
    denemeler.delete(anahtar);
    return;
  }

  const simdi = Date.now();
  const mevcut = denemeler.get(anahtar);

  if (!mevcut) {
    denemeler.set(anahtar, {
      sayac: 1,
      ilkDeneme: simdi,
      kilitliTo: null,
    });
    return;
  }

  mevcut.sayac++;

  // Limit aştıysa kilitle
  if (mevcut.sayac >= config.maxDeneme) {
    mevcut.kilitliTo = simdi + config.kilitMs;
  }

  denemeler.set(anahtar, mevcut);
}

// Otomatik temizleme (her 10 dakikada bir, eski kayıtları sil)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const simdi = Date.now();
    for (const [anahtar, kayit] of denemeler.entries()) {
      // Pencere geçmiş VE kilit yok → sil
      if (simdi - kayit.ilkDeneme > 60 * 60 * 1000 && !kayit.kilitliTo) {
        denemeler.delete(anahtar);
      }
    }
  }, 10 * 60 * 1000);
}
```

**B) Login endpoint'i güncelle:**

`app/api/auth/giris/route.ts` POST fonksiyonunun **en başına**, body parse'tan **önce**:

```ts
import { rateLimitKontrol, rateLimitKaydet } from "@/shared/lib/rate-limit";

const LOGIN_RATE_LIMIT = {
  maxDeneme: 5,
  pencereMs: 5 * 60 * 1000,    // 5 dakika
  kilitMs: 5 * 60 * 1000,      // 5 dakika kilit
};

export async function POST(req: Request) {
  const ip = ipCikar(req);

  // RATE LIMIT KONTROL — IP bazlı
  const rlKontrol = rateLimitKontrol(`login:${ip}`, LOGIN_RATE_LIMIT);
  if (!rlKontrol.izinli) {
    await auditLog({
      eylem: "giris-rate-limit",
      ip,
      detaylar: {
        kilitliKalanSn: rlKontrol.kilitliKalan,
      },
    });
    return NextResponse.json(
      {
        basarili: false,
        hata: `Çok fazla deneme. ${Math.ceil(rlKontrol.kilitliKalan / 60)} dakika sonra tekrar deneyin.`,
        kilitliKalan: rlKontrol.kilitliKalan,
      },
      { status: 429 },
    );
  }

  // ... mevcut kod ...
  // body parse, kullanıcı kontrol vs.

  // Başarısız ise:
  if (!kullanici || !kullanici.aktif) {
    rateLimitKaydet(`login:${ip}`, false, LOGIN_RATE_LIMIT);
    // ... mevcut audit + 401 response
  }

  // Şifre yanlışsa:
  if (!dogru) {
    rateLimitKaydet(`login:${ip}`, false, LOGIN_RATE_LIMIT);
    // ... mevcut audit + 401 response
  }

  // BAŞARILI GİRİŞ — sayacı sıfırla
  rateLimitKaydet(`login:${ip}`, true, LOGIN_RATE_LIMIT);

  // ... mevcut kod (oturum oluştur vs.)
}
```

**Konfig:** 5 dakikada 5 deneme → kilitlenir 5 dakika. Bayram günü meşru kullanıcı 5 yanlış denemez normalde.

**LAN İçin Not:** Tüm bayram personeli aynı router'dan bağlanırsa hepsi aynı IP'ye sahip olabilir. Bu durumda **IP + kullanıcı adı** kombosu kullanmak daha iyi. Eğer LAN ortamında problem olursa anahtarı şöyle değiştir:

```ts
const anahtar = `login:${ip}:${veri.kullaniciAdi}`;
```

---

## 📋 İŞ 3 — FAZLA TAHSİLAT ENGELLEME

### Sorun

`app/api/tahsilat/odeme/route.ts` içinde `hisselereDagit()` fonksiyonu:

```ts
// MEVCUT (RİSKLİ)
if (kalan > 0 && sonuc.length > 0) {
  const sonHisse = sonuc[sonuc.length - 1]!;
  sonHisse.tutar = yuvarla(sonHisse.tutar + kalan);  // ❌ Sessizce fazla ekler
}
```

Hisse 30.000 TL, ödenmiş 29.000 TL, kasiyer 5.000 TL girer → sistem kabul eder, son hisseye 4.000 TL fazla yazılır.

### Çözüm — Önden Kontrol

`POST` fonksiyonu içinde, `hisseler` çekildikten sonra ve `tahsisler` hesaplanmadan **önce** kontrol ekle:

```ts
// HİSSELER ÇEKİLDİ — kalanlar hesaplandı
const kalanlar = hisseler.map((h) => {
  const odenmis = yuvarla(topla(...h.odemeler.map((o) => o.toplamTutar)));
  return { id: h.id, no: h.no, kurban: h.kurban.kesimSirasi, kalan: yuvarla(h.hisseFiyati - odenmis) };
});

// 🆕 FAZLA TAHSİLAT KONTROLÜ
const toplamKalan = yuvarla(topla(...kalanlar.map((k) => Math.max(k.kalan, 0))));

if (toplam > toplamKalan + 0.01) {  // 1 kuruş tolerans (yuvarlama farkı)
  return NextResponse.json(
    {
      basarili: false,
      hata: `Tahsilat tutarı kalan bakiyeyi aşıyor. Kalan: ${toplamKalan.toFixed(2)} TL, Girilen: ${toplam.toFixed(2)} TL`,
      kalanBakiye: toplamKalan,
      girilenTutar: toplam,
      fazla: yuvarla(toplam - toplamKalan),
    },
    { status: 400 },
  );
}

// Eğer hiç bakiye yoksa
if (toplamKalan <= 0) {
  return NextResponse.json(
    {
      basarili: false,
      hata: "Bu hisselerde ödenmemiş bakiye yok. Tüm ödemeler tamamlanmış.",
    },
    { status: 400 },
  );
}

// ... mevcut tahsisler hesaplama ...
```

**ÖNEMLİ:** Tolerans (`+ 0.01`) yuvarlama hataları için bırakıldı (örn. kasiyer 50.00 girdi, sistemde 49.99 görünüyor → kabul edilsin).

**Manuel dağıtımda da kontrol:**

`hisselereDagit()` içindeki `manuel` branch'inde her hisse için kalan'ı geçmesin:

```ts
if (yontem === "manuel" && manuel) {
  const sonuc = kalanlar.map((k) => {
    const istenen = yuvarla(manuel[k.id] ?? 0);
    const maxIzin = Math.max(k.kalan, 0);

    // Manuel girdiği tutar hisse kalanını aşıyorsa hata
    if (istenen > maxIzin + 0.01) {
      throw new Error(
        `Hisse ${k.no} için ${istenen.toFixed(2)} TL girildi ama kalan sadece ${maxIzin.toFixed(2)} TL`
      );
    }

    return { hisseId: k.id, tutar: istenen };
  });
  return sonuc;
}
```

**Sırayla dağıtımda fazla ekleme kaldır:**

```ts
if (yontem === "sirayla") {
  let kalan = toplam;
  const sonuc: Tahsis[] = [];
  for (const k of kalanlar) {
    if (kalan <= 0) {
      sonuc.push({ hisseId: k.id, tutar: 0 });
      continue;
    }
    const al = yuvarla(Math.min(kalan, Math.max(k.kalan, 0)));
    sonuc.push({ hisseId: k.id, tutar: al });
    kalan = yuvarla(kalan - al);
  }

  // 🆕 Önden kontrol var, buraya gelmemesi lazım. Yine de güvenlik için:
  if (kalan > 0.01) {
    throw new Error(`Dağıtım hatası: ${kalan.toFixed(2)} TL artık (önden kontrol bypass)`);
  }

  return sonuc;
}
```

---

## 📋 İŞ 4 — TEST SCRIPTI

`scripts/sayac-kontrol.ts` (YENİ):

```ts
/**
 * Sayac modelinin durumunu ve dekont numara sayım tutarlılığını kontrol et.
 * Çalıştır: pnpm tsx scripts/sayac-kontrol.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function kontrol() {
  console.log("\n🔍 SAYAÇ KONTROL\n");

  // Mevcut sayaçlar
  const sayaclar = await prisma.sayac.findMany();
  console.log(`Toplam sayaç: ${sayaclar.length}`);
  for (const s of sayaclar) {
    console.log(`  ${s.anahtar} = ${s.deger}`);
  }

  // ABH-2026 dekontlarını say
  const abhSayisi = await prisma.odeme.count({
    where: { dekontNo: { startsWith: "ABH-2026-" } },
  });
  const tkrSayisi = await prisma.odeme.count({
    where: { dekontNo: { startsWith: "TKR-2026-" } },
  });

  console.log(`\nDekont sayıları:`);
  console.log(`  ABH-2026-*: ${abhSayisi}`);
  console.log(`  TKR-2026-*: ${tkrSayisi}`);

  // En son dekont
  const sonABH = await prisma.odeme.findFirst({
    where: { dekontNo: { startsWith: "ABH-2026-" } },
    orderBy: { id: "desc" },
    select: { dekontNo: true },
  });
  console.log(`  Son ABH: ${sonABH?.dekontNo ?? "yok"}`);

  // Tutarlılık kontrolü
  const abhSayac = sayaclar.find((s) => s.anahtar === "dekont_ABH-2026-");
  if (abhSayac && sonABH?.dekontNo) {
    const sonSira = parseInt(sonABH.dekontNo.slice(9), 10);
    if (abhSayac.deger > sonSira) {
      console.log(`✅ Sayaç tutarlı (sayaç: ${abhSayac.deger}, son: ${sonSira})`);
    } else {
      console.log(`⚠️  Sayaç EŞIT/KÜÇÜK (sayaç: ${abhSayac.deger}, son: ${sonSira})`);
      console.log(`   Bir sonraki ödemede çakışma olabilir!`);
    }
  }

  await prisma.$disconnect();
}

kontrol().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

---

## ✅ TEST ADIM ADIM

```bash
# 1. Migration
pnpm prisma migrate dev --name add_sayac_modeli
pnpm prisma generate

# 2. Type check
pnpm tsc --noEmit

# 3. Build
pnpm build

# 4. Dev
pnpm dev
```

### Tarayıcı + Manuel Test

**Test 1: Atomik dekont (concurrent)**

İki tarayıcı sekmesi aç (veya 2 farklı tarayıcı). İkisinde de `/tahsilat/musteri/[id]`:
- Sekme A'da 100 TL ödeme hazırla
- Sekme B'de 100 TL ödeme hazırla
- **Aynı anda iki "Tahsilat Al" butonuna bas**
- ✅ İkisi de farklı dekont numarası almalı (ABH-2026-NNN ve ABH-2026-NN+1)
- ✅ Hiçbiri P2002 hatası vermemeli

**Test 2: Sayaç kontrolü**

```bash
pnpm tsx scripts/sayac-kontrol.ts
```

Çıktıda:
```
dekont_ABH-2026- = 8  (eğer 7 ödeme yaptıysan)
Son ABH: ABH-2026-000007
✅ Sayaç tutarlı
```

**Test 3: Login rate limit**

Çıkış yap. `/giris` sayfasında 6 kez yanlış şifre dene:
- İlk 5 deneme: "Kullanıcı adı veya şifre hatalı"
- 6. deneme: **"Çok fazla deneme. 5 dakika sonra tekrar deneyin."** (HTTP 429)
- Doğru şifre bile reddedilmeli
- 5 dakika sonra tekrar dene → çalışmalı

**Test 4: Fazla tahsilat engelleme**

Bir müşteriye git. Kalan bakiye örneğin 10.000 TL olsun.
- 10.000 TL gir → ✅ Kabul edilmeli
- 15.000 TL gir → ❌ **"Tahsilat tutarı kalan bakiyeyi aşıyor. Kalan: 10000.00 TL, Girilen: 15000.00 TL"** hatası
- 10.000,50 TL gir (kuruş fazla, tolerans içi) → ✅ Kabul edilmeli (yuvarlama)

**Test 5: Manuel dağıtım fazla kontrol**

Müşterinin 2 hissesi var (her biri 5.000 TL kalan):
- Manuel → Hisse 1'e 6.000 TL → ❌ Hata: "Hisse 1 için 6000 TL girildi ama kalan sadece 5000 TL"
- Manuel → Hisse 1'e 4.000 + Hisse 2'ye 4.000 → ✅ Kabul

### KUTSAL Kontrolü

- [ ] Tahsilat çalışıyor → ABH-2026-NNN üretiliyor (sıralı)
- [ ] Mevcut TKR-2026 ve ABH-2026 dekontlar görüntüleniyor
- [ ] `/api/tahsilat/iptal/[id]` çalışıyor
- [ ] KasaHareketi ters kaydı çalışıyor
- [ ] Audit log yazılıyor
- [ ] `pnpm tsx scripts/bayram-hazirlik-kontrol.ts` temiz

---

## 📊 RAPOR FORMATI

Bittiğinde:

```
✅ Commit SHA: ...
✅ Migration: add_sayac_modeli uygulandı
✅ pnpm tsc + build temiz

İŞ 1 (Atomik dekont):
✅ Sayac modeli oluştu
✅ sonrakiDekontNo(tx) yeni signature
✅ Concurrent test: 2 sekmede aynı anda ödeme → farklı dekont numaraları
✅ sayac-kontrol.ts çıktısı: tutarlı

İŞ 2 (Rate limit):
✅ 5 yanlış deneme → HTTP 429 "5 dakika sonra"
✅ Başarılı giriş → sayaç sıfırlanıyor
✅ Audit log "giris-rate-limit" eylemi kaydediyor

İŞ 3 (Fazla tahsilat):
✅ Kalan 10.000 TL hissesine 15.000 TL → 400 hata
✅ Kuruş toleransı (10.000,50) → kabul
✅ Manuel dağıtımda hisse kalanı kontrolü

KUTSAL:
✅ ABH-2026-000XXX üretiliyor (sıralı)
✅ İptal işlemi çalışıyor
✅ Audit log akışı bozulmadı
```

---

## 🚨 KRİTİK NOT — SIRA

Bu sprint **SPRINT-12'den BAĞIMSIZ**, paralel veya sonra yapılabilir.

**Önerilen sıra:**
1. **Şimdi:** SPRINT-12 (TV ekranı görsel) → bittiğinde test
2. **Yarın sabah:** Bu SPRINT-P0 → bittiğinde test
3. **Yarın öğle:** Excel veri yükleme + uçtan uca test
4. **Yarın akşam:** Son hazırlık + DB yedek
5. **Çarşamba 06:00:** BAYRAM 🐂

Eğer bu akşam yeterince enerjin varsa SPRINT-12 sonrası direkt buna geçebilirsin (1.5 saat ek).

**Süre tahmini: 60 dk implementasyon + 30 dk test = 1.5 saat**

---

## 🎯 ETKİ ÖZETİ

**ÖNCESİ:**
- ❌ İki kasiyer aynı anda → biri P2002 patlar
- ❌ Brute force riski (LAN'a giren biri admin şifresi tarayabilir)
- ❌ Yanlış tutar girildiğinde sessizce kabul

**SONRASI:**
- ✅ Atomic sayaç → çakışma SIFIR
- ✅ 5 yanlış deneme → 5dk kilit (audit log var)
- ✅ Fazla tahsilat → açık hata mesajı + tutar bilgisi
- ✅ Manuel dağıtımda hisse bazlı kontrol

**Bayram günü güvenlik seviyesi:** 🟢 PRODUCTION READY
