# 📊 ADA BEREKET — KAPSAMLI SİSTEM ANALİZİ & YOL HARİTASI

**Analiz Tarihi:** 27 Mayıs 2026 (bayram sonrası)
**Analiz Eden:** Kod tabanı taranarak (123 sayfa, gerçek satır sayıları)

---

## 🎯 YÖNETİCİ ÖZETİ

Sistem **çok geniş bir iskelet** üzerine kurulu: 123 sayfa planlanmış, ama **63'ü boş placeholder** (4 satırlık "yakında" sayfaları). Çalışan çekirdek güçlü (tahsilat, müşteri, hayvan, vekalet, raporlar), ama **mobil/saha kullanımı** ve **bazı kritik operasyon modülleri** eksik.

**Durum tablosu:**
- ✅ **Çalışan ve güçlü:** 60 sayfa (tahsilat, müşteri, hayvan, kasa, raporlar çekirdeği)
- ⚠️ **Boş placeholder:** 63 sayfa (yarısı)
- 🔴 **En kritik eksik:** Mobil saha kullanımı (alt navigasyon + hızlı işlem yok)

---

## 1️⃣ ÇALIŞAN MODÜLLER (Sağlam)

| Modül | Durum | Not |
|-------|-------|-----|
| **Tahsilat** | ✅ Güçlü | Ana sayfa, bugün, tüm, dekontlar, müşteri bazlı, iptal |
| **Müşteri** | ✅ Güçlü | Liste, detay, düzenle, yeni, borçlular, ekstre, arama |
| **Hayvan** | ✅ İyi | Liste, detay, yeni, hisse-atama, vekalet, boş-hisseler |
| **Kasa** | ✅ İyi | Açılış, kapanış, gider, hareketler |
| **Raporlar** | ✅ Çok iyi | Borç, kasa, tahsilat, kesim-listesi, muhasebe-defteri, kurban-dosyası |
| **TV Ekranı** | ✅ Çalışıyor | Personel + müşteri takip ekranları |
| **WhatsApp** | 🟡 Kısmi | Toplu, şablonlar, geçmiş var; SMS/email/otomatik boş |

---

## 2️⃣ BOŞ PLACEHOLDER SAYFALAR (63 adet)

### 🔴 Kritik Boşluklar (Operasyon için lazım)

**Kesim Modülü (9 boş):** En kritik eksik. Bayram günü kesimhanede lazım.
- `kesim/sira` — kesim sırası yönetimi
- `kesim/aktif` — şu an kesilen
- `kesim/parcalama` — parçalama takibi
- `kesim/paketleme` — paketleme
- `kesim/teslimat-hazirlik` — teslim hazırlığı
- `kesim/veteriner` — veteriner onayı
- `kesim/sakatat`, `kesim/canli-akis`, `kesim/rapor`

**Hisse İşlemleri (1 boş ama ÇOK kritik):**
- `hayvanlar/hisse-transfer` — **BOŞ!** Hisse devri (bayramda İSİMSİZ → gerçek hissedar için şart)

**Tahsilat (5 boş):**
- `tahsilat/toplu` — toplu tahsilat
- `tahsilat/taksit` — taksitli ödeme
- `tahsilat/indirim` — indirim uygula
- `tahsilat/iadeler` — iade işlemi
- `tahsilat/fiyat` — fiyat yönetimi

### 🟡 Orta Öncelik

**Personel (9 boş):** Tümü boş. Saha personel takibi yok.
**Lojistik (9 boş):** Tümü boş. Teslimat/araç/şoför yönetimi yok.
**Kasa (3 boş):** banka-mutabakat, gelir-gider, karlilik

### 🟢 Düşük Öncelik (Şimdilik gerekmez)

- WhatsApp alt modülleri (sms, email, otomatik, zamanlı, arama)
- Raporlar AI/ROI/dönemsel/operasyon/özel
- Müşteri etiketler/excel/vip/yeni-sezon
- Ayarlar entegrasyon/roller/saas/şube/tema

---

## 3️⃣ 🔴 EN KRİTİK SORUN: MOBİL SAHA KULLANIMI

**Mevcut durum:** Mobilde sadece **hamburger menü (drawer)** var. Saha personeli için bu YETERSİZ.

**Eksikler:**
1. ❌ **Alt navigasyon (bottom nav)** yok — telefonda en sık işlemler parmak altında olmalı
2. ❌ **Hızlı işlem butonu (FAB)** yok — "yeni satış", "tahsilat al" tek dokunuşla açılmalı
3. ❌ **Büyük dokunmatik hedefler** eksik — yaşlı personel küçük butonlara basamaz
4. ❌ **Saha modu** yok — sadeleştirilmiş, az seçenekli, hızlı ekran

**Senin söylediğin senaryo:** "Sahada ağırda bir personel telefondan... dana satışı, hisse satışı, müşteri kaydı, hisse atama, değiştirme, silme — çok rahat yapabilsin."

Bu, sistemin **en önemli eksiği.** Mevcut sayfalar masaüstü için tasarlanmış, telefonda kullanılabilir ama "çok rahat" değil.

---

## 4️⃣ TÜRKİYE & DÜNYA STANDARTLARINDA EKSİKLER

Kurban yönetim yazılımlarında olması gereken, sizde **eksik/zayıf** olanlar:

### Eksik Özellikler
1. **SMS bilgilendirme** — "Kurbanınız kesildi" otomatik SMS (placeholder boş)
2. **QR kodlu hisse takibi** — müşteri QR okutup kendi hissesini görür
3. **Online hisse satış formu** — müşteri kendi kaydını yapar (web'den)
4. **Fotoğraf/video teslim** — kesim sonrası kanıt görseli
5. **Bağış/vekalet kurum entegrasyonu** — vakıf/dernek kurbanları
6. **Et dağıtım/parçalama planı** — kaç kg, hangi parça kime
7. **Sakatat takibi** — ayrı dağıtım
8. **Teslim imza/onay** — dijital teslim tutanağı

### Güçlü Olduğunuz Alanlar (Rakiplerden İyi)
- ✅ Detaylı muhasebe denetimi (otomatik tutarsızlık tespiti — nadir özellik)
- ✅ Vekalet swipe-to-confirm (modern UX)
- ✅ Kurban dosyası (tam dökme rapor)
- ✅ TV ekranı (canlı takip)

---

## 5️⃣ ÖNERİLEN YOL HARİTASI (Öncelik Sıralı)

### 🔥 FAZ 1 — MOBİL SAHA MODU (En Acil, ~1 hafta)
Sahada telefondan rahat kullanım. **En yüksek değer.**

**Sprint 16: Mobil Alt Navigasyon + Hızlı İşlem**
- Bottom navigation (5 ana ikon: Ana Sayfa, Hayvanlar, Tahsilat, Müşteri, Daha Fazla)
- FAB (hızlı işlem): "+ Yeni Satış", "+ Tahsilat", "+ Müşteri"
- Büyük dokunmatik hedefler (min 48x48px)

**Sprint 17: Saha Satış Akışı (Tek Ekran)**
- "Yeni Hisse Satışı" sihirbazı: Müşteri seç/oluştur → Hayvan/hisse seç → Fiyat → Kapora al → Bitir
- Hepsi tek akışta, geri-ileri, büyük butonlar
- Telefon klavyesi optimize (sayı girişi numpad)

### 🔧 FAZ 2 — KRİTİK OPERASYON (Bayram öncesi şart, ~1 hafta)

**Sprint 18: Hisse Transfer (BOŞ sayfayı doldur)**
- İSİMSİZ hissedar → gerçek hissedar devri
- Hisseyi başka müşteriye taşı
- Ödeme geçmişi korunur

**Sprint 19: Kesim Modülü (Temel)**
- Kesim sırası ekranı (hangi dana sırada)
- Aktif kesim (şu an kesilen)
- Teslim hazırlık + dijital teslim onayı

### 📱 FAZ 3 — SAHA OPERASYON (Orta, ~1 hafta)

**Sprint 20: Tahsilat Tamamlama**
- Toplu tahsilat, taksit, indirim, iade

**Sprint 21: SMS Bilgilendirme**
- "Kurbanınız kesildi/hazır/teslim" otomatik SMS

### 🌟 FAZ 4 — REKABET ÖZELLİKLERİ (Düşük öncelik)
- QR hisse takibi, online satış formu, fotoğraf teslim, et dağıtım planı

---

## 6️⃣ HEMEN BAŞLANACAK: İLK 3 SPRINT

Senin önceliğin "saha personeli telefondan rahat kullansın" olduğu için:

| Sprint | Ne | Süre | Değer |
|--------|-----|------|-------|
| **16** | Mobil alt nav + FAB + büyük butonlar | 1 gün | 🔥🔥🔥 |
| **17** | Saha satış sihirbazı (tek akış) | 1.5 gün | 🔥🔥🔥 |
| **18** | Hisse transfer (boş sayfa) | 0.5 gün | 🔥🔥 |

Bu 3 sprint, "sahada telefondan her işlem rahat" hedefini büyük oranda karşılar.

---

## 7️⃣ KARAR GEREKEN NOKTALAR

1. **Mobil öncelik mi, operasyon mu?** Sen mobil dedin, ben de FAZ 1'i mobil yaptım. Onay?
2. **Saha satış sihirbazı:** Tek uzun akış mı, yoksa ayrı hızlı butonlar mı?
3. **Boş placeholder'lar:** Hepsini doldurmak büyük iş (63 sayfa). Hangileri gerçekten lazım, hangileri silinebilir/gizlenebilir?
4. **Kesim modülü:** Bu yıl kullanmadıysan gelecek yıl için mi, yoksa hiç mi?

---

## 📌 SONUÇ

Sistem **sağlam bir çekirdeğe** sahip ama **mobil saha kullanımı** ve **bazı operasyon modülleri** eksik. En yüksek değer, senin de dediğin gibi **mobil saha modunda.**

Önerim: **Sprint 16-17-18'i sırayla yapalım** (mobil nav + saha satış + hisse transfer). Bu 3'ü bitince saha personeli telefondan gerçekten rahat çalışır. Sonra kesim ve diğer modüllere geçeriz.
