# TİLBECORE KURBAN — PROFESYONEL SIDEBAR MENÜ YAPISI

> **Yerli yazılımlar:** Kurban Dijital, Bikurbanlık, Kurban360, Kurban Takip Sistemi, Sistem Plus, Nesasoft
> **Yabancı yazılımlar:** inecta (slaughterhouse ERP), TRAX-IT (slaughter traceability), Farmbrite (livestock), Folio3, Chetu, Farmkeep
> **Tarih:** 24 Mayıs 2026

---

## 🎯 ANA STRATEJİ

### Davranış
- ✅ Akordeon: Bir menü açılınca **diğeri otomatik kapanır** (kullanıcının isteği)
- ✅ Her ana menü altında **MAX 10 alt menü** (kullanıcının isteği)
- ✅ Sıralama: **En çok kullanılan yukarıda** (bayram operasyonu için)
- ✅ Her menü **gerçek bir iş** karşılıyor (gereksiz yok)

### Tasarım İlkesi
**"Bayram günü kasiyer 3 tıkta her şeyi yapabilmeli."**

---

## 📋 12 ANA MENÜ YAPISI (Optimal)

### 1. 🏠 ANA SAYFA (Dashboard)
**Alt menü YOK** — tek sayfa

**İçerik:**
- 6 KPI kart (müşteri, kurban, hisse, tahsilat, borç, kasa)
- Canlı kesim akışı (7 aşama)
- Tahsilat grafiği
- Hatırlatmalar paneli
- Bayram sayacı

---

### 2. 👥 MÜŞTERİLER / CARİ
**(Yerli + yabancı tüm yazılımlarda en kritik modül)**

```
👥 Müşteriler / Cari
   ├── 📋 Tüm Müşteriler
   ├── ➕ Yeni Müşteri
   ├── ⚠️ Borçlular
   ├── ⭐ VIP Müşteriler
   ├── 🆕 Yeni Müşteriler (bu sezon)
   ├── 📄 Hesap Ekstresi
   ├── 🏷️ Etiket Yönetimi
   ├── 📥 Excel İçe Aktar
   └── 📤 Excel Dışa Aktar
```

**9 alt menü.** Her biri **gerekli**:
- Tüm Müşteriler: Liste + filtre
- Yeni Müşteri: Hızlı kayıt
- Borçlular: Kritik liste (bayrama özel)
- VIP: Özel müşteriler
- Yeni Müşteriler: Bu sezon kaydolanlar
- Hesap Ekstresi: Cari yazdırma
- Etiketler: Segmentasyon
- Excel: Veri akışı (iki yönlü)

---

### 3. 🐂 KURBAN YÖNETİMİ
**(Hayvan + hisse + satış birleşik)**

```
🐂 Kurban Yönetimi
   ├── 📋 Tüm Kurbanlar
   ├── ➕ Yeni Kurban Ekle
   ├── 🐄 Hayvan Tedariği
   ├── 🎯 Hisse Atama
   ├── ⭕ Boş Hisseler
   ├── 🔄 Hisse Transfer
   ├── 📜 Vekalet Yönetimi
   ├── 🖼️ Hayvan Galerisi (fotoğraflar)
   ├── 🏷️ Etiket Yazdırma
   └── 📊 Stok Durumu
```

**10 alt menü.**

**Yeni Özellikler (Yabancı yazılım esinli):**
- **Hayvan Galerisi:** Her hayvanın fotoğrafları (Kurban360'ta var)
- **Etiket Yazdırma:** 6x9 cm hisse etiketleri (Bikurbanlık'ta var)
- **Stok Durumu:** Anlık doluluk + uyarılar (inecta tarzı)
- **Hayvan Tedariği:** Tedarikçi kaydı + alım (TRAX-IT tarzı)

---

### 4. 🔪 KESİM OPERASYONU
**(Bayram günü kalbi)**

```
🔪 Kesim Operasyonu
   ├── 📺 Canlı Akış Paneli
   ├── 📋 Kesim Sırası
   ├── 🔪 Aktif Kesimler
   ├── 👨‍⚕️ Veteriner Kontrol
   ├── ⚖️ Tartım & Sınıflandırma
   ├── 🔪 Parçalama
   ├── 📦 Paketleme
   ├── 📤 Teslimat Hazırlığı
   ├── 🥩 Sakatat Dağıtımı
   └── 📊 Operasyon Raporu
```

**10 alt menü.**

**Yabancı Yazılım Esinli (inecta + TRAX-IT):**
- **Tartım & Sınıflandırma:** Canlı kg / karkas kg (slaughterhouse standardı)
- **Sakatat Dağıtımı:** Karaciğer, böbrek, işkembe (Türk kültürü için kritik)
- **Veteriner Kontrol:** Sağlık onayı (gıda güvenliği standardı)

---

### 5. 💰 TAHSİLAT & ÖDEME
**(Para işleri tek menüde)**

```
💰 Tahsilat & Ödeme
   ├── ⚡ Hızlı Tahsilat
   ├── 📋 Tüm Tahsilatlar
   ├── 📅 Bugünkü Tahsilatlar
   ├── 📜 Dekontlar (TKR)
   ├── 💸 İadeler
   ├── 🔄 Taksit Takibi
   ├── 🎟️ İndirim & Mahsup
   ├── ❌ İptal İşlemleri
   ├── 🏷️ Fiyat Yönetimi
   └── 📨 Toplu Tahsilat
```

**10 alt menü.**

**Yeni Özellikler (Kurban360 esinli):**
- **Taksit Takibi:** Ödeme planları (Türk pazarı önemli)
- **İndirim & Mahsup:** Akıllı muhasebe (Kurban360'da var)
- **Fiyat Yönetimi:** Hisse fiyat ayarları
- **Toplu Tahsilat:** Birden çok müşteri tek seferde

---

### 6. 💼 KASA & FİNANS
**(Tahsilat'tan ayrı, çünkü kasa kasiyer dışı kullanıcılara da açık)**

```
💼 Kasa & Finans
   ├── 💵 Kasa Özeti
   ├── 💵 Nakit Kasa
   ├── 🏦 Banka Hesapları
   ├── 💳 POS / Kart
   ├── 📊 Kasa Hareketleri
   ├── 💸 Giderler
   ├── 📈 Gelir-Gider Analiz
   ├── 🌅 Gün Açılış / Kapanış
   ├── 🔄 Banka Mutabakat
   └── 💹 Karlılık Analizi
```

**10 alt menü.**

**Yabancı esinli (inecta):**
- **Karlılık Analizi:** Hisse başı kâr/zarar (cost per head)
- **Banka Mutabakat:** Banka ekstresi import (bank reconciliation)
- **Gün Açılış/Kapanış:** Vardiya yönetimi

---

### 7. 🚚 LOJİSTİK & TESLİMAT
**(Faz 2, ama menüde olsun ki yapı görünür olsun)**

```
🚚 Lojistik & Teslimat
   ├── 📦 Aktif Teslimatlar
   ├── 📋 Teslim Programı
   ├── 🚛 Şoför Yönetimi
   ├── 🚗 Araç Yönetimi
   ├── 🗺️ Rota Optimizasyonu
   ├── 📍 Canlı Takip (GPS)
   ├── ✅ Teslim Onayları
   ├── 📷 Teslim Fotoğrafları
   └── 📊 Lojistik Raporu
```

**9 alt menü.**

**Yabancı esinli:**
- **Rota Optimizasyonu** (logistics standardı)
- **Canlı GPS Takip**
- **Teslim Fotoğrafları** (kanıt)

---

### 8. 💬 İLETİŞİM & WHATSAPP
**(WhatsApp + SMS + Email birleşik)**

```
💬 İletişim & WhatsApp
   ├── 📨 Mesaj Merkezi (Inbox)
   ├── 📋 Mesaj Şablonları
   ├── 📤 Toplu Gönderim
   ├── ⏰ Zamanlanmış Mesajlar
   ├── 📜 Gönderim Geçmişi
   ├── 📵 SMS Yönetimi
   ├── 📧 E-mail Yönetimi
   ├── 📞 Arama Logu
   ├── 🤖 Otomatik Hatırlatma
   └── ⚙️ Entegrasyon Ayarları
```

**10 alt menü.**

**Yeni Özellikler:**
- **Otomatik Hatırlatma:** Borçluya 7/3 gün kala otomatik
- **Zamanlanmış Mesajlar:** İleri tarih gönderim
- **SMS + E-mail** entegre (sadece WhatsApp değil)

---

### 9. 📊 RAPORLAR & ANALİZ
**(BI + dashboard düşünülerek)**

```
📊 Raporlar & Analiz
   ├── 📈 Rapor Merkezi
   ├── 👥 Müşteri Analizi
   ├── 🐂 Kurban Analizi
   ├── 💰 Finansal Raporlar
   ├── ⚠️ Borç Raporu
   ├── 🔪 Operasyon Raporu
   ├── 📅 Dönemsel Karşılaştırma
   ├── 🎯 Karlılık & ROI
   ├── 🤖 AI Tahminler (Faz 4)
   └── 📤 Özel Rapor Oluştur
```

**10 alt menü.**

**Yabancı esinli (Folio3 + inecta):**
- **Dönemsel Karşılaştırma:** Yıllar karşılaştırma
- **AI Tahminler:** Tahmin modelleri (predictive)
- **ROI:** Yatırım geri dönüş

---

### 10. 👨‍💼 PERSONEL & EKİP
**(Çok-rollü kullanım için)**

```
👨‍💼 Personel & Ekip
   ├── 👥 Personel Listesi
   ├── ➕ Yeni Personel
   ├── 📋 Vardiya & Görev
   ├── 💬 Ekip Sohbeti (Chat)
   ├── 🎤 Sesli Mesajlaşma
   ├── 📍 Konum Takibi
   ├── 📊 Performans Raporu
   ├── 💵 Personel Ödemeleri
   ├── 🔐 Yetki Yönetimi
   └── 📜 Aktivite Logu
```

**10 alt menü.**

**Kullanıcının istediği:**
- **Ekip Sohbeti:** Slack tarzı yazılı chat
- **Sesli Mesajlaşma:** Walkie-talkie
- **Konum Takibi:** Saha personeli
- **Yetki Yönetimi:** Çok-rollü kullanım

---

### 11. 📺 TV EKRANI
**Alt menü YOK** — link, yeni sekme açar (fullscreen)

**İçerik:**
- Canlı kesim takip
- Müşteri sıra ekranı
- Public display (müşteri görür)

---

### 12. ⚙️ AYARLAR & SİSTEM

```
⚙️ Ayarlar & Sistem
   ├── 👤 Profil Ayarları
   ├── 🏢 Şirket Bilgileri
   ├── 🏪 Şube Yönetimi
   ├── 👥 Kullanıcı Yönetimi
   ├── 🔐 Roller & İzinler
   ├── 🎨 Tema & Görünüm
   ├── 💾 Yedekleme & Geri Yükleme
   ├── 🔌 Entegrasyonlar
   ├── 🌐 Multi-tenant (SaaS, Faz 2)
   └── 🛠️ Sistem Durumu
```

**10 alt menü.**

---

## 📊 ÖZET TABLO

| # | Ana Menü | Alt Menü Sayısı | Önem |
|---|----------|-----------------|------|
| 1 | 🏠 Ana Sayfa | - | ⭐⭐⭐ |
| 2 | 👥 Müşteriler / Cari | 9 | ⭐⭐⭐ |
| 3 | 🐂 Kurban Yönetimi | 10 | ⭐⭐⭐ |
| 4 | 🔪 Kesim Operasyonu | 10 | ⭐⭐⭐ |
| 5 | 💰 Tahsilat & Ödeme | 10 | ⭐⭐⭐ |
| 6 | 💼 Kasa & Finans | 10 | ⭐⭐ |
| 7 | 🚚 Lojistik & Teslimat | 9 | ⭐⭐ (Faz 2) |
| 8 | 💬 İletişim & WhatsApp | 10 | ⭐⭐⭐ |
| 9 | 📊 Raporlar & Analiz | 10 | ⭐⭐ |
| 10 | 👨‍💼 Personel & Ekip | 10 | ⭐⭐⭐ |
| 11 | 📺 TV Ekranı | - | ⭐⭐⭐ |
| 12 | ⚙️ Ayarlar & Sistem | 10 | ⭐⭐ |

**Toplam:** 12 ana menü + ~98 alt menü

---

## 🏆 NEDEN BU YAPI EN İYİSİ?

### Yerli Yazılımlardan Aldığımız İyi Fikirler:

✅ **Kurban360:** Hisse takibi, QR kod, TV ekranı, taksit, indirim/mahsup, müşteri portal
✅ **Bikurbanlık:** Etiket yazdırma, hisse atama, kesim sırası
✅ **Kurban Dijital:** Mobil PWA, otomatik yedekleme, SMS, çoklu kullanıcı
✅ **Kurban Takip Sistemi:** Çoklu kullanıcı + yetki, masaüstü + web, fiyat yönetimi
✅ **Sistem Plus:** Adak/akika/vacip ayrımı, video paylaşımı, yurt içi/dışı kota, çok dil
✅ **Nesasoft (Bikurbanlık):** Stok yönetimi, kesim planlaması, etiket

### Yabancı Yazılımlardan Aldığımız İyi Fikirler:

✅ **inecta:** Tartım, sınıflandırma, hayvan refahı, ERP entegrasyon, karlılık analizi
✅ **TRAX-IT:** Tedarikçi takibi, küpe doğrulama, sevk, gelişmiş izlenebilirlik
✅ **Farmbrite:** Sağlık monitoring, breeding, IoT entegrasyon
✅ **Folio3:** AI tahminler, predictive analytics, real-time dashboards
✅ **Chetu:** Performance tracking, herd monitoring
✅ **Farmkeep:** Finansal entegrasyon, gelir takibi

### Bizim Eklediğimiz Özgün Özellikler:

🆕 **Ekip Sohbeti (yazılı + sesli)** — Türk yazılımlarında yok
🆕 **Konum Takibi** — saha personeli için
🆕 **AI Tahminler** — Türk pazarında yok
🆕 **Multi-tenant SaaS** — diğer çiftliklere satılabilir
🆕 **Bayram Sayacı** — duygusal bağ
🆕 **Canlı Operasyon Akışı** — 7 aşamalı
🆕 **Veteriner Mobil Giriş** — saha kontrol
🆕 **TilbeCore Brand Identity** — premium SaaS hissi

---

## 🎨 SIDEBAR DAVRANIŞ KURALLARI

### 1. Akordeon Mantığı (Kullanıcı İsteği)
```javascript
// Bir menü açılınca, diğer açık menüler otomatik kapanır
function menuAc(menuId) {
  // Önceki açık menüyü kapat
  setActiveMenu(menuId);
  // Yeni menüyü aç
}
```

### 2. Klavye Kısayolları
- `Ctrl+Shift+M` → Müşteriler aç
- `Ctrl+Shift+K` → Kurbanlar aç
- `Ctrl+Shift+T` → Tahsilat aç
- `Ctrl+Shift+W` → WhatsApp aç
- `Ctrl+Shift+D` → Dashboard

### 3. Aktif Sayfa Vurgu
- Aktif ana menü: Turuncu zemin + beyaz yazı
- Aktif alt menü: Sol turuncu çizgi + bg vurgu
- Hover: Hafif gri zemin

### 4. Görsel Durum Rozetleri
Bazı menülerde **bildirim sayısı**:
- 👥 Müşteriler **34** (borçlu sayısı)
- 💬 WhatsApp **23** (bekleyen mesaj)
- ⚠️ Kasa **!** (kapanış bekleniyor)
- 🐂 Kurbanlar **9** (eksik vekalet)

### 5. Bildirim İkonları
```
🟢 Yeşil nokta: Yeni aktivite var
🟡 Sarı nokta: Dikkat
🔴 Kırmızı nokta: Acil
```

### 6. Collapsed Mode (Daraltılmış)
- Klik ile sidebar daralır (sadece ikon)
- Hover ile tooltip
- Mobile'da otomatik daralır

### 7. Yetki Bazlı Görünürlük
```typescript
// Kasiyer rolü görmez:
- Personel & Ekip
- Kasa & Finans (sadece okuma)
- Ayarlar (sadece profil)

// Kesim personeli sadece görür:
- Kesim Operasyonu
- TV Ekranı

// Müşteri personeli görür:
- Müşteriler
- İletişim & WhatsApp
- Hızlı Tahsilat (sadece)
```

---

## 📐 BAYRAM ÖNCESİ SADELEŞTİRİLMİŞ MENÜ

Bayrama 10 gün var. **Şimdi tam menüyü uygulamak** **çok büyük iş**. O yüzden:

### Faz 1 (Şimdi, Bayrama Kadar) — 7 Ana Menü Yeter

```
🏠 Ana Sayfa
👥 Müşteriler / Cari (5 alt)
🐂 Kurban Yönetimi (6 alt)
💰 Tahsilat (5 alt)
💼 Kasa (4 alt)
💬 WhatsApp (3 alt)
📊 Raporlar (3 alt)
📺 TV Ekranı
⚙️ Ayarlar
```

### Faz 2 (Bayram Sonrası) — Tam 12 Menü

Yukarıdaki tam yapı uygulanır.

---

## 🎯 ÖRNEK SİDEBAR HİYERARŞİSİ

```
┌─────────────────────────────────┐
│ 🐂 TilbeCore                    │
│    Kurban Yönetim Sistemi       │
├─────────────────────────────────┤
│ 🏠 Ana Sayfa                    │
│                                 │
│ 👥 Müşteriler / Cari       ▼   │
│    📋 Tüm Müşteriler           │
│    ➕ Yeni Müşteri              │
│    ⚠️ Borçlular (34)            │
│    ⭐ VIP Müşteriler             │
│    🆕 Yeni Müşteriler            │
│    📄 Hesap Ekstresi             │
│    🏷️ Etiket Yönetimi            │
│    📥 Excel İçe Aktar           │
│    📤 Excel Dışa Aktar          │
│                                 │
│ 🐂 Kurban Yönetimi          ▶   │
│ 🔪 Kesim Operasyonu         ▶   │
│ 💰 Tahsilat & Ödeme         ▶   │
│ 💼 Kasa & Finans            ▶   │
│ 🚚 Lojistik & Teslimat      ▶   │
│ 💬 İletişim & WhatsApp (23) ▶   │
│ 📊 Raporlar & Analiz        ▶   │
│ 👨‍💼 Personel & Ekip          ▶   │
│ 📺 TV Ekranı 🔗                │
│ ⚙️ Ayarlar & Sistem         ▶   │
│                                 │
├─────────────────────────────────┤
│ ⏰ Kurban Bayramına Kalan       │
│       1                         │
│      gün                        │
│   15 Haziran 2026               │
│                                 │
├─────────────────────────────────┤
│ 👤 Tilbehome                    │
│    Yönetici                     │
└─────────────────────────────────┘
```

---

## ✅ SON SÖZ

Bu menü yapısı:
- ✅ **Yerli ve yabancı 11 yazılımın** en iyi özelliklerini içerir
- ✅ **Gereksiz hiç menü yok** — her biri gerçek bir iş
- ✅ **Maksimum 10 alt menü** kullanıcı isteğine uygun
- ✅ **Akordeon davranış** — bir açılınca diğer kapanır
- ✅ **Türk pazarına özel** (taksit, mahsup, vekalet)
- ✅ **TilbeCore SaaS** vizyonuna hazır
- ✅ **Çok-rollü kullanım** için yetki sistemi

**Bayrama yetiştirilebilir:** Faz 1 (sade 7 menü) ✅
**Bayram sonrası tam vizyon:** Faz 2 (12 menü) ✅

---

**Hayırlı bayramlar! 🐂✨**

— *TilbeCore Vizyon*
