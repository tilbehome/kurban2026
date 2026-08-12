# Kaynak Önceliği ve Kanıt Standardı

```yaml
id: GOV-003
status: PLANNED
owner: Product-and-Architecture
source_role: source_precedence_and_evidence_source
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

## Çelişki çözme sırası

1. Kullanıcının son açık ve kapsamlı kararı.
2. Kabul edilmiş ADR ile belgelenmiş ürün/iş kararı.
3. Doğrulanmış kod, migration ve otomatik test davranışı.
4. Başarılı CI, release ve operasyon kanıtı.
5. Birleşik ana yol haritası ve uygulama takip defteri.
6. İncelemedeki ürün/mimari belgeler.
7. Kaynak belge paketi, arşiv, prompt ve sohbet kayıtları.

Kodun mevcut davranışı hedef kararın doğru uygulandığını kendiliğinden kanıtlamaz. Kod ile karar çelişirse fark kaydedilir; kritik iş kuralı sessizce kod lehine değiştirilmez.

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
