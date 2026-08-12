# 16 — Faz 2B Doğrulanmış Durum ve Kapsam Sınırı

```yaml
id: ARC-016
status: VERIFIED
owner: Architecture-and-Platform
source_role: phase_2b_verified_evidence_summary
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

## Sonuç

Faz 2B için doğru ifade şudur:

> Platform Süper Admin kontrol düzlemi `74915b6` commitine kadar kodlandı; migration, repository, domain/application, route ve CI kapsamındaki PostgreSQL senaryolarında doğrulandı. Genel güvenlik/E2E, canlı altyapı ve operasyon kabulü tamamlanmadığı için Faz 2B canlıya hazır değildir.

## Değişmez kanıtlar

| Kanıt | Referans | Sonuç |
|---|---|---|
| Commit | `74915b6f3f1f8d53116b760b6a6be9797111efa5` | Faz 2B kontrol düzlemi tamamlama paketi |
| CI koşusu | [TilbeCore CI / 31571606803](https://github.com/tilbehome/kurban2026/actions/runs/31571606803) | `success`, 12 Ağustos 2026 |
| Platform migration | `packages/database-platform/prisma/migrations/0007_platform_control_plane_completion/migration.sql` | `0001..0007` zincirinin parçası |
| Platform şeması | `packages/database-platform/prisma/schema.prisma` | 33 model; tenant operasyon modeli yok |
| Platform integration | `packages/database-platform/tests/platform-postgres.integration.test.ts` | CI’da PostgreSQL 16 ile geçti |
| Route testi | `apps/platform-admin/tests/routes.test.ts` | Platform Admin route/adaptör davranışları CI’da geçti |
| Domain/application testi | `packages/platform/src/tests/platform-admin.test.ts` | Kontrol düzlemi kuralları CI’da geçti |
| Tenant erişim politikası | `packages/tenant-runtime/src/tenant-request-runtime.ts` | read-only/full-stop/modül engeli request öncesi uygulanıyor |

CI ayrıca UTF-8, Platform/Tenant Prisma validate ve generate, iki migration apply, iki-tenant web/pool/backup izolasyonu, TypeScript, unit/route testleri, lint, root build, Platform Admin build, PWA artefakt kontrolü ve `git diff --check` adımlarını başarıyla tamamladı.

## Kodlanan Faz 2B kapsamı

- Ayrı `apps/platform-admin` Next.js uygulaması, ayrı PlatformUser session/cookie ve yetki alanı.
- Parola + TOTP yanında passkey kayıt/giriş/iptal, tek kullanımlık recovery code, cihaz/oturum iptali ve yeniden doğrulama.
- Platform komuta merkezi; firma liste/360°, provisioning, plan/lisans/entitlement, domain, backup, SupportSession, kullanıcı ve audit yüzeyleri.
- Incident zaman çizelgesi, planlı bakım, full-stop/read-only/modül durdurma politikaları.
- Firma dondurma, yeniden etkinleştirme, kapanış ön kontrolü/talebi, data-export işi ve sahiplik devri için idempotent iş kaydı.
- Kritik işlemde yakın tarihli yeniden doğrulama; kapanış, export ve devirde farklı ikinci yetkili onayı.
- İlk backup işi sonrasında süreli Firma Admin daveti hazırlama; tokenın yalnız hashlenmiş saklanması.
- Platform metadata payload’ında secret, connection string ve tenant operasyon verisi sızıntısını reddeden kontroller.

## Kısmi veya bağımlı kapsam

- `data_export` için Platform tarafında güvenli iş ve metadata vardır; gerçek tenant veri export içeriği üreticisi tamamlanmış değildir.
- Provisioning ve tenant operasyon worker’ları `--once` yürütülebilir; sürekli production orchestration kanıtı yoktur.
- Passkey kodu WebAuthn origin/RP/challenge doğrulamasına sahiptir; fiziksel authenticator ve güvenilir HTTPS kabulü yapılmamıştır.
- Tenant access policy runtime’a bağlanmıştır; bütün legacy route’ların yeni runtime’a taşındığı söylenemez.

## Kanıtlanmayan ve açık kalanlar

- Canlı DNS, TLS, reverse proxy, deployment ve rollback.
- Fiziksel passkey cihaz kabulü.
- Production destructive restore ve yetkili onay akışı.
- Yönetilen WAL/PITR ile ölçülmüş RPO/RTO.
- Gerçek abonelik/faturalama.
- Genel browser E2E, ASVS, WCAG, performans/yük ve Kurban Günü provası.
- Gerçek müşteri verisiyle UAT veya pilot firma kabulü.

## Durum kullanımı

Başka belgeler Faz 2B ayrıntısını çoğaltmaz; bu belgeye bağlanır. Takip tablosunda `IMPLEMENTED_PENDING_VERIFICATION`, bu rapordaki açık genel/canlı kapılar kapanıncaya kadar korunur.
