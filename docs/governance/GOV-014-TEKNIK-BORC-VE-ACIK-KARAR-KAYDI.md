# Teknik Borç ve Açık Karar Kaydı

```yaml
id: GOV-014
status: IMPLEMENTING
owner: Product-and-Architecture
source_role: technical_debt_and_open_decision_register
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

Riskler [GOV-007](../architecture/12-FAZLAR-RISKLER-VE-GERI-DONUS.md), gerçekleşen uygulama durumu [TRK-001](../architecture/KURBAN2026-UYGULAMA-TAKIP.md) tarafından yönetilir. Bu kayıt yalnız teknik borç ve henüz kullanıcı/ADR kararı gerektiren konuların sahibidir.

## Kimlikli teknik borçlar

| ID | Durum | Borç | Etki | Kapanış kanıtı | Hedef |
|---|---|---|---|---|---|
| TDB-001 | OPEN | Legacy satış akışı sıfır kaporayla satış/alacak açabiliyor | Finans ve sahiplik hedefiyle çelişki | Sıfır kapora negatif PG testi; rezervasyon süre sonu ve ledger yokluğu | Faz 5–6 |
| TDB-002 | OPEN | Legacy tenant uygulaması kök `app/modules/shared/components/prisma` yapısına bağlı | Monorepo hedefi ve tenant runtime geçişi tamamlanamaz | DIR-001 kapanışı, import grafiği ve route smoke | Faz 2D–10 |
| TDB-003 | OPEN | Statik loader yalnız altı gerçek registry modülünü kaydediyor | Entitlement ve menü/runtime aktivasyonu uçtan uca değil | MOD kataloğu–entitlement–runtime–menü negatif testleri | Faz 2D–11 |
| TDB-004 | OPEN | Firma ayarları tipli/sürümlü namespace sözleşmesine bağlı değil | Ayar çakışması, yetki/audit ve migration riski | Şema, policy, audit ve migration testleri | Faz 3–11 |
| TDB-005 | OPEN | Playwright/axe, fiziksel cihaz, yük/soak ve offline cihaz kabulleri yok | Canlı kullanım iddiası kurulamaz | İlgili TST/EVD kayıtları | Faz 12 |
| TDB-006 | OPEN | Canlı WAL/PITR, production restore, DNS/TLS/deployment kanıtı yok | RPO/RTO ve canlı süreklilik bilinmiyor | Operasyon EVD ve değişmez release kanıtı | Faz 12 |

## Açık kararlar

| ID | Durum | Karar konusu | Mevcut hedef tercihi | Karar verilene kadar güvenli davranış |
|---|---|---|---|---|
| DEC-001 | OPEN | `field-pwa / tenant-mobile`, `worker / jobs-worker`, `domains / modules` adları | RMP-001 `field-pwa`, `worker`, `domains/*` yönünü destekliyor; kabul edilmiş ADR yok | Fiziksel taşıma yok; mevcut yollar korunur |
| DEC-002 | OPEN | Satılmamış işletme hissesinin kesim öncesi dinî uygunluğu | Çözüm belirlenmedi | Sahte kişi/vekâlet/satış/finans üretilmez; hazırlık engeli gösterilir |
| DEC-003 | OPEN | Eklenti çalıştırma/sandbox ve marketplace güven modeli | EXT-001 yalnız güvenli omurga hedefidir | Tenant process’ine denetimsiz üçüncü taraf kod yüklenmez |
| DEC-004 | OPEN | Kurban Günü lisans toleransının süre ve imza politikası | Operasyonun kanıtsız aniden durmaması hedefi var | Sabit süre uydurulmaz; test edilmemiş tolerans canlı kabul edilmez |

Her kayıt; karar/borç sahibi, hedef tarih veya faz, bağlantılı REQ/issue ve kapanış EVD’si eklenmeden `CLOSED` yapılmaz.
