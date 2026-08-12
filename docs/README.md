# TilbeCore – Kurban Takip Belge Ana İndeksi

```yaml
id: GOV-002
status: VERIFIED
owner: Product-and-Architecture
source_role: canonical_document_index
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

Bu dosya aktif belge sisteminin tek giriş noktasıdır. Bir belgenin listelenmesi, içindeki hedeflerin kodlandığı veya kabul testlerinin çalıştırıldığı anlamına gelmez. Gerçek durum; belge durumu, kaynak kod/migration/test kanıtı ve doğrulanan commit birlikte okunarak belirlenir.

## Öncelikli okuma sırası

1. [Dokümantasyon politikası](governance/GOV-001-DOKUMANTASYON-POLITIKASI.md)
2. [Kaynak önceliği ve kanıt standardı](governance/GOV-003-KAYNAK-ONCELIGI-VE-KANIT-STANDARDI.md)
3. [Markdown envanteri ve tasnif kararları](governance/GOV-012-MARKDOWN-ENVANTERI-VE-TASNIF.md)
4. [Ürün vizyonu, kapsam ve başarı](product/PRD-001-URUN-VIZYONU-KAPSAM-VE-BASARI.md)
5. [Birleşik ana mimari ve Faz 1–12 yol haritası](architecture/TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md)
6. [Mevcut durum analizi](architecture/00-MEVCUT-DURUM-ANALIZI.md)
7. [Gereksinim izlenebilirlik matrisi](architecture/11-GEREKSINIM-IZLENEBILIRLIK-MATRISI.md)
8. [Yeni bağlayıcı ana test planı](testing/TST-001-MASTER-TEST-PLANI.md)
9. [Uygulama takip defteri](architecture/KURBAN2026-UYGULAMA-TAKIP.md)

Eski test planı yolu [ARC-010 uyumluluk yönlendirmesi](architecture/10-TEST-KALITE-VE-KABUL-PLANI.md) olarak korunur; test ve kabul konusunda kaynak gerçek `docs/testing/TST-001-MASTER-TEST-PLANI.md` belgesidir.

## Belge sistemi

Eksiksiz dosya bazlı liste, metadata, sahiplik, güncellik, aynı konu kaynağı ve tasnif kararı [GOV-012 Markdown envanterinde](governance/GOV-012-MARKDOWN-ENVANTERI-VE-TASNIF.md) bulunur.

| Alan | Dizin | Ana kaynak / erişim |
|---|---|---|
| Kök yönetişim | repo kökü | [AGENTS.md](../AGENTS.md), [README.md](../README.md) |
| Mimari ve izlenebilirlik | `docs/architecture` | [RMP-001](architecture/TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md), [REQ-003](architecture/11-GEREKSINIM-IZLENEBILIRLIK-MATRISI.md), [TRK-001](architecture/KURBAN2026-UYGULAMA-TAKIP.md), [ARC-017](architecture/17-HEDEF-MODUL-KATALOGU.md), [EXT-001](architecture/18-GUVENLI-EKLENTI-OMURGASI.md) |
| Mimari kararlar | `docs/adr` | [ADR-0001](adr/ADR-0001-PROFESYONEL-SAAS-DOMAIN-URL-ORIGIN-VE-TENANT-HOST-STANDARDI.md), [ADR-0002](adr/ADR-0002-PLATFORM-TENANT-VERI-SINIRI-VE-ERISIM-STANDARDI.md), [ADR-0003](adr/ADR-0003-TENANT-YEDEK-WAL-PITR-VE-RESTORE-DOGRULAMA.md) |
| Yönetişim | `docs/governance` | [GOV-001](governance/GOV-001-DOKUMANTASYON-POLITIKASI.md), [GOV-003](governance/GOV-003-KAYNAK-ONCELIGI-VE-KANIT-STANDARDI.md), [GOV-011](governance/GOV-011-BELGE-DONUSUM-KAYDI.md), [GOV-012](governance/GOV-012-MARKDOWN-ENVANTERI-VE-TASNIF.md), [GOV-013](governance/GOV-013-TESLIM-IZLENEBILIRLIK-VE-GITHUB-HEDEFI.md), [GOV-014](governance/GOV-014-TEKNIK-BORC-VE-ACIK-KARAR-KAYDI.md), [GOV-015](governance/GOV-015-COKLU-AJAN-WORKTREE-VE-DEVIR-PROTOKOLU.md) |
| Ürün | `docs/product` | [PRD-001](product/PRD-001-URUN-VIZYONU-KAPSAM-VE-BASARI.md), [PRD-005](product/PRD-005-FIRMA-LISANS-VE-SEZON-YASAM-DONGUSU.md) |
| Domain ve iş akışı | `docs/domains`, `docs/workflows` | [DOM-007](domains/DOM-007-HISSE-SATIS-TRANSFER-VE-IPTAL.md), [WFL-001](workflows/WFL-001-UCDAN-UCA-KURBAN-OPERASYONU.md); diğerlerinin tamamı GOV-012’de |
| Persona, UX, erişilebilirlik ve dil | `docs/personas`, `docs/ux`, `docs/accessibility`, `docs/i18n` | [PER-001](personas/PER-001-ROL-BAZLI-PERSONALAR.md), [A11Y-001](accessibility/A11Y-001-WCAG-22-AA-KABUL-PLANI.md), [I18N-001](i18n/I18N-001-TR-EN-AR-VE-RTL.md) |
| Güvenlik ve gizlilik | `docs/security`, `docs/privacy` | [SEC-001](security/SEC-001-GUVENLIK-MIMARISI-VE-TEHDIT-MODELI.md), [PRV-001](privacy/PRV-001-KVKK-VE-GIZLILIK-TASARIMI.md) |
| Test ve kanıt | `docs/testing`, `docs/evidence` | [TST-001](testing/TST-001-MASTER-TEST-PLANI.md), [kanıt şablonları](evidence/README.md) |
| Altyapı ve işletim | `docs/infrastructure`, `docs/operations`, `docs/reliability`, `docs/runbooks` | [INF-001](infrastructure/INF-001-ORTAM-DEPLOYMENT-VE-YAPILANDIRMA.md), [OPS-001](operations/OPS-001-CANLI-ISLETIM-EL-KITABI.md), [runbook dizini GOV-012’de](governance/GOV-012-MARKDOWN-ENVANTERI-VE-TASNIF.md) |
| Release, eğitim ve destek | `docs/releases`, `docs/training` | [REL-004](releases/REL-004-RELEASE-GO-NO-GO-VE-ROLLOUT.md), [TRN-006](training/TRN-006-ROL-BAZLI-EGITIM-VE-PROVA.md), [SUP-002](training/SUP-002-DESTEK-VE-SUPPORTSESSION-PROSEDURU.md) |
| Tarihsel kayıt | `docs/archive` | Yalnız [GOV-012 envanterindeki](governance/GOV-012-MARKDOWN-ENVANTERI-VE-TASNIF.md) `ARCHIVED` kayıtlar; aktif karar kaynağı değildir |

## Bağlayıcı iş kuralı düzeltmeleri

- Kaporasız kayıt kesin satış veya alacak değildir.
- Her pozitif tahsilat kaporadır.
- Bir büyükbaş hayvan tam yedi hissedir.
- Satılmamış hisse işletme envanteridir; sahte müşteri, sahte vekâlet, gelir veya alacak üretilmez.
- Dinî uygunluk hakkında kaynaklarda çözülmemiş konu kesin hüküm gibi yazılmaz.

Bu özet ayrıntılı domain kurallarının yerine geçmez; bağlayıcı ayrıntılar [DOM-007](domains/DOM-007-HISSE-SATIS-TRANSFER-VE-IPTAL.md), [DOM-008](domains/DOM-008-TAHSILAT-KASA-VE-MUTABAKAT.md) ve ilgili iş akışı belgelerindedir.

## Durum standardı

| Durum | Anlam |
|---|---|
| `VERIFIED` | Belgede belirtilen kapsam, commit ve kanıt gerçekten doğrulandı |
| `IMPLEMENTED_UNVERIFIED` | Kod veya migration mevcut; bütün kabul/genel doğrulama kanıtı eksik |
| `IMPLEMENTING` | Kapsamın yalnız bir bölümü uygulanmış |
| `PLANNED` | Henüz uygulanmamış hedef veya kabul edilmiş karar |
| `NOT_RUN` | İlgili test veya kanıt çalıştırılmamış |
| `SUPERSEDED` | Daha yeni bağlayıcı belgeyle değiştirilmiş |
| `ARCHIVED` | Yalnız tarihsel kayıt |

## Kanıt sınırı ve çalıştırılmamış kabuller

Son doğrulanmış kod referansı `74915b6f3f1f8d53116b760b6a6be9797111efa5` commitidir. [CI koşusu 31571606803](https://github.com/tilbehome/kurban2026/actions/runs/31571606803) yalnız koşuda gerçekten yer alan kontroller için kanıttır.

Aşağıdakiler bu entegrasyonda `NOT_RUN` durumundadır ve doğrulanmış gösterilemez:

- fiziksel HTTPS ortamında passkey/WebAuthn kabulü;
- Playwright ve axe uçtan uca kabul paketi;
- gerçek fiziksel cihaz kabulü;
- yük/soak ve çevrimdışı cihaz senaryoları;
- yönetilen PostgreSQL WAL/PITR denemesi;
- production restore ve genel Kurban Günü provası.

Arşiv belgeleri güncel karar kaynağı değildir. Bir arşiv belgesi ancak aktif belgede açıkça tarihsel kanıt olarak bağlandığında kullanılabilir.
