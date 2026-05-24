-- CreateTable
CREATE TABLE "Kullanici" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kullaniciAdi" TEXT NOT NULL,
    "sifreHash" TEXT NOT NULL,
    "adSoyad" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "sonGiris" DATETIME,
    "silindiMi" BOOLEAN NOT NULL DEFAULT false,
    "silinmeTarihi" DATETIME,
    "olusturanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Ayar" (
    "anahtar" TEXT NOT NULL PRIMARY KEY,
    "deger" TEXT NOT NULL,
    "guncelTarih" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ModulDurum" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "versiyon" TEXT NOT NULL,
    "ayarlar" TEXT,
    "yuklemeT" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelTarih" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eylem" TEXT NOT NULL,
    "model" TEXT,
    "kayitId" TEXT,
    "kullaniciId" TEXT,
    "ip" TEXT,
    "detaylar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "Kullanici" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Musteri" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adSoyad" TEXT NOT NULL,
    "telefon" TEXT,
    "tcKimlik" TEXT,
    "adres" TEXT,
    "notlar" TEXT,
    "etiketler" TEXT,
    "silindiMi" BOOLEAN NOT NULL DEFAULT false,
    "silinmeTarihi" DATETIME,
    "olusturanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Kurban" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kesimSirasi" INTEGER NOT NULL,
    "kesimSaati" TEXT,
    "kupeNo" TEXT,
    "hisseSayisi" INTEGER NOT NULL DEFAULT 7,
    "satisBedeli" REAL NOT NULL DEFAULT 0,
    "canliAgirlik" REAL DEFAULT 0,
    "karkasAgirlik" REAL DEFAULT 0,
    "durum" TEXT NOT NULL DEFAULT 'aktif',
    "notlar" TEXT,
    "silindiMi" BOOLEAN NOT NULL DEFAULT false,
    "silinmeTarihi" DATETIME,
    "olusturanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Hisse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kurbanId" TEXT NOT NULL,
    "no" INTEGER NOT NULL,
    "musteriId" TEXT,
    "hisseFiyati" REAL NOT NULL DEFAULT 0,
    "vekaletAlindi" BOOLEAN NOT NULL DEFAULT false,
    "vekaletTarihi" DATETIME,
    "notlar" TEXT,
    "silindiMi" BOOLEAN NOT NULL DEFAULT false,
    "silinmeTarihi" DATETIME,
    "olusturanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Hisse_kurbanId_fkey" FOREIGN KEY ("kurbanId") REFERENCES "Kurban" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Hisse_musteriId_fkey" FOREIGN KEY ("musteriId") REFERENCES "Musteri" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Odeme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hisseId" TEXT NOT NULL,
    "tarih" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nakit" REAL NOT NULL DEFAULT 0,
    "havale" REAL NOT NULL DEFAULT 0,
    "kart" REAL NOT NULL DEFAULT 0,
    "toplamTutar" REAL NOT NULL,
    "yontem" TEXT NOT NULL,
    "notlar" TEXT,
    "dekontNo" TEXT NOT NULL,
    "kullaniciId" TEXT NOT NULL,
    "iptal" BOOLEAN NOT NULL DEFAULT false,
    "iptalSebep" TEXT,
    "iptalTarihi" DATETIME,
    "iptalKulId" TEXT,
    "silindiMi" BOOLEAN NOT NULL DEFAULT false,
    "silinmeTarihi" DATETIME,
    "olusturanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Odeme_hisseId_fkey" FOREIGN KEY ("hisseId") REFERENCES "Hisse" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Odeme_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "Kullanici" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KasaHareketi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tip" TEXT NOT NULL,
    "tutar" REAL NOT NULL,
    "yontem" TEXT NOT NULL,
    "aciklama" TEXT NOT NULL,
    "odemeId" TEXT,
    "kullaniciId" TEXT NOT NULL,
    "tarih" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "silindiMi" BOOLEAN NOT NULL DEFAULT false,
    "silinmeTarihi" DATETIME,
    "olusturanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KasaHareketi_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "Kullanici" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Kullanici_kullaniciAdi_key" ON "Kullanici"("kullaniciAdi");

-- CreateIndex
CREATE INDEX "Kullanici_kullaniciAdi_idx" ON "Kullanici"("kullaniciAdi");

-- CreateIndex
CREATE INDEX "Kullanici_silindiMi_idx" ON "Kullanici"("silindiMi");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_eylem_idx" ON "AuditLog"("eylem");

-- CreateIndex
CREATE INDEX "AuditLog_kullaniciId_idx" ON "AuditLog"("kullaniciId");

-- CreateIndex
CREATE INDEX "AuditLog_model_kayitId_idx" ON "AuditLog"("model", "kayitId");

-- CreateIndex
CREATE INDEX "Musteri_adSoyad_idx" ON "Musteri"("adSoyad");

-- CreateIndex
CREATE INDEX "Musteri_telefon_idx" ON "Musteri"("telefon");

-- CreateIndex
CREATE INDEX "Musteri_silindiMi_idx" ON "Musteri"("silindiMi");

-- CreateIndex
CREATE UNIQUE INDEX "Kurban_kesimSirasi_key" ON "Kurban"("kesimSirasi");

-- CreateIndex
CREATE INDEX "Kurban_kesimSirasi_idx" ON "Kurban"("kesimSirasi");

-- CreateIndex
CREATE INDEX "Kurban_durum_idx" ON "Kurban"("durum");

-- CreateIndex
CREATE INDEX "Kurban_silindiMi_idx" ON "Kurban"("silindiMi");

-- CreateIndex
CREATE INDEX "Hisse_musteriId_idx" ON "Hisse"("musteriId");

-- CreateIndex
CREATE INDEX "Hisse_silindiMi_idx" ON "Hisse"("silindiMi");

-- CreateIndex
CREATE UNIQUE INDEX "Hisse_kurbanId_no_key" ON "Hisse"("kurbanId", "no");

-- CreateIndex
CREATE UNIQUE INDEX "Odeme_dekontNo_key" ON "Odeme"("dekontNo");

-- CreateIndex
CREATE INDEX "Odeme_hisseId_idx" ON "Odeme"("hisseId");

-- CreateIndex
CREATE INDEX "Odeme_tarih_idx" ON "Odeme"("tarih");

-- CreateIndex
CREATE INDEX "Odeme_dekontNo_idx" ON "Odeme"("dekontNo");

-- CreateIndex
CREATE INDEX "Odeme_silindiMi_idx" ON "Odeme"("silindiMi");

-- CreateIndex
CREATE INDEX "Odeme_iptal_idx" ON "Odeme"("iptal");

-- CreateIndex
CREATE INDEX "KasaHareketi_tarih_idx" ON "KasaHareketi"("tarih");

-- CreateIndex
CREATE INDEX "KasaHareketi_tip_idx" ON "KasaHareketi"("tip");

-- CreateIndex
CREATE INDEX "KasaHareketi_silindiMi_idx" ON "KasaHareketi"("silindiMi");
