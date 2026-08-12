# İnternet Kesintisi Runbook’u

```yaml
id: OPS-RB-001
title: İnternet Kesintisi Runbook'u
status: PLANNED
owner: Operations
source_role: incident_runbook
reviewers: [Tenant-Operations, Security, QA]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: ILK_AG_KESINTISI_PROVASINDA
version: 0.1
source_of_truth: false
related_requirements: [REQ-051, REQ-067, PRO-033, PRO-034]
related_adrs: []
related_modules: [tenant-runtime, offline, sync-engine]
related_tests: [TST-010, TST-014]
supersedes: []
superseded_by: null
```

## Tetikleyici ve ayrım

İnternet yokluğu ile yerel LAN/runtime/PostgreSQL yokluğu ayrılır. Yerel tenant runtime ve DB sağlıklıysa platform/haricî servis kesintisi aktif firma operasyonunu kendiliğinden durdurmamalıdır. DB’ye ulaşmayan kritik yazı hiçbir durumda başarı sayılmaz.

## Müdahale

1. Incident aç; tenant, tesis, istasyon, başlangıç zamanı ve etkilenen yüzeyleri kaydet.
2. Yerel gateway, tenant app, PostgreSQL, DNS ve cihaz LAN erişimini birbirinden bağımsız test et.
3. Public internet, platform kontrol düzlemi ve entegrasyon arızasını ayrı işaretle.
4. UI bağlantı durumunun doğru olduğunu ve kritik komutların `ONLINE_REQUIRED` olarak bloklandığını doğrula.
5. Yalnız onaylı `QUEUE_ALLOWED` işlemleri kullan; kuyruk sayısını ve en eski item’ı kaydet.
6. SMS/e-posta gibi dış servisleri dondur; ana operasyonu gereksiz tekrarlarla yorma.
7. Yerel runtime/DB de yoksa [DB runbook’una](OPS-RB-002-POSTGRESQL-VERITABANI-SORUNU.md) geç.

## Yasaklar

- Satış, tahsilat, kesim veya teslimi tarayıcıda yerel başarılı gösterme.
- Aynı komutu farklı cihazlarda tekrar tekrar gönderme.
- Queue verisini silme, düzenleme veya tenantlar arasında taşıma.
- İnternet geldi diye otomatik toplu sync’i gözlemsiz başlatma.

## Bağlantı geri geldiğinde

1. Saat, DNS/TLS, tenant host ve session/ref doğrulamasını kontrol et.
2. Önce read smoke; sonra tek düşük riskli queued item ile sync sağlığını doğrula.
3. İdempotency, sürüm, yetki ve TTL kontrolleriyle kontrollü batch aç.
4. Conflict/failed item’ları sorun masasına ayır; last-write-wins uygulama.
5. Queue öncesi/sonrası sayıları, server kayıtları, audit/outbox ve mükerrerlik kontrolünü kaydet.
6. Manuel/kağıt kayıtları yetkili çift kontrolle sisteme işle ve mutabakatla kapat.

## Kapanış kapısı

Kayıp/mükerrer kritik kayıt yok, conflict’ler sahipli, tenant sınırı sağlam ve finans/teslim mutabakatı tamamlanmış olmalıdır. Bu prova yapılmadıysa offline süreklilik `NOT_RUN` kalır.
