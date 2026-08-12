# 00 — Mevcut Durum Analizi

```yaml
id: ARC-000
status: VERIFIED
owner: Architecture
source_role: verified_repository_snapshot
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

## Doğrulama tabanı

Bu fotoğraf doğrudan `74915b6f3f1f8d53116b760b6a6be9797111efa5` ağacından çıkarıldı. Commit, inceleme anında `agent/docs-core`, `main` ve `origin/main` referanslarının ortak HEAD değeriydi. [GitHub Actions koşusu 31571606803](https://github.com/tilbehome/kurban2026/actions/runs/31571606803) `success` sonucuyla tamamlandı.

Kaynak paketindeki yeni nesil planlar mevcut kod kanıtı sayılmadı. Arşiv belgeleri yalnız tarihsel bağlam olarak kullanıldı.

## Tekrarlanabilir repo envanteri

| Alan | Değer |
|---|---:|
| `app` dosyaları | 227 |
| `apps` dosyaları | 80 |
| `modules` dosyaları | 170 |
| `packages` dosyaları | 90 |
| TypeScript/TSX dosyaları | 624 |
| `page.tsx` dosyaları | 142 |
| `route.ts` dosyaları | 105 |
| Test dosyaları | 33 |
| Workspace app/package manifestleri | 13 |
| Legacy SQLite Prisma modelleri | 18 |
| Platform PostgreSQL modelleri | 33 |
| Tenant PostgreSQL modelleri | 21 |
| Platform migration dizinleri | 7 |
| Tenant migration dizinleri | 3 |

Sayaçlar `rg --files`, `Get-ChildItem` ve Prisma şemalarında `rg '^model '` ile üretildi. Bunlar ürün tamamlanma ölçütü değil, yalnız commit fotoğrafıdır.

## Doğrulanmış çalışma yapısı

- Kök uygulama legacy Next.js/SQLite yüzeyini koruyor.
- Workspace altında `apps/platform-admin`, `apps/provisioning-cli` ve `apps/tenant-ops-cli` bulunuyor.
- On paket bulunuyor: `config`, `contracts`, `database-platform`, `database-tenant`, `operations`, `platform`, `provisioning`, `tenant-core`, `tenant-runtime`, `tenant-web-runtime`.
- Platform DB PostgreSQL şeması `0001..0007`; tenant DB PostgreSQL şeması `0001..0003` migration zincirine sahip.
- Legacy root `prisma/schema.prisma` SQLite ve `Float` para alanlarını hâlâ taşıyor. Mevcut legacy route’lar bütünüyle yeni tenant runtime/Decimal ledger modeline taşınmış değil.
- CI PostgreSQL 16 platform ve tenant servisleriyle migration apply, platform integration, iki tenant izolasyonu/backup doğrulaması, typecheck, unit/route test, lint, iki build ve UTF-8 kapılarını çalıştırıyor.

## Faz durumu

| Alan | Doğrulanmış durum |
|---|---|
| Faz 1 | Eski takip kaydında tamamlandı; bu belgede yeniden kabul yapılmadı |
| Faz 2A | Mimari sözleşme/import grafiği çıkış şartları karşılandı |
| Faz 2B | Kodlandı ve `74915b6` CI kapsamındaki senaryolarda doğrulandı; genel/canlı kabul bekliyor |
| Faz 2C | Önemli tenant DB, runtime, pool, provisioning ve backup parçaları kodlandı; genel/canlı kabul bekliyor |
| Faz 2D–12 | Bazı sözleşme ve başlangıç modelleri var; uçtan uca ürün tamamlanmadı |

Faz 2B ayrıntısı ve kanıt sınırı [ARC-016](16-FAZ-2B-DOGRULANMIS-DURUM-VE-KAPSAM-SINIRI.md) belgesindedir.

## Açık teknik boşluklar

- Legacy SQLite iş akışlarının yeni tenant PostgreSQL runtime’a aşamalı taşınması.
- Legacy finansal `Float` alanlarının doğrulanmış Decimal/Numeric ledger akışına göçü.
- Canlı DNS/TLS/reverse proxy ve deployment kanıtı.
- Fiziksel WebAuthn authenticator kabulü.
- Production restore onayı, WAL/PITR ve ölçülmüş RPO/RTO.
- Browser E2E, erişilebilirlik, RTL, yük ve tam Kurban Günü provası.
- Placeholder ve eski menü/yüzeylerin üretim kapsamı kararı.

## Kanıtsız sayılanlar

Kaynak dosya, route, model veya ekran varlığı tek başına özellik tamamlanması değildir. Bu nedenle repo boyutu, migration dosyasının varlığı ve unit testler `canlıya hazır` ifadesi için kullanılmaz.
