# Ürün Vizyonu, Kapsam ve Başarı Standardı

```yaml
id: PRD-001
status: PLANNED
owner: Product
source_role: product_scope_source
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

## Ürün tanımı

TilbeCore – Kurban Takip; büyükbaş kurban işletmelerinin tedarik, hayvan, hisse, müşteri, satış, finans, vekâlet, kesim, paketleme ve teslimat süreçlerini tek ürün ailesinde yöneten, çok firmalı profesyonel operasyon sistemidir.

## Değişmez kapsam

- Yalnız büyükbaş kurban operasyonu.
- Tek kod tabanı ve modüler monolit.
- Platform kontrol düzlemi ile firma operasyon düzleminin ayrılması.
- Platform için ayrı PostgreSQL, firma başına ayrı PostgreSQL hedefi.
- Masaüstü, tablet ve mobil; saha işlemlerinde mobil öncelik.
- Finansal kayıtların silinmeden ters kayıt/iadeyle düzeltilmesi.
- Hayvan başına en fazla yedi aktif hisse ve bir hisseye bir aktif hissedar.
- Ürün markası ile firma markasının ayrılması.

İş kurallarının ayrıntılı ana kaynağı [birleşik ana mimari ve yol haritasıdır](../architecture/TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md). Bu belgede aynı kurallar yeniden çoğaltılmaz.

## Kapsam dışı

- Küçükbaş, adak ve akika.
- Genel amaçlı kasap/et satış ERP’si.
- Kritik finans veya kesim kararını insan onayı olmadan veren yapay zekâ.
- İlk aşamada gereksiz mikroservis parçalanması.
- İşlevsiz placeholder ekranı tamamlanmış ürün kapsamı saymak.

## Mevcut doğrulanmış konum

`74915b6` ile Platform Süper Admin kontrol düzlemi, Platform PostgreSQL `0001..0007` migration zinciri, tenant PostgreSQL `0001..0003` zinciri, platform/tenant sınırları ve ilgili CI kapıları kodlanıp belirtilen CI ortamında doğrulandı. Bu, bütün ürün zincirinin veya Faz 2–12’nin tamamlandığı anlamına gelmez. Ayrıntı [ARC-016](../architecture/16-FAZ-2B-DOGRULANMIS-DURUM-VE-KAPSAM-SINIRI.md) belgesindedir.

## Başarı tanımı

Ürün ancak aşağıdaki sonuçların birlikte kanıtlanmasıyla canlıya hazır kabul edilir:

- Çifte hisse satışı ve çift teslim engellenir.
- Satış, tahsilat, kasa ve ledger açıklanamayan fark üretmez.
- İki firma arasında host, session, DB referansı, dosya, yedek ve destek erişimi izolasyonu doğrulanır.
- Kritik mobil görevler hedef cihaz ve ağ koşullarında kabul edilir.
- Migration, rollback, backup, restore ve Kurban Günü provası kanıtlanır.
- Güvenlik, erişilebilirlik, i18n/RTL ve operasyon kapıları geçer.

Bu maddeler hedef kabul ölçütüdür; mevcut tamamlanma beyanı değildir.
