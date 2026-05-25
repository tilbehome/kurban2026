-- AlterTable
ALTER TABLE "Kurban" ADD COLUMN "hisseGrubu" TEXT;

-- CreateIndex
CREATE INDEX "Kurban_hisseGrubu_idx" ON "Kurban"("hisseGrubu");
