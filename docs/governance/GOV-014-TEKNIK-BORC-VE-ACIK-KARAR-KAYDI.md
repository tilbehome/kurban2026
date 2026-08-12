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

| ID | Durum | Borç | Etki | Sahip | Hedef tarih / faz | Bağlı REQ / issue | Kapanış kanıtı / EVD | Güvenli ara davranış |
|---|---|---|---|---|---|---|---|---|
| TDB-001 | OPEN | Legacy satış akışı sıfır kaporayla satış/alacak açabiliyor | Finans ve sahiplik hedefiyle çelişki | Sales-and-Finance | Faz 5–6 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Sıfır kapora negatif PG testi; rezervasyon süre sonu ve ledger yokluğu EVD’si | Legacy davranış hedef davranış diye belgelenmez; yeni akışta pozitif kapora olmadan kesin satış açılmaz. |
| TDB-002 | OPEN | Legacy tenant uygulaması kök `app/modules/shared/components/prisma` yapısına bağlı | Monorepo hedefi ve tenant runtime geçişi tamamlanamaz | Architecture-and-Engineering | Faz 2D–10 | `DIR-001`; issue henüz açılmadı | DIR-001 kapanışı, import grafiği ve route smoke EVD’si | Fiziksel taşıma küçük ve geri alınabilir paket olmadan yapılmaz; mevcut yollar korunur. |
| TDB-003 | OPEN | Statik loader yalnız altı gerçek registry modülünü kaydediyor | Entitlement ve menü/runtime aktivasyonu uçtan uca değil | Product-and-Architecture | Faz 2D–11 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | MOD kataloğu–entitlement–runtime–menü negatif test EVD’si | Runtime hazır olmayan veya placeholder yüzey canlı menüde gösterilmez. |
| TDB-004 | OPEN | Firma ayarları tipli/sürümlü namespace sözleşmesine bağlı değil | Ayar çakışması, yetki/audit ve migration riski | Product-and-Architecture | Faz 3–11 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Şema, policy, audit ve migration test EVD’si | Serbest ayar yeni domain kararını veya yetkiyi sessizce değiştiremez. |
| TDB-005 | OPEN | Playwright/axe, fiziksel cihaz, yük/soak ve offline cihaz kabulleri yok | Canlı kullanım iddiası kurulamaz | Quality-and-Field-Operations | Faz 12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Bağlı TST senaryoları ve değişmez EVD kayıtları | Bu kabuller `NOT_RUN` kalır; CI/unit sonucu canlı cihaz kabulü sayılmaz. |
| TDB-006 | OPEN | Canlı WAL/PITR, production restore, DNS/TLS/deployment kanıtı yok | RPO/RTO ve canlı süreklilik bilinmiyor | Reliability-and-Operations | Faz 12 | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Operasyon EVD’si ve değişmez release kanıtı | Canlıya hazır veya ölçülmüş RPO/RTO iddiası kurulmaz; kontrollü test ortamı sınırı korunur. |

## Açık kararlar

| ID | Durum | Karar konusu | Mevcut hedef tercihi | Sahip | Hedef tarih / faz | Bağlı REQ / issue | Kapanış kanıtı / EVD | Karar verilene kadar güvenli davranış |
|---|---|---|---|---|---|---|---|---|
| DEC-001 | OPEN | `field-pwa / tenant-mobile`, `worker / jobs-worker`, `domains / modules` adları | RMP-001 `field-pwa`, `worker`, `domains/*` yönünü destekliyor; kabul edilmiş ADR yok | Product-and-Architecture | Faz 2D öncesi karar kapısı | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Kabul edilmiş ADR ve doğrulanmış taşıma planı EVD’si | Fiziksel taşıma yok; mevcut yollar korunur. |
| DEC-002 | OPEN | Satılmamış işletme hissesinin kesim öncesi dinî uygunluğu | Çözüm belirlenmedi | Product-and-Domain | Karar bekliyor; Faz 5–8 karar kapısı | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Yetkili kullanıcı kararı, bağlayıcı gereksinim/ADR ve kabul EVD’si | Sahte kişi, vekâlet, satış veya finans üretilmez; hazırlık engeli gösterilir. |
| DEC-003 | OPEN | Eklenti çalıştırma/sandbox ve marketplace güven modeli | EXT-001 yalnız güvenli omurga hedefidir | Security-and-Architecture | Eklenti runtime uygulaması öncesi karar kapısı | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Kabul edilmiş güvenlik ADR’si, tehdit modeli ve sandbox EVD’si | Tenant process’ine denetimsiz üçüncü taraf kod yüklenmez. |
| DEC-004 | OPEN | Kurban Günü lisans toleransının süre ve imza politikası | Operasyonun kanıtsız aniden durmaması hedefi var | Platform-and-Operations | Faz 12–15 karar kapısı | REQ eşlemesi karar bekliyor; issue henüz açılmadı | Kabul edilmiş politika/ADR, kesinti ve imza doğrulama EVD’si | Sabit süre uydurulmaz; test edilmemiş tolerans canlı kabul edilmez. |

Her kayıt, yukarıdaki kayıt bazlı alanları ve doğrulanmış kapanış EVD’sini taşımadan `CLOSED` yapılmaz. Genel belge sahibi kayıt sahibinin yerine geçmez.
