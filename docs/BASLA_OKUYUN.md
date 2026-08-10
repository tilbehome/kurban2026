# Tilbe Kurban — Hızlı Başlangıç (Modüler Mimari)

## 🎯 Bu sistemin özelliği

**MODÜLER YAPI** — her özellik (müşteriler, hayvanlar, tahsilat, kasa, raporlar, kesim takip) kendi klasöründe. Sonradan:
- Yeni modül 30 dakikada eklenir
- Bir modülü pasif yapabilirsin (silmeden)
- TilbeCore vizyonu için: müşteriye özel modül paketi sunabilirsin

## 🚀 Kurulum

### 1. Klasör hazırla
```bash
mkdir tilbe-kurban && cd tilbe-kurban
```

### 2. Bu paketteki dosyaları içine koy
- `CLAUDE_CODE_PROMPT.md`
- `seed-data.json`

### 3. Gereksinimler
```bash
node --version    # v20+
pnpm --version    # 9+
```

Yoksa: nodejs.org / `npm i -g pnpm`

### 4. VS Code/Cursor/Windsurf ile aç
```bash
code .   # veya cursor . veya windsurf .
```

### 5. Claude Code chat'i aç, PROMPT'u yapıştır
`CLAUDE_CODE_PROMPT.md` tamamını seç, kopyala, Claude Code'a yapıştır.

Sonra şunu yaz:
> **"Başla. Faz 0'dan (modüler altyapı) itibaren sırayla geliştir. Her faz bitince haber ver ve test etmemi iste."**

### 6. Onaylama komutlarına bas

Claude Code terminalde komutlar çalıştıracak — `y` ile onayla.

İlk 30 dakika kurulum, sonra geliştirme başlar.

## 📋 Faz Sırası

| Faz | İçerik | Süre | Test |
|-----|--------|------|------|
| **0** | **Modüler altyapı** ⭐ önce bu | 3-4 sa | Boş sayfa açılıyor mu |
| 1A | Core (auth, ayarlar, yedek) | 2-3 sa | Login çalışıyor mu |
| 1B | Müşteri + hayvan modülleri | 4-5 sa | Veri görünüyor mu |
| 1C | **TAHSİLAT** kritik | 8-10 sa | Ödeme alabiliyor muyum |
| 1D | Kasa + raporlar | 3-4 sa | Excel çıkıyor mu |
| 1E | Cilalama | 2-3 sa | Hata yok mu |
| 2 | Kesim TV ekranı | 6-8 sa | TV'de görünüyor mu |

**Faz 1 toplamı: ~25-30 saat**

## 🆘 Yardım

### Claude Code takıldı?
1. Hata mesajını kopyala
2. claude.ai'da yeni chat aç
3. Hatayı yapıştır, çözüm iste

### Yedek nasıl alınır?
- Sistem otomatik (her ödemede + her saat başı)
- Manuel: `prisma/tilbe.db` dosyasını başka yere kopyala
- Bayram boyunca **her saat USB'ye kopyala** (paranoyak ol)

### Bayram günü hata?
1. Soğukkanlı ol
2. Excel'i yedek olarak aç
3. SQLite dosyasını koru (`prisma/tilbe.db`)
4. Claude'a yaz, hızlı düzeltme iste

## 🌐 LAN Erişimi (Telefon için)

```bash
pnpm dev --hostname 0.0.0.0
```

Bilgisayar IP'sini bul:
- Windows: `ipconfig`
- Mac/Linux: `ifconfig`

Telefon: `http://192.168.1.45:3000` (örnek)

## 🧩 Modüler Mimari Avantajı

Bayram sonrası:
- "Bağış modülü ekleyelim" → 1-2 saat
- "Burhan için küçükbaş ekleyelim" → 1-2 saat
- "Online bağış kabul edelim" → ayrı modül
- "Birden fazla şube" → ayrı modül

Tüm bunlar **mevcut sistemi bozmadan** eklenir.

## 📞 Acil Durum Yedek Planı

Sistem çalışmazsa:
1. Excel + kalem (eski yöntem) hazır bulunsun
2. Müşteri ödemelerini Excel'e gir
3. Sistem düzelince sisteme aktar
4. Bayram sonrası eksikleri sisteme yükle
