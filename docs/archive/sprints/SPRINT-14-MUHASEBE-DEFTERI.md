---
id: ARCH-9046D9264AE3
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# SPRINT 14 — MASTER MUHASEBE DENETİM DEFTERİ

**Hedef:** Kesim no sırasına göre tam denetim raporu. Otomatik tutarsızlık tespiti, kırmızı işaretleme. A4 yazdırılabilir.
**Sebep:** Bayram sonrası genel hesap denetimi gerekli — her şey tek yerde, hatalar otomatik yakalanmalı.
**Süre:** ~2 saat
**Aciliyet:** ACİL
**Risk:** Düşük — sadece okuma + yeni rapor sayfası. Schema'ya dokunulmaz.

---

## 🎯 NE İSTENİYOR?

3 bölümlü tek A4 rapor (`/raporlar/muhasebe-defteri/yazdir`):

**BÖLÜM 1 — GENEL ÖZET (1. sayfa)**
- Toplam: kurban sayısı, hisse sayısı, bedel, tahsilat, kalan
- Yöntem dağılımı: nakit/havale/kart toplamları
- Vekalet durumu: alınan/bekleyen
- **🚨 UYARI SAYACI:** kaç tutarsızlık tespit edildi

**BÖLÜM 2 — KESİM DEFTERİ (kesim no sırası)**
- Her hayvan: DANA-N, küpe, hisse sayısı, bedel
- Her hissedar: ad, telefon, fiyat, ödenen, kalan, vekalet durumu
- Her ödeme: tarih, nakit/havale/kart, dekont no
- **Tutarsızlık varsa o satır kırmızı + uyarı simgesi**
- Hayvan özeti: yöntem toplamları + kalan

**BÖLÜM 3 — UYARILAR EKİ (son sayfalar)**
- Tüm kırmızı işaretli tutarsızlıklar tek listede
- Kategori bazlı gruplu
- Her uyarı: DANA no, hisse, sorun açıklaması, beklenen vs gerçek

---

## 🔍 OTOMATİK TUTARSIZLIK KONTROLLERİ (DENETİMİN KALBİ)

Sistem şu kontrolleri yapıp **kırmızı işaretleyecek:**

### Hisse Seviyesi
1. **Fazla ödeme:** `toplamOdenen > hisseFiyati` → "FAZLA ÖDEME: X TL fazla alınmış"
2. **Negatif kalan:** `kalan < 0` → yukarıdakiyle aynı, vurgula
3. **Ödeme var ama hisse boş:** `musteriId = null AMA odemeler.length > 0` → "SAHİPSİZ HİSSEYE ÖDEME"
4. **Hisse fiyatı sıfır ama ödeme var:** `hisseFiyati = 0 AND toplamOdenen > 0` → "FİYATSIZ HİSSEYE ÖDEME"
5. **Vekalet alınmış ama hissedar yok:** `vekaletAlindi = true AND musteriId = null` → "BOŞ HİSSEDE VEKALET"
6. **Ödeme toplamı tutarsız:** `nakit + havale + kart != toplamTutar` (her ödeme için) → "ÖDEME KALEMLERİ TOPLAMI YANLIŞ"

### Hayvan Seviyesi
7. **Hisse fiyatları toplamı ≠ satış bedeli:** `sum(hisseFiyati) != satisBedeli` (>1 TL fark) → "HİSSE TOPLAMI ≠ BEDEL"
8. **Hisse sayısı uyumsuz:** `hisseSayisi != hisseler.length` → "HİSSE SAYISI YANLIŞ"
9. **Dolu hisse > hisse sayısı:** atanan hissedar sayısı kayıtlı hisse sayısını aşıyor

### Ödeme Seviyesi
10. **Dekont no tekrarı:** Aynı dekontNo birden fazla → "DEKONT NO TEKRARI" (normalde unique ama kontrol)
11. **İptal edilmiş ama tutar hâlâ sayılıyor:** iptal=true ödemeler tahsilata dahil edilmemeli (kontrol)
12. **Gelecek tarihli ödeme:** `tarih > bugün` → "GELECEK TARİHLİ ÖDEME"

### Müşteri Seviyesi
13. **Telefonu olmayan borçlu:** `kalan > 0 AND telefon = null` → bilgi amaçlı sarı uyarı (kırmızı değil)
14. **İsimsiz/bilinmeyen hissedar:** adSoyad "İSİMSİZ" içeriyor + kalan > 0 → sarı uyarı

**Kırmızı (kritik):** 1-12 arası
**Sarı (bilgi):** 13-14

---

## ⛔ DOKUNMA

- Schema (sadece okuma)
- Diğer raporlar
- Tahsilat akışı
- Auth/izin

---

## 📋 PRE-WRITE GATE

```bash
# Helper konumları
grep -rn "export function formatPara\|export function yuvarla\|export function topla" shared/lib/para.ts
grep -rn "export function formatTarih" shared/lib/tarih.ts

# Mevcut rapor servisi
grep -n "export async function\|export interface" modules/raporlar/lib/rapor.service.ts

# lucide-react versiyonu (ÖNEMLİ — Beef hatası tekrarı olmasın)
grep "lucide-react" package.json
```

**Raporla:**
- `formatPara`, `formatTarih`, `yuvarla`, `topla` doğru import yolları?
- lucide-react versiyonu? (Sadece temel iconlar kullanılacak: AlertTriangle, FileText, Printer, CheckCircle, XCircle — bunlar her versiyonda var)
- Sprint 13'teki `kesimMuhasebeRaporu()` zaten yapıldı mı? (Varsa onu genişletebiliriz, yoksa sıfırdan)

---

## 🎯 ONAY SONRASI YAPILACAKLAR

### 1. Backend: rapor.service.ts'e denetim fonksiyonu

```typescript
export interface DenetimUyari {
  seviye: "kritik" | "bilgi";          // kırmızı | sarı
  kategori: string;                     // "Fazla Ödeme", "Hisse Toplamı" vb.
  kesimSirasi: number;
  hisseNo: number | null;               // hayvan seviyesi ise null
  mesaj: string;
  beklenen?: string;                    // "336.000 TL"
  gercek?: string;                      // "330.000 TL"
}

export interface DefterOdeme {
  dekontNo: string;
  tarih: string;
  nakit: number;
  havale: number;
  kart: number;
  toplamTutar: number;
  iptal: boolean;
  uyarilar: DenetimUyari[];             // bu ödemeye ait uyarılar
}

export interface DefterHisse {
  hisseNo: number;
  musteriAdi: string | null;
  telefon: string | null;
  hisseFiyati: number;
  toplamOdenen: number;
  kalan: number;
  vekaletAlindi: boolean;
  odemeler: DefterOdeme[];
  uyarilar: DenetimUyari[];             // bu hisseye ait uyarılar
}

export interface DefterKurban {
  kesimSirasi: number;
  kupeNo: string | null;
  hisseSayisi: number;
  satisBedeli: number;
  toplamOdenen: number;
  kalan: number;
  toplamNakit: number;
  toplamHavale: number;
  toplamKart: number;
  vekaletAlinan: number;                // kaç hisse vekalet aldı
  hisseler: DefterHisse[];
  uyarilar: DenetimUyari[];             // hayvan seviyesi uyarılar
}

export interface MuhasebeDefteri {
  kurbanlar: DefterKurban[];
  // Genel özet
  ozet: {
    kurbanSayisi: number;
    hisseSayisi: number;
    doluHisse: number;
    bosHisse: number;
    toplamBedel: number;
    toplamOdenen: number;
    toplamKalan: number;
    toplamNakit: number;
    toplamHavale: number;
    toplamKart: number;
    vekaletAlinan: number;
    vekaletBekleyen: number;
  };
  // Tüm uyarılar (bölüm 3 için)
  tumUyarilar: DenetimUyari[];
  uyariSayisi: { kritik: number; bilgi: number };
}

export async function muhasebeDefteri(): Promise<MuhasebeDefteri> {
  const bugun = new Date();
  bugun.setHours(23, 59, 59, 999);

  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    orderBy: { kesimSirasi: "asc" },
    include: {
      hisseler: {
        where: { silindiMi: false },
        orderBy: { no: "asc" },
        include: {
          musteri: { select: { adSoyad: true, telefon: true } },
          odemeler: {
            orderBy: { tarih: "asc" },
            select: {
              dekontNo: true, tarih: true, nakit: true, havale: true,
              kart: true, toplamTutar: true, iptal: true,
            },
          },
        },
      },
    },
  });

  const tumUyarilar: DenetimUyari[] = [];
  const dekontGorulen = new Map<string, number>(); // dekont tekrarı kontrolü

  const defterKurbanlar: DefterKurban[] = kurbanlar.map((k) => {
    const hayvanUyarilari: DenetimUyari[] = [];

    const defterHisseler: DefterHisse[] = k.hisseler.map((h) => {
      const hisseUyarilari: DenetimUyari[] = [];
      const gecerliOdemeler = h.odemeler.filter((o) => !o.iptal);
      const toplamOdenen = yuvarla(topla(...gecerliOdemeler.map((o) => o.toplamTutar)));
      const kalan = yuvarla(h.hisseFiyati - toplamOdenen);

      // KONTROL 1-2: Fazla ödeme / negatif kalan
      if (kalan < -1) {
        const u: DenetimUyari = {
          seviye: "kritik", kategori: "Fazla Ödeme",
          kesimSirasi: k.kesimSirasi, hisseNo: h.no,
          mesaj: `Fazla ödeme: ${formatPara(Math.abs(kalan))} fazla alınmış`,
          beklenen: formatPara(h.hisseFiyati), gercek: formatPara(toplamOdenen),
        };
        hisseUyarilari.push(u); tumUyarilar.push(u);
      }

      // KONTROL 3: Boş hisseye ödeme
      if (!h.musteriId && gecerliOdemeler.length > 0) {
        const u: DenetimUyari = {
          seviye: "kritik", kategori: "Sahipsiz Hisseye Ödeme",
          kesimSirasi: k.kesimSirasi, hisseNo: h.no,
          mesaj: `Hisse boş ama ${formatPara(toplamOdenen)} ödeme var`,
        };
        hisseUyarilari.push(u); tumUyarilar.push(u);
      }

      // KONTROL 4: Fiyatsız hisseye ödeme
      if (h.hisseFiyati === 0 && toplamOdenen > 0) {
        const u: DenetimUyari = {
          seviye: "kritik", kategori: "Fiyatsız Hisseye Ödeme",
          kesimSirasi: k.kesimSirasi, hisseNo: h.no,
          mesaj: `Hisse fiyatı 0 ama ${formatPara(toplamOdenen)} ödeme var`,
        };
        hisseUyarilari.push(u); tumUyarilar.push(u);
      }

      // KONTROL 5: Boş hissede vekalet
      if (h.vekaletAlindi && !h.musteriId) {
        const u: DenetimUyari = {
          seviye: "kritik", kategori: "Boş Hissede Vekalet",
          kesimSirasi: k.kesimSirasi, hisseNo: h.no,
          mesaj: `Hisse boş ama vekalet alınmış işaretli`,
        };
        hisseUyarilari.push(u); tumUyarilar.push(u);
      }

      // KONTROL 13: Telefonsuz borçlu (sarı)
      if (kalan > 1 && h.musteriId && !h.musteri?.telefon) {
        const u: DenetimUyari = {
          seviye: "bilgi", kategori: "Telefonsuz Borçlu",
          kesimSirasi: k.kesimSirasi, hisseNo: h.no,
          mesaj: `${h.musteri?.adSoyad} borçlu ama telefonu yok (${formatPara(kalan)})`,
        };
        hisseUyarilari.push(u); tumUyarilar.push(u);
      }

      // KONTROL 14: İsimsiz hissedar borçlu (sarı)
      if (h.musteri?.adSoyad?.includes("İSİMSİZ") && kalan > 1) {
        const u: DenetimUyari = {
          seviye: "bilgi", kategori: "İsimsiz Hissedar",
          kesimSirasi: k.kesimSirasi, hisseNo: h.no,
          mesaj: `Bilinmeyen hissedar, ${formatPara(kalan)} borçlu — gerçek bilgi girilmeli`,
        };
        hisseUyarilari.push(u); tumUyarilar.push(u);
      }

      // Ödeme bazlı kontroller
      const defterOdemeler: DefterOdeme[] = h.odemeler.map((o) => {
        const odemeUyarilari: DenetimUyari[] = [];

        // KONTROL 6: nakit+havale+kart != toplamTutar
        const kalemToplam = yuvarla(o.nakit + o.havale + o.kart);
        if (!o.iptal && Math.abs(kalemToplam - o.toplamTutar) > 1) {
          const u: DenetimUyari = {
            seviye: "kritik", kategori: "Ödeme Kalemleri Hatalı",
            kesimSirasi: k.kesimSirasi, hisseNo: h.no,
            mesaj: `Dekont ${o.dekontNo}: Nakit+Havale+Kart (${formatPara(kalemToplam)}) ≠ Toplam (${formatPara(o.toplamTutar)})`,
          };
          odemeUyarilari.push(u); tumUyarilar.push(u);
        }

        // KONTROL 10: Dekont tekrarı
        if (!o.iptal) {
          dekontGorulen.set(o.dekontNo, (dekontGorulen.get(o.dekontNo) ?? 0) + 1);
        }

        // KONTROL 12: Gelecek tarihli ödeme
        if (!o.iptal && new Date(o.tarih) > bugun) {
          const u: DenetimUyari = {
            seviye: "kritik", kategori: "Gelecek Tarihli Ödeme",
            kesimSirasi: k.kesimSirasi, hisseNo: h.no,
            mesaj: `Dekont ${o.dekontNo}: Ödeme tarihi gelecekte (${formatTarih(new Date(o.tarih))})`,
          };
          odemeUyarilari.push(u); tumUyarilar.push(u);
        }

        return {
          dekontNo: o.dekontNo, tarih: o.tarih.toISOString(),
          nakit: o.nakit, havale: o.havale, kart: o.kart,
          toplamTutar: o.toplamTutar, iptal: o.iptal,
          uyarilar: odemeUyarilari,
        };
      });

      return {
        hisseNo: h.no,
        musteriAdi: h.musteri?.adSoyad ?? null,
        telefon: h.musteri?.telefon ?? null,
        hisseFiyati: yuvarla(h.hisseFiyati),
        toplamOdenen, kalan,
        vekaletAlindi: h.vekaletAlindi,
        odemeler: defterOdemeler,
        uyarilar: hisseUyarilari,
      };
    });

    // Hayvan seviyesi
    const gecerliOdemelerTum = k.hisseler.flatMap((h) => h.odemeler.filter((o) => !o.iptal));
    const toplamNakit = yuvarla(topla(...gecerliOdemelerTum.map((o) => o.nakit)));
    const toplamHavale = yuvarla(topla(...gecerliOdemelerTum.map((o) => o.havale)));
    const toplamKart = yuvarla(topla(...gecerliOdemelerTum.map((o) => o.kart)));
    const toplamOdenen = yuvarla(toplamNakit + toplamHavale + toplamKart);
    const kalan = yuvarla(k.satisBedeli - toplamOdenen);
    const vekaletAlinan = k.hisseler.filter((h) => h.vekaletAlindi).length;

    // KONTROL 7: Hisse fiyatları toplamı ≠ satış bedeli
    const hisseFiyatToplam = yuvarla(topla(...k.hisseler.map((h) => h.hisseFiyati)));
    if (Math.abs(hisseFiyatToplam - k.satisBedeli) > 1 && k.satisBedeli > 0) {
      const u: DenetimUyari = {
        seviye: "kritik", kategori: "Hisse Toplamı ≠ Bedel",
        kesimSirasi: k.kesimSirasi, hisseNo: null,
        mesaj: `Hisse fiyatları toplamı satış bedeline eşit değil`,
        beklenen: formatPara(k.satisBedeli), gercek: formatPara(hisseFiyatToplam),
      };
      hayvanUyarilari.push(u); tumUyarilar.push(u);
    }

    // KONTROL 8: Hisse sayısı uyumsuz
    if (k.hisseSayisi !== k.hisseler.length) {
      const u: DenetimUyari = {
        seviye: "kritik", kategori: "Hisse Sayısı Yanlış",
        kesimSirasi: k.kesimSirasi, hisseNo: null,
        mesaj: `Kayıtlı hisse sayısı (${k.hisseSayisi}) ile gerçek hisse adedi (${k.hisseler.length}) farklı`,
      };
      hayvanUyarilari.push(u); tumUyarilar.push(u);
    }

    return {
      kesimSirasi: k.kesimSirasi, kupeNo: k.kupeNo,
      hisseSayisi: k.hisseSayisi, satisBedeli: yuvarla(k.satisBedeli),
      toplamOdenen, kalan, toplamNakit, toplamHavale, toplamKart,
      vekaletAlinan, hisseler: defterHisseler, uyarilar: hayvanUyarilari,
    };
  });

  // Dekont tekrarı (KONTROL 10) — tüm tarama sonrası
  for (const [dekont, sayi] of dekontGorulen.entries()) {
    if (sayi > 1) {
      tumUyarilar.push({
        seviye: "kritik", kategori: "Dekont No Tekrarı",
        kesimSirasi: 0, hisseNo: null,
        mesaj: `Dekont ${dekont} ${sayi} kez kullanılmış (benzersiz olmalı)`,
      });
    }
  }

  // Genel özet
  const tumHisseler = defterKurbanlar.flatMap((k) => k.hisseler);
  const ozet = {
    kurbanSayisi: defterKurbanlar.length,
    hisseSayisi: tumHisseler.length,
    doluHisse: tumHisseler.filter((h) => h.musteriAdi).length,
    bosHisse: tumHisseler.filter((h) => !h.musteriAdi).length,
    toplamBedel: yuvarla(topla(...defterKurbanlar.map((k) => k.satisBedeli))),
    toplamOdenen: yuvarla(topla(...defterKurbanlar.map((k) => k.toplamOdenen))),
    toplamKalan: yuvarla(topla(...defterKurbanlar.map((k) => k.kalan))),
    toplamNakit: yuvarla(topla(...defterKurbanlar.map((k) => k.toplamNakit))),
    toplamHavale: yuvarla(topla(...defterKurbanlar.map((k) => k.toplamHavale))),
    toplamKart: yuvarla(topla(...defterKurbanlar.map((k) => k.toplamKart))),
    vekaletAlinan: tumHisseler.filter((h) => h.vekaletAlindi).length,
    vekaletBekleyen: tumHisseler.filter((h) => h.musteriAdi && !h.vekaletAlindi).length,
  };

  return {
    kurbanlar: defterKurbanlar,
    ozet,
    tumUyarilar,
    uyariSayisi: {
      kritik: tumUyarilar.filter((u) => u.seviye === "kritik").length,
      bilgi: tumUyarilar.filter((u) => u.seviye === "bilgi").length,
    },
  };
}
```

### 2. Sayfa: app/raporlar/muhasebe-defteri/yazdir/page.tsx

```tsx
import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { muhasebeDefteri } from "@/modules/raporlar/lib/rapor.service";
import { MuhasebeDefteriYazdirClient } from "./MuhasebeDefteriYazdirClient";

export const dynamic = "force-dynamic";

export default async function MuhasebeDefteriYazdirPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "raporlar.goruntule")) redirect("/");

  const defter = await muhasebeDefteri();
  return <MuhasebeDefteriYazdirClient defter={defter} />;
}
```

### 3. Client: MuhasebeDefteriYazdirClient.tsx

A4 portre, 3 bölüm. Otomatik print. İçerik:

**BÖLÜM 1 — Genel Özet (ilk sayfa):**
- Büyük başlık + tarih
- 2 kolon özet kutu: solda finansal (bedel/tahsil/kalan/nakit/havale/kart), sağda durum (kurban/hisse/dolu/boş/vekalet)
- **Büyük UYARI kutusu:** "🚨 X kritik, Y bilgi uyarısı tespit edildi. Detaylar son sayfada."
- Eğer 0 kritik uyarı → yeşil "✓ Tutarsızlık tespit edilmedi"

**BÖLÜM 2 — Kesim Defteri:**
- Her kurban bir blok (`page-break-inside: avoid`)
- Başlık çubuğu: DANA-N · Küpe · X hisse · Bedel · Kalan
- **Eğer hayvanda kritik uyarı varsa başlık KIRMIZI**
- Hisse tablosu: No | Hissedar | Telefon | Tarih | Dekont | Nakit | Havale | Kart | Fiyat | Kalan
- Uyarılı hisse satırı: kırmızı arka plan + ⚠ simgesi
- İptal ödemeler: üstü çizili, gri
- Hayvan altı: yöntem toplamları + uyarı varsa kırmızı not

**BÖLÜM 3 — Uyarılar Eki:**
- Yeni sayfadan başla (`page-break-before`)
- Başlık: "DENETİM UYARILARI"
- Kategori bazlı gruplu liste
- Her uyarı: [DANA-N H.X] kategori — mesaj (beklenen vs gerçek)
- Kritik kırmızı, bilgi sarı

**Print CSS:**
```css
@media print {
  @page { size: A4 portrait; margin: 1cm 0.7cm; }
  body { font-family: Arial; font-size: 9.5px; }
  .no-print { display: none !important; }
  .kurban-blok { page-break-inside: avoid; }
  .yeni-sayfa { page-break-before: always; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
.uyari-kritik { background: #ffebee; color: #c00; }
.uyari-bilgi { background: #fff8e1; color: #b8860b; }
.iptal { opacity: 0.4; text-decoration: line-through; }
```

**Önemli:** Sadece şu iconlar (lucide-react): `AlertTriangle, CheckCircle, XCircle, Printer, FileText`. Başka icon KULLANMA.

### 4. Menüye link

`/raporlar` sayfasına buton ekle: "📒 Master Muhasebe Defteri (Denetim)". Doğrudan `/raporlar/muhasebe-defteri/yazdir` açar (yeni sekme).

---

## ✅ TAMAMLAMA KRİTERLERİ

- [ ] `muhasebeDefteri()` fonksiyonu — 14 kontrol çalışıyor
- [ ] Bölüm 1: Genel özet + uyarı sayacı
- [ ] Bölüm 2: Kesim no sırasıyla her kurban + hissedar + ödeme
- [ ] Bölüm 3: Tüm uyarılar kategori gruplu
- [ ] Kritik uyarılar kırmızı, bilgi sarı
- [ ] Uyarılı hayvan başlığı kırmızı
- [ ] İptal ödemeler üstü çizili, tahsilata dahil DEĞİL
- [ ] `page-break-inside: avoid` — hayvan bloğu bölünmüyor
- [ ] Otomatik print dialog açılıyor
- [ ] 0 uyarı durumunda yeşil "temiz" mesajı
- [ ] lucide-react: sadece AlertTriangle/CheckCircle/XCircle/Printer/FileText
- [ ] Konsol hata yok

---

## 🧪 TEST

1. Sayfa açılır, print dialog çıkar
2. Bölüm 1'de toplamlar doğru mu? (sistem KPI'larıyla karşılaştır)
3. Bilerek bir hisseye fazla ödeme gir → kırmızı uyarı çıkmalı
4. Boş hisseye ödeme test → "Sahipsiz hisseye ödeme" uyarısı
5. İptal ödeme → üstü çizili, toplama dahil değil
6. Bölüm 3'te tüm uyarılar listeleniyor mu?
7. Yazdır → A4'te düzgün, hayvan blokları bölünmüyor

---

## 📦 COMMIT

```
feat(rapor): master muhasebe denetim defteri — otomatik tutarsızlık tespiti

- muhasebeDefteri(): 14 otomatik kontrol (fazla ödeme, boş hisseye ödeme,
  hisse toplamı≠bedel, dekont tekrarı, gelecek tarih, kalem toplamı vb.)
- 3 bölüm: Genel Özet + Kesim Defteri + Uyarılar Eki
- Kritik kırmızı, bilgi sarı işaretleme
- A4 yazdırma, hayvan blokları break-inside korumalı
- İptal ödemeler tahsilattan hariç + üstü çizili
- /raporlar/muhasebe-defteri/yazdir

Sebep: Bayram sonrası genel hesap denetimi — tutarsızlıkları otomatik yakalar

Etkilenmeyen: schema, tahsilat akışı, diğer raporlar
```

---

## 🛑 ONAY

PRE-WRITE GATE raporunu ver (helper yolları + lucide-react versiyonu + Sprint 13 yapıldı mı). "Devam et" deyince yaz.

Sıra: Backend (denetim fonksiyonu) → Yazdırma sayfası → Menü linki. Her aşamada commit.
