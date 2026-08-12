---
id: ARCH-5EB3B349A050
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# 🏗️ MİMARİ SAĞLIK DENETİMİ — "Sürekli Geliştirilebilir Temel" Hedefi

**Tarih:** 28 Mayıs 2026
**Soru:** Bu temel, "Türkiye'nin en gelişmiş, her platformda çalışan, sürekli geliştirilen yazılımı" hedefini kaldırır mı?
**Yöntem:** Kod tabanı ölçüldü (tahmin yok).

---

## 📊 ÖLÇÜLEN GERÇEKLER

| Metrik | Değer | Değerlendirme |
|--------|-------|---------------|
| TS/TSX dosya | 463 | Büyük ama yönetilebilir |
| Toplam satır | 55.331 | Ciddi bir kod tabanı |
| API endpoint | 72 | Kapsamlı |
| Veritabanı modeli | 18 | İyi yapılandırılmış |
| **`any` kullanımı** | **0** | ✅ **Mükemmel tip güvenliği** |
| Zod validasyon | 40/72 API | 🟡 İyi ama %100 değil |
| Try-catch | 58/72 API | 🟡 İyi ama %100 değil |
| Service katmanı | 10+ `.service.ts` | ✅ Modüler, temiz |
| **Test (vitest/jest/playwright)** | **0** | 🔴 **EN KRİTİK EKSİK** |
| Prisma index/relation | 62 | ✅ Performanslı |
| Soft-delete (silindiMi) | 23 yerde | ✅ Tutarlı |
| PWA manifest | ✅ Var | ✅ Her cihaz hedefine uygun |

---

## ✅ TEMEL GÜÇLÜ YANLARI (Vizyona Uygun)

Açık olayım: **mimari beklediğimden çok daha sağlam.** Bu temel ciddi geliştirmeyi kaldırır.

1. **Modüler mimari** — `modules/` altında alan-bazlı (hayvanlar, tahsilat, kasa, raporlar...). Her modülün kendi `lib/*.service.ts`'i var. Bu, **büyümeye en uygun** yapı.

2. **Veri erişim katmanı ayrı** — İş mantığı `service.ts`'lerde, API'ler ince. Yeni özellik eklerken servis yazıp API'den çağırıyorsun. Doğru desen.

3. **Sıfır `any`** — 55 bin satırda hiç `any` yok. Bu nadir ve çok değerli. TypeScript tam güvenli → refactor sırasında derleyici seni korur.

4. **PWA hazır** — manifest var, "her cihazdan erişim" hedefinin temeli atılmış. Telefon/tablet/masaüstü standalone app gibi çalışabilir.

5. **Modern stack** — Next.js 16 + React 19 + Prisma 6 + Tailwind 4. Güncel, uzun ömürlü.

6. **Soft-delete + audit** — `silindiMi`, `olusturanId`, `createdAt/updatedAt` her modelde. Veri kaybı riski düşük, denetlenebilir.

---

## 🔴 TEMEL ZAYIF YANLARI (Vizyon İçin Düzeltilmeli)

"Mükemmel olmalı, sorunsuz ilerlemeli" diyorsan bunlar **şart:**

### 1. SIFIR TEST — En Kritik 🔴🔴🔴
**Sorun:** Hiç otomatik test yok. Her değişiklikte bir şey kırılabilir ve **fark etmezsin** (borçlular #31 bug'ı tam bu — kimse fark etmeden bozuldu).

**Neden kritik:** "Sürekli geliştireceğiz" diyorsan, her yeni özellik eski bir şeyi bozabilir. Test olmadan bunu yakalayamazsın. Bug'lar canlıda, bayram günü ortaya çıkar.

**Çözüm:** En azından **kritik akışlar** için test:
- Tahsilat hesabı (nakit+havale+kart = toplam)
- Hisse fiyatı / borç hesabı
- Muhasebe denetim kontrolleri
- Fiyatlandırma 3 modu

### 2. Eksik Validasyon/Hata Yönetimi 🟡
- 32 API'de zod yok (40/72)
- 14 API'de try-catch yok (58/72)

**Neden önemli:** Validasyonsuz API'ye bozuk veri girerse, sessizce yanlış kayıt oluşur (hesap hataları buradan gelir). Her API zod + try-catch olmalı.

### 3. Çözülmemiş Bug 🔴
- Borçlular "Yazdır" → Base UI #31 (obje render). Hâlâ açık.

### 4. Yarısı Boş (63 placeholder) 🟡
"Tam, eksiksiz" hedefiyle çelişir. Ya doldurulmalı ya menüden gizlenmeli (kullanıcı boş sayfa görmemeli).

### 5. Hata İzleme Yok 🟡
Canlıda bir hata olunca nereden öğreneceksin? **Hata loglama/izleme** (Sentry benzeri veya basit dosya log) yok. "Her platformda çalışan" sistemde uzaktaki bir tablet çökerse haberin olmaz.

---

## 🎯 "MÜKEMMEL TEMEL" İÇİN YOL HARİTASI

Yeni özelliklere devam etmeden önce, **temeli sağlamlaştıran** bir faz öneriyorum. Bu, sonraki tüm geliştirmeleri "sorunsuz ve mükemmel" yapar.

### FAZ 0 — TEMEL SAĞLAMLAŞTIRMA (önce bu)

**Sprint T1 — Test Altyapısı** 🔴
- Vitest kur
- Kritik hesaplama testleri: para, tahsilat, borç, denetim, fiyatlandırma
- Her yeni sprint'te test zorunlu kuralı

**Sprint T2 — Bug + Validasyon Sağlamlaştırma** 🔴
- Borçlular #31 bug'ı çöz (dev mod ile)
- Eksik 32 API'ye zod ekle
- Eksik 14 API'ye try-catch ekle

**Sprint T3 — Hata İzleme + Placeholder Temizliği** 🟡
- Basit hata loglama (uzaktaki cihaz çökünce kayıt)
- 63 boş sayfayı: kullanılmayacaklar menüden gizle, kullanılacaklar işaretle

### FAZ 1 — ÖZELLİK GELİŞTİRME (temel sağlamken)
- Sprint 17: Hisse etiketi (6x9 + A4)
- Sprint 18: Mobil saha satış sihirbazı
- Sprint 19: Otomatik fiyat + tür ayrımı

---

## 💡 NET TAVSİYEM

**Vizyonun doğru ve temel buna hazır** — ama iki şartla:

1. **Önce test altyapısı kur (Sprint T1).** Bu olmadan "sürekli geliştirme" her seferinde yeni bug riski demek. Test, "mükemmel olmalı" sözünün teknik karşılığıdır.

2. **Açık bug'ı kapat (#31).** Yarım çalışan özellik, "eksiksiz" hedefiyle çelişir.

Bu ikisi bitince, üstüne istediğin kadar özellik koyarız — her biri test'le korunur, hiçbir şey sessizce bozulmaz.

---

## 📋 KARAR

İki yol var:

**A) Sağlam temel önce (önerilen):**
Sprint T1 (test) → T2 (bug+validasyon) → sonra özellikler.
Yavaş başlar ama sonra her şey hızlı ve güvenli.

**B) Özellik önce:**
Sprint 17/18/19 (etiket, satış, fiyat) → test sonra.
Hızlı görünür ama bug riski birikir.

"Mükemmel olmalı, sorunsuz ilerlemeli" dediğin için **A'yı öneriyorum.** Hangisini seçersin?
