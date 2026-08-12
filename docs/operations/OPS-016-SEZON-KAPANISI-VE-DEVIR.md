# Sezon Kapanışı ve Devir Prosedürü

```yaml
id: OPS-016
title: Sezon Kapanışı ve Devir Prosedürü
status: PLANNED
owner: Tenant-Operations
source_role: operations_policy_or_playbook
reviewers: [Finance, Operations, Privacy, Tenant-Owner]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: HER_SEZON_KAPANISI_ONCESI
version: 0.1
source_of_truth: false
related_requirements: [REQ-068, PRO-009, PRO-019, PRO-021, PRO-030, PRO-032]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [season-management, finance-ledger, reporting, audit]
related_tests: [TST-006, TST-013, TST-014]
supersedes: []
superseded_by: null
```

## Ön koşul

Sezon kapanışı kayıt silmez ve yeni sezona sessiz bakiye/operasyon devretmez. Kapanan sezon salt okunur olur; düzeltme yalnız onaylı dönem politikası ve auditli ters kayıtla yapılır.

## Kapanış kontrolü

1. Açık/rezervasyonlu/işletmeye kalan hisseler ve yedi hisse invariant’ı.
2. Açık borç, tahsilat, iade, mahsup ve müşteri sezon carisi.
3. Kasa sayımı; banka/POS/ledger sıfır açıklanamayan fark.
4. Eksik/geçersiz vekâlet ve belge sürümleri.
5. Kesilmemiş hayvan, yarım aşama, tartım/paket/kg farkı.
6. Soğuk oda/araçta açık, kayıp/fazla veya teslim edilmemiş paket.
7. Açık incident, override, SupportSession, offline queue/conflict, outbox/DLQ.
8. Veri kalitesi, tenant güvenliği, audit ve privacy/export talepleri.

Bloklayıcı bulgu varken sezon başarılı kapanmış gösterilmez. Yetkili istisna kararında kapsam, etki, sahip ve takip zamanı bulunur.

## Finans ve operasyon onayı

Finance ve operasyon ayrı mutabakat çıktısı üretir; Firma Admin/owner sonuçları onaylar. Düzeltme fiziksel silme değil bağlantılı ters kayıt/istisna komutudur. Kapanış snapshot’ı release/schema/migration ve firma saat dilimiyle işaretlenir.

## Yedek, arşiv ve privacy

- Son tenant DB ve belge/object storage backup’ı alınır, checksum ve geçici restore ile doğrulanır.
- Sezon rapor/export paketi okunabilir, tenant kapsamlı ve erişim kontrollüdür.
- Retention, legal hold, KVKK talebi ve geçici export temizliği kaydedilir.
- Platform yalnız backup/sağlık/kapanış metadata’sını görür; operasyon içeriğini kopyalamaz.

## Devir ve kapanış sonrası

Açık risk/incident, cihaz/secret/entegrasyon, bakım işi, bilinen sorun ve gelecek sezon backlog’u yazılı devredilir. Kullanıcı/cihaz erişimleri gözden geçirilir. Postmortem, darboğaz, SLO ve eğitim bulguları sahipli iyileştirmeye dönüşür.

## Kanıt

Kapanış; finans mutabakatı, operasyon sayımları, açık istisnalar, backup/restore sonucu, salt-okunur geçiş audit’i ve yetkili sign-off ile kanıtlanır. Herhangi biri `NOT_RUN/FAILED/BLOCKED` ise durum açıkça böyle kalır.
