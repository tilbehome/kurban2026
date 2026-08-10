# 🚨 ACIL — TAHSILAT BOZULDU TANI VE DUZELT

**SORUN:** SPRINT EX commit'i (c4e0d42) sonrasında `/api/tahsilat/odeme` "Ödeme kaydedilemedi" hatası veriyor. Bayrama 2 gün var, sistem KIRIK.

**KESINLIKLE TAHSILAT KODUNA DOKUNMA** — sebep schema/migration/cache uyumsuzluğu, kod degil.

---

## ADIM 1 — SERVER LOG OKU (5 saniye)

`pnpm dev` calisirken (veya prod ise pm2 logs):

```bash
# Eger pnpm dev calisiyorsa terminal'i dondur, son hatayi oku
# `[odeme] Transaction hatasi:` ile baslayan satiri bana raporla
```

Bu satir bana **gercek sebebi** verecek. Tahmin etme — gercek hatayi oku.

**Olasi hatalar:**

### A) Schema vs DB uyumsuzlugu (en olasi)
```
PrismaClientKnownRequestError:
Invalid `prisma.bildirimLog.create()` invocation:
Unknown field `kullaniciId`...
```
veya
```
The column `kullaniciId` does not exist in the current database.
```

**Sebep:** SPRINT EX migration `20260525125211_add_bildirim_log_kullanici_id`
schema.prisma'ya field ekledi ama DB'ye uygulanmadi. Prisma Client memory'de eski.

**COZUM:**
```bash
# 1. Dev server'i durdur (Ctrl+C)
pnpm prisma migrate deploy
# Eger migrate deploy hata verirse:
pnpm prisma migrate dev
# Sonra Prisma Client regen:
pnpm prisma generate
# Sonra dev'i tekrar baslat:
pnpm dev
```

### B) Cookie bozulmus / kullaniciId int
```
PrismaClientKnownRequestError:
Argument `kullaniciId`: Invalid value provided.
Expected String, provided Int.
```

**Sebep:** Eski cookie kalintisi. Faz 1'de fix vardi ama tekrar olabilir.

**COZUM:**
- Tarayicidan tum cookie sil (`/giris` sayfasi otomatik logout yapacak)
- Tekrar giris yap (admin/sifre)
- Tekrar dene

### C) Foreign key constraint
```
Foreign key constraint failed on the field: `kullaniciId`
```

**Sebep:** Bcrypt password hash veya seed yeniden calistirildi, kullanici ID degisti.

**COZUM:** Cikis yap, tekrar giris yap.

### D) Prisma Client guncel degil
```
TypeError: Cannot read properties of undefined (reading 'create')
```

**Sebep:** `pnpm prisma generate` calistirilmadi.

**COZUM:**
```bash
pnpm prisma generate
# Dev server'i restart
```

---

## ADIM 2 — HIZLI HEALTH CHECK

```bash
# DB durumu
pnpm prisma migrate status

# Beklenen cikti: "Database schema is up to date!"
# Eger "Following migrations have not yet been applied:" gorursen
# → pnpm prisma migrate deploy CALISTRI
```

---

## ADIM 3 — TEST

Server restart sonrasi:
1. Tarayicida `Ctrl+Shift+R` (hard refresh) yap
2. /tahsilat/musteri/{test musteri id} sayfasini ac
3. 100 TL nakit gir → "Odemeyi Al ve Dekont Bas"
4. **Beklenen:** "Odeme alindi · ABH-2026-NNN" toast + yeni sekmede dekont

5. Bana sonucu raporla:
   - Calisti mi?
   - Toast metni
   - Yeni dekont no
   - Server log son 10 satir

---

## ADIM 4 — EGER HALA CALISMAZSA

Tum bu adimlari yaptin ama hala patliyor ise:

```bash
# 1. Mevcut DB'yi yedekle (KRITIK)
cp prisma/tilbe.db prisma/tilbe-PRE-ROLLBACK.db

# 2. Son commit'i revert et (SPRINT EX'i geri al)
git revert c4e0d42 --no-edit
git push

# 3. Migration'i geri sar
pnpm prisma migrate resolve --rolled-back 20260525125211_add_bildirim_log_kullanici_id

# 4. Dev restart
pnpm dev
```

Bu **son care**. SPRINT EX'in bug duzeltmeleri kayar ama tahsilat geri gelir.

---

## RAPOR FORMATI

Bana sunlari ver:

```
1. ADIM 1 server log:
   <yapistir>

2. ADIM 2 migrate status cikti:
   <yapistir>

3. ADIM 3 test sonucu:
   - Calisti: EVET / HAYIR
   - Toast: <metin>
   - Dekont no: <varsa>

4. Hangi durum (A/B/C/D) eslesti?
```

Bunlar gelince **gercek cozumu** vereyim. Tahmin yapma, log oku.
