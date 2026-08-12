---
id: DOM-003
title: Firma, Tesis ve Sezon Domain Sözleşmesi
status: PLANNED
owner: Domain-and-Operations
source_role: domain_contract
source_of_truth: false
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
related_requirements: [REQ-007, REQ-008, REQ-043, PRO-030, PRO-031, PRO-032]
---

# Firma, tesis ve sezon

Bu belge sezonu firma operasyonunun ve finansının zorunlu sınırı olarak tanımlar. Onaylanana kadar bağlayıcı kaynak [birleşik ana mimari](../architecture/TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md) ve [gereksinim matrisi](../architecture/11-GEREKSINIM-IZLENEBILIRLIK-MATRISI.md) olmaya devam eder. Belge durumu, uygulama durumunu göstermez.

## Sınır ve sahiplik

- Firma ve tenant yaşam döngüsü Platform Control Plane’in; sezon içi operasyon tenant veritabanının sorumluluğudur.
- İlk canlı kapsam tek lokasyonla çalışabilir. Gelişmiş şube/tesis hiyerarşisi `PLANNED` durumundadır.
- Müşteri kimliği sezonlar arasında korunur; cari, satış, ledger, kesim ve teslim kayıtları sezonla ayrılır.
- Arşivlenen sezon salt okunurdur; yeni sezon eski bakiyeyi veya operasyon durumunu sessizce devralmaz.

## Aggregate ve durum makinesi

`Season`, hazırlık engelleri ve kapanış mutabakatının tutarlılık sınırıdır.

```text
PREPARATION → SALES → SLAUGHTER → DELIVERY → RECONCILIATION → ARCHIVED
```

Kod sözleşmesindeki karşılıklar `preparation`, `sales`, `slaughter`, `delivery`, `reconciliation`, `archived` değerleridir. Geçiş atlanamaz; aynı duruma idempotent tekrar zarar vermez. `ARCHIVED` durumundan yazılabilir bir duruma dönüş tanımlı değildir.

## Değişmez kurallar

1. Tenant operasyon ve finans kayıtları `seasonId` taşır.
2. Sezon geçişi server-side yetki, önkoşul, gerekçe, actor, zaman ve audit üretir.
3. `SALES` açılmadan fiyat, hisse ve satış hazırlıkları doğrulanır.
4. `SLAUGHTER` öncesinde hayvan uygunluğu, tam yedi hisse, gerçek kişilere satılan hisselerin vekâleti, satılmamış işletme hissesi kararı ve görev/cihaz hazırlık engelleri görünürdür.
5. `ARCHIVED` öncesinde açık borç, açık kasa farkı, teslim edilmemiş hisse/paket ve açık istisna raporlanır.
6. Kapanış kayıt silmez; yazmayı kilitler ve doğrulanmış arşiv/yedek bağı üretir.

## Gerçek uygulama durumu

| Dilim | Durum | Kanıt ve sınır |
|---|---|---|
| `Season` tipi ve geçiş koruması | `IMPLEMENTED_UNVERIFIED` | `packages/tenant-core/src/tenant-domain.ts`; `assertSeasonTransition` mevcut. |
| PostgreSQL `Season` modeli ve sezon ilişkileri | `IMPLEMENTED_UNVERIFIED` | `packages/database-tenant/prisma/schema.prisma`; migration zinciri mevcut. |
| Legacy firma uygulamasında gerçek sezon seçimi/cari ayrımı | `PLANNED` | Kök SQLite şemasında `Season` modeli yok; `/musteriler/yeni-sezon` placeholder. |
| Hazırlık skoru, prova ve kapanış sihirbazı | `PLANNED` | `packages/operations/src/simulation-readiness.ts` yalnız sözleşme/gate sağlar; bağlı runtime/UI kanıtı yok. |
| Gelişmiş şube, tesis ve kapasite yönetimi | `PLANNED` | İlk canlı sonrası kapsam. |

## Komutlar ve olaylar

Planlanan komutlar: `CreateSeason`, `OpenSales`, `OpenSlaughterDay`, `OpenDelivery`, `StartReconciliation`, `ArchiveSeason`. Her komut idempotency, optimistic concurrency ve tenant/season kapsamı ister.

Planlanan olaylar: `season.created`, `season.sales_opened`, `season.slaughter_opened`, `season.reconciliation_started`, `season.archived`, `season.transition_rejected`.

## Kabul matrisi

| Senaryo | Beklenen sonuç |
|---|---|
| `PREPARATION → SLAUGHTER` atlama | Güvenli hata; veri değişmez. |
| Açık teslim veya kasa farkıyla arşivleme | Bloke; bulgular istisna kuyruğuna gider. |
| Arşiv sezonuna yazma | Server-side reddedilir. |
| Aynı geçişin ağ tekrarı | İkinci yan etki/audit çoğaltılmaz. |
| İki sezonlu müşteri | Ekstreler ayrı, birleşik geçmiş salt okunur görünür. |

Uçtan uca akış [WFL-007](../workflows/WFL-007-SEZON-ACILISI-VE-KAPANISI.md), kullanıcı yüzeyi [UX-003](../ux/UX-003-360-SAYFA-SOZLESMELERI.md) ile birlikte değerlendirilir.
