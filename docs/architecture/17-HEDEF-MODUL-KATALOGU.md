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

Bu katalog fiziksel klasör veya tamamlanmış özellik beyanı değildir. Hedef modülleri `MOD-001..MOD-020` kimlikleriyle tekilleştirir. Mevcut legacy statik loader yalnız `_core`, `musteriler`, `hayvanlar`, `tahsilat`, `kasa` ve `raporlar` olmak üzere altı gerçek modül kaydeder; `_example` çalışma zamanı registry kaydı değildir. Placeholder sayfa modül veya tamamlanmış özellik sayılmaz.

## Sorumluluk, durum ve veri sahipliği

| ID | Modül / sorumluluk | Mevcut gerçek durum | Eksik | Bağımlılık ve veri sahibi |
|---|---|---|---|---|
| MOD-001 | Platform Control Plane: firma, plan, lisans, entitlement | `IMPLEMENTED_UNVERIFIED`; Platform DB/admin yüzeyleri var | Canlı kabul ve ticari faturalama | Platform DB sahibi; MOD-002/003 |
| MOD-002 | Provisioning ve firma yaşam döngüsü | `IMPLEMENTED_UNVERIFIED`; iş/CLI/worker `--once` var | Sürekli orchestration, export executor, production restore | Platform DB metadata; tenant DB yaratımı MOD-003/004 |
| MOD-003 | IAM, cihaz, oturum ve SupportSession | Platform bölümü `IMPLEMENTED_UNVERIFIED`, tenant IAM `PLANNED` | Firma IAM, gerçek cihaz/passkey kabulü | Platform ve tenant kimlik alanları ayrı veri sahibi |
| MOD-004 | Firma Ayarlar Merkezi ve marka | Legacy `Ayar`/`ModulDurum` `IMPLEMENTING` | Tipli namespace, sürüm, policy, audit, migration | Firma DB sahibi; entitlement MOD-001 |
| MOD-005 | Sezon ve tesis | Tenant sözleşmesi `IMPLEMENTED_UNVERIFIED`, runtime/UI `PLANNED` | Durum makinesi, sezon kapanışı, tesis | Firma DB; MOD-006..020 sezon bağımlısı |
| MOD-006 | Müşteri ve sezon carisi | Legacy + tenant sözleşmesi `IMPLEMENTING` | Sezonlu cari, privacy, Müşteri 360 | Firma DB; ledger MOD-010 |
| MOD-007 | Tedarikçi, alış ve gider | Legacy kısmi, hedef `PLANNED` | Fatura, maliyet dağıtımı, tedarikçi cari | Firma DB; hayvan MOD-008, ledger MOD-010 |
| MOD-008 | Hayvan, sağlık, padok ve tartım geçmişi | Legacy + tenant sözleşmesi `IMPLEMENTING` | Tam uygunluk/tarihçe ve Hayvan 360 | Firma DB; MOD-007/009/013 |
| MOD-009 | Hisse, rezervasyon, satış, transfer | Teknik çekirdek var; hedef iş kuralı `IMPLEMENTING` | Pozitif kapora şartı, süre sonu, işletme envanteri, transfer | Firma DB; müşteri MOD-006, ledger MOD-010 |
| MOD-010 | Finans ledger, tahsilat ve mutabakat | Tenant sözleşmesi `IMPLEMENTED_UNVERIFIED`; legacy tek kaynak değil | Runtime taşıması, PG invariant ve mutabakat | Ledger sahibi; MOD-006/009/011/015 |
| MOD-011 | Kasa, banka ve POS | Legacy `IMPLEMENTING` | Kasa oturumu, settlement, Kasa 360 | Ledger MOD-010; firma DB |
| MOD-012 | Vekâlet, belge, QR ve korumalı depolama | Sözleşme/migration + legacy dosya koruması `IMPLEMENTING` | Uçtan uca tenant runtime ve belge kabulü | Firma DB/storage; MOD-009/013/015 |
| MOD-013 | Kesim operasyon motoru | Sözleşme/migration `IMPLEMENTED_UNVERIFIED`; legacy ekran kısmi | Runtime istasyonları, önkoşul/istisna | MOD-008/009/012; firma DB |
| MOD-014 | Tartım, parçalama ve paketleme | Sözleşme/migration `IMPLEMENTED_UNVERIFIED` | Cihaz adapteri, değer/miktar dengesi | MOD-013; firma DB |
| MOD-015 | Soğuk oda, yükleme ve teslimat | Teslim sözleşmesi var; genel akış `IMPLEMENTING` | Soğuk oda, rota, tek teslim E2E | MOD-014/010/012; firma DB |
| MOD-016 | Saha PWA, offline kuyruk ve sync | Cache/sözleşme kısmi `IMPLEMENTING` | IndexedDB runtime, conflict UX, cihaz kabulü | MOD-003 ve görev modülleri; cihaz yerel verisi |
| MOD-017 | Public display ve müşteri takip | Legacy TV/takip `IMPLEMENTING` | PII-minimize read model ve hedef app ayrımı | MOD-013/015; salt-okunur projection |
| MOD-018 | Bildirim ve güvenli entegrasyon merkezi | Legacy WhatsApp kısmi; hedef `PLANNED` | Outbox/webhook, secret, retry ve sağlayıcılar | Olay sahibi domainler; secret store |
| MOD-019 | Raporlama, arama ve 360 çalışma alanları | Legacy/operations sözleşmesi `IMPLEMENTING` | Mutabık read model; Firma/Müşteri/Hayvan/Hisse/Kasa 360 | Kaynak domainler; kendi kopyası karar kaynağı değil |
| MOD-020 | Audit, gözlemlenebilirlik, süreklilik ve release | Sözleşmeler/CLI kısmi `IMPLEMENTED_UNVERIFIED` | OTel runtime, alarm, WAL/PITR, prova/release kanıtı | Platform+firma audit ayrımı; tüm modüller |

## Yetki, yüzey, offline sınıfı ve kabul

Offline sınıfları: `O0` çevrimdışı yazı yok, `O1` salt-okunur cache, `O2` idempotent ve uzlaştırılabilir kuyruk, `O3` kritik işlem yalnız doğrulanmış server commit.

| ID | Temel yetki ailesi | Ekran / API / event yüzeyi | Offline | Asgari kabul ölçütü |
|---|---|---|---|---|
| MOD-001 | `platform.organization/license/module.*` | Console 360, plan/lisans API, entitlement event | O0 | Firma verisi okunmadan lisans ve entitlement tutarlı |
| MOD-002 | `platform.provisioning/lifecycle.*` | Provisioning/ops iş merkezi, worker event | O0 | İdempotent resume/rollback ve iki firma izolasyonu |
| MOD-003 | `platform.auth.*`, `tenant.iam.*` | Giriş, kullanıcı/rol, session/device, SupportSession | O0/O1 | Ayrı cookie/kimlik, süreli destek, negatif yetki |
| MOD-004 | `settings.*`, `branding.*` | Firma Ayarlar Merkezi, settings API/event | O1 | Namespace şemalı, sürümlü, yetkili, auditli ve migrate edilebilir |
| MOD-005 | `season/facility.*` | Sezon/tesis 360, lifecycle event | O1 | Geçersiz sezon geçişi ve çapraz sezon yazısı reddedilir |
| MOD-006 | `customer/current.*` | Müşteri 360, arama/cari API, customer event | O1/O3 | Ortak telefon engellenmez; sezon bakiyesi karışmaz |
| MOD-007 | `supplier/purchase/expense.*` | Tedarik/fatura ekranı/API/event | O1/O3 | Fatura–hayvan–borç atomik ve maliyet mutabık |
| MOD-008 | `animal/health/weighing.*` | Hayvan 360, kabul/sağlık/tartım API/event | O1/O2 | Küpe tekil; uygunsuz hayvan satılamaz |
| MOD-009 | `share/reservation/sale/transfer.*` | Hisse 360, satış API, expiry/sale event | O1/O3 | Yedi hisse; sıfır kapora satış yok; yarışta tek kazanan |
| MOD-010 | `ledger/receipt/refund.*` | Cari/tahsilat/ledger API/event | O1/O3 | Borç=alacak, replay tek kayıt, reversal bağlantılı |
| MOD-011 | `cash/bank/pos.*` | Kasa 360, oturum/sayım/settlement API | O1/O3 | Fiziksel sayım ve ledger sıfır açıklanamayan fark |
| MOD-012 | `proxy/document/qr.*` | Vekâlet, belge, dosya API, QR event | O1/O3 | Yetkisiz dosya yok; token tek kullanım/sürüm |
| MOD-013 | `slaughter.*` | Komuta merkezi/istasyon API/state event | O1/O3 | Önkoşulsuz veya atlamalı geçiş reddedilir |
| MOD-014 | `weighing/packaging.*` | Tartım/paket istasyonu, cihaz portu/event | O1/O2 | Kaynak tartım ile yedi paket mutabık |
| MOD-015 | `coldchain/loading/delivery.*` | Teslim 360/PWA, delivery event | O1/O3 | Hisse bir kez teslim; reversal auditli |
| MOD-016 | `offline/device.*` | PWA shell, sync/conflict API/event | O1/O2 | Kuyruk/çatışma açık; O3 işlem offline başarılı görünmez |
| MOD-017 | `display/tracking.read` | TV ve tokenlı takip projection/API | O1 | PII/finans sızmaz; token kapsamlı ve süreli |
| MOD-018 | `notification/integration.*` | Entegrasyon merkezi, webhook/outbox event | O2 | İmza, retry, rate limit, idempotency ve redaction |
| MOD-019 | `report/search/360.read` | Firma ve dört domain 360, rapor/arama API | O1 | KPI kaynağı/tazeliği belli ve ledger ile mutabık |
| MOD-020 | `audit/ops/release.*` | Audit, telemetry, backup/restore, release gate | O1 | Tenant ayrımı, secret redaction, restore/prova EVD |

## Registry ve runtime aktivasyonu

Platform entitlement bir modülü ticari olarak yetkilendirir; tenant runtime aktivasyonu ise migration, sürüm, dependency, permission, ayar, health ve feature durumunu doğrular. Bu iki uç bugün tam bağlı değildir ve `TDB-003` olarak açıktır. Menü görünürlüğü yalnız statik kayda veya entitlement’a dayanamaz; runtime hazır olmayan ya da placeholder yüzey canlı menüde gösterilmez.

Firma Ayarlar Merkezi için hedef anahtar biçimi `namespace.key`, şema sürümü, varsayılan, hassasiyet sınıfı, okuyabilen/yazabilen izin, audit, optimistic concurrency ve migration fonksiyonudur. Serbest metin/JSON ayarı domain kararını sessizce değiştiremez.

Firma 360 bu katalogdaki MOD-001/002/004/005/020 durumlarını; Müşteri, Hayvan, Hisse ve Kasa 360 sözleşmeleri [UX-003](../ux/UX-003-360-SAYFA-SOZLESMELERI.md) kurallarını kullanır.
