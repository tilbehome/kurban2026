# SPRINT 5 — Hissedar Atama Akışı + Hayvanlar Galerisi Geliştirme

**Tahmini süre**: 3-4 saat
**Aciliyet**: 🟡 Bayram öncesi yapılırsa hissedar atama hızlanır
**Bağımlılık**: Sprint 0, 1, 2 commit edildi

---

## 🎯 AMAÇ

### Sorun #1 — Hissedar Atama Akışı YANLIŞ
Şu an Hayvan Detay sayfasında "Hissedar Ekle" butonu **doğrudan `/musteriler/yeni`** (yeni müşteri formu) açıyor. Yani:
- Müşteri zaten kayıtlı bile olsa **tekrar yeni kayıt yapmaya zorlanıyor**
- Mükerrer kayıt riski
- Çift telefon, çift TC riski
- Gerçek akış: **önce ara, varsa seç, yoksa hızlı ekle**

### Sorun #2 — Hayvanlar Galerisi Minimal
Mevcut kart sadece bedel/ödenen/kalan + ilerleme bar gösteriyor. Eksikler:
- Arama YOK (63 kurban arasında bulmak için scroll)
- Filtre YOK (sadece boş hisseli olanlar, sadece bugünkü kesim vs.)
- Kart bilgileri yetersiz (canlı kg, kesim saati, kesim durumu, hissedarlar yok)
- Kart hover bilgi yok
- Bayram günü "kesimdekiler" gibi hızlı kategoriler yok

---

## ⚠️ PRE-WRITE GATE

Yazmaya başlamadan önce **rapor et**:

1. Yeni component yapısı (dosya ağacı)
2. Mevcut sayfalardan hangileri etkilenecek
3. Yeni endpoint'ler (varsa)
4. Müşteri arama UX kararları (modal mı, dropdown mı, sayfa mı)
5. Kart geliştirme için hangi schema alanları kullanılacak
6. Test stratejisi

Onayımı bekle, sonra yazmaya başla.

---

## 📋 BÖLÜM 1 — Hissedar Atama Akışı

### Yeni Akış (Modal)

Hayvan Detay'da boş hissenin yanındaki "Hissedar Ekle" butonu tıklanınca:

**MusteriSeciciModal açılır** — 3 sekme/state:

```
┌──────────────────────────────────────────────────┐
│  Hissedar Seç                              [×]    │
├──────────────────────────────────────────────────┤
│  [🔍] AHMET                              [Temizle]│
│  ────────────────────────────────────────────────│
│                                                   │
│  📋 MEVCUT MÜŞTERİLER (3 sonuç)                  │
│                                                   │
│  ┌──────────────────────────────────────────┐    │
│  │ AHMET YILMAZ                             │    │
│  │ 0532 ••• 567 · 🐂 2 hisse · ⭐ VIP        │    │
│  │                                  [Seç →] │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│  ┌──────────────────────────────────────────┐    │
│  │ AHMET DEMİR                              │    │
│  │ 0533 ••• 890 · — · —                     │    │
│  │                                  [Seç →] │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│  ─────────────────────────────────────────────── │
│  Bulamadın mı?                                    │
│  [+ Hızlı Müşteri Ekle]                          │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Boş arama durumu** (hiç yazılmamışsa):
```
🔍 Müşteri aramaya başla...
   Ad, soyad veya telefon yazabilirsin

   Bulamadın mı?  [+ Hızlı Müşteri Ekle]
```

**Sonuç yok durumu**:
```
😕 "ZZTOP" için sonuç yok

   [+ Hızlı Müşteri Ekle: ZZTOP]
```

**Hızlı Müşteri Ekle modali** (sub-modal veya inline form):
```
┌──────────────────────────────────────────────────┐
│  Hızlı Müşteri Ekle                        [×]    │
├──────────────────────────────────────────────────┤
│  Ad Soyad *                                       │
│  [AHMET YILMAZ                              ]    │
│                                                   │
│  Telefon                                          │
│  [0532 ___ ___ ___                          ]    │
│                                                   │
│  TC Kimlik (vekalet için)                         │
│  [___________                               ]    │
│                                                   │
│  [İptal]                       [Kaydet ve Ata] →  │
└──────────────────────────────────────────────────┘
```

### İşleyiş

1. Arama yaparken **300ms debounce** ile `/api/musteriler?arama=X&limit=10` çağrılır
2. Sonuçlar listelenir
3. "Seç" butonuna basınca → hisse'ye müşteri ID atanır → modal kapanır → sayfa yenilenir
4. "Hızlı Müşteri Ekle" → sub-form açılır → POST `/api/musteriler` → dönen `id` ile hisse'ye atanır → modal kapanır
5. Atama işlemi: yeni endpoint **POST `/api/hisseler/[id]/atama`**

### Yeni Endpoint

`app/api/hisseler/[hisseId]/atama/route.ts`:

```ts
POST /api/hisseler/{hisseId}/atama
Body: { musteriId: string }

İşleyiş:
1. Yetki: izinKontrol("hisseler.atama") veya admin
2. Hisse var mı? silindiMi false? boş mu (musteriId === null)?
   - Atanmışsa: 400 "Hisse zaten atanmış. Önce çıkar."
3. Müşteri var mı? silindiMi false?
4. Hisse.musteriId = body.musteriId
5. AuditLog "hisse-atama"
6. yayinla("hisse:atandi", { hisseId, musteriId, kurbanId })
7. Return: { basarili: true, hisse: { id, no, musteri: {...} } }
```

### Hissedar Çıkar (Geri Al)

Atanmış hisseden müşteri çıkarmak için yeni akış (mevcut yok):

Hayvan detay sayfasında **atanmış hisselerin yanına** "..." menüsü:
- Hissedarı Çıkar (onay dialog ile)
- Hisse Transferi (mevcut sayfaya yönlendirir)

`DELETE /api/hisseler/{hisseId}/atama`:
```ts
1. Yetki kontrol
2. Hisse atanmış mı? Ödeme var mı?
   - Ödeme varsa: 400 "Bu hisse ödeme almış. Önce iptal et."
3. Hisse.musteriId = null
4. AuditLog "hisse-cikarma"
5. yayinla("hisse:cikarildi", { hisseId, eskiMusteriId, kurbanId })
```

### Component Yapısı

```
modules/hayvanlar/components/hissedar-atama/
├── HissedarAtamaModal.tsx          # ana modal container
├── MusteriArama.tsx                # arama input + debounce
├── MusteriSonucListesi.tsx         # sonuç kartları
├── MusteriSonucKart.tsx            # tek müşteri kartı (seç butonu)
├── HizliMusteriEkleForm.tsx        # hızlı kayıt formu
└── HissedarCikarDialog.tsx         # çıkarma onay dialog

app/api/hisseler/[hisseId]/atama/route.ts (POST + DELETE)
```

### Kullanım

Hayvan detay sayfasında (`app/hayvanlar/[id]/page.tsx`):

**ÖNCE**:
```tsx
<Link href={`/musteriler/yeni?next=/hayvanlar/${kurban.id}`}>
  Hissedar Ekle
</Link>
```

**SONRA**:
```tsx
<HissedarAtamaModal hisseId={h.id} kurbanId={kurban.id} />
// Modal trigger butonu içeride
```

Atanmış hisseler için:
```tsx
<HisseKart>
  <Link href={`/musteriler/${h.musteri.id}`}>{h.musteri.adSoyad}</Link>
  <DropdownMenu>
    <DropdownMenuItem onClick={cikar}>Hissedarı Çıkar</DropdownMenuItem>
    <DropdownMenuItem asChild>
      <Link href={`/hayvanlar/hisse-transfer?from=${h.id}`}>Hisse Transferi</Link>
    </DropdownMenuItem>
  </DropdownMenu>
</HisseKart>
```

---

## 📋 BÖLÜM 2 — Hayvanlar Galerisi Geliştirme

### Hedefler

1. **Gelişmiş Arama** — kurban no, küpe no, hissedar adı, telefonla arama
2. **Hızlı Filtreler** — chip butonlar (boş hisseli / dolu / kesim bekliyor / kesimde / bitti)
3. **Zengin Kart** — daha fazla bilgi, durum rozeti, hissedar avatar grup
4. **Sıralama** — kesim sırası / bedel / kalan / ilerleme
5. **Grid/Liste görünüm** toggle
6. **Boş durum** — "Henüz kurban yok, [yeni ekle]"

### Yeni Yapı

```
┌─────────────────────────────────────────────────────────────────┐
│  Hayvanlar                                                       │
│  63 kurban kayıtlı                              [+ Yeni Kurban] │
├─────────────────────────────────────────────────────────────────┤
│  [🔍 No, küpe, hissedar ara...                              ]   │
│                                                                  │
│  Durum: [Hepsi 63] [Boş Hisse 12] [Hazır 8] [Kesimde 2]        │
│         [Bitti 41] [İptal 0]                                    │
│                                                                  │
│  Sırala: [Sıra ↑] [Bedel ↓] [Kalan ↓] [İlerleme ↓]             │
│  Görünüm: [⊞ Grid]  [☰ Liste]                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                 │
│  │  #1  🐂 Büyükbaş    │  │  #2  🐂 Büyükbaş    │                 │
│  │  ─────────────────  │  │  ─────────────────  │                 │
│  │  Küpe: 12345        │  │  Küpe: 56789        │                 │
│  │  ⏰ 07:10           │  │  ⏰ 08:00           │                 │
│  │  ⚖️ 450kg canlı    │  │  ⚖️ 380kg canlı    │                 │
│  │  ─────────────────  │  │  ─────────────────  │                 │
│  │  Bedel:  ₺336.000,00│  │  Bedel:  ₺400.000,00│                 │
│  │  Ödenen: ₺10.000,00 │  │  Ödenen: ₺429.400,00│                 │
│  │  Kalan:  ₺326.000,00│  │  Kalan:  -₺29.400,00│                 │
│  │  ─────────────────  │  │  ─────────────────  │                 │
│  │  Hissedar (7/7)     │  │  Hissedar (7/7)     │                 │
│  │  [A][M][S][...+4]   │  │  [A][M][...+5]      │                 │
│  │  ─────────────────  │  │  ─────────────────  │                 │
│  │  ▮▮▮░░░░░░░ 3%      │  │  ▮▮▮▮▮▮▮▮▮▮ 100%    │                 │
│  │  [⚪ Hazır]          │  │  [🟢 Tam Ödendi]    │                 │
│  └────────────────────┘  └────────────────────┘                 │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                 │
│  │  #4  🐂 Büyükbaş    │  │  #6  🐂 Küçükbaş    │                 │
│  │  Küpe: —            │  │  Küpe: 88900        │                 │
│  │  ⏰ —               │  │  ⏰ 09:30           │                 │
│  │  ─────────────────  │  │  ─────────────────  │                 │
│  │  Bedel:  ₺260.000,02│  │  Bedel:  ₺258.000,00│                 │
│  │  Ödenen: ₺5.000,00  │  │  Ödenen: ₺31.000,00 │                 │
│  │  Kalan:  ₺255.000,02│  │  Kalan:  ₺227.000,00│                 │
│  │  ─────────────────  │  │  ─────────────────  │                 │
│  │  Hissedar (1/7)     │  │  Hissedar (6/6)     │                 │
│  │  [M] [⬚][⬚][⬚][⬚]  │  │  [A][B][C][D][E][F] │                 │
│  │  6 boş hisse        │  │  ─────────────────  │                 │
│  │  ─────────────────  │  │  ▮▮▮▮░░░░░░ 12%     │                 │
│  │  ▮░░░░░░░░░ 2%      │  │  [⚪ Bekliyor]      │                 │
│  │  [🟡 6 Boş Hisse]    │  └────────────────────┘                 │
│  └────────────────────┘                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Kart Anatomi

Her kart:
1. **Üst Satır**: `#1 🐂 Büyükbaş` + sağda küpe no
2. **Hızlı Bilgi**: Kesim saati ⏰ · Canlı kg ⚖️ (varsa)
3. **Bedel/Ödenen/Kalan**: aynı şekilde
4. **Hissedar Grubu**:
   - Avatar harf rozetleri (max 5 görünür)
   - "(1/7)" gibi sayaç (dolu/toplam)
   - Boş hisse uyarısı (kırmızı/sarı vurgu)
5. **İlerleme Bar**: aynı + yüzde
6. **Durum Rozeti**: Renk kodlu
   - 🟢 Tam Ödendi
   - 🟡 Boş Hisseli
   - 🔵 Kesimde
   - 🟣 Hazır (kesim için bekleyen, paralarda var)
   - ⚫ Bitti / Teslim
   - 🔴 İptal

### Hızlı Filtreler

Sayaçlı chip butonlar (lucide ikon + sayı):
- **Hepsi 63** — varsayılan
- **Boş Hisse 12** — `bosHisseSayisi > 0`
- **Hazır 8** — `bosHisseSayisi === 0 && durum === "aktif"`
- **Kesimde 2** — `kesimDurumu in ("siradaki","hazirlik","kesimde","deri_yuzme","parcalama","tartimda","paketleme")`
- **Bitti 41** — `durum === "kesildi" || durum === "teslim"`
- **İptal 0** — `durum === "iptal"`

### Sıralama

Chip butonlar:
- **Sıra ↑** — `kesimSirasi ASC` (varsayılan)
- **Bedel ↓** — `satisBedeli DESC`
- **Kalan ↓** — hesaplanmış `kalan DESC`
- **İlerleme ↓** — `ilerlemeYuzde DESC`

### Arama

Tek bir arama kutusu, çoklu alan:
- Kurban no (`#5` veya `5` → kesimSirasi)
- Küpe no (`12345`)
- Hissedar adı (`AHMET`)
- Hissedar telefonu (`0532`)

Sonuç filtrelenmiş kartlar.

### Component Yapısı

```
modules/hayvanlar/components/galeri/
├── HayvanlarGaleri.tsx              # ana client component (state, filtreler)
├── HayvanlarGaleriUst.tsx           # arama + filtreler + sıralama + görünüm toggle
├── HayvanlarGaleriGrid.tsx          # grid render
├── HayvanlarGaleriListe.tsx         # liste render (alternatif görünüm)
├── KurbanKart.tsx                   # zengin kart
├── HissedarAvatarGrup.tsx           # hissedar harf rozetleri
└── DurumRozeti.tsx                  # renk kodlu durum badge

modules/hayvanlar/lib/
└── kurban-filtre.ts                 # client-side filtre + sıralama logic
```

### Service Genişletme

`kurbanlariListele` döndürdüğü tipler **hissedarlar listesini** de içermeli (avatar grup için):

```ts
export interface KurbanOzet {
  // ... mevcut alanlar
  hisseSayisi: number;
  bosHisseSayisi: number;
  hissedarlar: Array<{
    hisseNo: number;
    musteriId: string | null;
    adSoyad: string | null;
    telefon: string | null;  // maskelenmemiş (admin görür)
  }>;

  // Hayvan detayları
  canliAgirlik: number | null;
  karkasAgirlik: number | null;
  tur: string; // "Büyükbaş" | "Küçükbaş" — kesimSirasi'na göre değil, ayrı alan ya da hesap

  // Kesim durumu
  kesimDurumu: string;
  asama: string | null;
  operasyonSira: number | null;
  kesimBaslama: Date | null;
  kesimBitis: Date | null;
}
```

**NOT**: `tur` alanı schema'da YOK. Eğer eklenecekse:
- Seçenek A: Schema'ya `Kurban.tur String @default("Büyükbaş")` ekle (migration)
- Seçenek B: `Ayar.varsayilan_kurban_turu` (genel ayar, kart "Büyükbaş" sabitler) — Sprint 5 KAPSAMI DIŞI, schema dokunma

**Önerilen**: Seçenek B (basit). Kart sabit "Büyükbaş" göstersin (Ada Bereket esas olarak büyükbaş satıyor), gelecekte Sprint 6'da `tur` alanı eklenebilir.

### Yeni Endpoint (opsiyonel)

Şu an `kurbanlariListele()` server component'inde direkt çağrılıyor. **Aynı kalsın**. Client filtre/arama tamamen frontend'de.

Daha sonra (eğer 63 kurban değil 1000+ olursa) `?arama&filtre&sirala` query parametreli endpoint yapılır.

---

## 🎨 TASARIM NOTLARI

### Renk Paleti (Ada Bereket'ten)

- Primary: `#DE0B1E` (marka kırmızısı)
- Accent: `#1a1a1a` (siyah)
- Boş hisse uyarı: amber-500
- Kesimde: blue-500
- Tam ödendi: green-600
- Bitti: gray-500

### Avatar Harf Rozetleri

Müşteri adının ilk harfi + gradient bg:
```tsx
<div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white
                bg-gradient-to-br from-orange-400 to-red-600">
  A
</div>
```

Aynı harf için aynı renk (hash-based) → AHMET hep aynı turuncu, MEHMET hep aynı mavi.

```ts
function avatarRenk(ad: string): string {
  const renkler = [
    "from-orange-400 to-red-600",
    "from-blue-400 to-indigo-600",
    "from-green-400 to-emerald-600",
    "from-purple-400 to-pink-600",
    "from-yellow-400 to-orange-600",
    "from-cyan-400 to-blue-600",
    "from-rose-400 to-red-600",
    "from-teal-400 to-cyan-600",
  ];
  const hash = ad.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return renkler[hash % renkler.length];
}
```

### Boş Hisse Rozeti

```tsx
<div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed
                border-amber-400 text-amber-600 text-xs">
  ⬚
</div>
```

### Mobil

`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` — mevcut yapı korunur. Kart daha yüksek olduğu için mobilde dikey scroll sorun değil.

Filtreler horizontal scroll (mobilde tüm chip'ler sığmazsa):
```tsx
<div className="flex gap-2 overflow-x-auto pb-2">
  {/* chip butonlar */}
</div>
```

---

## 🧪 TEST

### Hissedar Atama
1. Hayvan detay → Boş hisse "Hissedar Ekle" → Modal açılır
2. "AHMET" yaz → 300ms sonra sonuçlar gelir
3. "Seç" → modal kapanır, sayfa yenilenir, hisse atandı
4. Boş arama + "Hızlı Müşteri Ekle" → form → kaydet → otomatik atandı
5. Atanmış hisseyi "Çıkar" → onay → boş oldu
6. Ödeme almış hisseyi çıkar → 400 "Ödeme var, önce iptal et"
7. AuditLog'a hisse-atama / hisse-cikarma yazıldı mı?

### Hayvanlar Galerisi
1. Arama "AHMET" → AHMET'in olduğu kurbanlar
2. Arama "12345" → küpe no eşleşen kurban
3. Arama "5" → kesim sırası 5 olan kurban
4. Filtre "Boş Hisseli" → sadece bosHisseSayisi > 0
5. Sıralama "Bedel ↓" → en pahalı önde
6. Grid/Liste toggle çalışıyor
7. Avatar grupları doğru renkler, hash deterministic
8. Boş hisse rozeti dashed border ile görünüyor
9. Mobil görünüm sorunsuz
10. KUTSAL TKR/ABH test (tahsilat değişmedi)

---

## 📋 COMMIT MESAJI

```
feat(hayvanlar): musteri secici modal + zengin kart + gelismis arama

Hayvan Detay sayfasinda "Hissedar Ekle" butonu artik dogrudan
yeni musteri formuna degil, MUSTERI SECICI MODAL'a yonlendiriyor.
Mevcut musteriler aranabilir, varsa secilir, yoksa hizli kayit yapilir.

Hayvanlar Galerisi yeniden tasarlandi: arama, filtreler, siralama,
zengin kart, hissedar avatar grup, durum rozetleri.

YENI OZELLIKLER:

[1] Hissedar Atama Akisi
- HissedarAtamaModal (modules/hayvanlar/components/hissedar-atama/)
- MusteriArama: 300ms debounce, /api/musteriler?arama=X
- MusteriSonucKart: hisse sayisi + etiketler + Sec butonu
- HizliMusteriEkleForm: ad/tel/tc + kaydet+ata tek adim
- HissedarCikarDialog: onay + odeme var ise red
- Yeni: POST /api/hisseler/{id}/atama (musteri ata)
- Yeni: DELETE /api/hisseler/{id}/atama (musteri cikar)
- AuditLog: hisse-atama / hisse-cikarma
- Hayvan detay sayfasi: Link -> Modal component

[2] Hayvanlar Galerisi Gelistirme
- HayvanlarGaleri (client): state + filtre + sirala
- HayvanlarGaleriUst: arama + chip filtreler + siralama
- KurbanKart: zengin (kesim saati, canli kg, hissedar grup, durum rozeti)
- HissedarAvatarGrup: harf rozetleri + hash-bazli renk + bos hisse
- DurumRozeti: 6 renkli durum (Tam Odendi/Bos Hisseli/Kesimde/Hazir/Bitti/Iptal)
- Filtre chip'leri: Hepsi/Bos Hisseli/Hazir/Kesimde/Bitti/Iptal + sayilar
- Siralama: Sira/Bedel/Kalan/Ilerleme
- Grid/Liste gorunum toggle
- Arama: no/kupe/hissedar/telefon coklu alan
- Mobil: horizontal scroll filtre + responsive grid
- Bos durum: "Henuz kurban yok, [yeni ekle]"

SERVICE GUNCELLEMESI:
- kurbanlariListele() artik hissedarlar listesi de donduruyor
  (avatar grup icin)
- canliAgirlik, karkasAgirlik, kesimDurumu eklenmis
- Kurban turu (Buyukbas) sabit metin (Sprint 6'da schema'ya tasinabilir)

KUTSAL korundu:
- Tahsilat akisi calisiyor
- Hisse-atama eski URL (/musteriler/yeni?next=...) hala calisiyor
  (geriye uyumlu fallback - mevcut bookmark'lar bozulmaz)
- TKR-2026 + ABH-2026 mevcut kayitlar etkilenmedi
- /api/tahsilat/odeme dokunulmadi

Test:
- pnpm tsc --noEmit + build temiz
- Modal: ara/sec/hizli-ekle 3 yol da calisiyor
- Cikarma: odeme varsa engellendi, yoksa basariliyla cikti
- Galeri: 8 filtre kombinasyonu test edildi
- Avatar grup: aynsi isim hep ayni renk (hash deterministic)
- Mobil responsive sorunsuz
- TKR test (yeni atama ile)
```

---

## 🎯 ÖZET

| Bolum | Süre | Etki |
|---|---|---|
| Hissedar Atama Modal | 1.5-2 sa | Mukerrer kayit engellenir, hız 3-5x |
| Hayvanlar Galeri | 1.5-2 sa | Bayram günü navigasyon hız 5-10x |
| **Toplam** | **3-4 sa** | |

**Sprint sonrası**:
- Burhan Bey hayvana hissedar ekleyince mevcut müşterilerden seçecek (mükerrer azalır)
- Galeride 63 kurban arasında 1 saniyede arar/filtreler (eskiden scroll + manuel)
- Avatar grupla kim olduğu görsel bağla anlaşılır
- Boş hisse uyarısı kartlarda öne çıkar (12 boş hisse → satılmadı uyarı)

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Modal vs Sayfa**: Modal seçildi çünkü hayvan detay sayfasındaki context (hangi hisse, hangi kurban) korunur. Sayfaya yönlendirme yapsaydık geri gelirken context kaybolacaktı.

2. **Debounce 300ms**: Klavye yazarken her tuşa istek atmayalım. 300ms doğru sweet spot (UX testlerinde kabul görmüş).

3. **Hızlı Müşteri Ekleme - sadece zorunlu alanlar**: Ad Soyad zorunlu, telefon ve TC opsiyonel. Detaylı düzenleme `/musteriler/{id}/duzenle` sayfasında.

4. **Boş hisse rozeti**: Boş hisseler kartta görünür kalsın, kasiyer "ah bu kurbanın 6 boş hissesi var, hadi telefon edeyim" diyebilsin.

5. **Müşteri sayfa-no çakışması**: Eski `/musteriler/yeni?next=/hayvanlar/X` URL'i destekli kalsın (kurban detay'da kullanılmasa bile başka yerden gelinebilir).
