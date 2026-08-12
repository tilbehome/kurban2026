# Felaket Kurtarma ve İş Sürekliliği Planı

```yaml
id: OPS-009
title: Felaket Kurtarma ve İş Sürekliliği Planı
status: PLANNED
owner: Reliability
source_role: reliability_policy_or_playbook
reviewers: [Operations, Security, Data-Operations, Product, Tenant-Owner]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: CANLI_TOPOLOJI_VE_RPO_RTO_ONAYINDA
version: 0.1
source_of_truth: false
related_requirements: [REQ-046, REQ-051, REQ-063, REQ-067, PRO-021, PRO-029, PRO-031, PRO-034]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [operations, platform, database-tenant, tenant-runtime, offline]
related_tests: [TST-013, TST-014]
supersedes: []
superseded_by: null
```

## Durum ve hedef

Canlı topoloji, alternatif bölge/tesis, WAL/PITR ve ölçülmüş RPO/RTO henüz yoktur. Bu plan senaryoları ve karar kapılarını tanımlar; iş sürekliliği hazır veya test edilmiş iddiası taşımaz.

## Öncelik sırası

1. İnsan güvenliği ve saha güvenliği.
2. Tenant sınırı, kimlik ve finans/veri doğruluğu.
3. Kesimden doğru pakete/teslime kimlik zinciri.
4. Kritik yerel operasyonun kontrollü devamı.
5. Platform/rapor/iletişim gibi ikincil servislerin geri gelişi.

## Senaryolar

| Senaryo | İlk güvenli mod | Kurtarma odağı |
|---|---|---|
| İnternet/platform kesintisi | Yerel runtime/LAN; riskli bulut bağımlılığını durdur | Bağlantı sonrası kontrollü sync/mutabakat |
| Tenant PostgreSQL kesintisi | Riskli yazı stop/read-only; kağıt acil kimlik | DB health, doğru restore/failover, mutabakat |
| Platform DB kesintisi | Aktif tenant operasyonunu tolerans politikasıyla koru | Lisans/support/provisioning metadata geri gelişi |
| Veri bozulması/operator hatası | Yazıyı dondur, kanıtı koru | İleri düzeltme veya restore/PITR |
| Tenant güvenlik olayı | Etkilenen tenant/modülü izole et | Containment, credential, audit ve bildirim |
| Storage/belge kaybı | Belge işlemini bloke/manuel kanıt | Object restore ve DB metadata mutabakatı |
| Tesis/enerji/ağ kaybı | Güvenli manuel operasyon | Alternatif cihaz/ağ/tesis ve sonradan giriş |
| Hatalı release/migration | Rollout’u durdur/read-only | App rollback veya schema roll-forward/restore |

## DR aktivasyonu

SEV-1/2 incident açılır; olay komutanı kapsamı, güvenli modu ve DR aktivasyonunu kaydeder. Hedef tenant/environment iki kişiyle doğrulanır. İletişim, veri/finans, güvenlik, DB ve saha liderleri ayrılır. Değişiklikler tek zaman çizelgesinde tutulur.

## Geri dönüş kapısı

- Doğru tenant/ref ve başka tenantların etkilenmediği doğrulandı.
- App/schema/migration uyumlu.
- Ledger/kasa ve kritik operasyon mutabakatı tamamlandı.
- Paket/teslim zinciri ve açık manuel kayıtlar işlendi.
- Secret/oturum/pool/worker güvenle yenilendi.
- Telemetry ve alarmlar çalışıyor; kademeli yazı açma onaylandı.

## Tatbikat programı

En az internet, tenant DB, yanlış release, backup restore, PITR destekleniyorsa PITR, cihaz/QR ve tenant güvenlik senaryoları ayrı ayrı ve tam Kurban Günü provasında yürütülür. Periyot, RPO/RTO ve başarı hedefleri canlı mimari/baseline sonrası onaylanır. Kanıt [EVD-010](../evidence/EVD-010-KURBAN-GUNU-PROVA-SABLONU.md) ve gerektiğinde [EVD-005](../evidence/EVD-005-BACKUP-RESTORE-PITR-SABLONU.md) ile tutulur.
