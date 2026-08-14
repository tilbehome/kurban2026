# Faz 2D–6 Kapanış Kanıtı

```yaml
id: EVD-013
title: Faz 2D–6 Kapanış Kanıtı
status: IMPLEMENTED_UNVERIFIED
owner: Product-and-Architecture
source_role: evidence_record
reviewers: [Finance, Security, QA-and-Operations]
effective_date: 2026-08-14
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
next_review: PR_CI_SONUCUNDA
version: 0.1
source_of_truth: false
related_requirements: [REQ-008, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-031, PRO-030, PRO-038]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [customer, procurement, animal, sales, finance, proxy, reporting]
related_tests: [TST-001, TST-006]
supersedes: []
superseded_by: null
```

## Envanter ve dönüşüm sınırı

| Alan | Başlangıç kanıtı | Bu paketteki durum |
|---|---|---|
| Müşteri ve sezon carisi | Tenant repository vardı; legacy sayfalar ve bazı raporlar global Prisma kullanıyordu. | Tenant cari kayıtları satış, tahsilat, iptal ve kontrollü transfer hareketleriyle korunur; yeni cari raporu gerçek `CustomerSeasonAccount` verisini okur. |
| Tedarikçi ve satın alma | Alış faturası hayvan/hisse üretimini atomik yapıyordu; vergi matrahı ayrılmıyor, ödeme/gider journal'a bağlanmıyordu. | Vergili alış journal'ı matrah + indirilecek vergi → tedarikçi borcu olarak ayrıldı; tedarikçi ödeme ve gider belgeleri değişmez journal bağlantısı aldı. |
| Hayvan, sağlık, padok ve tartım | Hayvan, sağlık ve tartım vardı; padok yalnız yol haritası hedefiydi. | Sezon kapsamlı `Paddock` ve geçmiş koruyan `AnimalPaddockAssignment` eklendi; kapasite ve tek aktif atama transaction/DB kuralıyla korunur. |
| Hisse, rezervasyon, satış, transfer ve iptal | Pozitif kaporalı satış vardı; iptal journal ters kaydı üretmiyor, transfer `SaleShare` satırını siliyordu. | Tahsis kapsam/limit kilidi, satış ve tahsilat reversal iptali, silinmeyen aktif/pasif satış-hisse geçmişi ve ödeme varken müşteri değişimine fail-closed kural eklendi. |
| Vekâlet ve belge | Protected storage guard vardı; grantor–hisse sahipliği ve sezon metadata'sı eksikti. | Sezon, yöntem, MIME, boyut, oluşturan ve iptal gerekçesi kalıcılaştırıldı; grantor yalnız sahip olduğu satılmış hisse için vekâlet verebilir; korumalı okuma tenant/sezon yetkisine bağlıdır. |
| Faturalar 360 ve ölçü birimi | Migration `0008–0009`, satır snapshot'ı ve provider mapping fail-closed davranışı vardı. | Mevcut bütünlük kuralları korunur; satın alma çekirdeği aynı vergi hesap sınıflarıyla uyumlu hale getirildi. Gerçek sağlayıcı hâlâ `BLOCKED/NOT_RUN` durumundadır. |
| Raporlar ve eski yüzeyler | Yönetim analitiğinde dört rapor vardı; kasa/rapor/hisse atama ekranları PostgreSQL modunda legacy veriye gidebiliyordu. | Ledger mutabakatı, cari, tedarikçi/alış ve hayvan/maliyet/sağlık/padok raporları eklendi. PostgreSQL modunda legacy doğrudan atama/transfer/iptal API'leri fail-closed; eski aktif sayfalar tenant çalışma alanına yönlenir. |

## Migration ve geri dönüş

- Yeni ileri migration: `packages/database-tenant/prisma/migrations/0010_faz_2d_6_closure/migration.sql`.
- `0001–0009` dosyaları değiştirilmez.
- Migration; yeni tablo/kolon/FK/index/trigger ekler. Vekâlet sezonu mevcut hisse bağlantısından fail-closed backfill edilir; kapsamı belirlenemeyen eski kayıt varsa deploy durur.
- Geri dönüş, migration dosyasını geçmişten silmek değildir. Aday dal/PR geri alınır; uygulanmış ortam için backup/restore ve ayrı onaylı forward düzeltme gerekir.

## Test sözleşmesi

`packages/database-tenant/tests/faz-2d-6-closure.integration.test.ts` gerçek PostgreSQL üzerinde şu negatif/pozitif kabulleri yürütür:

- rezervasyonun satış, tahsilat veya journal üretmemesi;
- pozitif kaporalı kesin satış ve toplam satış tutarını aşan tahsis reddi;
- satış/tahsilat reversal iptali ve sıfırlanan cari bakiye;
- transferde eski `SaleShare` geçmişinin silinmemesi;
- ödeme varken farklı müşteriye transferin reddi;
- vergili alış, tedarikçi ödeme ve gider journal sınıfları;
- padok kapasitesi/aktif atama geçmişi;
- vekâlet veren müşterinin hisse sahipliği ve tenant/sezon kapsamı.

2026-08-14 tarihinde yalnız sentetik veri taşıyan, loopback'e bağlı izole PostgreSQL 16 kabul ortamında boş veritabanlarına platform `0001–0007` ve tenant `0001–0010` migration zincirleri uygulandı. Yerel sonuçlar: platform PostgreSQL `9/9`, tenant izolasyonu/provisioning/backup-restore `1/1`, Faturalar 360 PostgreSQL `6/6` ve Faz 2D–6 kapanış PostgreSQL `3/3`; toplam `19/19` başarılıdır. Bu yerel kanıt gerçek müşteri verisi, gerçek staging veya production kabulü değildir. GitHub CI aynı değişmez PR HEAD üzerinde başarılı olmadan bu belge `VERIFIED` yapılmaz.

## Açık dış kabuller

- Gerçek e-Fatura/e-Arşiv entegratörü, resmî güncel UBL-TR birim eşlemesi ve sağlayıcı sandbox kabulü: `BLOCKED/NOT_RUN`.
- Gerçek HTTPS staging E2E/axe, gerçek collector/export, k6 load/spike/soak, fiziksel passkey/cihaz/yazıcı/terazi, Kurban Günü provası ve production deployment: `NOT_RUN`.
- Legacy SQLite verisinin tenant PostgreSQL'e müşteri ortamında dry-run/import ve mutabakatı: ayrı veri geçiş paketi gerektirir; bu kod kapanışı gerçek firma verisi üzerinde migration çalıştırmaz.
