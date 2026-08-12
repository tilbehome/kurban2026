# Çekirdek Belge Dönüşüm Kaydı

```yaml
id: GOV-011
status: REVIEW
owner: Architecture
source_role: documentation_transformation_register
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

## Dönüşüm kararı

`TILBECORE-PROFESYONEL-BELGE-PAKETI` altındaki 15 Markdown dosyası taslak kaynak olarak incelendi. Paket doğrudan kopyalanmadı; kod, migration, test ve CI ile doğrulanabilen içerik mevcut çekirdek belgelere işlendi. Yeni nesil `YN-00–YN-26` yol haritası bu aşamada bağlayıcı uygulama planına dönüştürülmedi; Faz 1–12 sonrasına ait ürün planı olarak kaldı.

## Kaynak–hedef matrisi

| Kaynak paket belgesi | Hedef | Karar | Durum |
|---|---|---|---|
| `00-README-VE-BELGE-INDEKSI.md` | `docs/README.md` | Ana indeks standardı işlendi | Dönüştürüldü |
| `01-MEVCUT-BELGELER-DONUSUM-MATRISI.md` | Bu belge | Dönüşüm ve silme kapıları işlendi | Dönüştürüldü |
| `02-URUN-VIZYONU-KAPSAM-VE-BASARI.md` | `docs/product/PRD-001-...md` | Hedef ile mevcut durum ayrıldı | Dönüştürüldü |
| `03-KULLANICI-ROLLER-LISANS-VE-KURULUM.md` | `docs/product/PRD-005-...md` | Yaşam döngüsü hedefi, Faz 2B kanıt sınırıyla işlendi | Dönüştürüldü |
| `04-UCDAN-UCA-KURBAN-OPERASYON-MODELI.md` | Birleşik yol haritası ve ilgili uzmanlık belgeleri | Çekirdek kurallar korundu; workflow dizini bu pakette değiştirilmedi | Yönlendirildi |
| `05-SISTEM-MIMARISI-DIZIN-VE-MODUL-STANDARDI.md` | `01`, `02`, `13`, `15` mimari belgeleri | Mükerrer hedef yapı ana kaynaklara bağlandı | Dönüştürüldü |
| `06-VERI-FINANS-VE-IZLENEBILIRLIK-STANDARDI.md` | `03`, `06`, `09` mimari belgeleri | Gerçek ve hedef ayrımı korundu | Dönüştürüldü |
| `07-GUVENLIK-GIZLILIK-VE-TENANT-IZOLASYONU.md` | `03`, `05`, ADR-0002 | Güvenlik dizini bu pakette değiştirilmedi | Yönlendirildi |
| `08-UX-360-PWA-OFFLINE-VE-CIHAZ-STANDARDI.md` | `08-TASARIM-SISTEMI-...md` | UX dizini bu pakette değiştirilmedi | Yönlendirildi |
| `09-TEST-KALITE-KABUL-VE-KANIT-PLANI.md` | `10-TEST-KALITE-...md` | CI kanıtı ve canlı kabul ayrımı eklendi | Dönüştürüldü |
| `10-ALTYAPI-CANLI-ISLETIM-YEDEK-VE-DR.md` | `09`, ADR-0003 | Operations/runbooks dizinleri bu pakette değiştirilmedi | Yönlendirildi |
| `11-RELEASE-EGITIM-DESTEK-VE-SEZON-KAPANISI.md` | Birleşik yol haritası | Henüz uygulama kanıtı olmayan maddeler plan olarak korundu | Yönlendirildi |
| `12-BELGE-YONETISIMI-VE-CODEX-UYGULAMA-TALIMATI.md` | GOV-001, GOV-003 ve `AGENTS.md` | Belge kuralları repo standardına işlendi | Dönüştürüldü |
| `TILBECORE-KURBAN-OS-TEK-BAGLAYICI-YENI-NESIL-YOL-HARITASI.md` | Birleşik Faz 1–12 yol haritasına referans | `YN-*` dönemi başlamadı; aktif Faz 2 ile birleştirilmedi | Plan kaynağı |
| `TILBECORE-PROFESYONEL-DOKUMANTASYON-SISTEMI-ANA-PLANI.md` | GOV-001, GOV-002, GOV-003, GOV-011 | Çekirdek yönetişim modeli işlendi | Dönüştürüldü |

## Koruma ve silme sonucu

Bu dönüşümde mevcut çekirdek belge silinmedi. Uzmanlık dizinlerine ayrılan içerik için dosya oluşturulmadı veya değiştirilmedi. Bir sonraki dönüşümde sorumluluğu tamamen taşınacak belge önce `SUPERSEDED`, bağlantı doğrulamasından sonra `ARCHIVED` yapılacaktır.
