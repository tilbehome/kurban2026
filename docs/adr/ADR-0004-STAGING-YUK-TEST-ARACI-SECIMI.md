# ADR-0004 — Staging Yük ve Dayanıklılık Test Aracı Seçimi

```yaml
id: ADR-0004
status: IMPLEMENTED_UNVERIFIED
owner: Architecture-and-QA
source_role: performance_tooling_decision
source_of_truth: true
last_reviewed: 2026-08-13
verified_against_commit: not_applicable
```

## Karar

TilbeCore sentetik staging yük, spike, soak, eşzamanlılık ve failure-injection testlerinde Grafana k6 OSS kullanır. Test scripti `performance/k6/tilbecore-staging.js`, çalıştırma kapısı `pnpm load:test` komutudur. Araç yerel `k6` binary’sini; yoksa sabitlenmiş Docker imajını kullanır. İki yöntem de yoksa sonuç `BLOCKED` olur.

## Gerekçe ve resmî kaynaklar

- k6 senaryo executor’ları baseline/load/spike/soak profillerinin birbirinden ayrılmasını sağlar: <https://grafana.com/docs/k6/latest/using-k6/scenarios/>.
- Yerleşik ve özel metrikler p50/p95/p99, throughput, teknik hata ve iş kuralı reddini ayrı ölçmeye uygundur: <https://grafana.com/docs/k6/latest/using-k6/metrics/>.
- Resmî Docker çalıştırma yolu Windows ve CI için tekrar üretilebilir bir fallback sağlar: <https://grafana.com/docs/k6/latest/get-started/running-k6/>.
- `check` tek başına testi fail etmediği için kabul kararı ölçüm sonrası, veri bütünlüğü mutabakatıyla verilir: <https://grafana.com/docs/k6/latest/using-k6/checks/>.

## Güvenlik ve kanıt sınırı

- Hedef yalnız güvenilir HTTPS `*.staging.tilbecore.com` veya `*.tilbecore.test` olabilir. Production hostu kod düzeyinde reddedilir.
- Gerçek kullanıcı veya firma verisi kullanılmaz. Sentetik auth değeri yalnız process environment üzerinden alınır; script, özet ve Git’e yazılmaz.
- Baseline ölçülmeden latency, throughput, kapasite veya SLO eşiği tanımlanmaz. Script bu nedenle önceden uydurulmuş threshold içermez.
- k6 sonucu tek başına kabul değildir. Satış tekilliği, idempotency, ledger, audit/outbox, teslim ve Tenant A/B mutabakatı ayrıca tamamlanmadan EVD-009 `PASSED` olamaz.

## Profiller

`baseline`, `load`, `spike`, `soak`, `concurrency`, `idempotency`, `tenant-isolation`, `db-pool`, `worker-backlog`, `report`, `read-only`, `failure-injection` ve `offline-sync`. Baseline dışındaki yoğunluk/süre değerleri environment ile açıkça verilmek zorundadır; varsayılan kullanıcı veya gecikme hedefi yoktur.

## Alternatifler

Playwright browser akışlarının performans sürücüsü olarak kullanılması, tarayıcı başına maliyet ve yüksek eşzamanlılık ölçümündeki gürültü nedeniyle reddedildi. Artillery, Node.js uyumu güçlü olsa da bu pakette k6’nın senaryo/metric modeli ve resmî tek binary/Docker dağıtımı daha küçük operasyon yüzeyi sunduğu için seçilmedi.

## Geri dönüş

`performance/k6`, ilgili package scripti ve bu ADR birlikte revert edilir. Staging veya production verisine migration uygulanmaz.
