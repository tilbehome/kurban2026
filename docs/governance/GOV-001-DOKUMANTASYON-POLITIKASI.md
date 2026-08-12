# TilbeCore Dokümantasyon Politikası

```yaml
id: GOV-001
status: VERIFIED
owner: Product-and-Architecture
source_role: documentation_lifecycle_source
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

## Amaç ve kapsam

Bu politika repo içindeki bütün aktif Markdown belgelerinin yaşam döngüsünü yönetir. Uzmanlık belgelerinin içerik sahibi metadata içindeki `owner` alanıdır; genel sınıflandırma ve erişim kaynağı [GOV-012 envanteridir](GOV-012-MARKDOWN-ENVANTERI-VE-TASNIF.md).

## Zorunlu metadata

Her aktif belge en az aşağıdaki alanları taşır:

```yaml
id: benzersiz-belge-kimliği
status: VERIFIED | IMPLEMENTED_UNVERIFIED | IMPLEMENTING | PLANNED | NOT_RUN | SUPERSEDED | ARCHIVED
owner: karar-ve-bakım-sahibi
source_role: belgenin-tek-sorumluluğu
source_of_truth: true | false
last_reviewed: YYYY-MM-DD
verified_against_commit: tam-commit-sha-veya-not_applicable
```

`VERIFIED` yalnız belgenin açıkça belirttiği kapsam ve kanıt için kullanılır. Kod veya migration varlığı, kabul doğrulaması yoksa en fazla `IMPLEMENTED_UNVERIFIED` sonucunu destekler. Çalıştırılmayan fiziksel, canlı veya uçtan uca kabul `NOT_RUN` olarak yazılır.

## Tek kaynak ilkesi

- Her konu için tek ana kaynak belirlenir.
- Başka belge ana kuralı kopyalamaz; bağlantı verir ve yalnız kendi bağlamındaki sonucu açıklar.
- Faz durumunun ana kanıtı [uygulama takip defteridir](../architecture/KURBAN2026-UYGULAMA-TAKIP.md).
- Faz 1–12 sırası ve mimari kararların ana kaynağı [birleşik ana yol haritasıdır](../architecture/TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md).
- Test ve kabul planının ana kaynağı [TST-001](../testing/TST-001-MASTER-TEST-PLANI.md) belgesidir.
- `74915b6` Faz 2B kanıtının özet kaynağı [ARC-016](../architecture/16-FAZ-2B-DOGRULANMIS-DURUM-VE-KAPSAM-SINIRI.md) belgesidir.

## Kanıt dili

| İfade | Gerekli kanıt |
|---|---|
| Planlandı | Gereksinim, yol haritası veya ADR |
| Kodlandı | Kaynak dosya ve commit |
| Migration hazır | Sürümlü migration dosyası ve validate/apply kanıtı |
| Test edildi | Test kimliği, ortam, commit ve sonuç |
| CI doğrulandı | Değişmez commit SHA ve koşu bağlantısı |
| Canlıya hazır | CI yanında güvenlik, migration, operasyon, restore, cihaz/E2E ve go/no-go kanıtı |

Test adı veya test dosyasının varlığı testin geçtiği anlamına gelmez. Yerel sonuç ile GitHub Actions sonucu ayrı kaydedilir.

## Dönüşüm ve arşiv

Yeni kaynak doğrulanmadan eski belge silinmez. Sorumluluk taşındığında eski belge önce `SUPERSEDED` yapılır ve `superseded_by` bağlantısı eklenir. İçerik aktarımı ve bağlantılar doğrulandıktan sonra `ARCHIVED` yapılabilir. Git geçmişi tek başına aktif bağlantıların yerini tutmaz.

## Kalite kapısı

- UTF-8 ve Türkçe karakter doğrulaması geçer.
- Yerel Markdown bağlantıları var olan hedeflere gider.
- Belge kimlikleri benzersizdir.
- Secret, parola, gerçek connection string veya gerçek kişisel veri bulunmaz.
- Gerçek durum, hedef durum ve kapsam dışı kanıtlar ayrıdır.
- Güncel koddan üretilebilen sayaçlar tarih ve commit ile verilir; kalıcı iş kuralı gibi yazılmaz.
- Bütün aktif belgeler [GOV-012 envanterinde](GOV-012-MARKDOWN-ENVANTERI-VE-TASNIF.md) bulunur.
- Değişiklik, ilgili takip ve indeks belgelerine bağlanır.

## İnceleme tetikleyicileri

Şema/migration, CI kapısı, faz durumu, ADR, ürün kapsamı, tenant sınırı veya canlı işletim kararı değiştiğinde ilgili çekirdek belge aynı uygulama paketi içinde gözden geçirilir.
