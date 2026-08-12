# Kaynak Önceliği ve Kanıt Standardı

```yaml
id: GOV-003
status: VERIFIED
owner: Product-and-Architecture
source_role: source_precedence_and_evidence_source
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
```

Bu belge kaynak önceliği ve kanıt sınıflarının tek ana sahibidir. `AGENTS.md`, kök `README.md`, RMP-001, TRK-001 ve uzmanlık belgeleri ayrı bir öncelik sırası üretmez; yalnız bu belgeye yönlendirir.

## Normatif hedef karar önceliği

1. Kullanıcının son açık ve kapsamlı kararı.
2. Kabul edilmiş ADR ile belgelenmiş ürün/iş kararı.
3. Birleşik ana yol haritasındaki normatif hedef ve ilgili tek-sahip domain/ürün sözleşmesi.
4. Gereksinim ve kabul kriteri belgeleri.
5. İncelemedeki ürün/mimari taslaklar.
6. Salt-okunur kaynak belge paketi, arşiv, prompt ve sohbet kayıtları.

## Mevcut uygulama gerçeği ve kanıt önceliği

1. Değişmez committe doğrudan incelenmiş kaynak kodu ve migration.
2. Aynı committe gerçekten çalışmış otomatik test ve CI adımları.
3. Ortamı, senaryosu ve sonucu kayıtlı operasyon/UAT kanıtı.
4. TRK-001 uygulama takip kaydı ve ARC-016 gibi kapsamı sınırlı kanıt özetleri.
5. Tarihli analiz ve envanter; yeniden üretilebilir kanıt yoksa yalnız gözlem kabul edilir.

Kodun mevcut davranışı hedef kararın doğru uygulandığını kendiliğinden kanıtlamaz ve normatif hedefi sessizce değiştiremez. Kod ile karar çelişirse hedef karar korunur; mevcut davranış TRK-001 ve ilgili domain belgesinde `IMPLEMENTING` farkı olarak kaydedilir.

## Kanıt sınıfları

| Sınıf | Örnek | Kanıtladığı | Kanıtlamadığı |
|---|---|---|---|
| Karar | ADR, onaylı yol haritası | Ne yapılması gerektiği | Uygulama veya test sonucu |
| Uygulama | Commit, kaynak dosya | Kod/migration varlığı | Çalışma, güvenlik veya canlı hazırlık |
| Otomatik doğrulama | Unit/integration/CI | Tanımlı senaryonun ilgili ortamda geçtiği | Kapsam dışı cihaz ve operasyon davranışı |
| Operasyon | Restore, prova, deployment, UAT | Belirtilen ortam ve senaryoda işletilebilirlik | Başka ortam veya sonraki sürüm |

## Commit ve CI sabitleme

Kanıt kaydı kısa SHA yerine mümkün olduğunda tam SHA kullanır. `main` veya `latest` gibi hareketli referanslar doğrulama referansı değildir. CI kanıtında koşu bağlantısı, commit, sonuç ve kapsanan işler bulunur.

12 Ağustos 2026 doğrulamasında temel referans:

- Commit: `74915b6f3f1f8d53116b760b6a6be9797111efa5`
- CI: [TilbeCore CI / 31571606803](https://github.com/tilbehome/kurban2026/actions/runs/31571606803)
- Sonuç: `success`
- Sınır: Bu koşu canlı DNS/TLS, fiziksel passkey cihazı, production restore, gerçek abonelik/faturalama veya genel Kurban Günü provası değildir.

## Yasak ifadeler

Kanıt kapsamı belirtilmeden `tamamlandı`, `tam güvenli`, `production ready`, `sorunsuz`, `tam izole` veya `geri yüklenebilir` denmez. Uygun karşılık, örneğin `kodlandı ve belirtilen CI senaryosunda doğrulandı; canlı kabul bekliyor` biçimindedir.
