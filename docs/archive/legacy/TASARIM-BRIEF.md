# TİLBECORE KURBAN YÖNETİM SİSTEMİ — TAM VİZYON TASARIM BRİEF

> 10 Ağustos 2026 uyum notu: Bu belge tarihsel tam vizyon/tasarım briefidir. Birinci bağlayıcı kaynak `TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md` belgesidir. Küçükbaş/adak/akika, gelişmiş çok şube, self-service üyelik, otomatik abonelik/faturalama ve ticari SaaS ayrıntıları ilk canlı kapsamı değildir; çok firma veri izolasyonu ise Faz 2 çekirdeğidir.

> **Bu belge, ürünün nihai halini anlatır.** Tasarımcı (sen), Figma/Adobe XD/Sketch gibi bir programda bu vizyonu çizecek. Sonra Claude Code'a verip uygulayacağız.
>
> **Hedef:** Türkiye'nin en profesyonel kurban yönetim SaaS'ı. Tek çiftlikten dev kombinaya kadar.

---

## 📑 İÇİNDEKİLER

1. [Ürün Vizyonu](#1-ürün-vizyonu)
2. [Hedef Kitle](#2-hedef-kitle)
3. [Marka Kimliği](#3-marka-kimliği)
4. [Sayfa Yapısı (Tüm Sayfalar)](#4-sayfa-yapısı)
5. [Modüller (Detaylı)](#5-modüller-detaylı)
6. [Bileşen Kütüphanesi](#6-bileşen-kütüphanesi)
7. [Tasarım Sistemi](#7-tasarım-sistemi)
8. [Etkileşim Modelleri](#8-etkileşim-modelleri)
9. [Responsive Tasarım](#9-responsive-tasarım)
10. [Özel Ekranlar](#10-özel-ekranlar)
11. [Tasarım Önerileri ve İlham](#11-tasarım-önerileri)

---

## 1. ÜRÜN VİZYONU

### Ne Yapıyoruz?
TilbeCore Kurban, **çiftlikler ve kombinalar** için kapsamlı bir **kurban yönetim platformu**. Müşteri, hisse, tahsilat, kesim, dağıtım, raporlama — hepsini tek sistemde toplar.

### Vaat
- Kasiyer **30 saniyede tahsilat** alır
- Yönetici **2 saniyede günlük rapor** görür
- Müşteri **WhatsApp'ta dekont** alır
- Kesim ekibi **TV ekranında** sırayı görür
- Patron **anlık karlılığı** bilir

### Rakipler (Türkiye)
- Excel + kalem-kağıt (% 90 piyasa)
- Eski masaüstü programlar (DBase, Access)
- Birkaç basit web sitesi (rakip yok denecek kadar az)

### Farkımız
- Modern teknoloji (Next.js, React)
- Mobile-first (saha personeli telefondan)
- Offline-first (internet kopsa bile çalışır)
- WhatsApp entegrasyonu (Türk pazarına özel)
- Yapay zeka önerileri (sonradan)

---

## 2. HEDEF KİTLE

### Birincil Kullanıcılar

**A) Çiftlik Sahibi (Yönetici)**
- Yaş: 35-60
- Teknoloji: Orta (WhatsApp kullanır, Excel açar)
- İhtiyaç: Genel durum, kar/zarar, kim borçlu
- Cihaz: Telefon + masaüstü
- **Örnek persona:** Burhan Bey (Sakarya)

**B) Kasiyer**
- Yaş: 20-40
- Teknoloji: Yüksek (kasiyer, hesap programları bilir)
- İhtiyaç: Hızlı tahsilat, doğru dekont
- Cihaz: Masaüstü (sabit), telefon (yedek)
- **Örnek persona:** Genç bir muhasebe görevlisi

**C) Kesim Personeli**
- Yaş: 25-55
- Teknoloji: Düşük (sadece bakacak)
- İhtiyaç: Sırayı görmek, hangi hisse hazır
- Cihaz: TV ekranı (büyük), telefon
- **Örnek persona:** Kesim merkezinde çalışan usta

**D) Müşteri (Son Kullanıcı)**
- Yaş: 25-70
- Teknoloji: Karışık
- İhtiyaç: Hissesinin durumunu görmek, dekont almak
- Cihaz: Telefon
- **Örnek persona:** Hisse alan vatandaş

### İkincil Kullanıcılar

**E) Veteriner**
- Sağlık raporu giren

**F) Şoför / Teslim Personeli**
- Kim kuryeye verildi takibi

**G) Belediye Denetçisi**
- Kayıt görme yetkisi

---

## 3. MARKA KİMLİĞİ

### Renk Paleti

**Birincil (Brand)**
- **Tilbe Orange:** `#ea580c` (CTA, vurgu)
- Açık tonlar: `#fff7ed`, `#ffedd5`, `#fed7aa`
- Koyu tonlar: `#c2410c`, `#9a3412`, `#7c2d12`

**İkincil (Doğa / Bayram)**
- **Kurban Yeşil:** `#16a34a` (başarı, kesim hazır)
- Açık: `#f0fdf4`, `#dcfce7`
- Koyu: `#15803d`, `#166534`

**Nötr (Arka plan)**
- Beyaz: `#ffffff`
- Açık gri: `#f8fafc`, `#f1f5f9`
- Gri: `#64748b`
- Koyu: `#1e293b`, `#0f172a`

**Anlamsal Renkler**
- ✅ Başarı (yeşil): `#16a34a`
- ⚠️ Uyarı (sarı): `#f59e0b`
- ❌ Hata (kırmızı): `#dc2626`
- ℹ️ Bilgi (mavi): `#2563eb`

### Tipografi

**Birincil Font:** Inter (Latin) veya Manrope
- Başlık: 600 ağırlık, sıkı kerning
- Body: 400 ağırlık, 1.6 line-height
- Sayılar: 500 ağırlık (kalın, dikkat çeker)

**Boyutlar:**
- H1: 32px (sayfa başlığı)
- H2: 24px (bölüm başlığı)
- H3: 18px (kart başlığı)
- Body: 14-16px
- Caption: 12px
- Mini: 10-11px

### Logo

- **TilbeCore + Kurban modülü logosu**
- Boğa silüeti + T harfi monogramı
- Birincil: Turuncu üzerine beyaz
- Negatif: Beyaz üzerine turuncu

### Marka Hissi
- **Profesyonel ama sıcak**
- **Modern ama Türk değerlerine saygılı**
- **Teknolojik ama anlaşılır**
- Apple sadeliği + Vercel modernliği + Türk geleneği

---

## 4. SAYFA YAPISI

### 4.1 Genel Layout

```
┌─────────────────────────────────────────────────────┐
│ TOP BAR (60px)                                       │
│ Logo | Arama (Ctrl+K) | Bildirim | Profil           │
├─────────┬───────────────────────────────────────────┤
│         │                                            │
│ SİDEBAR │ İÇERİK ALANI                              │
│ (220px) │                                            │
│         │                                            │
│ • Ana   │  ┌─────────────────────────────────┐      │
│   Sayfa │  │ Sayfa başlığı + actions          │      │
│         │  ├─────────────────────────────────┤      │
│ • Müş.  │  │ Sayfa içeriği                    │      │
│ • Kurb. │  │                                  │      │
│ • Tah.  │  │                                  │      │
│ • Kasa  │  │                                  │      │
│ • Rap.  │  │                                  │      │
│ • Whats │  │                                  │      │
│ • TV    │  │                                  │      │
│ • Ayar  │  └─────────────────────────────────┘      │
│         │                                            │
└─────────┴───────────────────────────────────────────┘
```

### 4.2 Tüm Sayfaların Listesi

#### 🏠 GENEL BAKIŞ
- `/` veya `/dashboard` — **Ana Sayfa** (KPI'lar, grafikler, hatırlatmalar)

#### 👥 MÜŞTERİLER (10 sayfa)
- `/musteriler` — **Tüm Müşteriler** (liste, filtre, arama)
- `/musteriler/yeni` — **Yeni Müşteri** (form)
- `/musteriler/[id]` — **Müşteri Detay** (tab'lı)
- `/musteriler/[id]/duzenle` — **Müşteri Düzenle**
- `/musteriler/[id]/ekstre` — **Hesap Ekstresi** (printable)
- `/musteriler/ara` — **Gelişmiş Arama**
- `/musteriler/borclular` — **Borçlular Listesi**
- `/musteriler/vip` — **VIP Müşteriler**
- `/musteriler/etiketler` — **Etiket Yönetimi**
- `/musteriler/import` — **Excel'den İçe Aktar**

#### 🐂 KURBANLAR (12 sayfa)
- `/kurbanlar` — **Tüm Kurbanlar**
- `/kurbanlar/yeni` — **Yeni Kurban Ekle**
- `/kurbanlar/[id]` — **Kurban Detay**
- `/kurbanlar/[id]/duzenle` — **Kurban Düzenle**
- `/kurbanlar/hisse-atama` — **Hisse Atama UI** (drag-drop)
- `/kurbanlar/bos-hisseler` — **Boş Hisseler**
- `/kurbanlar/vekalet` — **Vekalet Yönetimi**
- `/kurbanlar/kesim-sirasi` — **Kesim Sırası**
- `/kurbanlar/saglık` — **Veteriner Kayıtları**
- `/kurbanlar/transfer` — **Hisse Transfer**
- `/kurbanlar/iptal` — **İptal/İade**
- `/kurbanlar/tipler` — **Hayvan Türleri Yönetimi** (büyükbaş, küçükbaş)

#### 💰 TAHSİLAT (8 sayfa)
- `/tahsilat` — **Tahsilat Ana Sayfa** (hızlı tahsilat)
- `/tahsilat/yeni` — **Yeni Tahsilat**
- `/tahsilat/bugun` — **Bugünkü Tahsilatlar**
- `/tahsilat/tum` — **Tüm Tahsilatlar**
- `/tahsilat/dekontlar` — **Dekontlar (TKR listesi)**
- `/tahsilat/[id]` — **Tahsilat Detay**
- `/tahsilat/iptal` — **İptal Edilenler**
- `/tahsilat/iade` — **İade İşlemleri**

#### 💼 KASA (10 sayfa)
- `/kasa` — **Kasa Ana**
- `/kasa/gider` — **Gider Girişi**
- `/kasa/gelir` — **Gelir Girişi**
- `/kasa/hareketler` — **Tüm Hareketler**
- `/kasa/acilis` — **Gün Açılışı**
- `/kasa/kapanis` — **Gün Kapanışı**
- `/kasa/nakit` — **Nakit Kasa**
- `/kasa/havale` — **Havale/Banka**
- `/kasa/pos` — **POS/Kart**
- `/kasa/devir` — **Devir Yönetimi**

#### 📊 RAPORLAR (12 sayfa)
- `/raporlar` — **Rapor Merkezi**
- `/raporlar/musteri` — **Müşteri Raporu**
- `/raporlar/kurban` — **Kurban Raporu**
- `/raporlar/tahsilat` — **Tahsilat Raporu**
- `/raporlar/borc` — **Borçlu Raporu**
- `/raporlar/kasa` — **Kasa Raporu**
- `/raporlar/karlilik` — **Karlılık Analizi**
- `/raporlar/excel` — **Excel Çıktıları**
- `/raporlar/pdf` — **PDF Çıktıları**
- `/raporlar/grafik` — **Grafik Raporları**
- `/raporlar/karsilastirma` — **Yıllar Karşılaştırması**
- `/raporlar/ozel` — **Özel Rapor Oluştur**

#### 📱 WHATSAPP (6 sayfa)
- `/whatsapp` — **WhatsApp Merkezi**
- `/whatsapp/sablonlar` — **Mesaj Şablonları**
- `/whatsapp/toplu` — **Toplu Gönderim**
- `/whatsapp/gecmis` — **Gönderim Geçmişi**
- `/whatsapp/kuyruk` — **Bekleyen Mesajlar**
- `/whatsapp/ayarlar` — **WhatsApp Ayarları**

#### 📺 TV EKRANI (3 sayfa)
- `/tv` — **TV Ana Görünüm** (fullscreen)
- `/tv/kesim` — **Kesim Takip**
- `/tv/sira` — **Müşteri Sırası**

#### 👨‍💼 PERSONEL (Faz 2, 6 sayfa)
- `/personel` — **Personel Listesi**
- `/personel/yeni` — **Yeni Personel**
- `/personel/[id]` — **Personel Detay**
- `/personel/odemeler` — **Personel Ödemeleri**
- `/personel/vardiya` — **Vardiya Yönetimi**
- `/personel/yetkiler` — **Yetki Matrisi**

#### 🚚 LOJİSTİK (Faz 2, 5 sayfa)
- `/lojistik` — **Teslimat Yönetimi**
- `/lojistik/aktif` — **Aktif Teslimatlar**
- `/lojistik/soforler` — **Şoförler**
- `/lojistik/araclar` — **Araçlar**
- `/lojistik/rotalar` — **Rota Optimizasyonu**

#### ⚙️ AYARLAR (15 sayfa)
- `/ayarlar` — **Genel Ayarlar**
- `/ayarlar/profil` — **Profil**
- `/ayarlar/sirket` — **Şirket Bilgileri**
- `/ayarlar/sube` — **Şube Yönetimi**
- `/ayarlar/kullanicilar` — **Kullanıcı Yönetimi**
- `/ayarlar/roller` — **Rol ve İzinler**
- `/ayarlar/fiyatlar` — **Fiyat Yönetimi** (hisse fiyatları)
- `/ayarlar/banka` — **Banka Hesapları**
- `/ayarlar/yedek` — **Yedekleme**
- `/ayarlar/import-export` — **Veri Aktarımı**
- `/ayarlar/log` — **Audit Log / Aktivite**
- `/ayarlar/bildirim` — **Bildirim Tercihleri**
- `/ayarlar/entegrasyon` — **Entegrasyonlar** (WhatsApp, SMS, POS, e-Fatura)
- `/ayarlar/temel-veri` — **Hayvan tipleri, fiyatlar, etiketler**
- `/ayarlar/sistem` — **Sistem Durumu**

#### 🔐 AUTH (4 sayfa)
- `/giris` — **Giriş**
- `/sifremi-unuttum` — **Şifre Sıfırlama**
- `/kayit` — **Kayıt** (SaaS için, çoklu müşteri)
- `/hosgeldin` — **Onboarding**

#### 🌟 ÖZEL SAYFALAR
- `/yardim` — **Yardım Merkezi**
- `/yardim/[konu]` — **Belirli konu**
- `/destek` — **Destek Talebi**
- `/blog` — **Blog/Haber** (SaaS marketing)
- `/fiyatlandirma` — **Fiyatlandırma** (SaaS müşterileri için)
- `/iletisim` — **İletişim**
- `/hakkimizda` — **Hakkımızda**
- `/kvkk` — **KVKK Aydınlatma**
- `/sozlesme` — **Hizmet Sözleşmesi**

**TOPLAM: ~100 sayfa** (büyük, kapsamlı SaaS)

---

## 5. MODÜLLER (DETAYLI)

### 5.1 ANA SAYFA (Dashboard)

**Amacı:** İlk açılışta yöneticinin gözüne çarpan kritik bilgiler.

**İçerik:**

**TOP STRİP (Bildirim Çubuğu)**
- Bayrama X gün kaldı (renkli, dikkat çekici)
- Yeni özellik duyurusu (kapatılabilir)
- Yedek hatırlatma

**KPI KARTLAR (6 kart, üst satır)**
1. **Toplam Müşteri** — sayı + bu ay trend + tıklanır
2. **Toplam Kurban** — sayı + hisse doluluk %
3. **Tahsilat** — TL + dünden değişim
4. **Bekleyen Borç** — TL + kaç müşteri (kırmızı vurgu)
5. **Bugünkü Kasa** — TL + işlem sayısı
6. **Aktif Personel** — sayı + çevrimiçi sayısı

**ANA İÇERİK (Grid layout)**

**Sol kolon:**
- Tahsilat Akışı grafiği (haftalık/aylık/yıllık) — Bar/Line chart
- Son işlemler feed (avatar + isim + tutar + zaman)
- Hızlı eylem grid (4 büyük buton)

**Orta kolon:**
- Kesim Durumu (donut chart) — Hazır/Kesimde/Tamamlandı/Beklemede
- Kasa Durumu (nakit/havale/POS dağılımı)
- Müşteri Segmentasyonu (pasta grafik)

**Sağ kolon:**
- Hatırlatmalar paneli (renkli ikonlar)
- Bayram Sayacı (büyük, etkileyici)
- Hava durumu (kesim için önemli!)
- Etkinlikler (yarın yapılacaklar)

**Alt:**
- Karlılık özeti (tablo)
- WhatsApp kuyruğu (bekleyen mesajlar)

### 5.2 MÜŞTERİLER MODÜLÜ

#### Liste Sayfası (`/musteriler`)

**Üst Bölüm (Filtre/Arama)**
- Sol: KPI özet (Toplam müşteri, Borçlu, VIP, Yeni bu ay)
- Sağ: "+ Yeni Müşteri" CTA butonu

**Filtre Bar**
- Arama input (Ctrl+K destekli)
- Durum filtresi (Hepsi, Ödedi, Kısmi, Borçlu)
- Etiket filtresi (VIP, Düzenli, Yeni, vs.)
- Sıralama (Ad, Tarih, Tutar, vs.)
- Görünüm seçici (Tablo / Kart / Liste)

**Alfabe Şeridi**
- A-Z + ÇĞIÖŞÜ
- Tıklanır, dolu olan harfler vurgulu

**Müşteri Listesi**

**Tablo Görünümü:**
| Avatar | Ad Soyad | Telefon | Hisse | Toplam | Ödenen | Kalan | Durum | Etiket | İşlem |
|--------|----------|---------|-------|--------|--------|-------|-------|--------|-------|
| MY     | Mehmet Yılmaz | 0532... | 2 | 14.000 ₺ | 7.000 ₺ | 7.000 ₺ | 🟡 Kısmi | VIP | ⋯ |

- Sıralanabilir kolonlar
- Sağ tıkla bağlam menüsü
- Çoklu seçim (checkbox)
- Sonsuz scroll veya sayfalama

**Kart Görünümü:**
- Her müşteri için kart
- Avatar büyük
- Ad + iletişim + bakiye
- Durum rozeti
- 3 hızlı eylem butonu (Tahsilat, WhatsApp, Detay)

#### Detay Sayfası (`/musteriler/[id]`)

**Üst Bölüm (Hero)**
- Sol: Büyük avatar (gradient)
- Orta: Ad, telefon, TC, etiketler, son işlem
- Sağ: Bakiye kartı (büyük, renkli)
  - Toplam bedel
  - Ödenen
  - Kalan (renkli — yeşil=ödendi, sarı=kısmi, kırmızı=borçlu)
  - "+ Tahsilat" CTA

**Hızlı Eylem Bar**
- 💰 Tahsilat Al
- 💸 İade Yap
- 📞 Telefon Et
- 💬 WhatsApp
- ✏️ Düzenle
- 🐂 Hisse Ata
- 📄 Ekstre Yazdır
- 📊 Excel İndir
- 🏷️ Etiket Ekle
- ⋯ Daha fazla

**TAB BAR (8 tab)**

1. **📋 Genel Bakış**
   - Özet bilgiler
   - Toplam istatistikler
   - Son işlemler özeti

2. **🐂 Hisseler**
   - Atanan kurbanların listesi
   - Her hisse için: Dana no, hisse no, fiyat, durum
   - Hisse ekle/çıkar butonları

3. **💰 Tahsilatlar**
   - Tüm gelen ödemeler
   - Tarih, tutar, yöntem, dekont no
   - Dekont yeniden indir/yazdır

4. **💸 İadeler / Ödemeler**
   - Müşteriye yapılan ödemeler/iadeler
   - Fazla ödeme iadeleri

5. **📜 Vekaletler**
   - İmzalı vekalet belgeleri
   - PDF görüntüleme
   - Yeni vekalet yükleme

6. **📝 Notlar**
   - Serbest metin notları
   - Tarihli, kullanıcılı
   - Renkli etiketleme (acil, hatırlat, vs.)

7. **📞 İletişim Geçmişi**
   - Gönderilen WhatsApp'lar
   - SMS'ler
   - E-postalar
   - Arama logları (manuel)

8. **📊 Hareket Logu (Audit)**
   - Kim ne zaman ne yaptı
   - Profil güncelleme, ödeme, hisse, vs.

**SAĞ PANEL (Sticky)**
- Hızlı Tahsilat Paneli
  - Tutar input
  - Yöntem seçici (Nakit/Havale/POS/Karışık)
  - "Enter" ile onay
  - Dekont otomatik açılır

### 5.3 KURBANLAR MODÜLÜ

#### Liste Sayfası

**Görünüm Seçici**
- Liste görünümü (tablo)
- Grid görünümü (kart kart)
- **Stable görünümü** (ahır tasarımı — görsel, etkileşimli)

**Stable Görünümü (Özel)**
- Her kurban büyük bir kart
- Görsel: Boğa/inek silüeti (renkli)
- 7 hisse kutusu (boş/dolu)
- Müşteri avatar'ları hisselerin üzerinde
- Sürükle-bırak ile hisse atama
- Renkler durum gösterir:
  - Yeşil: Hazır
  - Sarı: Kesimde
  - Mavi: Tamamlandı
  - Gri: Beklemede
  - Kırmızı: Sorunlu

#### Hisse Atama UI (Drag & Drop)

**Sol Panel: Müşteriler**
- Atanmamış / Eksik hisseli müşteriler
- Avatar + ad + ihtiyaç hisse sayısı
- Sürüklenebilir

**Orta Panel: Kurbanlar Grid**
- Her kurban için 7 hisse kutusu
- Boş kutu: "+ Boş"
- Dolu kutu: Müşteri avatar + adı
- Müşteri sürükleyince → yerleşir
- Çift tıkla → çıkar
- Sağ tık → menü

**Sağ Panel: Onay**
- Atama özeti
- Toplam tutar
- "Onayla ve Kaydet" butonu

#### Kurban Detay

**Üst:**
- Kurban no, ağırlık, fiyat
- Tedarikçi bilgisi
- Sağlık durumu

**Hisse Tablosu:**
- 7 hisse
- Her hisse: müşteri, fiyat, ödenen, durum
- Hisse bazlı tahsilat butonu

**Kesim Bilgisi:**
- Kesim tarihi/saati
- Kesim yapan veteriner
- Et ağırlığı (kesimden sonra)
- Sakatat dağıtım listesi

### 5.4 TAHSİLAT MODÜLÜ

#### Hızlı Tahsilat Ekranı (`/tahsilat`)

**Bu ekran bayramda en çok kullanılan ekran**, hızlı olmalı!

**Layout: Tek sayfa, 3 sütun**

**Sol Sütun: Müşteri Seçim**
- Büyük arama kutusu (otomatik focus)
- Fuzzy search (yazdıkça arar)
- Müşteri listesi (avatar + isim + bakiye)
- "+ Yeni Müşteri" linki
- Son seçilen 5 müşteri (hızlı erişim)

**Orta Sütun: Tahsilat Bilgileri**
- Seçilen müşteri bilgileri
- Bakiye gösterimi (büyük)
- **Tutar Input** (büyük, sayısal klavye)
- **Ödeme Yöntemi:**
  - Nakit / Havale / POS / **Karışık**
- Karışık seçilirse:
  - Nakit tutar
  - Havale tutar
  - POS tutar
  - Otomatik toplam
- **Açıklama** (opsiyonel)
- **Tarih** (default: bugün)
- Büyük yeşil "TAHSİL ET" butonu

**Sağ Sütun: Dekont Önizleme**
- Dekont anlık önizleme (canlı güncellenir)
- TKR numarası
- Yazdır butonu
- WhatsApp gönder butonu
- E-mail gönder butonu

#### Dekont Tasarımı

**A5 boyutu, yazdırılabilir**

**Üst:**
- Şirket logosu
- TilbeCore + Adabereket Kurban
- Adres, telefon, vergi no

**Orta:**
- Dekont no (TKR-2026-NNNNNN)
- Tarih, saat
- Kasiyer adı
- Müşteri bilgileri
- Tahsilat detayı (tutar, yöntem)
- Açıklama

**Alt:**
- Hisse bilgileri
- Bakiye (önceki + ödenen = yeni)
- İmza alanları
- QR kod (mobil onay)
- Yasal metin

### 5.5 KASA MODÜLÜ

#### Kasa Ana

**Üst Bölüm:**
- Nakit Kasa (büyük, yeşil)
- Banka Hesapları (her banka ayrı)
- POS Hesapları
- Toplam Kasa (en büyük)

**Bugün Özet:**
- Toplam giriş
- Toplam çıkış
- Net hareket
- İşlem sayısı

**Son Hareketler:**
- Tarih, saat, açıklama, tutar, yön (+/-)
- Renk kodlu (yeşil giriş, kırmızı çıkış)

#### Gider Girişi

**Form:**
- Gider tipi (Yem, İlaç, Personel, Yakıt, Diğer)
- Tutar
- Tarih
- Açıklama
- Fatura no (opsiyonel)
- Belge yükleme (PDF/foto)

### 5.6 RAPORLAR MODÜLÜ

#### Rapor Merkezi (`/raporlar`)

**Üst: Hızlı raporlar**
- Bugünkü tahsilat
- Borçlular listesi
- Kasa raporu
- Excel dışa aktar

**Grid: Tüm raporlar**
- Her rapor için kart:
  - İkon
  - Başlık
  - Açıklama
  - Son güncellenme
  - Çalıştır butonu

**Filtreler:**
- Tarih aralığı (date range picker)
- Müşteri (multi-select)
- Etiket (multi-select)
- Durum

#### Grafik Raporları

**Tahsilat Trendi**
- Line chart
- Günlük / haftalık / aylık / yıllık
- Hover'da detay
- Excel'e aktar

**Müşteri Segmentasyonu**
- Pie chart (VIP, Düzenli, Yeni)
- Tıklanır segmentler → filtrelenmiş liste

**Karlılık**
- Combo chart (gelir + gider + kar)
- Aylık karşılaştırma
- Yıllar karşılaştırması

### 5.7 WHATSAPP MODÜLÜ

#### WhatsApp Merkezi

**Sol Panel: Şablon Listesi**
- "Borç hatırlatma (yumuşak)"
- "Borç hatırlatma (sert)"
- "Tahsilat alındı"
- "Kurban hazır"
- "Bayram tebriği"
- "+ Yeni şablon"

**Orta Panel: Mesaj Editörü**
- Şablon adı
- Değişkenler ({{adSoyad}}, {{tutar}}, {{tarih}})
- Mesaj metni (zengin metin)
- Önizleme (telefon mockup'ında)

**Sağ Panel: Test ve Kaydet**
- Test gönder (kendi telefonuna)
- "Aktif" toggle
- Kaydet

#### Toplu Gönderim

**Adım 1: Şablon Seç**
**Adım 2: Hedef Seç**
- Filtreli müşteri seç (örn. "Borçlu olanlar")
- Tek tek seç
- Excel'den listesini yükle

**Adım 3: Önizleme**
- Kaç kişiye gidecek
- Örnek mesaj (gerçek müşteri verisiyle)
- Maliyet (varsa)

**Adım 4: Zamanlama**
- Şimdi gönder
- İleri tarih
- Saat seç

**Adım 5: Onay ve Gönder**

### 5.8 TV EKRANI

#### Kesim Takip Ekranı

**Fullscreen, klavye ile kontrol**

**Layout: Dikey 3 bölüm**

**Üst:**
- Tilbe logosu
- "ADABEREKET KURBAN MERKEZİ"
- Tarih, saat (büyük, canlı)
- Kalan kurban sayısı

**Orta (En büyük alan):**
- 3 sütun
- **Şu an kesimde** (3 hisse)
  - Müşteri adı, hisse no, dana no
  - Renkli durum çubuğu (ilerleme)
- **Sıradakiler** (5 hisse)
  - Aşamalı listeler
- **Bekleyenler** (toplam sayı)

**Alt:**
- Bilgi şeridi (kayan yazı)
  - "Hisse sahipleri ÇIKARDIĞINIZ et torbalarını teslim alabilir"
  - Hatırlatmalar

**Renkler:**
- Kesimde: Turuncu (#ea580c) + animasyon
- Hazır: Yeşil (#16a34a)
- Sırada: Sarı (#f59e0b)
- Beklemede: Gri (#94a3b8)

**Özellikler:**
- Otomatik yenilenir (SSE / WebSocket)
- Müşteri kesime girdiğinde animasyon
- Bayram günü 12-24 saat çalışır
- Power-save mode (gece düşük parlaklık)

### 5.9 AYARLAR MODÜLÜ

#### Genel Ayarlar
- Şirket adı, adresi
- Logo upload
- Vergi no
- Banka hesapları

#### Kullanıcı Yönetimi
- Kullanıcı listesi
- Yeni kullanıcı ekle
- Rol atama (Admin / Kasiyer / İzleyici / Personel)
- Şifre sıfırla
- Aktivite logu

#### Rol ve İzinler
- Rol matrisi
- Her rol için izinler:
  - Müşteri görme/ekleme/silme
  - Tahsilat alma/iptal
  - Kasa görme/değiştirme
  - Rapor görme
  - Sistem ayarları

#### Yedekleme
- Otomatik yedek listesi (tarihli)
- Manuel yedek butonu
- Restore (geri yükleme)
- Bulut yedek (Google Drive / S3) — Faz 2

#### Audit Log
- Kim, ne zaman, ne yaptı
- Filtre (kullanıcı, eylem, tarih)
- Export

---

## 6. BİLEŞEN KÜTÜPHANESİ

Tasarımcı bu bileşenleri **bir kere** çizecek, sonra her yerde kullanılacak.

### 6.1 Temel Bileşenler

**Butonlar (5 boyut, 4 stil)**
- Stiller: Primary, Secondary, Outline, Ghost, Destructive
- Boyutlar: xs, sm, md, lg, xl
- Durumlar: Normal, Hover, Active, Disabled, Loading

**Input'lar**
- Text Input
- Number Input (TL için)
- Date Picker
- Time Picker
- Select / Dropdown
- Multi-select
- Searchable Select
- Checkbox
- Radio
- Toggle Switch
- Textarea
- File Upload (drag-drop)

**Kartlar**
- Default Card
- Stat Card (KPI)
- Action Card (hover'da büyür)
- Müşteri Kart
- Kurban Kart

**Liste Bileşenleri**
- Table (sıralanır, filtrelenir)
- List Item
- Avatar List
- Activity Feed

**Modal / Dialog**
- Confirmation Modal (Onay)
- Alert Dialog
- Form Modal
- Drawer (sağdan açılan)
- Bottom Sheet (mobile)
- Sticky Panel

**Navigasyon**
- Sidebar (kompakt + genişletilmiş)
- Top Bar
- Breadcrumb
- Tab Bar
- Pagination
- Stepper (form adımları)

**Geri Bildirim**
- Toast / Snackbar
- Alert (info, success, warning, error)
- Banner
- Skeleton Loader
- Progress Bar
- Spinner
- Empty State
- Error State (404, 500)

**Veri Görselleştirme**
- Stat Card (sayı + trend)
- Line Chart
- Bar Chart
- Donut Chart
- Pie Chart
- Progress Ring
- Sparkline (mini chart)
- Heatmap

### 6.2 Özel Bileşenler (TilbeCore'a Özel)

**Avatar**
- 3 boyut (sm 32px, md 40px, lg 64px)
- Gradient (ID bazlı, otomatik renk)
- İlk harfler
- Online indicator (yeşil nokta)
- VIP rozeti (köşede)

**Müşteri Kartı**
- Avatar (lg)
- Ad + telefon
- Bakiye (renkli)
- Etiketler (VIP, Düzenli)
- Hisse sayısı
- Hızlı eylem butonları (3 dot)

**Hisse Kutusu** (Kurbanlar modülü için)
- 7 küçük kare (1 kurban için)
- Boş: kesik çizgi border
- Dolu: müşteri avatar
- Hover'da müşteri adı tooltip
- Sürükle-bırak destekli

**Kurban Kartı (Stable view)**
- Boğa silüet ikon
- Kurban no
- 7 hisse kutusu yan yana
- Durum şeridi (renkli)
- Tıklanır

**Tahsilat Hızlı Panel**
- Sticky right panel
- Tutar input (büyük)
- Yöntem seçici
- "Tahsil Et" button
- Klavye shortcut (Enter)

**Bayram Sayacı**
- Gradient kart (turuncu)
- Büyük sayı (kalan gün)
- Animasyon (her gün değişir)
- "Bayram günü" geldiğinde kutlama

**Dekont Önizleme**
- A5 oranlı kart
- Yazdırılabilir
- Logolu

**TV Kesim Item**
- Müşteri adı (büyük)
- Hisse + dana no
- İlerleme barı
- Yeni geldi animasyonu

### 6.3 Etiket / Badge'ler

**Durum Etiketleri**
- 🟢 Ödendi (yeşil)
- 🟡 Kısmi (sarı)
- 🔴 Borçlu (kırmızı)
- ⚪ Beklemede (gri)
- 🔵 İptal (mavi gri)

**Özellik Etiketleri**
- ⭐ VIP (altın)
- 💎 Düzenli (mavi)
- 🆕 Yeni (yeşil)
- ⚠️ Sorunlu (turuncu)
- 🚫 Engelli (kırmızı)

**Kurban Durumu**
- 🟢 Hazır
- 🟡 Kesimde
- 🔵 Tamamlandı
- ⚪ Beklemede
- 🟣 Vekaletli
- 🔴 Sorunlu

### 6.4 İkon Seti

**İlk tercih:** Lucide Icons (Tailwind ile uyumlu)

**Kurban için özel ikonlar:**
- 🐂 Boğa/Dana
- 🐑 Koyun/Keçi (küçükbaş için)
- 🥩 Et (sakatat için)
- 🔪 Kesim
- 📜 Vekalet
- 🕌 Bayram (cami silueti)

---

## 7. TASARIM SİSTEMİ

### 7.1 Spacing Sistemi (8-Point Grid)

```
4px   — xs (içerik içi gap)
8px   — sm (kart içi)
12px  — md (öğe arası)
16px  — base (genel padding)
24px  — lg (kart padding)
32px  — xl (sayfa padding)
48px  — 2xl (büyük gap)
64px  — 3xl (sayfa bölüm arası)
```

### 7.2 Border Radius

```
2px   — xs (input içi)
4px   — sm (etiket, rozet)
6px   — md (buton, küçük kart)
8px   — base (kart)
12px  — lg (büyük kart)
16px  — xl (özel kart)
24px  — 2xl (modal, drawer)
9999px — full (avatar, pill button)
```

### 7.3 Gölgeler (Shadow)

```
shadow-sm:  Hover state, ince çizgi
shadow-md:  Kart vurgu
shadow-lg:  Modal, dropdown
shadow-xl:  Drawer, sidebar
```

**Renk önerim:** Sade — modern tasarımda gölge minimal. Border kullan, gölge sadece hover/active'de.

### 7.4 Geçişler (Transitions)

```
fast:    150ms ease-out (hover)
base:    200ms ease (her şey)
slow:    300ms ease (modal, drawer)
slower:  500ms ease (sayfa geçişi)
```

### 7.5 Z-Index Sistemi

```
0:    Default
10:   Sticky elements
20:   Tooltips
30:   Dropdowns
40:   Drawers
50:   Modals
60:   Toasts
70:   Above all (kritik bildirim)
```

---

## 8. ETKİLEŞİM MODELLERİ

### 8.1 Klavye Kısayolları

**Genel**
- `Ctrl+K` — Komut paleti (her şey buradan)
- `?` — Yardım/kısayollar
- `Esc` — Modal/drawer kapat
- `/` — Hızlı arama focus

**Tahsilat**
- `Ctrl+T` — Yeni tahsilat
- `Enter` — Onayla
- `Ctrl+P` — Dekont yazdır

**Navigasyon**
- `G + D` — Dashboard
- `G + M` — Müşteriler
- `G + K` — Kurbanlar
- `G + T` — Tahsilat
- `G + R` — Raporlar

### 8.2 Komut Paleti (Ctrl+K)

**Linear/VSCode tarzı**

**İçerik:**
- "Mehmet Yılmaz" → müşteriye git
- "yeni tahsilat" → tahsilat sayfası
- "bugünkü rapor" → rapor
- "WhatsApp toplu gönder" → ilgili sayfa
- "borçlular" → borçlu listesi
- Her sayfa
- Her komut
- Recent searches

### 8.3 Geri Bildirim

**Toast Bildirimleri**
- Sağ üst köşede
- Otomatik kapanır (5sn)
- Türleri: success, error, warning, info
- Aksiyon butonlu olabilir ("Geri Al")

**Loading States**
- Buton içi spinner (eylemde)
- Skeleton screen (sayfa yüklenirken)
- Progress bar (uzun işlemler)

**Boş Durumlar (Empty States)**
- İllüstrasyon
- Açıklama metni
- CTA buton ("Yeni Müşteri Ekle")

### 8.4 Sürükle-Bırak

- Hisse atama (müşteri → hisse)
- Sıralama (kesim sırası)
- Dosya upload (PDF, fotoğraf)
- Excel import

---

## 9. RESPONSIVE TASARIM

### Breakpoint'ler

```
xs:  < 640px   (Telefon dikey)
sm:  640px+    (Telefon yatay)
md:  768px+    (Tablet)
lg:  1024px+   (Laptop)
xl:  1280px+   (Desktop)
2xl: 1536px+   (Geniş ekran)
```

### Mobil (Telefon)

**Saha personeli için kritik!**

- Sidebar → bottom navigation
- Top bar → kompakt (logo + arama ikon + bildirim)
- Tablolar → kart görünümü
- 3 sütun layout → tek sütun
- Tüm CTA butonlar tam genişlik
- Touch-friendly (min 44x44px)
- Gesture'lar (swipe to delete, vs.)

**Mobile-specific sayfalar:**
- Hızlı Tahsilat (telefon optimize)
- WhatsApp Tek mesaj
- Müşteri Ara

### Tablet

- Sidebar daraltılır (sadece ikon)
- 2 sütun layout
- Touch optimize
- Kasiyer bir tablet kullanabilir (POS tarzı)

### Desktop

- Tam sidebar
- 3-4 sütun layout
- Klavye shortcut yoğun
- Çoklu pencere desteği (TV ekranı ayrı)

---

## 10. ÖZEL EKRANLAR

### 10.1 TV Ekranı (Public Display)

- Fullscreen
- Tıklanmaz (sadece görüntüleme)
- Otomatik yenilenir
- Müşteriler de görür → temiz, anlaşılır, hoş

### 10.2 Müşteri Portal (Faz 3)

Müşteri kendi link ile giriş yapar:
- Hissesinin durumu
- Ödeme geçmişi
- Dekont indirme
- Kesim durumu
- "Geliyorum" butonu

### 10.3 Onboarding (İlk Kurulum)

- 5 adımlı sihirbaz
- Şirket bilgileri
- Logo yükleme
- Kullanıcılar
- Banka hesapları
- Hisse fiyatları
- "Tamamla" → Dashboard

### 10.4 Erişim Reddedildi (403)

- İllüstrasyon
- "Bu sayfa için yetkiniz yok"
- Geri butonu

### 10.5 Sayfa Bulunamadı (404)

- Eğlenceli illüstrasyon (kayıp dana?)
- "Aradığınız sayfa bulunamadı"
- Ana sayfaya dönüş

### 10.6 Bakım Modu

- Sistem güncellenirken
- Animasyonlu logo
- Tahmini süre

---

## 11. TASARIM ÖNERİLERİ VE İLHAM

### 11.1 İlham Kaynakları

**Studied & Approved:**
- **Linear.app** — modern, hızlı, kısayol odaklı
- **Stripe Dashboard** — finansal veri sunumu
- **Vercel Dashboard** — temiz, premium
- **Notion** — esneklik
- **Airbnb** — kullanıcı dostu

**Türk pazarına özel:**
- **Trendyol Satıcı Paneli** — Türk kullanıcı bilir
- **Hepsiburada Merchant** — tablolar iyi
- **iyzico Dashboard** — finansal sunum

### 11.2 Tasarım Trendleri (2026)

✅ **Kullan:**
- Subtle gradient'ler (sadece arka plan, CTA)
- Glassmorphism (sınırlı)
- Micro-interactions (hover, click)
- Sayfa geçişleri yumuşak
- Skeleton loading
- Dark mode

❌ **Kaçın:**
- Aşırı süslü illüstrasyonlar
- Çok renkli tasarım (kafa karıştırır)
- Neumorphism (eski moda)
- Auto-playing animations
- Aşırı gölge

### 11.3 Önemli Detaylar

**Bayram için özel:**
- Kurban Bayramı sayacı (sayfada görünür)
- Bayram günü tema (turuncu vurgu artar)
- Bayram tebrik animasyonu

**Türk pazarına:**
- TL para birimi (₺)
- Türkçe tarih (24.05.2026)
- TC Kimlik validasyon
- Türk telefon formatı (+90 5XX...)
- Bayram tatil günleri (resmi tatil bildirimi)

**Kurban kültürüne:**
- Hayvan refahına önem (görsel ifade)
- Vekalet kavramı net
- Helal bilgisi
- Bayram namazı vakti gösterimi (bonus)

---

## 12. EKSTRA / FAZA 2 / GELECEK

### Yapay Zeka Özellikler

- **Otomatik tahsilat tahmini:** "Bu müşteri 3 gün içinde ödeyecek"
- **VIP tespit:** "Bu müşteri VIP'e dönüşebilir"
- **Risk uyarı:** "Bu müşteri 2 yıldır geç ödüyor"
- **Otomatik gruplandırma:** Müşteri segmentleri
- **Fiyat önerisi:** "Bu yıl fiyatı 7.500 ₺ yapın"

### Mobil Uygulama (Native)

- iOS + Android
- Offline-first
- Push notification
- Barcode scanner (hisse no)
- Imza alma (touch)
- Foto alma (vekalet, makbuz)

### Entegrasyonlar

- **E-Fatura (GİB)**
- **e-Arşiv**
- **POS terminalleri** (Iyzico, Param, vs.)
- **Banka API** (havale otomatik)
- **SMS** (Netgsm, Iletimerkezi)
- **WhatsApp Business API** (resmi)
- **Muhasebe yazılımları** (Logo, Mikro, Netsis)
- **e-Ticaret platformları** (et satış için)

### Multi-tenant SaaS

- Her çiftlik kendi alanı
- Subdomain (adabereket.tilbe.com)
- Veri izolasyonu
- Faturalandırma
- Stripe entegrasyon

---

## 13. TESLİM EDİLECEKLER

Tasarımcı (sen) Figma'da şunları teslim edecek:

### A) Tasarım Sistemi (Design System)
- Renk paleti
- Tipografi
- Spacing
- İkonlar
- Bileşen kütüphanesi
- Token'lar (CSS değişkenleri için hazır)

### B) Sayfa Tasarımları (Mockup'lar)

**Öncelikli (Faz 1):**
1. Ana Sayfa (Dashboard)
2. Müşteriler Liste
3. Müşteri Detay (8 tab)
4. Hızlı Tahsilat
5. Kurbanlar Liste + Stable View
6. Hisse Atama UI
7. TV Kesim Ekranı
8. WhatsApp Merkezi
9. Raporlar
10. Ayarlar

**Faz 2:**
- Tüm diğer sayfalar
- Mobil tasarımları
- Onboarding

### C) Etkileşim (Prototype)

- Tıklanır prototype
- Sayfa geçişleri
- Modal/drawer açılışları
- Hover/active state'ler

### D) Asset'lar

- Logo (SVG, PNG)
- İllüstrasyonlar (boş state'ler için)
- İkonlar (özel olanlar)
- Mockup screenshot'lar (pazarlama için)

---

## 14. BAŞLAMA ADIMLARI (TASARIMCI İÇİN)

### Adım 1: Tasarım Sistemi Kur (1-2 gün)
- Renkler, tipografi, spacing
- Component library başlat
- Token'lar

### Adım 2: Ana Sayfa (Dashboard) Çiz (1 gün)
- En kritik sayfa
- Stakeholder'a göster, feedback al

### Adım 3: Müşteri Detay (1 gün)
- Tab yapısı
- Hızlı eylem barı
- Sticky panel

### Adım 4: Tahsilat (1 gün)
- 3 sütun layout
- Dekont önizleme

### Adım 5: Diğer Kritik Sayfalar (3-5 gün)
- Müşteri liste
- Kurban liste + Stable
- Hisse atama
- TV ekranı

### Adım 6: Prototype Bağla (1 gün)
- Tıklanır akış
- Demo için hazır

### Adım 7: Claude Code'a Brief Hazırla
- Tasarım sistemi → token'lar
- Mockup'lar → screenshot'lar
- Etkileşim notu

---

## 15. FİGMA ORGANİZASYON ÖNERİSİ

```
📁 TilbeCore Kurban - Design System
   ├── 🎨 01 - Foundations
   │   ├── Colors
   │   ├── Typography
   │   ├── Spacing
   │   └── Icons
   │
   ├── 🧱 02 - Components
   │   ├── Buttons
   │   ├── Inputs
   │   ├── Cards
   │   ├── Tables
   │   ├── Navigation
   │   ├── Feedback
   │   └── Charts
   │
   ├── 🎭 03 - Patterns
   │   ├── Forms
   │   ├── Lists
   │   ├── Modals
   │   └── Empty States
   │
   ├── 📄 04 - Pages
   │   ├── 🏠 Dashboard
   │   ├── 👥 Customers
   │   ├── 🐂 Animals
   │   ├── 💰 Payments
   │   ├── 💼 Cashbox
   │   ├── 📊 Reports
   │   ├── 📱 WhatsApp
   │   ├── 📺 TV Display
   │   └── ⚙️ Settings
   │
   ├── 📱 05 - Mobile
   │   ├── Bottom Nav
   │   ├── Customer Mobile
   │   └── Quick Payment Mobile
   │
   ├── 🔧 06 - Special
   │   ├── Login / Onboarding
   │   ├── 404 / Error
   │   └── Maintenance
   │
   └── 📦 07 - Assets
       ├── Logo
       ├── Illustrations
       └── Mockup Photos
```

---

## ✅ ÖZET

**Sen şunu yapacaksın:**
1. Bu briefi oku
2. Figma'da yeni dosya aç
3. Tasarım sistemini kur (renk, font, component'ler)
4. **Önce Ana Sayfa**'yı çiz, bana göster
5. Onay alınca diğer sayfaları çiz
6. Hepsi bitince ben Claude Code'a brief hazırlarım

**Ben şunu yapacağım:**
1. Tasarımını göreceğim
2. Her sayfa için **detaylı Claude Code prompt'u** yazacağım
3. Tasarım token'larını CSS değişkenlerine çevireceğim
4. Component library'i Tailwind'e çevireceğim
5. Sen Claude Code'a verirsin, uygular

**Hedef:**
TilbeCore Kurban — Türkiye'nin **en profesyonel** kurban yönetim sistemi.

---

**Hayırlı tasarımlar! 🎨🐂**

— *TilbeCore Mimari*
