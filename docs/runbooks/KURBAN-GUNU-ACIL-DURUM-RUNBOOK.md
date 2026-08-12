# Kurban Günü Savaş Odası ve Acil Durum Runbook’u

```yaml
id: OPS-010
title: Kurban Günü Savaş Odası ve Acil Durum Runbook'u
status: REVIEW
owner: Operations
reviewers: [Product, Security, Data-Operations, Support, Tenant-Owner]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: HER_KURBAN_GUNU_PROVASI_ONCESI
version: 0.2
source_of_truth: false
related_requirements: [REQ-067, PRO-015, PRO-016, PRO-021, PRO-031, PRO-034, PRO-035]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [operations, platform, tenant-runtime, slaughter-packaging-delivery]
related_tests: [TST-010, TST-011, TST-014]
supersedes: []
superseded_by: null
```

## Kullanım ve kanıt durumu

Bu runbook canlı açılış kanıtı değildir. İnternet, DB, cihaz, güvenlik, read-only ve operasyon düzeltme senaryoları sentetik tam provada çalıştırılmadan `VERIFIED` olmaz.

## Açılış kontrolü

- Olay komutanı, teknik/DB, güvenlik, operasyon, iletişim ve kayıtçı rolleri atanmıştır.
- Güncel nöbet/iletişim listesi erişim kontrollü sistemdedir; repo içinde kişisel telefon yoktur.
- Dashboard/telemetry, status iletişimi ve incident kayıt yüzeyi erişilebilirdir.
- Son doğrulanmış backup, restore prova sonucu, release/migration sürümü ve rollback planı bilinir.
- Yedek cihaz/ağ/yazıcı/QR malzemesi ve kağıt acil kimlik seti sayılmıştır.
- Read-only/full-stop/modül durdurma yetkilileri ve çift onay yöntemi bellidir.

## İlk beş dakika kontrol listesi

1. İnsan güvenliği riski varsa teknik işlemden önce saha güvenliğini sağla.
2. Incident aç; zaman, tenant/tesis/istasyon, görülen belirti ve ilk bildireni kaydet.
3. Etkiyi sınıflandır: tenant güvenliği, finans/veri doğruluğu, kesim-paket zinciri, kullanılabilirlik.
4. Şüpheli yazıları durdur; olayın kapsamından büyük bir kesinti uygulamadan en küçük güvenli modu seç.
5. Kanıtı koru: request/trace/audit ID, release, cihaz ve zaman; PII/secret kopyalama.
6. İlgili alt runbook’u çağır ve tek olay komuta zincirini koru.

## Güvenli modlar

| Mod | Kullanım | Yasak |
|---|---|---|
| Normal | Sağlıklı sistem | İzinsiz override |
| Modül durdurma | Tek riskli modül/işlev | Etkilenmeyen çekirdeği gereksiz durdurma |
| Read-only | Veri doğruluğu şüpheli; güvenli görüntüleme mümkün | Yeni riskli yazı ve başarı bildirimi |
| Full stop | Tenant sınırı/DB bütünlüğü veya çekirdek yaygın risk | Kontrolsüz manuel dijital yazı |
| Kağıt acil akış | Dijital yazı yok; saha güvenliği/kimlik sürekliliği | Finans/teslimi sonradan doğrulamadan kesinleşmiş sayma |

## Alt runbook’lar

- [İnternet kesintisi](OPS-RB-001-INTERNET-KESINTISI.md)
- [PostgreSQL/veritabanı sorunu](OPS-RB-002-POSTGRESQL-VERITABANI-SORUNU.md)
- [Yanlış paket veya hisse](OPS-RB-003-YANLIS-PAKET-VEYA-HISSE.md)
- [Kasa farkı](OPS-RB-004-KASA-FARKI.md)
- [Cihaz, yazıcı veya QR](OPS-RB-005-CIHAZ-YAZICI-QR.md)
- [Salt-okunur/acil durdurma](OPS-RB-006-SALT-OKUNUR-ACIL-DURDURMA.md)
- [Tenant güvenlik olayı](OPS-RB-007-TENANT-GUVENLIK-OLAYI.md)

## Vardiya devri

Açık incident, güvenli mod, son doğrulanan işlem/kimlik, manuel kayıt aralığı, sahip, sonraki karar zamanı ve iletişim durumu sözlü değil yazılı devredilir. Yeni ekip geri dönüş kapısını yeniden doğrular.

## Kapanış

Semptomun kaybolması kapanış değildir. Veri/ledger/paket/teslim mutabakatı, tenant sınırı, queue/manual kayıt uzlaştırması, alarm/telemetry, müşteri iletişimi ve kalıcı aksiyon sahibi doğrulanır. Sonuç [EVD-010](../evidence/EVD-010-KURBAN-GUNU-PROVA-SABLONU.md) veya incident/postmortem kaydıyla bağlanır.
