# Teslim İzlenebilirliği ve GitHub Yönetişim Hedefi

```yaml
id: GOV-013
status: PLANNED
owner: Engineering-and-Product
source_role: delivery_traceability_and_github_governance_source
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
```

## Zorunlu teslim zinciri

Her uygulama paketi aşağıdaki kimlikli zinciri kurar; bir bağlantının yokluğu sonraki halkayı kendiliğinden doğrulanmış yapmaz:

```text
REQ/PRO → GitHub issue → branch/worktree → PR → değişmez commit
        → TST sonucu → EVD kaydı → release adayı → release/go-no-go
```

Issue gereksinim/iş akışı kimliğini, kapsam dışını, riski ve kabul ölçütünü taşır. PR ilgili issue’yu, değişen sözleşmeleri, test sonuçlarını/atlamaları, migration ve geri dönüş etkisini bağlar. EVD kaydı test ortamı, commit, komut, sonuç ve artefaktı sabitler. Release kaydı yalnız gerçekten kapsanan EVD’leri referans alır.

## Definition of Ready

- Gereksinim ve tek-sahip karar kaynağı belli.
- Kabul ölçütleri normal, hata, yetki, idempotency/concurrency ve geri alma davranışını kapsıyor.
- Tenant, finans, PII/secret, migration, offline ve cihaz etkileri sınıflandırılmış.
- Bağımlılıklar, sorumlu, kapsam dışı ve açık kararlar görünür.
- Test ortamı, sentetik veri ve geri dönüş yöntemi hazır.

## Definition of Done

- Kod/migration/doküman kapsamı ilgili REQ/PRO ve issue ile bağlı.
- Yetki, tenant sınırı, transaction/idempotency ve audit etkileri doğrulandı.
- Gerekli testler çalıştı; çalışmayanlar gerekçeli `NOT_RUN` veya `SKIPPED_WITH_REASON`.
- Diff, secret, UTF-8, doküman bağlantı/envanter ve geri dönüş kontrolleri geçti.
- TRK-001, gereksinim matrisi, test/EVD ve bilinen risk/borç kayıtları güncellendi.
- “Kodlandı”, “test edildi”, “kabul edildi” ve “canlıya hazır” ayrı sonuçlar olarak raporlandı.

## Faz ve istisna kapıları

Faz hedef sırası ve çıkış kriterlerinin tek sahibi [RMP-001](../architecture/TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md), güncel gerçekleşme kaynağı [TRK-001](../architecture/KURBAN2026-UYGULAMA-TAKIP.md), risk/rollback kaynağı [GOV-007](../architecture/12-FAZLAR-RISKLER-VE-GERI-DONUS.md) belgesidir. Kapı istisnası; gerekçe, kapsam, süre, risk sahibi, telafi kontrolü ve onaylayanlarla kimlikli karar olarak kaydedilmeden uygulanmaz.

## GitHub hedefi

Bu görev GitHub ayarlarını değiştirmez. Aşağıdakiler `PLANNED` hedeftir ve mevcut/etkin gösterilemez:

- Gereksinim, hata, risk ve teknik borç için issue şablonları.
- REQ/issue, test/EVD, migration, güvenlik ve rollback alanlarını isteyen PR şablonu.
- Belge/kod sahipliğiyle uyumlu `CODEOWNERS`.
- `main` için zorunlu PR, gerekli CI kontrolleri, onay, konuşma çözümü, force-push/silme engeli ve ayrıcalık denetimi içeren ruleset.
- Project alanları: gereksinim kimliği, faz, modül, tenant/finans/güvenlik riski, durum, kanıt, sorumlu, hedef sürüm ve açık karar.

GitHub Project erişimi ve gerçek repository ruleset durumu bu pakette doğrulanmamıştır. Ekran görüntüsü veya hareketli dal adı kanıt yerine geçmez.
