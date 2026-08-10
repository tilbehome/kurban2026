# SPRINT EX — Bug Fix (Bayram Öncesi Kritik Düzeltmeler)

**Tahmini süre**: 2-3 saat
**Aciliyet**: 🔴 Bayrama 2 gün — bugün yarın bitir
**Bağımlılık**: Sprint 0 tamamlandı (commit `32444ed4`)

---

## 🎯 AMAÇ

Sistem üzerinde 9 gerçek bug/eksik tespit edildi (kod auditi sonucu). Sprint 0/1/2/3 branding+format işlerinden bağımsız, gerçek hatalar. Bunlar:

- **Veri kaybı riski** (backup yanlış dosyayı kopyalayabilir)
- **Güvenlik açıkları** (cookie forge, müşteri PII sızıntısı, sessiz broadcast)
- **İş akışı eksikleri** (yanlış tahsilat iptal edilemiyor)
- **UX bozuklukları** (telefon regex Türkçe formatları kabul etmiyor)
- **Sessiz başarısızlıklar** (boş p256dh kaydedilebiliyor, abonelik fail)

Tek commit halinde çözülecek. Her madde bağımsız, commit'in iç bölümleri olarak.

---

## ⚠️ PRE-WRITE GATE

Bu sprint'i yapmadan önce şunları **rapor et**:

1. **Dosya envanteri**: Her bug için dokunulacak dosyalar
2. **Yeni dosyalar**: Hangi yeni route/component oluşturulacak
3. **Schema değişikliği var mı**: `BildirimLog.kullaniciId` alanı eklenecek mi (BUG #7)
4. **Risk tahmini**: Hangi mevcut akış riske girer
5. **Test stratejisi**: Her bug için nasıl doğrulanacak

Bu raporu ver, **onayımı bekle**, sonra yazmaya başla.

---

## 🐛 BUG #1 — Ödeme İptal Endpoint'i

### Sorun
`/tahsilat/iptal` sayfası mevcut, ama sadece **listeleme** yapıyor. Kendi içinde yazıyor:
> "İptal işlemi için dekontlar listesinden ilgili kaydı seçin (geliştirme)"

`/api/tahsilat/iptal/[id]` route **yok**. DB schema'da `Odeme.iptal`, `iptalSebep`, `iptalTarihi`, `iptalKulId` alanları var ama doldurulamıyor.

Bayram günü yanlış müşteriden tahsilat alındığında **sistem üzerinden iptal mekanizması yok**.

### Çözüm

**1. Yeni endpoint**: `app/api/tahsilat/iptal/[id]/route.ts`

```ts
POST /api/tahsilat/iptal/{odemeId}
Body: { sebep: string (max 500) }

İşleyiş (transaction):
1. Odeme bulunan ve iptal=false olmalı, yoksa 400
2. Odeme.iptal=true, iptalSebep=body.sebep, iptalTarihi=now, iptalKulId=oturum.kullaniciId
3. Bu ödemeye bağlı KasaHareketi'lerini bul, her biri için ters kayıt:
   - tip: "iptal-tahsilat"
   - tutar: -X (negatif!)
   - yontem: orijinaliyle aynı
   - aciklama: "İptal — {orijinal aciklama}"
   - odemeId: aynı odeme ID
4. Otomatik yedek (yedekAl ile, neden: "iptal-{odemeId}")
5. AuditLog: eylem "odeme-iptal", model "Odeme", kayitId, kullaniciId, ip,
   detaylar: { odemeId, dekontNo, iptalTutar, sebep, hisseId, musteriId }
6. yayinla("odeme:iptal", { odemeId, hisseId, musteriId, tutar })
7. Return: { basarili: true, iptalTarihi }

Yetki: izinKontrol(oturum, "tahsilat.olustur") (kasiyer+admin)

KUTSAL kurallar:
- Soft mark (iptal=true), kayıt SİLİNMEZ
- KasaHareketi ters kayıt zorunlu — kasa bakiyesi otomatik düzeltilir
- Aynı ödeme 2 kez iptal edilemez (iptal=true ise reject)
```

**2. UI güncelleme**: `app/tahsilat/dekontlar/page.tsx`

Tablo satırlarına **"İptal"** butonu ekle:
- Sadece `iptal=false` olan satırlarda görünür
- Tıklanınca confirm dialog: "Bu tahsilat iptal edilecek. Sebep girin:"
- Textarea + İptal Et / Vazgeç
- İptal Et → POST /api/tahsilat/iptal/{id} → toast başarı → sayfa yenile

**3. UI güncelleme**: `app/tahsilat/iptal/page.tsx`

Mevcut listeleme korunsun ama alt yazı düzeltilsin:
- ❌ "İptal işlemi için... (geliştirme)"
- ✅ "İptal yapmak için Dekontlar sayfasından ilgili ödemenin İptal butonuna basın."

### Test
- TKR-XYZ ödeme oluştur (Burhan'la giriş yap, 1000 TL nakit)
- /tahsilat/dekontlar → satırı bul, İptal butonu görünüyor mu?
- İptal butonu → sebep "Test", İptal Et → toast başarı
- /tahsilat/iptal → listede görünüyor mu?
- /kasa/hareketler → ters kayıt (-1000 TL) görünüyor mu?
- Aynı dekonta tekrar İptal → 400 "Zaten iptal edilmiş"
- AuditLog'a kayıt mı düştü?

---

## 🐛 BUG #2 — Backup Yolu Hard-Coded

### Sorun
`shared/lib/backup.ts:15`:
```ts
const DB_YOL = path.join(process.cwd(), "prisma", "tilbe.db");
```

`.env` `DATABASE_URL` farklı yere işaret ederse (örn. `file:./data/prod.db`), yedek **yanlış dosyayı** kopyalar veya başarısız olur. **Sessiz hata** — sistem "yedek aldım" sanır gerçekte yedek yok.

### Çözüm

`shared/lib/backup.ts`'de DB yolu dinamik:

```ts
function dbDosyaYolu(): string {
  const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/tilbe.db";
  // "file:./prisma/tilbe.db" veya "file:./data/prod.db" formatı
  if (!dbUrl.startsWith("file:")) {
    throw new Error(`Backup desteklemez: ${dbUrl} (sadece SQLite file: protokolü)`);
  }
  const rel = dbUrl.slice("file:".length); // "./prisma/tilbe.db"
  return path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
}

const DB_YOL = dbDosyaYolu();
```

Yedek dosya adı da dinamik olsun:
```ts
const dbAdi = path.basename(DB_YOL, ".db"); // "tilbe" veya "prod"
const dosyaAdi = `${dbAdi}-${tarih}-${neden}.db`;
```

### Test
- Mevcut .env (file:./prisma/tilbe.db) ile yedek al → aynı çalışıyor
- Test için geçici .env değiştir → file:./test.db → dummy dosya oluştur → yedek doğru dosyayı kopyaladı mı?
- Geçersiz protokol (postgresql://) → açık hata mesajı

---

## 🐛 BUG #3 — `/api/tv/musteri-bul` Güvenlik

### Sorun
`app/api/tv/musteri-bul/route.ts` public + rate limit yok + telefon PII tam dönüyor.

Saldırı senaryosu:
- `?q=A` → tüm A ile başlayan müşteriler döner (ad+telefon)
- `?q=AHM`, `?q=MEH`... → alfabe taraması ile tüm DB sızdırılabilir
- Saniyede 100 istek → DoS

KVKK ihlali + DoS riski.

### Çözüm

**1. Min sorgu uzunluğu**: 3 karakter
**2. Rate limit**: IP başına 30 sorgu/dakika (basit in-memory sliding window)
**3. Telefon maskelendir**: `0532****567` (ilk 4 + son 3 karakter görünür)
**4. Maks sonuç**: 5 (zaten var, dokunma)

`shared/lib/rate-limit.ts` (yeni dosya, ~40 satır):
```ts
const istek = new Map<string, number[]>(); // ip -> timestamps[]

export function rateLimitKontrol(
  ip: string,
  maxIstek: number,
  pencereSn: number
): { izinli: boolean; kalanSn?: number } {
  const simdi = Date.now();
  const pencereSinir = simdi - pencereSn * 1000;
  const liste = istek.get(ip) ?? [];
  const yeni = liste.filter((t) => t > pencereSinir);

  if (yeni.length >= maxIstek) {
    const enErken = Math.min(...yeni);
    const kalanSn = Math.ceil((enErken + pencereSn * 1000 - simdi) / 1000);
    return { izinli: false, kalanSn };
  }
  yeni.push(simdi);
  istek.set(ip, yeni);
  return { izinli: true };
}

// Periyodik temizleme (memory leak engelleme)
setInterval(() => {
  const simdi = Date.now();
  const eski = simdi - 5 * 60 * 1000; // 5 dakika eskileri sil
  for (const [ip, liste] of istek) {
    const yeni = liste.filter((t) => t > eski);
    if (yeni.length === 0) istek.delete(ip);
    else istek.set(ip, yeni);
  }
}, 60 * 1000);
```

`shared/lib/telefon.ts` (yeni veya genişlet):
```ts
/** "<EXAMPLE_PHONE>" → "0532****567" */
export function telefonMaskele(tel: string | null): string | null {
  if (!tel) return null;
  const rakam = tel.replace(/\D/g, "");
  if (rakam.length < 7) return tel; // çok kısa, maskeleme
  const son3 = rakam.slice(-3);
  const ilk4 = rakam.slice(0, 4);
  return `${ilk4}****${son3}`;
}
```

`app/api/tv/musteri-bul/route.ts` güncellemesi:
```ts
export async function GET(req: NextRequest) {
  const ip = ipCikar(req);
  const limit = rateLimitKontrol(ip, 30, 60); // 30/dk
  if (!limit.izinli) {
    return NextResponse.json(
      { basarili: false, hata: `Çok hızlı sorgu. ${limit.kalanSn}sn bekleyin.` },
      { status: 429 }
    );
  }

  const sorgu = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (sorgu.length < 3) {  // 0 değil, 3!
    return NextResponse.json({
      basarili: true,
      sonuc: { tip: null, mesaj: "En az 3 karakter girin" }
    });
  }

  const sonuc = await akilliAra(sorgu);

  // PII maskele
  if (sonuc.musteri?.telefon) {
    sonuc.musteri.telefon = telefonMaskele(sonuc.musteri.telefon);
  }
  if (sonuc.musteriler) {
    sonuc.musteriler = sonuc.musteriler.map((m) => ({
      ...m,
      telefon: telefonMaskele(m.telefon),
    }));
  }

  return NextResponse.json({ basarili: true, sonuc });
}
```

### Test
- `?q=A` → 400 "En az 3 karakter"
- `?q=AHM` → 200, telefon `0532****567` formatlı
- 35 hızlı istek → 30. sonrası 429
- Müşteri TV/m'de "AHMET" yazarken normal çalışıyor mu (UX bozulmadı)

---

## 🐛 BUG #4 — `.env.example` Tahmin Edilebilir SECRET

### Sorun
`.env.example:9`:
```
SESSION_SECRET=<SECRET>
```

Kullanıcılar kopyalayıp değiştirmezler. Public + tahmin edilebilir secret = cookie forge'a açık.

### Çözüm

`.env.example` güncelle:

```
# Tilbe Kurban - Çevre Değişkenleri Örneği
# Bu dosyayı .env olarak kopyalayın ve değerleri güncelleyin

# SQLite veritabanı yolu
DATABASE_URL=<SECRET>

# Iron-session şifreleme anahtarı — MUTLAKA KENDİ DEĞERİNİZİ ÜRETİN
# Üretmek için (terminal):
#   openssl rand -base64 48
# veya:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
# Boş bırakırsanız sistem başlamaz (en az 32 karakter zorunlu)
SESSION_SECRET=

# ... (geri kalanı korunur)
```

**README.md** da güncellensin (kurulum bölümü):
```
## Kurulum

1. `.env.example` → `.env` kopyala
2. `SESSION_SECRET` üret:
   ```bash
   openssl rand -base64 48
   ```
3. Çıkan değeri `.env`'deki `SESSION_SECRET=<SECRET> satırına yapıştır
4. `pnpm install && pnpm db:migrate && pnpm db:seed`
5. `pnpm dev`
```

### Test
- `.env.example` kopyala → `.env` → boş SESSION_SECRET → `pnpm dev` → throw "SESSION_SECRET ortam değişkeni en az 32 karakter olmalı"
- Yeni secret üret → çalışıyor

---

## 🐛 BUG #5 — `/api/musteriler/borclular` Endpoint Yok

### Sorun
`/musteriler/borclular` sayfa server component'inde direkt Prisma'dan okuyor. API endpoint yok.

Sprint 2'de WhatsApp toplu eylem yaparken bu endpoint'e ihtiyaç var. Şimdi yapalım, sonra hazır olsun.

### Çözüm

**Yeni endpoint**: `app/api/musteriler/borclular/route.ts`

```ts
GET /api/musteriler/borclular?telefon=hepsi|var|yok&etiket=VIP,Düzenli&minBorc=0&sirala=borc|isim

Query params:
- telefon: "hepsi" (default) | "var" | "yok"
- etiket: virgülle ayrılmış, herhangi biri eşleşirse al (OR)
- minBorc: minimum kalan tutar (default 0)
- sirala: "borc" (default, kalan DESC) | "isim" (adSoyad ASC)
- limit: max 500 (default 500)

İşleyiş:
1. aktifOturum() + izinKontrol("musteriler.goruntule")
2. Borçluları hesapla:
   - Müşterilerin tüm hisselerini bul
   - Her hisse için: kalan = hisseFiyati - SUM(odemeler iptal=false toplamTutar)
   - Müşteri toplam kalanı = SUM(hisseler.kalan)
   - kalan > minBorc olanlar borçlu
3. Filtreler uygulanır
4. Sıralama
5. Toplam sayı + liste döner

Return:
{
  basarili: true,
  toplam: 14,
  borclular: [
    {
      musteriId, adSoyad, telefon, etiketler,
      hisseSayisi, toplamBedel, toplamOdenen, kalan,
      enYuksekHisse: { kurbanKesimSirasi, no, kalan }
    }
  ],
  ozet: {
    toplamBorclu: 14,
    toplamAlacak: 18010291.34,
    ortalamaBorc: 1286449.38,
    enYuksekBorc: 17000958.00
  }
}
```

`/app/musteriler/borclular/page.tsx` mevcut server component **dokunma**, paralel API hazır olsun. Sprint 2'de bu endpoint kullanılacak.

### Test
- GET /api/musteriler/borclular → tüm borçlular
- GET ?telefon=var → sadece telefonlu
- GET ?etiket=VIP → VIP etiketli olanlar
- GET ?minBorc=100000 → 100K+ borçlular
- 401 (auth yok) → reject

---

## 🐛 BUG #6 — Telefon Regex Türkçe Formatları Reddediyor

### Sorun
`modules/tv/lib/musteri-bul.ts:39`:
```ts
const TELEFON_REGEX = /^(?:\+90)?[\s-]*0?5\d{9}$/;
```

Fail durumları:
- `"<EXAMPLE_PHONE>"` (boşluklu)
- `"<EXAMPLE_PHONE>"` (boşluklu +90)
- `"<EXAMPLE_PHONE>"` (tireli)
- `"+90-532-..."` (tireli +90)

Müşteri TV/m'de telefon girince **bulamaz**.

### Çözüm

Yardımcı fonksiyon ve test logic:

```ts
/**
 * Türkçe telefon formatlarından 10-haneli mobil numarayı çıkarır.
 * Tanır:
 *  "<EXAMPLE_PHONE>" / "<EXAMPLE_PHONE>" / "<EXAMPLE_PHONE>"
 *  "+90 532 ..." / "<EXAMPLE_PHONE>"
 *  "5321234567"
 *
 * Döner: 10 haneli numara (5XX-XXXXXXX) veya null
 */
export function telefonNormalize(input: string): string | null {
  const rakam = input.replace(/\D/g, "");
  if (rakam.length === 10 && rakam.startsWith("5")) return rakam;
  if (rakam.length === 11 && rakam.startsWith("05")) return rakam.slice(1);
  if (rakam.length === 12 && rakam.startsWith("905")) return rakam.slice(2);
  if (rakam.length === 13 && rakam.startsWith("0905")) return rakam.slice(3);
  return null;
}
```

`musteri-bul.ts` `akilliAra`'da:
```ts
// 2. Telefon araması — herhangi bir format
const tel10 = telefonNormalize(temiz);
if (tel10) {
  const musteri = await prisma.musteri.findFirst({
    where: {
      silindiMi: false,
      OR: [
        { telefon: { contains: tel10 } },
        { telefon: { contains: "0" + tel10 } },
        { telefon: { contains: "+90" + tel10 } },
        { telefon: { contains: "90" + tel10 } },
      ],
    },
    select: { id: true, adSoyad: true, telefon: true },
  });
  if (musteri) return { tip: "telefon", musteri };
}
```

`shared/lib/telefon.ts`'e ekle (BUG #3 ile aynı dosya — telefonMaskele yanına).

### Test
- `telefonNormalize("<EXAMPLE_PHONE>")` → `"5321234567"`
- `telefonNormalize("<EXAMPLE_PHONE>")` → `"5321234567"`
- `telefonNormalize("invalid")` → `null`
- TV/m'de boşluklu telefon → müşteri bulundu

---

## 🐛 BUG #7 — `web-push.ts` `kullaniciId` Dead Param

### Sorun
`pushGonder(abonelikId, payload, kullaniciId)` — `kullaniciId` parametresi alıyor ama fonksiyon içinde **hiç kullanılmıyor**. BildirimLog'a yazılmıyor, audit eksik.

### Çözüm

**Schema değişikliği gerekli** — `BildirimLog.kullaniciId` ekle:

`prisma/schema.prisma`:
```prisma
model BildirimLog {
  id           String   @id @default(cuid())
  musteriId    String?
  abonelikId   String?
  abonelik     PushAbonelik? @relation(fields: [abonelikId], references: [id])
  kullaniciId  String?  // YENI — kim gönderdi
  kanal        String
  sablon       String?
  baslik       String
  mesaj        String
  durum        String   @default("gonderildi")
  hata         String?

  createdAt DateTime @default(now())

  @@index([musteriId])
  @@index([kanal])
  @@index([createdAt])
  @@index([kullaniciId])  // YENI
}
```

Migration: `pnpm prisma migrate dev --name add_bildirim_log_kullanici_id`

`shared/lib/web-push.ts`'de `pushGonder` ve `pushTopluGonder`/`pushFiltreliGonder`'da `kullaniciId`'i BildirimLog'a yaz:

```ts
await prisma.bildirimLog.create({
  data: {
    musteriId: abonelik.musteriId,
    abonelikId,
    kullaniciId, // YENI
    kanal: "push",
    // ...
  },
});
```

### Test
- Admin'den push gönder → BildirimLog'da `kullaniciId` admin ID'si dolu
- Schema migration başarılı

---

## 🐛 BUG #8 — `pushFiltreliGonder({})` Sessiz Broadcast

### Sorun
`shared/lib/web-push.ts:175-186`:
```ts
const where: Record<string, unknown> = { aktif: true };
if (filtre.musteriId) where.musteriId = filtre.musteriId;
if (filtre.oturumKey) where.oturumKey = filtre.oturumKey;
// tumune kontrol edilmiyor, boş objede TÜM aktif abonelere yayın yapar
```

`pushFiltreliGonder({})` çağrılırsa **tüm aktif abonelere yayın yapar**. Kazara broadcast riski.

### Çözüm

Açık guard ekle:

```ts
export async function pushFiltreliGonder(
  filtre: {
    musteriId?: string;
    oturumKey?: string;
    tumune?: boolean;
  },
  payload: PushPayload,
  kullaniciId?: string,
): Promise<{ basarili: number; hata: number; toplam: number }> {
  // GUARD: en az bir filtre VEYA tumune=true zorunlu
  if (!filtre.tumune && !filtre.musteriId && !filtre.oturumKey) {
    console.error("[web-push] pushFiltreliGonder filtresiz çağrıldı — broadcast engellendi");
    return { basarili: 0, hata: 0, toplam: 0 };
  }

  const where: Record<string, unknown> = { aktif: true };
  if (filtre.musteriId) where.musteriId = filtre.musteriId;
  if (filtre.oturumKey) where.oturumKey = filtre.oturumKey;
  // tumune=true ise where'e ekstra filtre EKLENMEZ (tüm aktif abonelikler)

  // ... mevcut kod
}
```

### Test
- `pushFiltreliGonder({})` → 0 abone, log: "filtresiz çağrıldı"
- `pushFiltreliGonder({ tumune: true })` → tüm aktifler
- `pushFiltreliGonder({ musteriId: "X" })` → sadece X

---

## 🐛 BUG #9 — `AbonelikSchema.p256dh` Boş String Kabul Ediyor

### Sorun
`app/api/tv/push-abonelik/route.ts:25`:
```ts
p256dh: z.string().max(500).default(""),
auth: z.string().max(500).default(""),
```

Boş string kabul edilirse abonelik DB'ye yazılır ama **web-push'tan asla push gönderilemez**. Silent fail.

### Çözüm

Schema'yı sıkı yap:

```ts
const AbonelikSchema = z.object({
  musteriId: z.string().nullable().optional(),
  kurbanId: z.string().nullable().optional(),
  endpoint: z.string().url().min(20).max(500),  // URL formatı zorunlu
  p256dh: z.string().min(40).max(500),  // gerçek key 65+ char, min 40 yeter
  auth: z.string().min(8).max(500),     // 16+ char normalde
  userAgent: z.string().max(300).optional(),
});
```

Eski kayıtlar (boş p256dh ile) varsa, `pushGonder`'daki mevcut kontrol zaten devre dışı bırakıyor. Onlar bayram sonrası temizlenecek.

**Migration script** (opsiyonel ama önerilen): `scripts/temizle-eski-abonelikler.ts`
```ts
// Boş p256dh olan abonelikleri pasif yap
const sonuc = await prisma.pushAbonelik.updateMany({
  where: { OR: [{ p256dh: "" }, { p256dh: { startsWith: "" } }] },
  data: { aktif: false },
});
console.log(`${sonuc.count} eski/boş abonelik pasif yapıldı`);
```

### Test
- POST /api/tv/push-abonelik with p256dh="" → 400 "min 40 karakter"
- POST geçerli p256dh → 200, DB'ye yazıldı
- Eski boş kayıtlar pasif

---

## 🐛 BUG #10 — WhatsApp Şablonunda Hard-Coded "Adabereket"

### Sorun
`prisma/seed-whatsapp-sablonlari.ts:75` "Kurban Hazır - Et Teslimi" şablonu içinde:
```
Adres: Adabereket Hayvancılık
```

Diğer şablonlar `{sirketAdi}` placeholder kullanıyor (doğru white-label). Bu tek şablon hard-coded, tutarsız.

### Çözüm

`prisma/seed-whatsapp-sablonlari.ts`'de o satırı düzelt:

```ts
icerik: `Sayın {adSoyad},

Kurban etiniz teslime hazırdır. Bugün {bugun} itibariyle çiftliğimizden alabilirsiniz.

Adres: {sirketAdi}
İletişim: {sirketTel}

Hayırlı bayramlar.`,
```

Çalıştırma sonrası mevcut DB'deki şablon güncellenmez (varsayılan=true olanlar atlanıyor). Şu seçenekler:

**Seçenek A**: Migration script yaz, DB'de güncel kayıdı bul ve metni değiştir
**Seçenek B**: Manuel SQL (basit): `UPDATE WhatsAppSablonu SET icerik = REPLACE(icerik, 'Adabereket Hayvancılık', '{sirketAdi}') WHERE icerik LIKE '%Adabereket Hayvancılık%';`

**Önerilen Seçenek A** (production-safe):

`scripts/duzelt-whatsapp-sablon.ts`:
```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const sablonlar = await prisma.whatsAppSablonu.findMany({
    where: { icerik: { contains: "Adabereket Hayvancılık" } },
  });
  for (const s of sablonlar) {
    const yeni = s.icerik.replace(/Adabereket Hayvancılık/g, "{sirketAdi}");
    await prisma.whatsAppSablonu.update({
      where: { id: s.id },
      data: { icerik: yeni },
    });
    console.log(`✓ Düzeltildi: ${s.ad}`);
  }
}
main().finally(() => prisma.$disconnect());
```

Çalıştır: `pnpm tsx scripts/duzelt-whatsapp-sablon.ts`

### Test
- /whatsapp/sablonlar → "Kurban Hazır" şablonu içinde "{sirketAdi}" görünüyor
- Test mesaj göndermede {sirketAdi} → "Ada Bereket Hayvancılık" çözülüyor

---

## 📋 COMMIT MESAJI

```
fix(bayram-onceisi): 9 kritik+orta bug duzeltmesi + 1 schema migration

Kod auditi sonucu tespit edilen 9 gercek bug tek commit'te duzeltildi.
Branding/format dışı, sistem güvenliği + veri butunlugu + UX odakli.

DEGISIKLIKLER:

BUG #1 — Odeme iptal endpoint (yeni)
- app/api/tahsilat/iptal/[id]/route.ts: POST endpoint
  * Odeme.iptal=true + iptalSebep + iptalTarihi + iptalKulId
  * KasaHareketi ters kayit (negatif tutar)
  * Otomatik yedek + AuditLog "odeme-iptal"
- app/tahsilat/dekontlar/page.tsx: Iptal butonu satirlarda
- app/tahsilat/iptal/page.tsx: aciklama metni guncellendi

BUG #2 — Backup yolu dinamik
- shared/lib/backup.ts: DATABASE_URL'den parse et
  * "file:./prisma/tilbe.db" -> /full/path
  * Dosya adi da dinamik (tilbe-... veya prod-...)

BUG #3 — TV musteri-bul guvenligi
- shared/lib/rate-limit.ts (yeni): sliding window 30/dk/IP
- shared/lib/telefon.ts (yeni): telefonMaskele "0532****567"
- app/api/tv/musteri-bul/route.ts: min 3 char + rate limit + maskele

BUG #4 — SESSION_SECRET guvenligi
- .env.example: SESSION_SECRET= <SECRET> talimat yorum)
- README.md: openssl rand -base64 48 talimati

BUG #5 — Borclular API endpoint (yeni)
- app/api/musteriler/borclular/route.ts: GET
  * telefon/etiket/minBorc filtreleri
  * sirala=borc|isim
  * ozet (toplam alacak vs)
- Sprint 2 hazirligi

BUG #6 — Telefon regex Turkce formatlar
- shared/lib/telefon.ts: telefonNormalize() helper
- modules/tv/lib/musteri-bul.ts: regex yerine normalize
- "<EXAMPLE_PHONE>", "+90 532-..." vs tum formatlar

BUG #7 — BildirimLog.kullaniciId
- prisma/schema.prisma: kullaniciId String? + index
- Migration: add_bildirim_log_kullanici_id
- shared/lib/web-push.ts: pushGonder/Toplu/Filtreli kullaniciId yazar

BUG #8 — pushFiltreliGonder broadcast guvenligi
- shared/lib/web-push.ts: guard "filtresiz bos obje engelle"

BUG #9 — p256dh bos string kabul
- app/api/tv/push-abonelik/route.ts: z.string().min(40) zorunlu
- endpoint: z.string().url().min(20)
- auth: min(8)
- scripts/temizle-eski-abonelikler.ts (manuel calistirma)

BUG #10 — WhatsApp sablonu hard-coded
- prisma/seed-whatsapp-sablonlari.ts: Adabereket -> {sirketAdi}
- scripts/duzelt-whatsapp-sablon.ts: mevcut DB sablonlarinda REPLACE

KUTSAL korundu:
- Tahsilat akisi calisiyor (yeni iptal akisi ile guclendi)
- Mevcut TKR/ABH-2026-NNN kayitlari etkilenmedi
- Push altyapisi calisiyor (silent fail riski kapandi)
- FAZ 4-9.6 + Sprint 0 hicbir sey bozulmadi

Test:
- pnpm tsc --noEmit + build temiz
- pnpm prisma migrate dev (BUG #7 schema)
- pnpm tsx scripts/duzelt-whatsapp-sablon.ts (BUG #10 DB temizlik)
- TKR test: ABH-2026-XXX olustu + IPTAL + kasa ters kayit + yedek
- /api/tv/musteri-bul rate limit + maskeleme dogrulandi
- Telefon normalize 4 format test edildi
- /api/musteriler/borclular filtreler dogru
- Bos p256dh -> 400 reddedildi
- pushFiltreliGonder({}) -> guard tetiklendi
```

---

## ✅ Son Kontroller

Commit öncesi her bug için test:

| Bug | Test |
|---|---|
| #1 | Test ödeme oluştur → iptal → kasa ters kayıt → audit log |
| #2 | DATABASE_URL geçici değiştir → yedek doğru dosyaya gitti mi |
| #3 | curl ile 35 hızlı istek → 30. sonrası 429 + telefon maskeli |
| #4 | `.env` bozulmuşsa app başlamıyor (mevcut guard çalışıyor) |
| #5 | curl /api/musteriler/borclular?telefon=var → JSON ile filtreli |
| #6 | TV/m'de "<EXAMPLE_PHONE>" yaz → Burhan bulundu |
| #7 | Push gönder → BildirimLog'da kullaniciId dolu |
| #8 | pushFiltreliGonder({}) çağır → log uyarısı, 0 push |
| #9 | curl POST push-abonelik with p256dh:"" → 400 |
| #10 | /whatsapp/sablonlar → "Kurban Hazır" içinde {sirketAdi} |

**Tahmini süre**: 2-3 saat
**Risk**: Düşük (schema migration var ama küçük — sadece BildirimLog'a optional field)

---

## ⚠️ ÖNEMLİ NOT

Bu sprint sırasında **kesinlikle dokunulmayacak**:
- `/api/tahsilat/odeme` akışı (TKR/ABH-2026-NNN üretimi)
- `aktifOturum()` defensive guard
- FAZ 9.5 kurban-asama akışı
- Prisma migration olmadan schema değiştirme (sadece BildirimLog'a optional field var)
- Mevcut PWA service worker logic'i

Test geçmedikçe commit yapma. KUTSAL = tahsilat çalışıyor olmalı.
