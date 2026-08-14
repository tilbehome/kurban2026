---
id: UX-003
title: Hayvan, Müşteri, Hisse ve Kasa 360 Sayfa Sözleşmeleri
status: PLANNED
owner: UX-and-Frontend
source_role: ux_contract
source_of_truth: false
last_reviewed: 2026-08-14
verified_against_commit: not_applicable
related_requirements: [REQ-001, REQ-008, REQ-015, REQ-028, PRO-001, PRO-005]
---

# 360 sayfa sözleşmeleri

360 sayfası her veriyi tek ekrana yığmaz. Sabit başlık, kritik engel, sonraki görev, rol bazlı eylem, ilişkiler, zaman çizelgesi ve ayrıntı sekmelerini tek çalışma bağlamında birleştirir.

## Ortak iskelet

1. **Sabit kimlik başlığı:** ad/numara, durum, tenant/sezon, sorumlu ve son güncelleme.
2. **Engel bandı:** ödeme, vekâlet, uygunluk, çakışma, paket, cihaz veya yetki sorunu.
3. **Sonraki doğru görev:** tek birincil eylem; tamamlanmış/kuyrukta/başarısız ayrımı.
4. **Özet KPI:** yalnız kararı destekleyen ve kaynak alanı belli değerler.
5. **İlişki sekmeleri:** domain’e göre bağlı kayıtlar.
6. **Zaman çizelgesi:** actor, zaman, olay, gerekçe, request/audit bağı.
7. **Belge/iletişim/not:** yetki ve PII maskelemesiyle.
8. **Hızlı eylemler:** role, duruma, cihaza ve bağlantıya göre.
9. **Sistem durumları:** yükleniyor, boş, hata, yetkisiz, offline, kuyrukta, çatışma.

## Hayvan 360

**Başlık:** fotoğraf varsa güvenli varlık, küpe, kurban no, operasyon sırası, uygunluk, padok/konum ve kesim aşaması.

**Özet:** tedarikçi/alış maliyeti, canlı/karkas tartım, tam yedi hissenin işletme envanteri/rezervasyon/kesin satış ayrımı, tahsilat/vekâlet/paket/teslim sayıları. Kârlılık yalnız mutabık ledger ve gerçek maliyet varsa gösterilir; işletme envanteri sahte gelir sayılmaz.

**Sekmeler:** genel; tedarik/maliyet; tartım; sağlık/uygunluk; 7 hisse; kesim; paket/teslim; belge/not; timeline/audit.

**Hızlı eylemler:** tartım ekle, uygunluk değiştir, sıra değiştir, hisse aç, sorun bildir. Geçersiz eylem gizlenmekle kalmaz; server da reddeder.

**Durum:** Tenant yönetim read-model'i hayvan maliyet/sağlık/padok ve fulfillment ilerleme raporlarını `IMPLEMENTED_UNVERIFIED` olarak sağlar. Tam Hayvan 360 sayfa sözleşmesi ve Faz 12 UI kabulü `PLANNED/NOT_RUN` kalır.

## Müşteri 360

**Başlık:** ad, maskeli/izinli iletişim, mükerrer uyarısı, aktif sezon bakiyesi, açık engeller.

**Özet:** aktif/önceki sezonlar, hisseler, borç/tahsilat, vekâlet, teslim ve iletişim izinleri.

**Sekmeler:** genel; sezon hesapları; hisseler/satışlar; tahsilatlar/makbuzlar; vekâlet/belgeler; teslim; iletişim/notlar; privacy/audit.

**Hızlı eylemler:** satış başlat, tahsilat al, belge/vekalet, hatırlatma, veri talebi. Ödeyen/hissedar/teslim alan ayrımları görünürdür.

**Durum:** Yetki filtreli evrensel arama ve müşteri sezon bakiyesi read-model'i `IMPLEMENTED_UNVERIFIED`; tam Müşteri 360 privacy/timeline UI kabulü `PLANNED/NOT_RUN` kalır.

## Hisse 360

**Başlık:** hayvan/küpe, `1..7` hisse sıra no, sahiplik türü (`işletme envanteri`, `rezervasyon`, `kesin satış`), varsa gerçek müşteri, durum ve teslim hazırlığı.

**Özet:** rezervasyon süresi veya kesin satışta liste fiyatı, indirim, anlaşma bedeli snapshot’ı, pozitif kapora, tahsilat/kalan, vekâlet, paket sayısı/kilo ve teslim. Rezervasyon ve işletme envanterinde alacak/gelir gösterilmez.

**Sekmeler:** satış/fiyat; müşteri/ödeyen; ödeme/ledger; vekâlet/belge; kesim; paket/tartım; teslim; transfer/iptal; timeline/audit.

**Hızlı eylemler:** rezervasyon oluştur/uzat/bırak, pozitif kaporayla satışı kesinleştir, tahsilat, transfer, iptal talebi, belge, teslim hazırlığı. İşletme envanterinde müşteri/vekâlet eylemi satıştan önce açılmaz. Ödemeli iptal veya teslim reversal doğrudan buton değil, etki önizlemeli sihirbazdır.

**Durum:** PostgreSQL rezervasyon/satış, tam yedi hisse, vekâlet/paket/teslim ve yetki filtreli hisse araması `IMPLEMENTED_UNVERIFIED`; birleşik Hisse 360 UI ve Faz 12 kabulü `PLANNED/NOT_RUN`.

## Kasa 360

**Başlık:** kasa/şube/sezon, açık vardiya, sorumlu, durum ve son sayım.

**Özet:** açılış, beklenen/sayılan nakit, yöntem toplamları, fark, bekleyen banka/POS settlement, iade/ters kayıt sayısı.

**Sekmeler:** oturum/vardiya; hareketler; tahsilatlar; giderler; banka/POS; sayım/fark; mutabakat; onaylar; timeline/audit.

**Hızlı eylemler:** oturum aç, tahsilat, gider, sayım, devir, kapanış, fark incele. Kapanış ve reversal yeniden doğrulama/ikinci onay ister.

**Durum:** Legacy `/kasa` özet ve alt ekranları vardır (`IMPLEMENTING`); gerçek kasa oturumu, banka/POS settlement ve ledger kaynaklı Kasa 360 `PLANNED`.

## Responsive davranış

- Masaüstü: liste + detay, yoğun tablo, kalıcı filtre ve klavye/komut paleti.
- Tablet: özet + görev paneli; landscape iki panel, portrait görev öncelikli.
- Telefon: tek kolon, birincil eylem alt çubuğu, ayrıntı çekmeceleri.
- TV/kiosk: 360 düzeni kullanılmaz; görev ve PII sınırı olan özel görünüm kullanılır.

## Etkileşim güvenliği

- Kaydetme sırasında çift tıklama kilidi idempotency’nin yerine geçmez.
- “Başarılı” yalnız server commit sonucu gösterilir; offline kayıt “kuyrukta”dır.
- Destructive/finansal işlem etki önizlemesi, gerekçe ve gerekiyorsa ikinci onay ister.
- Deep link tenant/session/permission doğrulamasını atlayamaz.
- PII ve finans rol bazlı maskelenir; URL ve telemetry’ye hassas değer yazılmaz.

## Kabul ölçütleri

- Her sayfa boş, loading, hata, offline, yetkisiz ve conflict durumuna sahiptir.
- Birincil göreve klavye ve dokunmayla ulaşılır; odak geri yüklenir.
- KPI’nın kaynağı ve veri tazeliği belirsiz değildir.
- Kritik eylem sonrası ilgili diğer 360 görünümleri aynı kalıcı olayı gösterir.
- 360 sayfasında bulunan eylemler server-side permission negatif testine sahiptir.

Erişilebilirlik kapısı [A11Y-001](../accessibility/A11Y-001-WCAG-22-AA-KABUL-PLANI.md), locale/RTL kapısı [I18N-001](../i18n/I18N-001-TR-EN-AR-VE-RTL.md) içindedir.
