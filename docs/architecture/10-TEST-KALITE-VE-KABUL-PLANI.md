# 10 — Test, Kalite ve Kabul Planı — Tarihsel Uyumluluk Kaydı

```yaml
id: ARC-010
title: Test, Kalite ve Kabul Planı — Tarihsel Uyumluluk Kaydı
status: SUPERSEDED
owner: QA-and-Engineering
source_role: historical_test_plan_compatibility_redirect
source_of_truth: false
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
superseded_by: TST-001
```

Bu dosya eski bağlantıları kırmamak için korunur. Test stratejisi, kalite kapıları, tenant izolasyon matrisi ve kanıt dili için tek bağlayıcı kaynak [TST-001 Master Test Planı](../testing/TST-001-MASTER-TEST-PLANI.md) belgesidir.

## Yerine geçen karar

Bu yol daha önce `TST-001` kimliğini taşıyordu. Uzmanlık belgelerinin `docs/testing` altında tekilleştirilmesiyle kimlik ve ana kaynak sorumluluğu yeni master plana taşındı. Eski belgede yalnız bulunan ve hâlâ geçerli Faz 1 test envanteri, mock sınırları, PRO kalite kapıları ve tenant izolasyon senaryoları yeni belgeye aktarıldı.

## Kanıt sınırı

Bu uyumluluk kaydı test sonucu değildir ve hiçbir özelliği doğrulanmış saydırmaz. Geçerli sonuçlar, commit ile eşleşen CI/yerel kanıt ve [evidence indeksi](../evidence/README.md) birlikte okunarak belirlenir.
