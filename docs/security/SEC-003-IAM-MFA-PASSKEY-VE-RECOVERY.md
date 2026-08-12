# IAM, MFA/Passkey ve Hesap Kurtarma Politikası

```yaml
id: SEC-003
title: IAM, MFA/Passkey ve Hesap Kurtarma Politikası
status: PLANNED
owner: Security
source_role: security_standard
reviewers: [Platform, Architecture, Operations]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: FIZIKSEL_AUTHENTICATOR_KABULU_ONCESI
version: 0.1
source_of_truth: false
related_requirements: [REQ-050, PRO-008, PRO-013, PRO-026, PRO-027]
related_adrs: [ADR-0001, ADR-0002]
related_modules: [platform, identity, tenant-runtime]
related_tests: [TST-008, TST-012]
supersedes: []
superseded_by: null
```

## Mevcut kanıt sınırı

`74915b6f3f1f8d53116b760b6a6be9797111efa5` içinde Platform Admin için parola + TOTP akışı, WebAuthn/passkey route ve servisleri, challenge tüketimi, hashlenmiş tek kullanımlık recovery kodu, cihaz/passkey/oturum iptali ve yeniden doğrulama kodu bulunur. [TilbeCore CI koşusu 31571606803](https://github.com/tilbehome/kurban2026/actions/runs/31571606803) bu commit için `completed/success` sonucuyla Platform PostgreSQL integration, unit/route, TypeScript, lint ve iki build kontrolünü çalıştırmıştır; PostgreSQL integration kapsamındaki challenge ve recovery kodu tek kullanım testi bu CI kanıtına dahildir. Fiziksel authenticator, gerçek HTTPS, çoklu tarayıcı ve gerçek hesap kurtarma operasyonu bu koşuda çalıştırılmamıştır ve doğrulama bekler.

Firma kullanıcı IAM’i için hedef rol/policy kararları belgelenmiş, bütün tenant route’larında standart uygulama henüz kanıtlanmamıştır.

## Kimlik alanları

- Platform kullanıcısı ile firma kullanıcısı ayrı model, oturum, cookie adı ve origin kullanır.
- Platform oturumu tenant işlemi; tenant oturumu platform işlemi için yetki üretmez.
- İnsan kullanıcı, servis hesabı, cihaz eşleştirme, davet ve public takip token’ı aynı kimlik türü değildir.
- Tenant oturumu resolved host, firma, sezon ve gerekiyorsa cihaz kapsamına bağlanır.

## Güçlü kimlik doğrulama politikası

| Kullanıcı | Hedef | Canlı kapısı |
|---|---|---|
| Platform Süper Admin ve güvenlik operatörü | MFA zorunlu; passkey tercih edilen güçlü yöntem | HTTPS/RP/origin, fiziksel cihaz, recovery ve iptal testi |
| Firma Admin | MFA zorunlu hedef | Tenant izolasyonlu enrollment/recovery E2E |
| Finans ve kritik override rolleri | Risk bazlı MFA ve işlem yeniden doğrulaması | Rol/policy ve audit testi |
| Saha görevlisi | Güçlü parola/oturum, kayıtlı cihaz; role göre MFA | Hız ve güvenlik dengesi UAT kararı |

MFA/passkey devre dışı bırakma, yeni cihaz kaydı, recovery yenileme, bütün oturumları kapatma, export, devir, kapatma ve destructive restore gibi işlemler yeniden doğrulama ve gerektiğinde ikinci yetkili ister. Süre ve risk eşikleri yapılandırılır; belgelenmeden sabit değer varsayılmaz.

## Passkey yaşam döngüsü

1. Kullanıcı ve origin/RP bağlamı server-side çözülür.
2. Tek kullanımlık, süreli challenge üretilir; istemci tenant/RP seçemez.
3. Registration veya authentication doğrulaması user verification, origin ve RP kontrolüyle yapılır.
4. Credential kimliği, public key, counter ve güvenli metadata saklanır; private key alınmaz.
5. Aynı challenge ikinci kez kullanılamaz.
6. Cihaz adı kullanıcıya gösterilebilir; hassas credential malzemesi gösterilmez.
7. İptal, şüpheli kullanım ve counter anomalisi audit/incident üretir.

## Recovery politikası

- Recovery kodları yalnız oluşturma anında bir kez gösterilir, düz metin saklanmaz ve tekrar görüntülenmez.
- Kullanılan kod atomik biçimde tüketilir; yarışta yalnız bir istek kazanır.
- Yeni recovery seti eski kullanılmamış seti geçersiz kılar ve bütün olaylar auditlenir.
- Helpdesk kimlik doğrulaması tek başına MFA sıfırlama yetkisi vermez.
- Hesap kurtarma için kimlik doğrulama yöntemi, ikinci yetkili ve bekleme/bildirim politikası ürün, güvenlik ve hukuk sahiplerince canlı öncesi kararlaştırılır.
- Kurtarma sonunda mevcut oturumlar, passkey’ler ve cihazlar risk kararına göre gözden geçirilir veya iptal edilir.

## Oturum ve cihaz

- Cookie host-only, `Secure`, `HttpOnly` ve akışa uygun `SameSite` kullanır; ortamlar aynı cookie adını paylaşmaz.
- Login, yetki değişimi, recovery ve kritik işlem sonrası session rotation uygulanır.
- Hareketsiz/mutlak süre, eşzamanlı oturum ve cihaz limiti ölçüm ve risk kararıyla yapılandırılır.
- Kullanıcı kendi oturumlarını; yetkili admin yalnız kendi güven alanındaki oturum/cihazları görebilir ve iptal edebilir.
- İptal request anında etkili olmalı; cache veya offline yetki süresi nedeniyle sessizce devam etmemelidir.

## Negatif kabul senaryoları

- Platform cookie’si tenant hostunda, tenant cookie’si console hostunda reddedilir.
- Başka kullanıcı veya tenant challenge’ı, süresi dolmuş/replay challenge ve yanlış RP/origin reddedilir.
- Kullanılmış recovery kodu ve eşzamanlı ikinci tüketim reddedilir.
- Yetki değişimi veya hesap askıya alma sonrası eski oturum kritik komut çalıştıramaz.
- UI’da gizli işlem doğrudan API çağrısıyla da reddedilir.
- Recovery ve MFA reset olaylarında secret, kod veya credential loglanmaz.

## Kanıt gereksinimi

Sonuçlar [genel kanıt şablonuna](../evidence/EVD-000-KANIT-KAYDI-SABLONU.md) işlenir. Tarayıcı/cihaz kabulü olmadan durum en fazla `IMPLEMENTED_UNVERIFIED` olabilir.
