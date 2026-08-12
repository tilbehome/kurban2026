# Canlı İşletim El Kitabı

```yaml
id: OPS-001
title: Canlı İşletim El Kitabı
status: REVIEW
owner: Operations
reviewers: [Security, Data-Operations, Support, Product]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
next_review: ILK_CANLI_SEZON_ONCESI
version: 0.1
source_of_truth: false
related_requirements: [REQ-046, REQ-051, REQ-063, REQ-064, REQ-067, PRO-016, PRO-021, PRO-031]
related_adrs: [ADR-0002, ADR-0003]
related_modules: [operations, platform, tenant-runtime, worker]
related_tests: [TST-011, TST-013, TST-014]
supersedes: []
superseded_by: null
```

## İşletim ilkeleri

- Tenant ve finans doğruluğu kullanılabilirlikten önce gelir; şüphede riskli yazı durdurulur.
- Her müdahale incident/change kaydı, sorumlu, zaman, request/trace/audit bağı ve geri dönüş içerir.
- Production secret, PII veya operasyon içeriği ticket/chat/kanıta kopyalanmaz.
- Kritik değişiklik iki kişi kontrolü ve release/migration planına bağlıdır.
- Kanıtsız “sağlıklı”, “restore edildi” veya “sorun çözüldü” denmez.

## Günlük kontrol

- Platform/tenant resolution ve kritik komut sentetik smoke durumu.
- Açık incident, maintenance, emergency stop ve SupportSession’lar.
- DB bağlantı/pool, transaction hatası, disk ve migration uyumu.
- Queue age, retry ve dead-letter.
- Backup yaşı, sonucu, checksum/doğrulama ve restore prova takvimi.
- Sertifika, domain/custom domain ve entegrasyon sağlığı.
- Release dağılımı, config drift ve alarm gürültüsü.

## Haftalık/sezonluk kontrol

- Yetkili kullanıcı, cihaz, service account ve SupportSession access review.
- Restore doğrulama ve kanıt örneklemesi.
- Capacity trendi, yavaş sorgu ve pool adaleti.
- Secret/sertifika rotasyon takvimi ve dependency/zafiyet durumu.
- Runbook iletişim, cihaz, yazıcı, QR, internet ve yedek ekipman provası.
- Açık problem/postmortem aksiyonları ve doküman drift’i.

## Kurban Günü komuta modeli

| Rol | Sorumluluk |
|---|---|
| Olay komutanı | Severity, öncelik, mod değişimi ve kapanış kararı |
| Operasyon lideri | İstasyon etkisi, manuel iş akışı ve mutabakat |
| Teknik lider | Uygulama/DB/ağ tanısı ve kontrollü müdahale |
| Güvenlik/Privacy | Tenant/PII olayı, erişim ve delil koruma |
| İletişim sorumlusu | Firma/personel/status güncellemeleri |
| Kayıtçı | Zaman çizelgesi, karar, kanıt ve devir |

Kişi adları ve telefonlar bu repoya yazılmaz; güncel nöbet listesi erişim kontrollü işletim sisteminde tutulur.

## Severity ilkesi

- `SEV-1`: Tenant sızıntısı şüphesi, yaygın kritik yazı kaybı/bozulması, finans bütünlüğü veya tüm Kurban Günü çekirdeği.
- `SEV-2`: Bir tenant/istasyon kritik akışı; güvenli workaround sınırlı.
- `SEV-3`: Kısmi işlev, tek cihaz/entegrasyon; çekirdek akış güvenli.
- `SEV-4`: Bilgi/iyileştirme; operasyon etkisi yok.

Yanıt süreleri ve iletişim periyotları kadro/SLO onayı olmadan uydurulmaz.

## Runbook yönlendirmesi

Ana savaş odası [Kurban Günü acil durum runbook’udur](../runbooks/KURBAN-GUNU-ACIL-DURUM-RUNBOOK.md). DB, internet, yanlış paket/hisse, kasa, cihaz/QR, read-only ve tenant güvenlik olayları ilgili alt runbook’a ayrılır.
