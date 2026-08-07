# 08 — Tasarım Sistemi ve Mobil PWA

## Mevcut gözlem

- `components/ui` shadcn tabanlı küçük bileşen seti içeriyor.
- `app/globals.css`, `modules/dashboard/lib/tema-tokens.ts`, `shared/lib/sidebar-config.ts` tasarım kararlarını dağınık tutuyor.
- `public/manifest.json` firma markasını sabit içeriyor.
- `shared/components/PlaceholderSayfa.tsx` ve `shared/lib/sidebar-config.ts` çok sayıda “Yakında” veya çekirdek dışı ekranı görünür kılıyor.
- Mobil alt navigasyon ve PWA yükleme bildirimi var; ancak mobil ekranların çoğu masaüstü sayfalarının küçültülmüş versiyonu.

## Hedef token sistemi

- Renk: ürün rengi, firma rengi, durum renkleri.
- Tipografi: desktop, mobile, TV, belge.
- Boşluk ve radius.
- Gölge/elevation.
- Dokunma alanları: minimum 44 px.
- Form davranışı: büyük buton, az alan, hızlı onay.
- Tablo → mobil kart dönüşümü.
- Bayram günü yüksek stres modu: büyük yazı, net aksiyon, az modal.
- Firma markalama sınırı: logo, belge rengi, başlık; ürün kimliği altyapı/footer.

## Mobil görev ekranları

Mobil PWA, masaüstünün aynası olmamalı.

Önerilen rol bazlı hızlı ekranlar:

- Saha satış: müşteri ara/oluştur, hisse seç, kapora al.
- Muhasebe: hızlı tahsilat, dekont, borçlu arama.
- Kesim: sıradaki kurban, aşama geçişi.
- Tartım: keypad, tartım kaydı.
- Paketleme: hisse paket kontrol.
- Teslimat: QR okut, borç/vekalet kontrol, teslim kapat.

## RTL ve erişilebilirlik

- RTL token seti.
- Focus görünürlüğü.
- Klavye erişimi.
- Ekran okuyucu etiketleri.
- TV ekranlarında yüksek kontrast.
- Belge/PDF tasarımlarında font gömme.

