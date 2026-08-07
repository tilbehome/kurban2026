# 02 — Modüler Monolit ve Domain Sınırları

## Strateji

Mevcut Next.js uygulaması çöpe atılmayacak. Hedef, route dosyalarındaki iş kurallarını kontrollü şekilde domain/application servislerine taşımaktır.

Route sorumluluğu:

1. Request parse/validasyon.
2. Auth ve yetki.
3. Use-case çağrısı.
4. Güvenli response.

Domain/application sorumluluğu:

- İş kuralı.
- Transaction sınırı.
- Domain olayı.
- Ters kayıt/iptal davranışı.
- Test edilebilir saf mantık.

## Önerilen modül sınırları

| İş alanı | Mevcut kanıt | Hedef domain |
|---|---|---|
| Platform/tenant | Yok | `platform`, `tenant-routing`, `deployment` |
| Kimlik ve erişim | `shared/lib/session.ts`, `shared/lib/izinler.ts`, `Kullanici` | `identity`, `access-control`, firma ve platform ayrımı |
| Sezon | Yok / implicit 2026 | `season` modeli ve cari dönem bağlamı |
| Müşteri/cari | `Musteri`, müşteri API ve modülleri | Müşteri kimliği, mükerrer uyarı, sezon geçmişi |
| Tedarik/alım/gider | `app/hayvanlar/tedarik`, `app/kasa/gider` | Tedarikçi, alış faturası, gider defteri |
| Hayvan | `Kurban` | Hayvan kartı, küpe, uygunluk, tartım geçmişi |
| Hisse kartı/envanter | `Hisse` | Bağımsız hisse kartı, stok, transfer, yedinci hisse istisnası |
| Satış/kapora | `/api/saha-satis`, `/api/hisseler/*` | Satış emri, fiyat snapshot, borçlandırma |
| Finansal defter | `Odeme`, `KasaHareketi` | Tek ledger, kasa/banka/POS alt defterleri |
| Vekâlet/belge | `Vekalet`, `/api/vekaletler` | Dosya güvenliği, belge snapshot, QR doğrulama |
| Kesim operasyonu | TV/kesim route ve modülleri | Durum makineleri, yetkili geçişler |
| Tartım/paket/teslim | `paketKg`, `teslimDurumu` | Paket batch, kg farkı, QR teslim |
| Bildirim | WhatsApp, push | Kanal bağımsız bildirim use-case |
| Raporlama | `modules/raporlar` | Read-model ve mutabakat raporları |
| Audit/olay | `AuditLog`, `shared/lib/events.ts` | Domain event + audit policy |
| Yedek/güncelleme/lisans | `app/api/yedek/*` | Firma ve platform ayrılmış operasyon |

## Büyük route adayları

| Route | Yaklaşık satır | Öneri |
|---|---:|---|
| `app/api/tahsilat/odeme/route.ts` | 398 | `TahsilatService.al`, `LedgerService.kaydet`, idempotency middleware |
| `app/api/saha-satis/route.ts` | 309 | `SahaSatisUseCase.tamamla` |
| `app/api/tv/kurban-asama/route.ts` | 196 | `KesimDurumMakinesi.gecisYap` |
| `app/api/tv/push-gonder/route.ts` | 191 | `BildirimService.gonder` |
| `app/api/musteriler/borclular/route.ts` | 171 | `CariReadModel.borclular` |

## Domain olayları

Başlangıç olay seti:

- `musteri.olusturuldu`
- `hisse.rezerve_edildi`
- `hisse.kesin_satildi`
- `satis.iptal_edildi`
- `tahsilat.alindi`
- `tahsilat.iptal_edildi`
- `ledger.ters_kayit_olustu`
- `vekalet.tamamlandi`
- `kurban.kesime_hazir`
- `kurban.kesildi`
- `hisse.paketlendi`
- `hisse.teslim_edildi`
- `firma.yedek_alindi`
- `migration.tamamlandi`

