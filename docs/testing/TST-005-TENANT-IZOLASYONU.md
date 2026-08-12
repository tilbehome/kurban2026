# Tenant İzolasyonu Test Planı

```yaml
id: TST-005
title: Tenant İzolasyonu Test Planı
status: REVIEW
owner: QA-and-Security
reviewers: [Platform, Data-Operations, Privacy]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: HER_TENANT_RUNTIME_VE_SUPPORTSESSION_DEGISIKLIGINDE
version: 0.1
source_of_truth: false
related_requirements: [REQ-048, REQ-049, REQ-059, REQ-062, REQ-066, PRO-020, PRO-021]
related_adrs: [ADR-0001, ADR-0002, ADR-0003]
related_modules: [tenant-runtime, tenant-web-runtime, database-tenant, database-platform, platform]
related_tests: [TST-005]
supersedes: []
superseded_by: null
```

## Amaç ve mevcut kapsam

Amaç, istemci kimliği veya kayıt ID’si aynı olsa bile Tenant A verisinin Tenant B, platform kullanıcısı, yanlış pool veya yanlış backup hedefi üzerinden okunamadığını/değiştirilemediğini kanıtlamaktır.

Repo entegrasyon testi iki fiziksel tenant DB, aynı kayıt ID’leri, host/session/ref, custom domain, ayrı pool, süre/kapsam/onay kontrollü `SupportSession`, dump/geçici restore ve çapraz backup reddini kapsar. [TilbeCore CI koşusu 31571606803](https://github.com/tilbehome/kurban2026/actions/runs/31571606803), `74915b6f3f1f8d53116b760b6a6be9797111efa5` commit’i için `Two-tenant web, pool and backup/restore isolation tests` adımını `success` sonucuyla tamamlamıştır. Legacy route’ların tümü yeni runtime’a taşınmadığından bu suite’in geçmesi bütün ürün yüzeylerini, production restore’u veya canlı tenant altyapısını kanıtlamaz.

## Kurulum

- Ayrı platform DB ile iki ayrı fiziksel tenant DB.
- Tenant A/B için aynı schema ve aynı season/customer/share gibi kimlikler; ayırt edilebilir sentetik değerler.
- Ayrı tenant host/session/ref, bir platform session ve farklı durumlarda SupportSession fixture’ları.
- Pool event/metric kaydı, log/hata yakalama ve tenant bazlı backup storage.

## Negatif matris

| Senaryo | Beklenen |
|---|---|
| Tenant A host + Tenant B session | Fail-closed; PII/veri gövdesi yok |
| Tenant A session + Tenant B DB ref | Fail-closed |
| Reserved/bilinmeyen host | Tenant context oluşmaz |
| Doğrulanmamış/pasif custom domain | Erişim reddi |
| Pasif/askıda tenant | Okuma/yazma politika gereği reddedilir |
| Platform session, SupportSession yok | Tenant operasyon erişimi yok |
| Onaysız/süresi dolmuş/iptal SupportSession | Erişim yok |
| Read-only veya yanlış modül kapsamı | Yazma reddi |
| Aynı ID, iki fiziksel DB | Yalnız resolved tenant kaydı görünür/değişir |
| Eşzamanlı A/B istekleri ve pool reuse | Context/ref karışmaz |
| Tenant A backup + Tenant B ref | Status/verify/restore reddi |
| Hata/CLI/log/trace | Connection string, parola, PII veya operasyon içeriği yok |

## Pozitif sınır

Geçerli tenant oturumu yalnız kendi DB’sinde izinli işlemi yapabilir. Geçerli `SupportSession` yalnız onaylı tenant, süre, modül, veri sınıfı ve okuma/yazma kapsamında çalışır; gerçek erişim tenant audit’e, güvenli metadata platform audit’e korele edilir.

## Geniş yüzey taraması

Route, worker, scheduled job, export, dosya/object storage, cache, queue, offline sync, telemetry, backup ve restore her biri tenant context kaynağı açısından envantere alınır. Yeni runtime’a bağlı olmayan yüzey `NOT_COVERED` olarak release riskine yazılır; dolaylı UI gizleme kanıt sayılmaz.

## Kabul

- Bütün negatifler gerçekten koşmuş, beklenen güvenli ret ve veri yokluğunu doğrulamıştır.
- Başka tenant DB, backup, storage ve audit kaydı değişmemiştir.
- Pool/worker cleanup tamamlanmış, geçici hedef kalmamıştır.
- Secret/PII canary değerleri hata/log/trace/artefakta çıkmamıştır.
- Sonuç [EVD-003](../evidence/EVD-003-TENANT-IZOLASYON-SABLONU.md) ile commit ve ortam bazında kaydedilmiştir.
