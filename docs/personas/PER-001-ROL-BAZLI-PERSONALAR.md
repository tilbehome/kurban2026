---
id: PER-001
title: Rol Bazlı Personalar
status: PLANNED
owner: Product-and-UX
source_role: role_persona_catalog
source_of_truth: false
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
related_requirements: [REQ-050, REQ-059, REQ-060, PRO-001, PRO-005, PRO-006, PRO-008, PRO-020]
---

# Rol bazlı personalar

Bu personalar demografik tahmin içermez. Belgelenmiş görev, yetki, cihaz ve hata maliyetinden türetilmiş iş profilleridir. Rol adı tek başına yetki vermez; server-side permission, tenant, sezon, cihaz ve kayıt durumu ayrıca doğrulanır.

## 1. Platform Süper Admin

**Amaç:** TilbeCore platformunu firma operasyon verisini normal şartlarda görmeden kurmak ve işletmek.

**Ana görevler:** firma/lisans/plan yönetimi, provisioning, domain/sertifika metadata’sı, migration ve yedek durumu, incident/bakım/acil durdurma, platform kullanıcı/oturum güvenliği, süreli `SupportSession`.

**Yüzey ve cihaz:** `console.tilbecore.com`; ağırlıkla masaüstü, acil sağlık/incident için sınırlı telefon görünümü.

**Görmemesi gereken:** müşteri, telefon, hayvan, hisse, tahsilat, vekâlet, kesim ve teslim operasyon içeriği. Destek erişimi talep, firma onayı, süre, kapsam ve çift audit olmadan açılamaz.

**Başarı ölçütü:** tenantlar arası veri görmeden doğru firmaya doğru sürüm/lisans/işletim komutunu uygular; kritik işlemler yeniden doğrulama/ikinci onaydan geçer.

**Kod durumu:** Ayrı Platform Admin uygulaması ve kontrol düzlemi `IMPLEMENTED_UNVERIFIED`; canlı DNS/TLS, fiziksel passkey kabulü ve production restore onayı tamamlanmamıştır.

## 2. Firma Admin

**Amaç:** Kendi firmasını, sezonunu, kullanıcılarını ve operasyon hazırlığını güvenli yönetmek.

**Ana görevler:** sezon açılışı/kapanışı, rol ve cihazlar, firma markası, fiyat/hisse/finans ayarları, hazırlık skoru, istisna ve onay kutusu, rapor/mutabakat, destek erişimi onayı.

**Yüzey ve cihaz:** masaüstü ana yüzey; Kurban Günü büyük ekran kontrol merkezi ve tablet; telefonda kritik özet/onay.

**Kritik riskler:** başka tenant verisine erişim, yetkiyi yalnız menü gizlemeye bırakma, hazırlık engellerini atlama, açık farkla sezon kapatma, ürün ve firma markasını karıştırma.

**Başarı ölçütü:** sezonu prova/engeller tamamlanmadan açmaz; açık borç/kasa/paket/teslim farkıyla kapatmaz.

**Kod durumu:** Legacy firma ayar/ekranlarının bir bölümü vardır; gerçek sezon, birleşik istisna/onay merkezi ve yeni tenant DB bağlantısı `PLANNED`/`IMPLEMENTING` durumundadır.

## 3. Satış ve kasa personeli

**Amaç:** Müşteriyi hızlı bulmak, doğru hisseyi bir kez satmak ve tahsilatı doğru borç/kasa yöntemlerine işlemek.

**Ana görevler:** müşteri ara/oluştur, mükerrer uyarısını çöz, hisse/satış, fiyat ve kapora, karma tahsilat, makbuz, iade/mahsup talebi, kasa açılış/kapanış.

**Yüzey ve cihaz:** masaüstünde yoğun liste/klavye; sahada telefon/tablet hızlı satış ve tahsilat; barkod/QR opsiyonel giriş.

**Kritik riskler:** çifte satış, kapora ile satışın yarım kalması, yanlış müşteriye ödeme, POS vade farkının tamamına uygulanması, ödemeli kaydı silme, kasa farkını gizleme.

**Başarı ölçütü:** tek komutla atomik satış/tahsilat; makbuz, cari ve kasa aynı sonucu verir; ağ tekrarında çift kayıt oluşmaz.

**Kod durumu:** Legacy satış/tahsilat akışları kısmi çalışır; yeni ledger ve kasa 360 runtime’ına tam taşınmamıştır.

## 4. Kesim operasyon personeli

**Amaç:** Doğru hayvanı doğru sırada, gerekli önkoşullarla bir kez işlemek.

**Ana görevler:** sıradaki işi aç, hayvan/küpe/QR doğrula, vekâlet ve uygunluk engelini gör, kesimi başlat/tamamla, beklet, sorun bildir, vardiya devret.

**Yüzey ve cihaz:** eldivenle tablet/telefon istasyon modu; kontrol liderinde büyük ekran; TV yalnız anonim yayın.

**Kritik riskler:** yanlış hayvan, aşama atlama, çift başlatma, acil sıra değişikliğinin diğer ekranlara yansımaması, offline işlemi tamamlandı sanma.

**Başarı ölçütü:** aynı anda tek aktif iş, büyük kimlik, üç ana işlem ve görünür bağlantı/sync durumu.

**Kod durumu:** Kesim state-machine sözleşmesi vardır; gerçek istasyon/kontrol merkezi ve cihaz provası tamamlanmamıştır.

## 5. Paket ve teslim personeli

**Amaç:** Kaynak hayvan/hisse bağını kaybetmeden doğru paketi doğru kişiye yalnız bir kez teslim etmek.

**Ana görevler:** tartım/parça doğrulama, paket/etiket, yeniden baskı gerekçesi, soğuk oda konumu, araç yükleme checklist’i, QR/kimlik/teslim kanıtı, istisna bildirimi.

**Yüzey ve cihaz:** tablet istasyon, telefon/QR okuyucu teslim; etiket yazıcı ve terazi adapterleri.

**Kritik riskler:** yanlış hisse etiketi, eksik/fazla paket, çift raf/araç konumu, ikinci teslim, borçlu teslim override’ının kontrolsüz olması.

**Başarı ölçütü:** bütün paketler taranır, teslim kanıtı bir kez kapanır, sorunlar vardiyada kaybolmaz.

**Kod durumu:** Paket/teslim modelleri ve legacy temel ekranlar vardır; soğuk oda, yükleme, tek kullanımlık teslim kanıtı ve gerçek cihaz adapterleri `PLANNED` durumundadır.

## 6. Müşteri

**Amaç:** Kendi kurban sürecini kişisel verisi ifşa olmadan izlemek; yetkili kanalda belge, ödeme veya teslim bilgisine erişmek.

**Yüzeyler:** anonim/tokenlı takip yalnız minimum operasyon durumu; kimliği doğrulanmış müşteri portalı özel belge/ödeme işlevleri için ayrı yüzeydir. TV’de isim, telefon ve finans gösterilmez.

**Ana görevler:** durum takip, bildirim tercihi, yetkili belge erişimi, teslim kodu/kanıtı, itiraz/şikâyet.

**Kritik riskler:** tahmin edilebilir token, başka müşterinin kaydına erişim, TV’de PII, eski teslim tokenının tekrar kullanımı, teknik hata/locale karmaşası.

**Başarı ölçütü:** sade ve erişilebilir dilde doğru durum; token amacı/süresi açık; hassas ayrıntı yalnız kimliği doğrulanmış alanda.

**Kod durumu:** Legacy TV/takip yüzeyleri kısmi; profesyonel portal, tam token sınırı ve TR/EN/AR kabulü `PLANNED` durumundadır.

## Persona kabul matrisi

| Persona | Zorunlu görev testi | Negatif test |
|---|---|---|
| Platform Süper Admin | Firma metadata/incident yönetimi | SupportSession olmadan operasyon verisi |
| Firma Admin | Sezon hazırlık ve kapanış kontrolü | Başka firma/kapalı sezon yazısı |
| Satış/kasa | Atomik satış + karma tahsilat | Çifte satış/tahsilat |
| Kesim | Doğru sıradaki hayvanı ilerletme | Eksik vekâlet/aşama atlama |
| Paket/teslim | Taramalı tek teslim | Yanlış/eksik paket ve token replay |
| Müşteri | Tokenlı minimum takip | Başka müşterinin PII/finansı |

Cihaz davranışı [UX-004](../ux/UX-004-CIHAZ-VE-YERLESIM-STANDARDI.md), erişilebilirlik [A11Y-001](../accessibility/A11Y-001-WCAG-22-AA-KABUL-PLANI.md) ile birlikte kabul edilir.
