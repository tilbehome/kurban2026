---
id: ARCH-81F1BAF092C5
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# TİLBECORE KURBAN — YOL HARİTASI VE YENİ MODÜLLER

> 10 Ağustos 2026 uyum notu: Bu belge tarihsel fikir/yol haritası kaynağıdır. Birinci bağlayıcı kaynak `TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md` belgesidir.
>
> Yerine geçen kararlar: Eski “Multi-Tenant SaaS Faz 6” yaklaşımı geçerli değildir; çok firma veri izolasyonu, Platform Süper Admin, Platform PostgreSQL ve firma başına ayrı PostgreSQL Faz 2 çekirdeğine alınmıştır. Self-service müşteri/üyelik, otomatik abonelik/faturalama, gelişmiş çok şube, dış servis otomasyonları ve ticari SaaS özellikleri sonraya bırakılır. Sistem yalnız büyükbaş kurban içindir; placeholder sayfalar tamamlanmış özellik sayılmaz.

> **Bu belge, refactor sonrasında uygulanacak özelliklerin tam listesidir.**
> Hem kullanıcının iste­dik­leri hem de Claude'un önerdikleri burada.
>
> **Tarih:** 24 Mayıs 2026
> **Durum:** Claude Code şu an MIMARI.md refactor yapıyor. Bittiğinde bu listeyi uygulayacağız.

---

## 📋 KAYDEDİLMİŞ KULLANICI İSTEKLERİ (Önemli)

### 1. ✅ ÇOK-ROLLÜ SAHA KULLANIMI

**Senaryo:**
- **Kullanıcı (Tilbehome):** Muhasebede, bilgisayar başında, **tüm yetki**, her şeyi yönetir
- **Kesim alanı personeli:** Telefondan bağlanır, **sadece kurban sıra işlemleri** yapar
- **Müşteri ilişkileri personeli:** Müşteri listesinden **sırası gelen müşterileri** görür, arar, mesaj atar
- **Kasiyer (yedek):** Sadece tahsilat
- **İzleyici:** Sadece görüntüleme

**Yetkiler:**
- Yönetici (admin) → her şey
- Kesim personeli → sadece kesim modülü, kasayı GÖREMEZ
- Müşteri personeli → müşteri listesi + WhatsApp + arama, tahsilat YAPAMAZ
- Kasiyer → tahsilat + dekont, müşteri silemez
- İzleyici → sadece read-only

**Cihaz türleri:**
- 💻 Muhasebede masaüstü (yönetici)
- 📱 Sahada telefon (kesim, müşteri personeli)
- 📺 TV ekranı (görüntüleme)

### 2. ✅ PERSONEL İÇİ İLETİŞİM (Yazılı + Sesli)

- **Yazılı chat:** Slack/WhatsApp gibi anlık mesajlaşma
- **Sesli mesaj:** Walkie-talkie tarzı, basılı tut → gönder
- **Sesli görüşme:** İki personel canlı konuşabilir
- **Grup sohbeti:** Tüm personel
- **Görev paylaşımı:** "Bu müşteriyi sen ara"
- **Konum paylaşımı:** "Şu an kesim alanındayım"

---

## 🎯 CLAUDE'UN EKLEDİĞİ İŞE YARAR ÖZELLİKLER

Aşağıdaki özellikler **gerçekten kullanışlı**, sadece "süs" değil. Türk pazarına ve kurban operasyonuna özel düşünüldü.

---

## 📦 YENİ MODÜLLER

### 🔥 KRİTİK MODÜLLER (Bayram operasyonu için)

#### M1. SAHADA YÖNETİM (Field Management)

**Telefondan saha kontrolü.**

- **Hisse Tarama (QR/Barcode):** Her hisse için QR kod basılır. Personel QR okutur:
  - "Hisse 3, dana 12, Mehmet Yılmaz" görür
  - "Kesime aldım" butonu
  - "Tamamlandı" butonu
- **Konum İşaretleme:** Hayvanlar nerede, hangi padokta
- **Veteriner Kontrol:** Sağlık raporu, mobil giriş
- **Tartı Kayıt:** Mobil tartıdan veri gir
- **Foto Çekim:** Hayvan fotoğrafları, kesim öncesi/sonrası

#### M2. KESİM TAKİP MERKEZİ (Slaughter Center)

**Bayram günü tam operasyon kontrolü.**

- **Canlı Kesim Akışı:** SSE/WebSocket ile her saniye güncellenir
- **Veteriner Onay:** Her hisse için ayrı sağlık onayı
- **Et Tartı Sistemi:** Kesimden sonra hayvanın etini tart, kayda al
- **Sakatat Yönetimi:** Karaciğer, böbrek, işkembe → kime gidecek
- **Kelle/Paça Dağıtımı:** Sırasıyla dağıtım listesi
- **Kemik/Deri/Lifa:** Üretici/satıcı seçimi
- **Soğuk Hava Takibi:** Hangi etin nerede olduğu
- **Teslim Zamanlaması:** Müşteri ne zaman gelecek

#### M3. MÜŞTERİ İLETİŞİM MERKEZİ (Customer Communication Hub)

**Tek merkezden tüm iletişim.**

- **Inbox:** WhatsApp + SMS + E-mail + Telefon aramaları
- **Çağrı Kayıt:** "Burhan'ı aradım, 5 dakika konuştuk, ödeme yapacak"
- **Otomatik Hatırlatma:** Borçlulara 7 gün, 3 gün kala otomatik mesaj
- **Sıralı Mesaj:** Belirli müşteri grubuna sırayla mesaj (rate limit önlemek için)
- **Şablon Önerisi:** AI öneri "Bu müşteriye sertçe yazmalısın"
- **Yanıt Takibi:** Müşteri okudu mu, yanıt verdi mi
- **Auto-responder:** Belirli sorulara otomatik yanıt

#### M4. EKİP İÇİ KOMÜNİKASYON (Team Communication)

**Kullanıcının istediği özellik:**

- **Anlık Mesajlaşma:** Slack tarzı
  - Genel kanal (#duyurular)
  - Departman kanalları (#kesim, #muhasebe, #saha)
  - Özel mesajlar (1-1)
  - @bahsi (mention)
- **Sesli Mesaj:** Walkie-talkie tarzı, basılı tut konuş
- **Sesli Görüşme:** WebRTC, 2 kişilik konuşma
- **Video Görüşme:** Gerekirse, kesim merkezi gösterme
- **Görev Atama:** "Mehmet Bey'i ara" → personele atanır
- **Konum Paylaşımı:** "Şu an kesim alanındayım"
- **Sesli Bildirim:** Bildirim geldikçe ses çıkarır
- **Push Notification:** Telefonda anlık uyarı
- **Çevrimiçi/Çevrimdışı:** Kim aktif, kim değil

### 💎 YÜKSELTİCİ MODÜLLER

#### M5. AKILLI HATIRLATMA SİSTEMİ (Smart Reminders)

**AI destekli otomatik takip.**

- **Borçlu Tahmin:** "Bu müşteri 3 gün içinde ödeyecek" (AI tahmin)
- **Risk Skoru:** Her müşteri için 0-100 puan
  - Geç ödeme geçmişi
  - İletişim kopukluğu
  - Ortalama gecikme süresi
- **Akıllı Sıralama:** Önce risk düşük olanlar (kolay tahsilat)
- **Optimum Zaman:** Bu müşteriyi en iyi sabah 10'da ara
- **Mesaj Tonu Önerisi:** "Bu müşteriye sert yazma, eski müşteri"
- **Otomatik Eskalasyon:** 3 mesaj sonrası → telefon arama

#### M6. ANALİZ VE BI (Business Intelligence)

**Profesyonel raporlama.**

- **Yıllar Karşılaştırma:** 2024 vs 2025 vs 2026
- **Tahmin (Forecast):** "Bu yıl muhtemel toplam: 1.5M TL"
- **Müşteri Segmentasyonu:** RFM analiz (Recency, Frequency, Monetary)
  - Champions (en iyiler)
  - Loyal (sadık)
  - At Risk (kaybolma riski)
  - New (yeni)
  - Hibernating (uyuyan)
- **Cohort Analiz:** "2024'te aldıkların kaçı 2025'te de aldı?"
- **Karlılık Analizi:** Hisse başı kâr/zarar
- **Operasyonel Verim:** Saatlik kesim hızı, vs.
- **Bayram Karşılaştırma:** Ramazan Bayramı vs Kurban Bayramı

#### M7. FİNANSAL YÖNETİM (Finance)

**Daha derin para işlemleri.**

- **Çoklu Banka:** Garanti, İş Bankası, Ziraat — hepsi ayrı
- **Banka Mutabakat:** Banka ekstresi import et, otomatik eşleştir
- **POS Entegrasyon:** Iyzico, Param, Vakıf
- **e-Fatura/e-Arşiv:** GİB entegrasyon
- **Maliyetlendirme:** Hayvan başı maliyet (yem, ilaç, personel)
- **Kar/Zarar Tablosu:** Aylık, yıllık
- **Nakit Akış:** Gelir/gider takvimi
- **Banka Hesap Bakiye Senkron:** API ile otomatik
- **Senet/Çek Yönetimi:** İleri tarihli ödeme
- **Taksit Planı:** Kişiye özel taksitlendirme

#### M8. TEDARİKÇİ YÖNETİMİ (Supplier Management)

**Hayvan tedarik eden çiftçilere yönetim.**

- **Tedarikçi Listesi:** Ad, telefon, lokasyon, fiyat geçmişi
- **Alım Kayıtları:** Kimden, ne zaman, kaç hayvan, kaç TL
- **Ödeme Takibi:** Tedarikçilere borç durumu
- **Performans:** Bu tedarikçinin hayvanları kaliteli mi
- **Otomatik Hatırlatma:** "1 ay sonra X tedarikçiden alım yap"

#### M9. STOK YÖNETİMİ (Inventory)

**Yem, ilaç, ekipman.**

- **Yem Stoğu:** Mısır, arpa, kuru ot — günlük tüketim
- **İlaç Stoğu:** Veteriner ilaçları, son kullanma tarihi
- **Ekipman:** Bıçaklar, kovalar, iplik
- **Otomatik Sipariş:** Kritik seviyeye düşünce alarm
- **Maliyet Hesabı:** Stoktan ne kadar harcandı

#### M10. BELGE YÖNETİMİ (Document Management)

**Tüm evraklar dijital.**

- **TC Kimlik:** Müşterinin TC fotokopisi (KVKK uyumlu)
- **Vekalet:** PDF veya foto upload
- **Sağlık Raporu:** Veteriner imzalı
- **Sevk İrsaliyesi:** Hayvan sevki
- **Fatura:** Tedarikçi faturaları
- **OCR Tarama:** Foto çekince yazıyı otomatik okur
- **Arama:** İçerikte arama yap
- **Dijital İmza:** Müşteri ekrandan imza atabilir

### 🚀 GELECEKTE EKLENEBİLİR (Faz 3+)

#### M11. MÜŞTERİ PORTALI (Self-Service)

**Müşterilerin kendi sayfası.**

- Müşteri WhatsApp linki ile portal'a girer
- Hissesinin durumunu görür
- Ödeme geçmişini görür
- Dekont indirir
- "Geliyorum, hisse al" bildirimi
- Vekalet imzalar (dijital)
- Bayram tebriği gönderir
- Anket doldurur

#### M12. E-TİCARET MODÜLÜ (Yıl Boyu Et Satışı)

**Bayram dışında da gelir.**

- Online et siparişi
- Anlık ücretlendirme
- Kapıya teslim
- Yemekli paket (örn. kavurma)
- Kuzu/koyun satışı
- Hediye paketleri
- Sadakat puanı

#### M13. LOJİSTİK (Delivery)

**Hayvan/et taşıma.**

- Şoför yönetimi
- Araç takibi (GPS)
- Rota optimizasyonu
- Teslim onayı (foto + imza)
- Müşteri canlı takip

#### M14. SAĞLIK TAKİBİ (Veterinary)

**Hayvan sağlık geçmişi.**

- Aşı kayıtları
- Hastalık geçmişi
- Tedavi kayıtları
- Veteriner notları
- Kulak küpesi sistemi

#### M15. BEREKETLENDİRME (Religious Compliance)

**Dini bilgi ve yardım.**

- Bayram namazı vakti
- Kurban kesim duası
- Vekalet hadis bilgisi
- Helal kesim sertifikası
- Bağış/zekat hesaplama

---

## 🎁 BONUS ÖZELLİKLER

### B1. AKILLI ÖZELLİKLER

- **Sesli Komut:** "Ahmet Bey'e mesaj at" → otomatik
- **Sesli Tahsilat Kaydı:** "10.000 TL aldım Mehmet Yılmaz'dan" → otomatik kaydeder
- **Doğal Dil Arama:** "Geçen hafta borçlu olanları göster"
- **Akıllı Fiyatlama:** "Bu yıl fiyatı şu olmalı" önerisi
- **Otomatik Etiketleme:** Müşteriyi VIP olarak işaretle

### B2. SOSYAL ÖZELLİKLER

- **Bayram Tebriği:** Otomatik tüm müşterilere
- **Doğum Günü Tebriği:** TC'den otomatik
- **Memnuniyet Anketi:** Bayram sonrası
- **Referans Programı:** "Arkadaşını getir, indirim al"
- **Sadakat Programı:** "5 yıldır müşterisin, hediye var"

### B3. EĞLENCELİ ÖZELLİKLER

- **Bayram Sayacı:** Saatleri sayıyor
- **Başarı Rozeti:** "1000. tahsilat", "100. müşteri"
- **Liderlik Tablosu:** Personel arası sağlıklı rekabet
- **Yıllık Özet:** Spotify Wrapped tarzı (Aralık'ta)

### B4. GÜVENLİK VE UYUM

- **2FA:** İki faktörlü kimlik doğrulama
- **Biometric Login:** Parmak izi (mobile)
- **IP Kısıtlama:** Sadece çiftlik IP'sinden giriş
- **Aktivite Logu:** Her şey kayıtlı
- **KVKK Uyum:** Kişisel veri yönetim aracı
- **Veri Silme Hakkı:** Müşteri talep ederse otomatik
- **Yedek Şifreleme:** Yedekler şifreli

### B5. ENTEGRASYONLAR

- **WhatsApp Business API** (resmi)
- **SMS Servisleri** (Netgsm, İletimerkezi)
- **E-mail** (SendGrid, Mailgun)
- **Banka API'leri** (havale otomatik takip)
- **GİB e-Fatura** (yasal zorunluluk)
- **Muhasebe Yazılımları** (Logo, Mikro, Netsis)
- **Sosyal Medya** (Instagram, Facebook entegrasyonu)
- **Google Maps** (müşteri adresi)
- **Hava Durumu API** (kesim için önemli)
- **Müezzin/Ezan API** (namaz vakti)

---

## 📅 YOL HARİTASI ÖZET

### FAZ 1 — Bayram Operasyonu (ŞİMDİ - 3 Gün)
- ⏳ MIMARI.md refactor (Claude Code şu an yapıyor)
- ⏳ Lucide-react fix
- ⏳ Müşteri detay tab'ları tam
- ⏳ WhatsApp click-to-chat
- ⏳ Borçlular + Excel
- ⏳ Dekontlar sayfası
- ⏳ Hisse atama UI
- ⏳ TV Kesim ekranı
- ⏳ Excel template (Burhan için)
- ⏳ Veri import

### FAZ 2 — Çok-Rollü Kullanım (Bayram Sonrası, 1-2 Hafta)
- ✅ Çoklu kullanıcı yönetimi
- ✅ Rol bazlı izin matrisi (Admin, Kasiyer, Kesim, Müşteri, İzleyici)
- ✅ Mobile-first redesign
- ✅ QR kod hisse tarama
- ✅ Sahada saha yönetimi
- ✅ Veteriner mobil giriş
- ✅ Müşteri portal (basit)

### FAZ 3 — İletişim ve İşbirliği (1 Ay)
- ✅ Personel chat (yazılı)
- ✅ Sesli mesaj (walkie-talkie)
- ✅ Sesli görüşme (WebRTC)
- ✅ Görev atama sistemi
- ✅ Push notification
- ✅ Email entegrasyon
- ✅ SMS entegrasyon

### FAZ 4 — BI ve AI (2 Ay)
- ✅ Akıllı hatırlatma
- ✅ Risk skoru
- ✅ Tahmin modelleri
- ✅ Müşteri segmentasyonu
- ✅ Cohort analiz
- ✅ Karlılık raporu

### FAZ 5 — Finansal Derinlik (3 Ay)
- ✅ E-fatura entegrasyon
- ✅ Banka mutabakat
- ✅ POS entegrasyon
- ✅ Senet/Çek
- ✅ Taksit planları
- ✅ Maliyetlendirme

### FAZ 6 — Multi-Tenant SaaS (4-6 Ay)
- ✅ PostgreSQL geçiş
- ✅ Subdomain (her çiftlik kendi)
- ✅ Stripe ödeme
- ✅ Onboarding flow
- ✅ Fiyatlandırma sayfası
- ✅ Marketing site

### FAZ 7 — Mobil Uygulama (6-8 Ay)
- ✅ iOS uygulama
- ✅ Android uygulama
- ✅ Offline-first
- ✅ Biometric login
- ✅ Push notification

### FAZ 8 — E-ticaret + Lojistik (1 Yıl)
- ✅ Online et satışı
- ✅ Şoför yönetimi
- ✅ Rota optimizasyonu
- ✅ Müşteri canlı takip

---

## 📊 ÖZET TABLOSU

| Faz | Süre | Modül Sayısı | Kişi/Hafta |
|-----|------|--------------|------------|
| Faz 1 (Bayram) | 3 gün | 5 | 1 |
| Faz 2 (Çok-rol) | 2 hafta | 4 | 2 |
| Faz 3 (İletişim) | 1 ay | 3 | 2 |
| Faz 4 (BI/AI) | 2 ay | 2 | 3 |
| Faz 5 (Finans) | 3 ay | 2 | 3 |
| Faz 6 (SaaS) | 6 ay | - | 4 |
| Faz 7 (Mobil) | 8 ay | - | 4 |
| Faz 8 (Lojistik) | 12 ay | 2 | 5 |

**Toplam Vizyon:** 18 modül + sayısız özellik = **Türkiye'nin en kapsamlı kurban yönetim platformu**

---

## 🎯 NOT EDİLENLER (Kullanıcının söyledikleri)

1. ✅ Muhasebede bilgisayar, sahada telefon
2. ✅ Çok rollü kullanım, yetki kısıtlaması
3. ✅ Kesim personeli kasayı görmemeli
4. ✅ Müşteri personeli sırası gelenleri görmeli + arama + mesaj
5. ✅ Personeller arası yazılı + sesli sohbet
6. ✅ Bu özellikler tasarım brief'ine değil, **YAZILIM GELİŞTİRME yol haritasına** ekleniyor
7. ✅ Claude Code refactor bitince yapılacak

---

## 🚀 SIRADAKİ ADIMLAR

1. ⏳ **Claude Code refactor bitsin** (şu an çalışıyor)
2. ⏳ Sen tasarımı yapacaksın (Figma/diğer)
3. ⏳ Ben Claude Code prompt'larını yazacağım
4. ⏳ Faz 1 (bayram operasyonu) tamamlanacak
5. ⏳ Bayram sonrası Faz 2'ye geçeceğiz

---

**Bu belge yaşayan bir döküman. Yeni fikir geldikçe ekleyeceğiz.**

— *TilbeCore Vizyon*
