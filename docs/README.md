# TilbeCore – Kurban Takip Belge Ana İndeksi

```yaml
id: GOV-002
status: REVIEW
owner: Product-and-Architecture
source_role: canonical_document_index
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

Bu dosya aktif çekirdek belgelerin tek giriş noktasıdır. Dosyanın listede bulunması, içindeki bütün hedeflerin kodlandığı anlamına gelmez. Gerçek durum; belge durumu, ilgili kanıt kaydı ve doğrulanan commit birlikte okunarak belirlenir.

## Okuma sırası

1. [Dokümantasyon politikası](governance/GOV-001-DOKUMANTASYON-POLITIKASI.md)
2. [Kaynak önceliği ve kanıt standardı](governance/GOV-003-KAYNAK-ONCELIGI-VE-KANIT-STANDARDI.md)
3. [Ürün vizyonu, kapsam ve başarı](product/PRD-001-URUN-VIZYONU-KAPSAM-VE-BASARI.md)
4. [Birleşik ana mimari ve yol haritası](architecture/TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md)
5. [Mevcut durum analizi](architecture/00-MEVCUT-DURUM-ANALIZI.md)
6. [Faz 2B doğrulanmış durum ve kapsam sınırı](architecture/16-FAZ-2B-DOGRULANMIS-DURUM-VE-KAPSAM-SINIRI.md)
7. [Uygulama takip defteri](architecture/KURBAN2026-UYGULAMA-TAKIP.md)

## Yönetişim ve ürün kaynakları

| ID | Belge | Durum | Sahip | Kaynak rolü |
|---|---|---|---|---|
| GOV-001 | [Dokümantasyon politikası](governance/GOV-001-DOKUMANTASYON-POLITIKASI.md) | `REVIEW` | Product-and-Architecture | Belge yaşam döngüsü için ana kaynak |
| GOV-003 | [Kaynak önceliği ve kanıt standardı](governance/GOV-003-KAYNAK-ONCELIGI-VE-KANIT-STANDARDI.md) | `APPROVED` | Product-and-Architecture | Çelişki ve tamamlanma dili için ana kaynak |
| GOV-011 | [Belge dönüşüm kaydı](governance/GOV-011-BELGE-DONUSUM-KAYDI.md) | `REVIEW` | Architecture | Kaynak paket dönüşümünün ana kaydı |
| PRD-001 | [Ürün vizyonu, kapsam ve başarı](product/PRD-001-URUN-VIZYONU-KAPSAM-VE-BASARI.md) | `REVIEW` | Product | Ürün sınırı için ana kaynak |
| PRD-005 | [Firma, lisans ve sezon yaşam döngüsü](product/PRD-005-FIRMA-LISANS-VE-SEZON-YASAM-DONGUSU.md) | `REVIEW` | Product-and-Platform | Yaşam döngüsü hedeflerinin ana kaynağı |

## Mimari ve izlenebilirlik belgeleri

| ID | Belge | Durum | Kaynak rolü |
|---|---|---|---|
| ARC-000 | [Mevcut durum analizi](architecture/00-MEVCUT-DURUM-ANALIZI.md) | `VERIFIED` | Doğrulanmış repo fotoğrafı |
| ARC-001 | [Hedef sistem mimarisi](architecture/01-HEDEF-SISTEM-MIMARISI.md) | `APPROVED` | Hedef sistem sınırı |
| ARC-002 | [Modüler monolit ve domain sınırları](architecture/02-MODULER-MONOLIT-VE-DOMAIN-SINIRLARI.md) | `APPROVED` | Bağımlılık yönü ve modül sınırı |
| ARC-003 | [Çoklu firma ve veritabanı mimarisi](architecture/03-COKLU-FIRMA-VE-VERITABANI-MIMARISI.md) | `IMPLEMENTED_PENDING_VERIFICATION` | Tenant veri mimarisi |
| ARC-004 | [Platform Süper Admin ve Firma Admin](architecture/04-PLATFORM-SUPER-ADMIN-VE-FIRMA-ADMIN.md) | `IMPLEMENTED_PENDING_VERIFICATION` | Control-plane ve kimlik ayrımı |
| ARC-005 | [Kimlik, yetki ve destek erişimi](architecture/05-KIMLIK-YETKI-VE-DESTEK-ERISIMI.md) | `IMPLEMENTING` | IAM hedefleri ve mevcut boşluklar |
| ARC-006 | [Finans ve ledger mimarisi](architecture/06-FINANS-VE-LEDGER-MIMARISI.md) | `IMPLEMENTING` | Finans hedef mimarisi |
| ARC-007 | [UTF-8, çoklu dil ve RTL](architecture/07-UTF8-COKLU-DIL-VE-RTL.md) | `IMPLEMENTING` | Yerelleştirme standardı |
| ARC-008 | [Tasarım sistemi, mobil ve PWA](architecture/08-TASARIM-SISTEMI-VE-MOBIL-PWA.md) | `IMPLEMENTING` | UX/PWA mimari özeti |
| ARC-009 | [Veri göçü, yedek ve güncelleme](architecture/09-VERI-GOCU-YEDEK-VE-GUNCELLEME.md) | `IMPLEMENTED_PENDING_VERIFICATION` | Migration ve geri dönüş mimarisi |
| TST-001 | [Test, kalite ve kabul planı](architecture/10-TEST-KALITE-VE-KABUL-PLANI.md) | `IMPLEMENTING` | Çekirdek kalite kapıları |
| REQ-003 | [Gereksinim izlenebilirlik matrisi](architecture/11-GEREKSINIM-IZLENEBILIRLIK-MATRISI.md) | `IMPLEMENTING` | Gereksinim–kanıt ilişkisi |
| GOV-007 | [Fazlar, riskler ve geri dönüş](architecture/12-FAZLAR-RISKLER-VE-GERI-DONUS.md) | `IMPLEMENTING` | Faz/risk/rollback özeti |
| ARC-013 | [Hedef dizin ve modül standardı](architecture/13-HEDEF-DIZIN-ISKELETI-VE-MODUL-STANDARDI.md) | `APPROVED` | Monorepo hedefi |
| INV-001 | [Program tam kapsam envanteri](architecture/14-PROGRAM-TAM-KAPSAM-ENVANTERI.md) | `IMPLEMENTING` | Ürün/kod kapsam envanteri |
| ARC-015 | [Faz 2A import grafiği ve taşıma matrisi](architecture/15-FAZ-2A-IMPORT-GRAFIGI-VE-TASIMA-MATRISI.md) | `VERIFIED` | Faz 2A kapanış kaydı |
| ARC-016 | [Faz 2B doğrulanmış durum ve kapsam sınırı](architecture/16-FAZ-2B-DOGRULANMIS-DURUM-VE-KAPSAM-SINIRI.md) | `VERIFIED` | `74915b6` kanıt özeti |
| RMP-001 | [Birleşik ana mimari ve yol haritası](architecture/TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md) | `APPROVED` | Faz 1–12 bağlayıcı ana yol haritası |
| TRK-001 | [Uygulama takip defteri](architecture/KURBAN2026-UYGULAMA-TAKIP.md) | `IMPLEMENTING` | Commit/test/CI ilerleme defteri |

## Mimari karar kayıtları

| ID | Belge | Durum | Kaynak rolü |
|---|---|---|---|
| ADR-0001 | [Domain, URL, origin ve tenant host standardı](adr/ADR-0001-PROFESYONEL-SAAS-DOMAIN-URL-ORIGIN-VE-TENANT-HOST-STANDARDI.md) | `APPROVED` | Domain/origin kararı; canlı DNS/TLS kanıtı değildir |
| ADR-0002 | [Platform–tenant veri sınırı](adr/ADR-0002-PLATFORM-TENANT-VERI-SINIRI-VE-ERISIM-STANDARDI.md) | `IMPLEMENTED_PENDING_VERIFICATION` | Platform/tenant veri sınırı kararı |
| ADR-0003 | [Tenant yedek, WAL/PITR ve restore doğrulama](adr/ADR-0003-TENANT-YEDEK-WAL-PITR-VE-RESTORE-DOGRULAMA.md) | `IMPLEMENTED_PENDING_VERIFICATION` | Yedek/restore kararı; canlı PITR bekliyor |

## Durum sözlüğü

| Durum | Anlam |
|---|---|
| `DRAFT` | Taslak; bağlayıcı değil |
| `REVIEW` | İncelemede; henüz kabul edilmedi |
| `APPROVED` | Karar olarak kabul edildi; kodlandığı anlamına gelmez |
| `IMPLEMENTING` | Kapsamın bir bölümü uygulanıyor |
| `IMPLEMENTED_PENDING_VERIFICATION` | Kod/migration var; bütün genel kabul kanıtları tamamlanmadı |
| `VERIFIED` | Belgenin açıkça belirttiği commit ve doğrulama kapsamı kanıtlandı |
| `SUPERSEDED` | Yerine geçen kaynak gösterilerek geçersiz kılındı |
| `ARCHIVED` | Yalnız tarihsel kayıt |

## Kanıt sınırı

Son doğrulanmış kod referansı `74915b6f3f1f8d53116b760b6a6be9797111efa5` commitidir. Bu commit için [TilbeCore CI koşusu](https://github.com/tilbehome/kurban2026/actions/runs/31571606803) başarılıdır. Başarılı CI; canlı deployment, fiziksel cihaz kabulü, production restore, gerçek müşteri verisi veya genel Kurban Günü provası kanıtı değildir.

Arşivdeki belgeler güncel karar kaynağı değildir. Bir arşiv belgesi yalnız aktif bir belgede açıkça tarihsel kanıt olarak bağlandığında kullanılır.
