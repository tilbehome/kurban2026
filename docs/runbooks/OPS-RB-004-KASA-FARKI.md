# Kasa Farkı Runbook’u

```yaml
id: OPS-RB-004
title: Kasa Farkı Runbook'u
status: PLANNED
owner: Finance-Operations
source_role: incident_runbook
reviewers: [Tenant-Owner, Security, QA]
effective_date: 2026-08-12
last_reviewed: 2026-08-12
verified_against_commit: not_applicable
next_review: ILK_KASA_KAPANIS_PROVASINDA
version: 0.1
source_of_truth: false
related_requirements: [REQ-024, REQ-040, REQ-068, PRO-002, PRO-032]
related_adrs: []
related_modules: [finance-ledger, cash, reconciliation]
related_tests: [TST-006]
supersedes: []
superseded_by: null
```

## Tetikleyici

Beklenen ve fiziksel sayılan kasa, banka/POS settlement veya müşteri cari/ledger arasında açıklanamayan fark.

## İlk adımlar

1. Kasa oturumunu yeniden yazılmasını önleyecek inceleme durumuna al; yeni vardiyayı ayrı kasa/oturumla yönet.
2. Farkı sıfırlama, kayıt silme, toplu update veya sahte tahsilat yapma.
3. İki kişiyle fiziksel sayım yap; kupür/yöntem toplamı, sayanlar ve zaman kaydedilsin.
4. Açılış, vardiya devirleri, tahsilat yöntem parçaları, iade/ters kayıt, POS slip/settlement ve banka hareketlerini çıkar.
5. Aynı idempotency, makbuz, işlem grubu ve offline/manual kayıt tekrarlarını araştır.

## Sınıflandırma

- Fiziksel sayım hatası.
- Yanlış ödeme yöntemi veya allocation.
- Eksik/fazla tahsilat ya da mükerrer posting.
- İade/ters kayıt veya POS settlement zaman farkı.
- Sistem/transaction/idempotency hatası.
- Güvenlik/suiistimal şüphesi; bu durumda delili koru ve erişimi sınırla.

## Düzeltme

Her düzeltme kaynak işleme bağlı, gerekçeli ve yetkili ters kayıt/mahsup/yeniden sınıflandırma ile yapılır. Büyük/şüpheli veya kapalı dönem etkisinde ikinci yetkili ve gerekiyorsa güvenlik incelemesi gerekir. “Kasa farkı” ayrı açıklanabilir hesap/olay olarak görünür; geçmiş sessizce değişmez.

## Kapanış

Ledger borç/alacak, tahsilat yöntem parçaları, müşteri carisi, kasa beklenen/sayılan ve banka/POS mutabakatı tamamlanır. Açıklanamayan fark varsa kasa kapanışı veya sezon kapanışı başarılı gösterilmez; [EVD-004](../evidence/EVD-004-FINANS-MUTABAKAT-SABLONU.md) `FAILED/BLOCKED` kalır.
