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

Saha PWA firma tenant origin’i altında `/saha` path’iyle sunulur: `https://{tenantSlug}.tilbecore.com/saha`. Service worker scope’u yalnız `/saha/` ile sınırlı olmalı; firma paneli, TV, takip veya API rotalarını kontrol etmemelidir.

Önerilen rol bazlı hızlı ekranlar:

- Saha satış: müşteri ara/oluştur, hisse seç, kapora al.
- Muhasebe: hızlı tahsilat, dekont, borçlu arama.
- Kesim: sıradaki kurban, aşama geçişi.
- Tartım: keypad, tartım kaydı.
- Paketleme: hisse paket kontrol.
- Teslimat: QR okut, borç/vekalet kontrol, teslim kapat.

Firma paneli `/panel`, TV `/tv`, müşteri takip `/takip/{opaqueToken}`, QR çözümleme `/q/{opaqueToken}`, davet `/davet/{opaqueToken}` path’leriyle aynı tenant origin altında ayrılır. Bu paket route veya ekran taşıması yapmaz; yalnız origin/path sahipliği sözleşmesini tanımlar.

## RTL ve erişilebilirlik

- RTL token seti.
- Focus görünürlüğü.
- Klavye erişimi.
- Ekran okuyucu etiketleri.
- TV ekranlarında yüksek kontrast.
- Belge/PDF tasarımlarında font gömme.

## Profesyonel panel UX hedefleri

- Operasyon Kontrol Merkezi ve istisna kuyruğu, tekrar eden kart kalabalığına dönüşmeden yoğun operasyon taraması için tablo, filtre ve durum bandı kullanır (`PRO-001`).
- Merkezi Onay Kutusu kritik kararları tek yerde toplar; onay, ret, gerekçe ve etkilenmiş kayıtlar kolay taranır (`PRO-002`).
- Evrensel arama masaüstünde hızlı komut/arama, mobilde barkod/QR ve metin aramasıyla çalışır; sonuçlar yetkiye göre maskelenir (`PRO-005`).
- Günlük görev ve vardiya devir teslimi mobil görev mantığıyla tasarlanır; açık iş, risk ve teslim alan kişi görünür olur (`PRO-006`).
- Kullanıcı yardım ve sentetik demo modu gerçek veriyle karışmayan eğitim akışları sağlar (`PRO-010`).
- WCAG 2.2 AA hedefi yeni firma ve platform panel ekranlarının kabul kriteridir; klavye, focus, kontrast, label ve hata mesajı davranışı otomatik ve manuel testle doğrulanır (`PRO-011`, `PRO-025`).
