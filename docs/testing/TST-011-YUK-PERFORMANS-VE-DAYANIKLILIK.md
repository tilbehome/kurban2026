# Yük, Performans ve Dayanıklılık Test Planı

```yaml
id: TST-011
title: Yük, Performans ve Dayanıklılık Test Planı
status: IMPLEMENTED_UNVERIFIED
owner: QA
source_role: test_plan
reviewers: [Operations, Architecture, Product, Security]
effective_date: 2026-08-12
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
next_review: ILK_STAGING_BASELINE_SONRASI
version: 0.1
source_of_truth: false
related_requirements: [REQ-067, PRO-017, PRO-022, PRO-031]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [tenant-runtime, database-tenant, operations, worker]
related_tests: [TST-011]
supersedes: []
superseded_by: null
```

## İlke

Üretim trafiği ve prova ölçümü olmadığı için sayısal latency, throughput, SLO, RPO veya RTO uydurulmaz. Önce sezon/kullanıcı/cihaz davranışından yük modeli ve staging baseline üretilir; hedefler ürün ve operasyon sahiplerince onaylanır.

Araç kararı [ADR-0004](../adr/ADR-0004-STAGING-YUK-TEST-ARACI-SECIMI.md) ile k6 OSS olarak alınmıştır. `performance/k6/tilbecore-staging.js` bütün profil isimlerini ve ölçümleri tanımlar; baseline dışındaki VU/süre değerleri açık environment olmadan başlamaz. Yerel makinede k6/Docker ve erişilebilir sentetik staging bulunmadan performans sonucu `BLOCKED`, sayısal alanlar `NOT_MEASURED` kalır.

## İş yükü modeli

- Firma sayısı, aynı anda aktif firma ve firma başına ayrı DB/pool davranışı.
- Kurban Günü istasyonları: kesim, tartım, paketleme, soğuk oda, teslim.
- Satış/kasa pikleri, karma ödeme ve eşzamanlı aynı hisse isteği.
- TV/public tracking okuma yükü ile yetkili yazı yükünün ayrılması.
- Worker/outbox/bildirim backlog’u ve ağır rapor etkisi.
- Belge/QR üretimi, backup ve migration’ın operasyon saatinden ayrılması.

Değerler tahminle değil sentetik prova ve gözlemlenmiş profil ile kanıta yazılır.

## Test türleri

| Test | Amaç | Durdurma ölçütü |
|---|---|---|
| Baseline | Tek kullanıcı/akış maliyeti | Fonksiyonel hata veya telemetry eksikliği |
| Load | Beklenen eşzamanlılık | Hata bütçesi/DB pool/queue kabul sınırı |
| Spike | Ani sıra/teslim yoğunluğu | Fail-closed kaybı veya mükerrer yazı |
| Soak | Leak, pool, queue ve storage büyümesi | Sürekli kötüleşme veya kaynak tükenmesi |
| Concurrency | Aynı hisse/idempotency/teslim | Birden fazla kazanan kayıt |
| Failure injection | DB, worker, storage, ağ ve sağlayıcı | Veri kaybı, tenant karışması, kontrolsüz retry |
| Degraded mode | Read-only/modül durdurma | Yasak yazının başarılı görünmesi |

## Ölçümler

Komut başarı/iş kuralı reddi/teknik hata oranı, p50/p95/p99 gecikme, throughput, DB bağlantı/pool bekleme, transaction rollback, lock/deadlock, CPU/RAM/disk/IO, queue age/DLQ, event-loop, cache hit, bundle/navigation ve cihaz sync gecikmesi izlenir. Tenant etiketi opaque ve bounded-cardinality olmalıdır.

## Veri doğruluğu kapısı

Yük testi sonunda performans kadar şu mutabakatlar zorunludur: satılan hisse tekilliği, idempotency tekrar sayısı, ledger dengesi, audit/outbox sayısı, paket/teslim tekilliği ve Tenant A/B ayrımı. Hızlı fakat tutarsız sonuç başarısızdır.

## Çıktı

Rapor; commit/artifact, ortam topolojisi, veri profili, script sürümü, yük aşamaları, ölçümler, hata örnekleri, bottleneck, kapasite baş mesafesi ve önerilen eşikleri içerir. Sonuç [EVD-009](../evidence/EVD-009-YUK-SOAK-SABLONU.md) ile tutulur.

## 14 Ağustos 2026 yerel ölçümü

Baseline, 5 VU load, 0→10 VU spike ve 3 VU/60 saniye kısa soak yerel sentetik HTTPS hedefinde hata oranı `0` ile ölçüldü; production hedef koruması istekten önce reddetti. Onaylı SLO ve production topolojisi olmadığı için kapasite kabulü verilmedi. Tam sayılar `EVD-009-RUN-20260814-001` kaydındadır.
