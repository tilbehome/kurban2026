# ADR-0001 — Profesyonel SaaS Domain, URL, Origin ve Tenant Host Çözümleme Standardı

## Durum

Kabul edildi. Bu ADR Faz 2A kapsamında davranış değiştirmeyen sözleşme ve test kararını tanımlar.

## Karar

TilbeCore Kurban için production ana domain `tilbecore.com` olarak kabul edilir.

Kullanıcıya açık adres standardı:

- Ürün/tanıtım: `https://tilbecore.com`
- Platform Süper Admin: `https://console.tilbecore.com`
- Firma ana origin: `https://{tenantSlug}.tilbecore.com`
- Firma girişi: `https://{tenantSlug}.tilbecore.com/giris`
- Firma yönetim paneli: `https://{tenantSlug}.tilbecore.com/panel`
- Saha personeli PWA: `https://{tenantSlug}.tilbecore.com/saha`
- TV ekranı: `https://{tenantSlug}.tilbecore.com/tv`
- Müşteri tokenlı takip: `https://{tenantSlug}.tilbecore.com/takip/{opaqueToken}`
- QR çözümleme: `https://{tenantSlug}.tilbecore.com/q/{opaqueToken}`
- Kullanıcı daveti/aktivasyonu: `https://{tenantSlug}.tilbecore.com/davet/{opaqueToken}`
- Firma API: `https://{tenantSlug}.tilbecore.com/api/v1`
- Sistem durumu: `https://status.tilbecore.com`
- Yardım merkezi: `https://help.tilbecore.com`
- Güncellemeler: `https://updates.tilbecore.com`
- Hassas olmayan statik varlıklar: `https://assets.tilbecore.com`

Gelecek sözleşmesi olarak ayrılan ama bu pakette uygulanmayan adresler:

- Dış entegrasyon API: `https://api.tilbecore.com/v1`
- Dış servis callback/webhook: `https://hooks.tilbecore.com/v1`

Staging `staging.tilbecore.com`, local development `tilbecore.test` temel domainini kullanır. `.test` yalnız geliştirme/test ortamı içindir.

## Gerekçe

- Kullanıcıya port göstermeyen profesyonel HTTPS adres standardı gerekir.
- Platform Süper Admin ve tenant kullanıcıları ayrı origin, cookie ve session alanlarında kalmalıdır.
- Firma paneli, saha PWA, TV, takip ve tenant API aynı tenant origin altında path ile ayrılınca CORS karmaşıklığı azalır.
- Tenant yalnız Host header metnine güvenerek seçilmez; normalize edilmiş host, allowlist/pattern ve platform registry çözümlemesi gerekir.
- Yerel/hibrit kurulumda split-DNS ile aynı firma adresinin yerel ağda çalışması hedeflenir.

## Alternatifler

1. Portlu uygulama adresleri (`:3000`, `:3001`) kullanmak.
2. Platform ve tenant uygulamalarını path tabanlı aynı host altında ayırmak.
3. Tenantları yalnız `/f/{firmaKodu}` path’iyle çözmek.
4. Her firma için ayrı kod/deployment kopyası üretmek.

## Reddedilen seçenekler

- Portlu kullanıcı adresleri reddedildi; portlar yalnız iç servis/development ayrıntısıdır.
- Tek host + path tabanlı tenant ayrımı ana yöntem olarak reddedildi; tenant izolasyonu, cookie ve origin sınırı subdomain standardıyla daha nettir.
- Yalnız Host header metnine güvenmek reddedildi; host normalize, reserved isim kontrolü, tenant slug validasyonu ve platform registry gerekir.
- Firma özel kod kopyası reddedildi; tek kod tabanı korunur.

## Güvenlik sınırları

- `console`, `status`, `help`, `updates`, `assets`, `api`, `hooks`, `www`, `staging` tenant slug olamaz.
- Platform hostu tenant gibi, tenant hostu platform gibi kullanılamaz.
- Doğrulanmamış custom domain aktif kabul edilmez.
- Host header enjeksiyonu, geçersiz slug ve bilinmeyen host reddedilir.
- Platform session/cookie tenant tarafından, tenant session/cookie platform tarafından kabul edilmez.
- Cookie sözleşmesi host-only, Secure, HttpOnly, uygun SameSite, ortam bazlı farklı isim ve ayrı namespace ister.
- PostgreSQL, secret store, backup, metrics, worker yönetimi, provisioning CLI, migration komutları ve Prisma Studio public internete açılmaz.

## Ortam adresleri

| Ortam | Base domain | Platform | Tenant örneği |
|---|---|---|---|
| Production | `tilbecore.com` | `https://console.tilbecore.com` | `https://firma.tilbecore.com` |
| Staging | `staging.tilbecore.com` | `https://console.staging.tilbecore.com` | `https://firma.staging.tilbecore.com` |
| Local | `tilbecore.test` | `https://console.tilbecore.test` | `https://firma.tilbecore.test` |

## Custom domain

Custom domain durumları `PENDING`, `VERIFYING`, `VERIFIED`, `ACTIVE`, `FAILED`, `SUSPENDED`, `REMOVED` olarak tanımlanır. Bir domain DNS sahipliği ve TLS doğrulaması tamamlanmadan aktif sayılamaz. Domain değişikliği tenant veya DB kimliğini değiştirmez.

## Split-DNS, TLS ve reverse proxy

Yerel/hibrit kurulumlarda firma domaini veya iç DNS split-DNS ile yerel sunucuya çözümlenebilir. Kullanıcı yine HTTPS ve aynı firma adresini kullanır. Gerçek DNS, CA, sertifika, reverse proxy ve deployment kurulumu bu ADR’de uygulanmaz; deployment/runbook aşamasında yapılır.

## Geri dönüş yöntemi

Bu paket davranış değiştirmeyen TypeScript sözleşmesi ve dokümantasyon içerir. Geri dönüş commit revert ile yapılır. Canlı DNS, sertifika, reverse proxy veya auth/session değişikliği yapılmadığı için runtime geri alma gerektirmez.
