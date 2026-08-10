# 05 — Kimlik, Yetki ve Destek Erişimi

## Mevcut durum

- `prisma/schema.prisma` içinde `Kullanici.rol` string: `"admin" | "kasiyer" | "izleyici"` yorumuyla sınırlı.
- `gorev` alanı TV/personel kullanımına genişletilmiş.
- P0 ile bazı API yetki kontrolleri eklendi; yine de tüm route’lar standardize edilmiş değildir.

## Hedef rol matrisi

| Rol | Masaüstü menüsü | Mobil menü | Görüntüleme | Yazma/iptal | Override | Kritik onay | Audit |
|---|---|---|---|---|---|---|---|
| Firma sahibi/yönetici | Tüm firma modülleri | Yönetim özetleri | Tam firma | Tam firma | Var | Satış iptal, borçlu teslim, kullanıcı yetki | Zorunlu |
| Ana muhasebe | Tahsilat, kasa, rapor, cari | Tahsilat/kasa | Finans + müşteri | Tahsilat, iade, mutabakat | Kısıtlı | İade, kasa kapanış | Zorunlu |
| Muhasebe yardımcısı | Tahsilat, müşteri | Hızlı tahsilat | Kısıtlı finans | Tahsilat | Yok | Büyük tutar onayı | Zorunlu |
| Saha sorumlusu | Saha satış, hisse, müşteri | Hızlı satış | Müşteri/hisse | Satış/kapora | Kısıtlı | Yedinci hisse istisnası | Zorunlu |
| Kesim sorumlusu | Kesim kontrol | Kesim görev | Kesim/hayvan | Aşama geçişi | Acil sıra değişimi | Kurban başlatma | Zorunlu |
| Tartım görevlisi | Tartım | Tartım keypad | Atanan işler | Tartım kaydı | Yok | Tartım düzeltme | Zorunlu |
| Paketleme görevlisi | Paketleme | Paket görev | Paket listesi | Paketleme | Yok | Paket düzeltme | Zorunlu |
| Teslimat görevlisi | Teslimat | QR teslim | Teslim listesi | Teslim kapatma | Yok | Borçlu teslim override yok | Zorunlu |
| Salt okunur rapor | Raporlar | Özet | Okuma | Yok | Yok | Yok | Erişim audit |

## Yetki ilkeleri

- Menü gizlemek yeterli değildir.
- API, use-case, repository ve veri erişiminde yetki doğrulanmalıdır.
- Kritik işlemler için sebep alanı ve audit zorunlu olmalıdır.
- Platform kullanıcısı ile firma kullanıcısı farklı session/cookie alanı kullanmalıdır.
- Destek erişimi firma onayı olmadan operasyon verisine erişmemelidir.
- Platform yöneticileri için WebAuthn/passkey ve MFA hedeflenir; recovery ve reset işlemleri de auditlenir (`PRO-013`, `PRO-026`).
- Firma cihaz/oturum yönetimi kendi firma sınırı içinde çalışır; başka firmaların cihazları veya oturumları görünmez (`PRO-008`).
- Güvenlik kabul hedefi OWASP ASVS Level 2’dir; kimlik, oturum, yetki, dosya, hata, logging, tenant isolation ve destek erişimi kontrolleri bu hedefe göre doğrulanır (`PRO-027`).
- KVKK, iletişim izni, veri dışa aktarma ve saklama talepleri açık yetki, gerekçe ve audit gerektirir (`PRO-009`, `PRO-019`).

## Önerilen izin adlandırması

`domain.action.scope` biçimi:

- `musteri.goruntule`
- `musteri.olustur`
- `hisse.satis`
- `hisse.transfer`
- `tahsilat.olustur`
- `tahsilat.iptal`
- `ledger.ters_kayit`
- `kesim.asama_degistir`
- `teslimat.qr_kapat`
- `firma.ayar.guncelle`
- `platform.firma.provision`
- `platform.guvenlik.yonet`
- `platform.migration.onkontrol`
- `platform.kill_switch.yonet`
- `support.session.onayla`
- `cihaz.oturum.iptal`
- `kvkk.talep.yonet`
