# Firma, Lisans ve Sezon Yaşam Döngüsü

```yaml
id: PRD-005
status: REVIEW
owner: Product-and-Platform
source_role: organization_license_season_lifecycle_source
source_of_truth: true
last_reviewed: 2026-08-12
verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5
```

## Hedef yaşam döngüsü

Firma yaşam döngüsü; ticari onay, tenant kaydı, provisioning, ilk yedek, Firma Admin daveti, yapılandırma doğrulaması, aktivasyon, askıya alma, yeniden etkinleştirme, veri dışa aktarma, devir ve kapanışı kontrollü iş kayıtlarıyla yönetir.

Lisans durumları ve sezon durumları ayrı kavramlardır. Lisans kesintisi, Kurban Günü’nde geçerli yerel operasyonu kanıtsız biçimde aniden durdurmamalıdır; tolerans politikası ayrıca onaylanıp test edilmelidir.

## `74915b6` ile uygulanan bölüm

- Plan, lisans, entitlement ve limit metadata’sı Platform DB’dedir.
- Provisioning işleri idempotent ve devam ettirilebilir kayıtlardır.
- Provisioning tamamlanınca ilk backup işi kuyruğa alınabilir.
- Başarılı backup metadata’sı sonrasında Firma Admin daveti hazırlanabilir; token hashlenmiş saklanır ve aktivasyon bağlantısı yalnız oluşturma yanıtında verilir.
- Dondurma, yeniden etkinleştirme, kapanış ön kontrolü/talebi, export ve devir iş kayıtları vardır.
- Kapanış, export ve devir ikinci yetkili onayı; kritik operasyonlar yakın tarihli yeniden doğrulama ister.

## Uygulanmış sayılmayan bölüm

- Gerçek abonelik ve platform faturalaması.
- Tenant tarafında data-export içeriğini üreten tamamlanmış executor.
- Canlı DNS/TLS ve production deployment.
- Production destructive restore ve onay akışı.
- Lisans toleransının gerçek çevrimdışı Kurban Günü kabulü.
- Tüm firma başlangıç ve sezon sihirbazlarının uçtan uca kullanıcı kabulü.

Bu sınırların kanıt kaynağı [ARC-016](../architecture/16-FAZ-2B-DOGRULANMIS-DURUM-VE-KAPSAM-SINIRI.md) ve [TRK-001](../architecture/KURBAN2026-UYGULAMA-TAKIP.md) belgeleridir.
