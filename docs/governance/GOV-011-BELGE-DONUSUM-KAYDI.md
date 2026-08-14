# Profesyonel Belge Paketi Dönüşüm Kaydı

```yaml
id: GOV-011
status: VERIFIED
owner: Architecture-and-Documentation
source_role: documentation_transformation_register
source_of_truth: true
last_reviewed: 2026-08-14
verified_against_commit: 885b55e2cc027cb7782e625d84c1073b74107e8c
```

## Dönüşüm kararı

`TILBECORE-PROFESYONEL-BELGE-PAKETI` içindeki 15 Markdown dosyası salt okunur taslak kaynak olarak içerik ve SHA-256 düzeyinde incelendi. Paket doğrudan kopyalanmadı; güncel kod, migration, test ve doğrulanmış kararlarla çelişmeyen içerik doğru uzmanlık belgesine işlendi. Kaynak paket değiştirilmedi.

Yeni nesil `YN-00–YN-26` yol haritası bu entegrasyonda bağlayıcı uygulama planına dönüştürülmedi. Mevcut Faz 1–12 yol haritası tamamlanmadan YN dönemine başlanmayacağı kararı korunur.

## Kaynak–hedef matrisi

| Kaynak paket belgesi | Repo hedefi | Karar |
|---|---|---|
| `00-README-VE-BELGE-INDEKSI.md` | [GOV-002](../README.md), [GOV-012](GOV-012-MARKDOWN-ENVANTERI-VE-TASNIF.md) | İndeks ve sınıflandırma ilkeleri işlendi |
| `01-MEVCUT-BELGELER-DONUSUM-MATRISI.md` | GOV-011, GOV-012 | Dönüşüm, saklama ve silmeme kapıları işlendi |
| `02-URUN-VIZYONU-KAPSAM-VE-BASARI.md` | [PRD-001](../product/PRD-001-URUN-VIZYONU-KAPSAM-VE-BASARI.md) | Hedef ile mevcut durum ayrıldı |
| `03-KULLANICI-ROLLER-LISANS-VE-KURULUM.md` | [PRD-005](../product/PRD-005-FIRMA-LISANS-VE-SEZON-YASAM-DONGUSU.md), [PER-001](../personas/PER-001-ROL-BAZLI-PERSONALAR.md) | Yaşam döngüsü ve rol hedefleri kanıt sınırıyla işlendi |
| `04-UCDAN-UCA-KURBAN-OPERASYON-MODELI.md` | [WFL-001](../workflows/WFL-001-UCDAN-UCA-KURBAN-OPERASYONU.md), WFL-003–009, DOM-003–012 | Uçtan uca akış ve iş kuralları uzmanlık belgelerine ayrıldı |
| `05-SISTEM-MIMARISI-DIZIN-VE-MODUL-STANDARDI.md` | ARC-001, ARC-002, ARC-013, ARC-015 | Mükerrer hedef yapı ana mimari kaynaklara bağlandı |
| `06-VERI-FINANS-VE-IZLENEBILIRLIK-STANDARDI.md` | ARC-003, ARC-006, ARC-009, DOM-008, TST-006 | Gerçek ve hedef ayrımı korunarak veri/ledger kapsamına işlendi |
| `07-GUVENLIK-GIZLILIK-VE-TENANT-IZOLASYONU.md` | SEC-001/003/005/006, PRV-001/004, ADR-0002 | Güvenlik, gizlilik ve SupportSession sorumluluklarına ayrıldı |
| `08-UX-360-PWA-OFFLINE-VE-CIHAZ-STANDARDI.md` | UX-003/004/008, A11Y-001, I18N-001 | UX, PWA/offline, cihaz, erişilebilirlik ve dil hedeflerine ayrıldı |
| `09-TEST-KALITE-KABUL-VE-KANIT-PLANI.md` | [TST-001](../testing/TST-001-MASTER-TEST-PLANI.md), TST-004/005/006/008/010/011, `docs/evidence` | Ana test planı tekilleştirildi; test varlığı ile çalıştırılmış kanıt ayrıldı |
| `10-ALTYAPI-CANLI-ISLETIM-YEDEK-VE-DR.md` | INF-001/006, OPS-001/002/007/008, OPS-003/009 ve runbook’lar | Canlı işletim, gözlemlenebilirlik, yedek/restore ve DR hedeflerine ayrıldı |
| `11-RELEASE-EGITIM-DESTEK-VE-SEZON-KAPANISI.md` | REL-004/005, SUP-002, TRN-006, OPS-016 | Release, eğitim, destek ve kapanış kabul kapıları ayrıştırıldı |
| `12-BELGE-YONETISIMI-VE-CODEX-UYGULAMA-TALIMATI.md` | GOV-001/002/003/011/012 ve `AGENTS.md` | Repo belge standardı ve ajan yönlendirmesi işlendi |
| `TILBECORE-KURBAN-OS-TEK-BAGLAYICI-YENI-NESIL-YOL-HARITASI.md` | Mevcut RMP-001 sonrası plan kaynağı | YN dönemi etkinleştirilmedi; `PLANNED` kaynak olarak tutuldu |
| `TILBECORE-PROFESYONEL-DOKUMANTASYON-SISTEMI-ANA-PLANI.md` | GOV-001/002/003/011/012 | Profesyonel belge sistemi ve kalite kapıları işlendi |

## Kaynak bütünlüğü kaydı

| Kaynak | SHA-256 |
|---|---|
| `00-README-VE-BELGE-INDEKSI.md` | `8392E2F7907511FD00AA3AB63C22B5E07D6544A7323E4BE57835E0A5D0DEB58F` |
| `01-MEVCUT-BELGELER-DONUSUM-MATRISI.md` | `879B8186F99B886B6018E574F07E5E4E7D5C02B44CEF78189A2B529601E6458A` |
| `02-URUN-VIZYONU-KAPSAM-VE-BASARI.md` | `8AB0FFC6CEF2F62979D2E6B2183BCD618964226AD4BDB75B9E0DB5F685FBDA49` |
| `03-KULLANICI-ROLLER-LISANS-VE-KURULUM.md` | `3A7DCF26C89929F40385F0CF8AB2B443AF260931223EA17C9D6BC01A14B99F93` |
| `04-UCDAN-UCA-KURBAN-OPERASYON-MODELI.md` | `2329740A485D850B0E522079A783797CFBD44CC46241B737BBFFCC545CF6F77A` |
| `05-SISTEM-MIMARISI-DIZIN-VE-MODUL-STANDARDI.md` | `DB21E65890A971364869C73FEF89669E7406C8054AB51DDDC47522D98241DDDE` |
| `06-VERI-FINANS-VE-IZLENEBILIRLIK-STANDARDI.md` | `59D3C2712C3672DB2F20E2FC84DD46387256F7F93B1EC62F973F4B7EAD2119F9` |
| `07-GUVENLIK-GIZLILIK-VE-TENANT-IZOLASYONU.md` | `CB91718E774668501A77E1ED0B9E9BC866C45BD626E41D4FAB900D83E9289CD1` |
| `08-UX-360-PWA-OFFLINE-VE-CIHAZ-STANDARDI.md` | `2AE6E1630E61EBACC06C97C1720D29CED459AB5F1A09820D1193F4B68D5CEB79` |
| `09-TEST-KALITE-KABUL-VE-KANIT-PLANI.md` | `9D00054C077A91ACC0D10EEF0E062B8F80955C419FB2EC5C73424A8D1A04A498` |
| `10-ALTYAPI-CANLI-ISLETIM-YEDEK-VE-DR.md` | `DD1E5F5D19BCFC62A740E094E9EAF7BF42B15FBB9B32E8EA9614CC700517F35D` |
| `11-RELEASE-EGITIM-DESTEK-VE-SEZON-KAPANISI.md` | `4053F3BD9117348292A6CD1BB9ACC3FCF38AB63FBE6536F6788A8F83CF1C8AE6` |
| `12-BELGE-YONETISIMI-VE-CODEX-UYGULAMA-TALIMATI.md` | `7BCCF4DD051835302B9056DB328ED74D63BFA16EF3F26CB1A7E619A14342F1FC` |
| `TILBECORE-KURBAN-OS-TEK-BAGLAYICI-YENI-NESIL-YOL-HARITASI.md` | `6F5EDB31138316FCF6E46488034D952D3FC3DBCFCDE2C803D84414971C99E14A` |
| `TILBECORE-PROFESYONEL-DOKUMANTASYON-SISTEMI-ANA-PLANI.md` | `E73497F589ED8EC8FC9740271038C4BAE8937951C5C069403122E8ABAC346256` |

## 14 Ağustos 2026 EVO kök kaynağı entegrasyonu

Kullanıcının hazırladığı kök `TILBECORE-EVO-KURUMSAL-GUVENLIK-OLCEK-VE-EKOSISTEM-YOL-HARITASI.md` dosyası, aşağıdaki bütünlük kaydıyla [EVO-ROADMAP-001](../architecture/EVO-ROADMAP-001-KURUMSAL-GUVENLIK-OLCEK-VE-EKOSISTEM-YOL-HARITASI.md) kalıcı belgesine alınmıştır. Kaynağın özgün maddeleri silinmemiş veya yeniden yorumlanarak değiştirilmemiş; yönetişim metadata alanları, mevcut repo kanıtı ayrımı ve Teknoloji Radarı eklenmiştir.

| Kaynak | Boyut | Önceki SHA-256 | Kalıcı hedef | Karar |
|---|---:|---|---|---|
| `TILBECORE-EVO-KURUMSAL-GUVENLIK-OLCEK-VE-EKOSISTEM-YOL-HARITASI.md` | 31.986 bayt | `07ECCD988F9A4A3C8CEBE905CF8B88C1430AC923132FE8DB3B239CA468434C99` | `docs/architecture/EVO-ROADMAP-001-KURUMSAL-GUVENLIK-OLCEK-VE-EKOSISTEM-YOL-HARITASI.md` | İçerik korundu; `PLANNED / NOT_ACTIVE` olarak yönetime alındı; kök mükerrer kopya kaldırıldı |

- Taksonomi kararı: Aktif Faz 1–12 yol haritası ve gelecekteki program kapıları zaten `docs/architecture` altında yönetildiği için yeni `docs/roadmaps` kategorisi açılmadı.
- Öncelik kararı: EVO, RMP-001 veya YN kaynağının yerine geçmez ve bunların sırasını değiştirmez.
- Aktivasyon bağımlılığı: **Mevcut Faz 2D–12 tamamlanmadan ve YN-00–YN-26 bitmeden uygulamaya alınmaz.**
- Kanıt sınırı: `885b55e2cc027cb7782e625d84c1073b74107e8c` yalnız entegrasyon sırasında incelenen gerçek repo fotoğrafıdır; EVO’nun uygulandığını veya production kabulünü kanıtlamaz.

## Koruma, red ve kanıt sınırı

- Mevcut belge yalnız adına veya benzer başlığa bakılarak silinmedi.
- Kaynaktaki taslak anlatım kodla çeliştiğinde `74915b6f3f1f8d53116b760b6a6be9797111efa5` kod/migration/test fotoğrafı üstün tutuldu.
- YN yol haritasının erken etkinleştirilmesi reddedildi.
- Fiziksel HTTPS passkey, Playwright/axe, gerçek cihaz, yük/soak, offline cihaz, WAL/PITR ve production restore hedefleri kaynakta bulunsa da çalıştırılmış kanıt olmadığı için `NOT_RUN` sınırında tutuldu.
- Eski architecture test planı silinmedi; [ARC-010](../architecture/10-TEST-KALITE-VE-KABUL-PLANI.md) uyumluluk belgesine dönüştürülerek [TST-001](../testing/TST-001-MASTER-TEST-PLANI.md) kaynağına bağlandı.

## 12 Ağustos 2026 hedef yeniden doğrulaması

- `02-URUN-VIZYONU-KAPSAM-VE-BASARI.md` SHA-256 kaydıyla eşleşen salt-okunur kaynakta “placeholder ekranlar tamamlanmış özellik sayılmaz ve canlı menüde görünmez” hedefi yeniden doğrulandı. Canlı menü bölümü daha önce görünür sonuç üretmediği için [PRD-001](../product/PRD-001-URUN-VIZYONU-KAPSAM-VE-BASARI.md) ve `REQ-065` içine `PLANNED` olarak aktarıldı.
- `03-KULLANICI-ROLLER-LISANS-VE-KURULUM.md` SHA-256 kaydıyla eşleşen salt-okunur kaynakta firma kurulum sihirbazının kullanıcı adımı için “en az bir yedek admin var” çıkış koşulu yeniden doğrulandı. Hedef [PRD-005](../product/PRD-005-FIRMA-LISANS-VE-SEZON-YASAM-DONGUSU.md), `PRO-012` ve IAM kabul ölçütlerine `PLANNED` olarak aktarıldı.
- İki hedef de reddedilmedi ve uygulanmış gösterilmedi; kaynak paket değiştirilmedi.
