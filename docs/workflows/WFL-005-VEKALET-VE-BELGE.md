---
id: WFL-005
title: Vekâlet ve Belge Akışı
status: REVIEW
owner: Domain-and-Religious-Operations
source_of_truth: false
last_reviewed: 2026-08-12
related_requirements: [REQ-029, REQ-030, REQ-031, REQ-032, REQ-033, REQ-034, REQ-061]
---

# Vekâlet ve belge akışı

## Vekâlet alma

1. Yetkili kullanıcı müşteri/hisseyi doğrular.
2. Vekâlet veren, temsilci, yöntem, politika/metin sürümü ve kapsanan hisseler seçilir.
3. Varsa dosya/kanıt tür, boyut ve güvenlik doğrulamasından geçirilir; korumalı storage’a alınır.
4. Belge ve hisse bağları, actor, kanal ve zamanla kaydedilir.
5. `SIGNED` durumundaki belge kesim önkoşuluna katkı verir.

## Belge üretimi

- Her hisse için firma markalı, sürümlü A4 kesim/teslim belgesi üretilir.
- Kesim kontrolü ve teslim için ayrı amaçlı opaque token kullanılır.
- Token açık müşteri/telefon/hisse kimliği taşımaz.
- Belge snapshot’ı üretim anındaki firma/şablon/metin sürümünü korur.

## Kayıp, iptal ve yeniden üretim

Eski belge fiziksel silinmez. Token iptal edilir, durum `LOST` veya `REVOKED` olur ve yeni sürüm/token üretilir. Yeniden baskı/üretim gerekçesi auditlenir.

## Kesim kontrolü

Kesim istasyonu hayvan/hisse ve QR amacını doğrular. Yedi geçerli vekâlet yoksa normal geçiş bloke edilir. Yetkili istisna ancak belgelenmiş politika, gerekçe ve audit ile mümkündür; bu istisnanın dinî/hukuki kararı yazılım tarafından uydurulmaz.

## Uygulama durumu

Tenant core belge/QR sözleşmesi ve legacy korumalı dosya okuma `IMPLEMENTED_PENDING_VERIFICATION`/`IMPLEMENTING`; çoklu veren/kanal, gerçek sürümlü belge, iki aşamalı QR ve baskı E2E’si `PLANNED` durumundadır. Legacy yükleme eski kaydı fiziksel silebildiğinden hedef sözleşmeyle tam uyumlu sayılmaz.

## Kabul kanıtı

- IDOR/path traversal ve yetki negatif testleri.
- Kayıp/iptal token tekrar kullanımı testi.
- Tek kanıtın çok hisse bağında doğru görünmesi.
- Eksik vekâletle kesim geçişinin reddi.
- TR/EN/AR, RTL ve PDF font/baskı testi.

Domain sözleşmesi [DOM-009](../domains/DOM-009-VEKALET-VE-BELGELER.md) içindedir.
