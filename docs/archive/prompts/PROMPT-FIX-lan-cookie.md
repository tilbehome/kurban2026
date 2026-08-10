# PROMPT-FIX: LAN Üzerinden Cookie Sorunu

> **ÖNCELİK: YÜKSEK** - Claude Code'a hemen ver.
> **Tahmini süre:** 15-20 dakika

---

## 🚨 SORUN

### Durum

**Çalışıyor:** `http://localhost:3000` ✅
**Çalışmıyor:** `http://192.168.1.89:3000` ❌

### Belirti
- LAN IP üzerinden giriş yapınca cookie set olmuyor
- Tekrar `/giris` sayfasına yönlendiriyor
- Localhost'tan girince sorunsuz çalışıyor
- Aynı kullanıcı/şifre, sadece URL farklı

### Sebep
Session cookie yapılandırması localhost'a özel:
- Cookie `domain: 'localhost'` olabilir
- Veya `sameSite` ayarı sıkı (`strict`)
- Veya `secure: true` ama HTTP üzerinde

---

## ⚠️ KORUNACAKLAR

**KESİNLİKLE BOZMA:**
- ✅ KUTSAL tahsilat akışı
- ✅ FAZ 4-9 tüm özellikler
- ✅ Mevcut admin / kasiyer / izleyici girişleri
- ✅ Audit log + granular izinler
- ✅ MIMARI.md uyumu

---

## 🔍 ADIM 1: SORUN TESPİTİ

### Dosyaları İncele

```bash
# Session yapılandırması
1. shared/lib/session.ts
2. shared/lib/auth.ts (varsa)
3. middleware.ts

# Login API
4. app/api/auth/giris/route.ts

# Login Form
5. app/giris/page.tsx (veya GirisFormu component)
```

### Kontrol Et

**`shared/lib/session.ts` içinde:**
- `domain` parametresi var mı? (varsa sorun bu)
- `secure: true` mu? (HTTP'de sorun)
- `sameSite: 'strict'` mı? (cross-origin sorun)

**Login API'de:**
- Cookie response'a ekleniyor mu?
- `getIronSession` doğru kullanılıyor mu?

---

## 🔧 ADIM 2: ÇÖZÜM

### Çözüm: Session Cookie Yapılandırması

**`shared/lib/session.ts` dosyasını güncelle:**

```typescript
// shared/lib/session.ts

import type { SessionOptions } from 'iron-session';

export interface SessionData {
  userId?: string;
  kullaniciAdi?: string;
  rol?: string;
  email?: string; // varsa
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'tilbe-session',
  cookieOptions: {
    // ❌ KALDIR: domain (otomatik tarayıcı belirler)
    // ❌ KALDIR: hostOnly

    // ✅ ZORUNLU SETLE:
    secure: false,           // HTTP üzerinde çalışsın (LAN için)
    httpOnly: true,          // JS erişemesin (XSS koruması)
    sameSite: 'lax',         // Same-site lax (cross-domain için)
    maxAge: 60 * 60 * 24 * 7, // 7 gün
    path: '/',               // Tüm sayfalarda geçerli
  },
};

// Production'da HTTPS varsa:
// secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true'
```

**Önemli notlar:**
- `secure: false` çünkü HTTP üzerinde çalışıyoruz
- `sameSite: 'lax'` cross-origin için yeterli
- `domain` belirleme — tarayıcı otomatik halleder
- `path: '/'` tüm route'larda cookie geçerli

### Çözüm: Next.js Config (`next.config.ts`)

```typescript
// next.config.ts

import type { NextConfig } from 'next';

const config: NextConfig = {
  // ... mevcut config

  // LAN için CORS / Origin sorunlarını çözer
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          // Cookie set'lerinde sorun olmaması için
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};

export default config;
```

### Çözüm: package.json Script

Dev sunucusu LAN'a açık olmalı:

```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0 -p 3000",
    "dev:local": "next dev -p 3000",
    "start": "next start -H 0.0.0.0 -p 3000"
  }
}
```

`-H 0.0.0.0` = tüm network interface'leri dinler (LAN dahil).

---

## 🧪 ADIM 3: TEST

### Test Senaryosu

1. **Cookie temizle:**
   - Tarayıcıda: F12 → Application → Storage → Clear site data
   - Veya: Ctrl+Shift+Del → Çerezleri sil

2. **Localhost'tan giriş:**
   ```
   http://localhost:3000/giris
   admin / tilbe2026
   ```
   ✅ Çalışmalı

3. **LAN IP'den giriş (aynı bilgisayardan):**
   ```
   http://192.168.1.89:3000/giris
   admin / tilbe2026
   ```
   ✅ Çalışmalı

4. **Telefon (LAN üzerinden):**
   - Telefonu aynı WiFi'a bağla
   - Tarayıcıda: `http://192.168.1.89:3000/giris`
   - Giriş yap
   ✅ Çalışmalı

5. **F5 ile yenileme:**
   - Giriş yaptıktan sonra sayfayı yenile
   - Çıkışa atmamalı
   ✅ Session korunmalı

---

## ✅ TEST CHECKLİSTİ

### Cookie/Session
- [ ] `shared/lib/session.ts` güncellenmiş
- [ ] `domain` parametresi yok
- [ ] `secure: false` (HTTP için)
- [ ] `sameSite: 'lax'`
- [ ] `httpOnly: true`
- [ ] `path: '/'`

### Erişim
- [ ] `http://localhost:3000` çalışıyor
- [ ] `http://192.168.1.89:3000` çalışıyor
- [ ] `http://127.0.0.1:3000` çalışıyor
- [ ] Telefondan LAN ile erişim çalışıyor

### Login Akışı
- [ ] Giriş başarılı
- [ ] Ana sayfaya yönlendiriliyor
- [ ] F5 ile session korunuyor
- [ ] Çıkış yapınca cookie siliniyor
- [ ] Çıkıştan sonra giriş tekrar çalışıyor

### Mevcut Sistem
- [ ] KUTSAL tahsilat çalışıyor
- [ ] Dashboard yükleniyor
- [ ] Sidebar çalışıyor
- [ ] FAZ 4-9 hiçbir şey bozulmadı
- [ ] TV ekranı çalışıyor (public)

---

## 📊 BONUS: HTTPS Desteği (Opsiyonel)

Eğer HTTPS de istiyorsa:

### Next.js Experimental HTTPS

```json
// package.json
{
  "scripts": {
    "dev:https": "next dev --experimental-https -H 0.0.0.0 -p 3000"
  }
}
```

Kullanım:
```bash
pnpm dev:https
```

**Sonuç:** `https://192.168.1.89:3000` (self-signed sertifika)

İlk erişimde "Güvenli değil" uyarısı çıkar, "Devam et" tıkla. Sonrası sorun yok.

---

## 🎯 UYGULAMA SIRASI (4 ADIM)

### ADIM 1: Sorun Analizi
1. `shared/lib/session.ts` oku
2. Mevcut cookie ayarlarını kontrol et
3. Sorun olan parametreleri tespit et

**Commit:** `fix(auth): cookie domain sorunu tespit edildi`

### ADIM 2: Session Cookie Düzelt
1. `domain` parametresini kaldır
2. `secure: false` yap
3. `sameSite: 'lax'` yap
4. `path: '/'` ekle

**Commit:** `fix(auth): LAN uyumlu cookie ayarlari`

### ADIM 3: Next.js Config Güncelle
1. CORS headers (gerekirse)
2. Trusted origins ayarı

**Commit:** `fix(server): LAN erisim CORS ayari`

### ADIM 4: Test
1. `pnpm tsc --noEmit` temiz
2. `pnpm build` temiz
3. Localhost'tan test
4. LAN IP'den test
5. Telefondan test

**Commit:** `test(auth): LAN uzerinden login dogrulandi`

### Final: Push

```bash
git push origin main
```

---

## 📊 RAPOR ŞABLONU

```markdown
# FIX TAMAMLANDI — LAN Cookie Sorunu

## ✅ Çözülen Sorun
- [x] LAN IP üzerinden giriş çalışıyor
- [x] Cookie domain ayarı kaldırıldı
- [x] secure: false (HTTP uyumlu)
- [x] sameSite: lax (cross-origin)
- [x] Telefon LAN erişimi çalışıyor

## 🧪 Test Sonuçları
- localhost:3000 → ✅
- 192.168.1.89:3000 → ✅
- Telefon LAN → ✅
- F5 session korunuyor → ✅
- KUTSAL tahsilat → ✅

## 📦 Git
- Toplam commit: 3-4
- Push: ✅

## 🎯 Sıradaki Adım
FAZ 9.5 (TV kapsamlı genişletme) için hazır.
```

---

## 🚀 BAŞLA

Bu **acil sorun çözümü**. FAZ 9.5'den ÖNCE çalıştır.

**Tahmini süre:** 15-20 dakika

Hayırlı kodlar! 🐂✨
