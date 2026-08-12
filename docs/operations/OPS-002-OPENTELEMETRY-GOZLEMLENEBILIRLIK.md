# OpenTelemetry Gözlemlenebilirlik Standardı

```yaml
id: OPS-002
title: OpenTelemetry Gözlemlenebilirlik Standardı
status: REVIEW
owner: Operations
reviewers: [Security, Privacy, Architecture, QA]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: OTEL_COLLECTOR_UYGULAMASINDA
version: 0.1
source_of_truth: false
related_requirements: [PRO-016, PRO-017, PRO-022, PRO-027]
related_adrs: [ADR-0002]
related_modules: [operations, observability, tenant-runtime, worker]
related_tests: [TST-011, TST-012]
supersedes: []
superseded_by: null
```

## Durum

Repo `traceId/requestId` ve sağlayıcıdan bağımsız event/metric sözleşmeleri içerir. Gerçek OpenTelemetry SDK/collector/exporter, dashboard ve alarm akışı uygulanmış/çalıştırılmış sayılmaz.

## Korelasyon zinciri

```text
requestId → traceId/spanId → actor/device → opaque tenant/season
→ command/domain event → transaction/ledger → auditId → outbox/job
```

Platform audit tenant operasyon içeriğini kopyalamaz. `SupportSession` varsa opaque session kimliği iki audit alanını korele eder.

## Telemetry sözleşmesi

| Sinyal | Zorunlu alan | Yasak |
|---|---|---|
| Trace | service, environment, release, operation, result, trace/request ID | Request body, PII, secret, SQL/connection string |
| Metric | bounded service/route/command/result/tenant tier | User/phone/customer ID gibi yüksek cardinality |
| Log | zaman, severity, güvenli kod, IDs, retry/decision | Stack’in kullanıcıya çıkması, credential, tam payload |
| Audit | actor, tenant, intent, önce/sonra güvenli özet, gerekçe | Secret ve gereksiz operasyon içeriği |

## Asgari enstrümantasyon

- Host/tenant resolution sonucu ve fail-closed nedeni.
- Auth/MFA/passkey/recovery/session ve yetki reddi.
- Kritik satış/tahsilat/kesim/paket/teslim command sonucu ve gecikmesi.
- DB pool acquire/wait/error, transaction rollback ve slow query sınıfı.
- Queue age, retry, DLQ ve worker shutdown.
- Backup/verify/restore/PITR adımı ve yaş.
- Offline queue/sync/conflict; cihaz/yazıcı/QR adapter hatası.
- Release, migration, maintenance, read-only/full-stop ve feature flag değişimi.

## Redaction ve erişim

[Secret standardındaki](../security/SEC-006-SECRET-ANAHTAR-VE-GUVENLIK-LOGLAMA.md) allowlist uygulanır. Collector öncesi ve merkezi depoda ikinci redaction kontrolü bulunur. Log/trace erişimi rol bazlı, auditli ve süreli olur; saklama süresi Privacy/Operations kararıyla belirlenir.

## Doğrulama

Sentetik bir request kritik zincirde yürütülür; request/trace/audit/outbox bağları bulunabilir olmalı, ancak sentetik canary secret ve PII hiçbir sinyalde görünmemelidir. Collector/exporter kesintisi ana transaction’ı bozmaz; kayıp/gap metric ve alarmı üretir. Sampling kararı güvenlik/audit olaylarını körleştiremez.
