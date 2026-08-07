# 06 — Finans ve Ledger Mimarisi

## Mevcut finans kanıtı

`prisma/schema.prisma` içinde finansal alanlar `Float`:

- `Kurban.satisBedeli`
- `Hisse.hisseFiyati`
- `Odeme.nakit`
- `Odeme.havale`
- `Odeme.kart`
- `Odeme.toplamTutar`
- `KasaHareketi.tutar`

`shared/lib/para.ts` kuruşa yuvarlama yardımcıları içeriyor; ancak kalıcı model hâlâ `Float`.

## Hedef

Tek iç finansal hareket/defter mimarisi kurulmalıdır. Operasyonel iç muhasebe ile resmî fatura/muhasebe sistemi ayrı tutulur. TilbeCore Kurban ilk aşamada operasyonel alacak, tahsilat, kasa, banka, POS, iade ve gider mutabakatını yönetir; resmî muhasebe entegrasyonu ayrı fazdır.

## Para modeli

Öneri:

- Uygulama içinde `Money` value object.
- Veritabanında kuruş tabanlı `Int` veya PostgreSQL `Decimal(18,2)` kararı migration öncesi netleşmeli.
- İş kuralı testleri kuruş bazlı yapılmalı.
- UI parse/format sadece kenarda kalmalı.

## Ledger modeli

Temel alanlar:

- `id`
- `sezonId`
- `islemGrubuId`
- `kaynakTipi`: satış, tahsilat, iade, gider, tedarikçi ödeme, kg farkı.
- `borcHesap`
- `alacakHesap`
- `tutarKurus`
- `paraBirimi`
- `kaynakModel`
- `kaynakId`
- `tersKayitId`
- `aciklama`
- `createdAt`
- `olusturanId`

## Kurallar

- Finansal kayıt fiziksel silinmez.
- Hatalı tahsilat ters kayıtla düzeltilir.
- Satış fiyatı snapshot olarak kilitlenir.
- Kapora, alacağın parçasıdır; hisseye/borca dağıtımı kayıtlıdır.
- Ödeyen kişi ve hissedar ayrımı modele girmelidir.
- Karma ödeme tek kullanıcı işlemi olsa da kasa/banka/POS alt hareketlerine ayrılır.
- POS taksit ve vade farkı ayrı muhasebe kalemi olmalıdır.
- Alt kg iadesi ters kayıt/indirim olarak görünmelidir.

## Faz riski

Float → kuruş/Decimal dönüşümü yüksek risklidir. Mevcut yerel veri test verisi kabul edilse bile migration scripti dry-run, tutar fark raporu ve rollback planı ile yazılmalıdır.

