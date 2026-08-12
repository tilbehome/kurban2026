# 17 — Hedef Modül Kataloğu

```yaml
id: ARC-017
status: PLANNED
owner: Product-and-Architecture
source_role: target_module_catalog
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

Bu katalog fiziksel klasör veya tamamlanmış özellik beyanı değildir. Hedef firma ürün modüllerini `MOD-001..MOD-020` kimlikleriyle tekilleştirir. Mevcut legacy statik loader yalnız `_core`, `musteriler`, `hayvanlar`, `tahsilat`, `kasa` ve `raporlar` olmak üzere altı gerçek modül kaydeder; `_example` çalışma zamanı registry kaydı değildir. Placeholder sayfa modül veya tamamlanmış özellik sayılmaz.

## Platform mimarisi ve modül kimliği sınırı

Platform Control Plane, provisioning ve platform IAM ürünün mevcut mimari kapasitesidir; firma modül kataloğundaki `MOD-*` kimliklerini yeniden kullanmaz. Bağlayıcı kapsam ve kanıt aşağıdaki belgelerde korunur:

| Platform kapasitesi | Bağlayıcı kapsam / kanıt | Firma modülleriyle ilişki |
|---|---|---|
| Platform Control Plane; firma, plan, lisans ve entitlement | [ARC-003](03-COKLU-FIRMA-VE-VERITABANI-MIMARISI.md), [ARC-004](04-PLATFORM-SUPER-ADMIN-VE-FIRMA-ADMIN.md), [ARC-016](16-FAZ-2B-DOGRULANMIS-DURUM-VE-KAPSAM-SINIRI.md) | Firma modüllerinin ticari yetkilendirmesini sağlar; onların veri sahibi değildir. |
| Provisioning ve firma yaşam döngüsü | [ARC-003](03-COKLU-FIRMA-VE-VERITABANI-MIMARISI.md), [ARC-009](09-VERI-GOCU-YEDEK-VE-GUNCELLEME.md), [ARC-016](16-FAZ-2B-DOGRULANMIS-DURUM-VE-KAPSAM-SINIRI.md) | Firma DB yaratımı, migration ve yaşam döngüsü kapılarını yürütür. |
| Platform IAM, cihaz, oturum ve `SupportSession` | [ARC-004](04-PLATFORM-SUPER-ADMIN-VE-FIRMA-ADMIN.md), [ARC-005](05-KIMLIK-YETKI-VE-DESTEK-ERISIMI.md), [SEC-003](../security/SEC-003-IAM-MFA-PASSKEY-VE-RECOVERY.md) | `MOD-003` firma IAM’inden ayrı kimlik, cookie, yetki ve audit alanıdır. |

## Sorumluluk, durum ve veri sahipliği

| ID | Modül / sorumluluk | Mevcut gerçek durum | Eksik | Bağımlılık ve veri sahibi |
|---|---|---|---|---|
| MOD-001 | Firma Ayarlar Merkezi | Legacy `Ayar`/`ModulDurum` `IMPLEMENTING` | Tipli namespace, sürüm, policy, audit, migration ve marka ayrımı | Firma DB sahibi; platform entitlement ayrı kapasite |
| MOD-002 | Firma, tesis ve sezon | Tenant sözleşmesi `IMPLEMENTED_UNVERIFIED`, runtime/UI `PLANNED` | Durum makinesi, sezon kapanışı ve tesis yönetimi | Firma DB; MOD-004..020 sezon bağımlısı |
| MOD-003 | Firma kullanıcı, rol ve yetki | Firma IAM `PLANNED`; platform IAM ayrı kapasite olarak mevcut | Firma kullanıcı/rol/izin, cihaz ve oturum kabulü | Firma kimlik alanı; platform IAM’den kesin ayrılır |
| MOD-004 | Müşteri ve sezon carisi | Legacy + tenant sözleşmesi `IMPLEMENTING` | Sezonlu cari, privacy ve Müşteri 360 | Firma DB; ledger MOD-008 |
| MOD-005 | Tedarikçi ve satın alma | Legacy kısmi, hedef `PLANNED` | Fatura, maliyet dağıtımı ve tedarikçi carisi | Firma DB; MOD-006/008 |
| MOD-006 | Hayvan, sağlık ve padok | Legacy + tenant sözleşmesi `IMPLEMENTING` | Tam uygunluk, tartım tarihçesi ve Hayvan 360 | Firma DB; MOD-005/007/010 |
| MOD-007 | Hisse, rezervasyon, satış, transfer ve iptal | Teknik çekirdek var; hedef iş kuralı `IMPLEMENTING` | Pozitif kapora şartı, süre sonu, işletme envanteri, transfer ve iptal | Firma DB; MOD-004/006/008 |
| MOD-008 | Tahsilat, ledger, kasa ve mutabakat | Tenant ledger sözleşmesi `IMPLEMENTED_UNVERIFIED`; legacy tahsilat/kasa `IMPLEMENTING` | Runtime taşıması, PG invariant, kasa/POS settlement ve mutabakat | Finansal kayıt sahibi; MOD-004/005/007/012 |
| MOD-009 | Vekâlet, belge ve QR | Sözleşme/migration + legacy dosya koruması `IMPLEMENTING` | Uçtan uca tenant runtime, korumalı depolama ve belge kabulü | Firma DB/storage; MOD-007/010/012 |
| MOD-010 | Kapasite, kesim planlama ve kontrol merkezi | Kesim sözleşmesi/migration `IMPLEMENTED_UNVERIFIED`; legacy ekran kısmi | Kapasite, sıra, runtime istasyonları, önkoşul ve istisna | MOD-006/007/009/013; firma DB |
| MOD-011 | Parçalama, tartım ve paketleme | Sözleşme/migration `IMPLEMENTED_UNVERIFIED` | Üretim dengesi, tartım düzeltmesi ve paket kabulü | MOD-010/014; firma DB |
| MOD-012 | Soğuk oda, yükleme, lojistik ve teslimat | Teslim sözleşmesi var; genel akış `IMPLEMENTING` | Soğuk oda, rota, yükleme ve tek teslim E2E | MOD-008/009/011/014; firma DB |
| MOD-013 | Personel, vardiya ve görev | Hedef `PLANNED`; legacy personel yüzeyi kısmi | Vardiya, istasyon yetkisi, görev atama ve devir | MOD-003/010/011/012; firma DB |
| MOD-014 | Cihaz, yazıcı, terazi ve QR adaptörleri | Dağınık cihaz/çıktı kodu kısmi `IMPLEMENTING` | Adapter sınırı, cihaz kabulü, health ve kalibrasyon | MOD-003/009/011/012; cihaz portları |
| MOD-015 | İletişim ve güvenli entegrasyon merkezi | Legacy WhatsApp kısmi; hedef `PLANNED` | Outbox/webhook, secret, retry, sağlayıcı ve bildirim izinleri | Olay sahibi domainler; güvenli secret store |
| MOD-016 | İçe/dışa aktarma | Import/export parçaları kısmi `IMPLEMENTING` | Şema sürümü, dry-run, veri kalitesi, export executor ve geri alma | Kaynak domainler; provisioning ayrı platform kapasitesi |
| MOD-017 | Denetim, onay ve veri kalitesi | Audit/onay sözleşmeleri kısmi `IMPLEMENTED_UNVERIFIED` | Firma audit akışı, ikinci onay, tutarlılık bulgusu ve düzeltme | Tüm firma modülleri; platform auditinden ayrı |
| MOD-018 | Raporlama ve operasyon merkezi | Legacy raporlar + operations sözleşmesi `IMPLEMENTING` | Mutabık read model; Firma/Müşteri/Hayvan/Hisse/Kasa 360 ve arama | Kaynak domainler; kendi kopyası karar kaynağı değil |
| MOD-019 | Müşteri takip portalı | Legacy TV/takip `IMPLEMENTING` | PII-minimize read model, süreli token ve hedef uygulama ayrımı | MOD-009/010/012; salt-okunur projection |
| MOD-020 | Destek, eğitim ve Kurban Günü provası | Destek sözleşmesi kısmi `IMPLEMENTED_UNVERIFIED`; eğitim/prova `PLANNED` | Eğitim, sentetik demo, saha provası, release ve kabul EVD’si | Tüm modüller; platform SupportSession ayrı kapasite |

## Yetki, yüzey, offline sınıfı ve kabul

Offline sınıfları: `O0` çevrimdışı yazı yok, `O1` salt-okunur cache, `O2` idempotent ve uzlaştırılabilir kuyruk, `O3` kritik işlem yalnız doğrulanmış server commit.

| ID | Temel yetki ailesi | Ekran / API / event yüzeyi | Offline | Asgari kabul ölçütü |
|---|---|---|---|---|
| MOD-001 | `settings.*`, `branding.*` | Firma Ayarlar Merkezi, settings API/event | O1 | Namespace şemalı, sürümlü, yetkili, auditli ve migrate edilebilir |
| MOD-002 | `organization/facility/season.*` | Firma/tesis/sezon 360, lifecycle event | O1 | Geçersiz sezon geçişi ve çapraz sezon yazısı reddedilir |
| MOD-003 | `tenant.iam.*` | Firma girişi, kullanıcı/rol, session/device | O0/O1 | Platform kimliğinden ayrı cookie/kimlik ve negatif yetki |
| MOD-004 | `customer/current.*` | Müşteri 360, arama/cari API, customer event | O1/O3 | Ortak telefon engellenmez; sezon bakiyesi karışmaz |
| MOD-005 | `supplier/purchase.*` | Tedarik/fatura ekranı/API/event | O1/O3 | Fatura–hayvan–borç atomik ve maliyet mutabık |
| MOD-006 | `animal/health/paddock.*` | Hayvan 360, kabul/sağlık/padok API/event | O1/O2 | Küpe tekil; uygunsuz hayvan satılamaz |
| MOD-007 | `share/reservation/sale/transfer/cancel.*` | Hisse 360, satış/transfer/iptal API ve event | O1/O3 | Yedi hisse; sıfır kapora satış yok; yarışta tek kazanan |
| MOD-008 | `ledger/receipt/cash/reconciliation.*` | Cari, tahsilat, kasa/POS ve ledger API/event | O1/O3 | Borç=alacak, replay tek kayıt, reversal bağlantılı ve kasa mutabık |
| MOD-009 | `proxy/document/qr.*` | Vekâlet, belge, dosya API, QR event | O1/O3 | Yetkisiz dosya yok; token tek kullanım/sürüm |
| MOD-010 | `capacity/slaughter/control.*` | Komuta merkezi, plan/istasyon API ve state event | O1/O3 | Kapasite aşımı, önkoşulsuz veya atlamalı geçiş reddedilir |
| MOD-011 | `processing/weighing/packaging.*` | Parçalama, tartım/paket istasyonu ve event | O1/O2 | Kaynak tartım ile üretim/paket toplamı mutabık |
| MOD-012 | `coldchain/loading/logistics/delivery.*` | Teslim 360/PWA, yükleme ve delivery event | O1/O3 | Hisse bir kez teslim; reversal auditli |
| MOD-013 | `staff/shift/task.*` | Vardiya ve görev merkezi, station assignment event | O1/O2 | Yetkisiz istasyon görevi ve eksik vardiya devri reddedilir |
| MOD-014 | `device/printer/scale/qr.*` | Cihaz merkezi, adapter/health/calibration API | O1/O2 | Cihaz kimliği, kalibrasyon ve tekrar işleme denetlenir |
| MOD-015 | `communication/integration.*` | Entegrasyon merkezi, webhook/outbox event | O2 | İmza, retry, rate limit, idempotency ve redaction |
| MOD-016 | `import/export.*` | Dry-run, import/export işi ve sonuç raporu | O0/O3 | Şema/tenant/sezon doğrulanmadan veri yazılmaz; export yetkilidir |
| MOD-017 | `audit/approval/data-quality.*` | Denetim, onay ve bulgu/düzeltme merkezi | O1/O3 | Kritik işlem onayı ve düzeltme izi silinemez |
| MOD-018 | `report/search/operations.read` | Firma ve domain 360, rapor/arama API | O1 | KPI kaynağı/tazeliği belli ve ledger ile mutabık |
| MOD-019 | `customer-portal/tracking.read` | Tokenlı müşteri takip projection/API | O1 | PII/finans sızmaz; token kapsamlı ve süreli |
| MOD-020 | `support/training/rehearsal.*` | Eğitim/demo, prova, destek ve release kabul yüzeyi | O1 | Sentetik veri ayrımı ve restore/cihaz/prova EVD’si tamamlanır |

## Registry ve runtime aktivasyonu

Platform entitlement bir modülü ticari olarak yetkilendirir; tenant runtime aktivasyonu ise migration, sürüm, dependency, permission, ayar, health ve feature durumunu doğrular. Bu iki uç bugün tam bağlı değildir ve `TDB-003` olarak açıktır. Menü görünürlüğü yalnız statik kayda veya entitlement’a dayanamaz; runtime hazır olmayan ya da placeholder yüzey canlı menüde gösterilmez.

Firma Ayarlar Merkezi için hedef anahtar biçimi `namespace.key`, şema sürümü, varsayılan, hassasiyet sınıfı, okuyabilen/yazabilen izin, audit, optimistic concurrency ve migration fonksiyonudur. Serbest metin/JSON ayarı domain kararını sessizce değiştiremez.

Firma 360 bu katalogdaki MOD-001/002/003/017/018/020 durumlarını; Müşteri, Hayvan, Hisse ve Kasa 360 sözleşmeleri [UX-003](../ux/UX-003-360-SAYFA-SOZLESMELERI.md) kurallarını kullanır.
