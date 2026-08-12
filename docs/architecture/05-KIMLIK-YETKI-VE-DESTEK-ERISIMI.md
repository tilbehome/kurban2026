# 05 — Kimlik, Yetki ve Destek Erişimi

```yaml
id: ARC-005
status: IMPLEMENTING
owner: Architecture-and-Security
source_role: identity_authorization_support_architecture
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

## Mevcut durum

- `prisma/schema.prisma` içinde `Kullanici.rol` string: `"admin" | "kasiyer" | "izleyici"` yorumuyla sınırlı.
- `gorev` alanı TV/personel kullanımına genişletilmiş.
- P0 ile bazı API yetki kontrolleri eklendi; yine de tüm route’lar standardize edilmiş değildir.
- Ayrı PlatformUser kimliği, session/cookie, parola+TOTP, passkey/recovery, cihaz/oturum iptali ve yeniden doğrulama `apps/platform-admin` ile uygulanmıştır. Fiziksel passkey cihaz kabulü ve bütün legacy tenant route yetki standardizasyonu tamamlanmış değildir; kanıt sınırı [ARC-016](16-FAZ-2B-DOGRULANMIS-DURUM-VE-KAPSAM-SINIRI.md) belgesindedir.

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
- Platform origin `https://console.tilbecore.com`, tenant origin `https://{tenantSlug}.tilbecore.com` standardını izler; staging ve local ortamlar kendi base domain ve cookie namespace değerlerini kullanır.
- Platform cookie’si tenant tarafından, tenant cookie’si platform tarafından kabul edilmez. Cookie sözleşmesi host-only, Secure, HttpOnly, uygun SameSite, session rotation, logout/revoke ve ortam bazlı farklı isim ister.
- Tenant session başka tenant hostunda geçerli sayılmaz; tenant context request boyunca değiştirilemez.
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

## Token ve cihaz erişim sınırı

Müşteri takip tokenı, QR kesim kontrol tokenı, QR teslim tokenı, kullanıcı davet tokenı, TV cihaz eşleştirme tokenı ve destek erişim tokenı ayrı amaçlara sahiptir. Tokenlar tahmin edilemez, açık kimlik/telefon içermez, amaç sınırlı, süreli veya tek kullanımlık, iptal edilebilir ve audit edilebilir olmalıdır. Bir token başka amaç için kullanılamaz.
