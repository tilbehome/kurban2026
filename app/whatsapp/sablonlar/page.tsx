import { redirect } from "next/navigation";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol, adminMi } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { ayarOku } from "@/modules/_core/ayarlar/ayar.service";
import { SablonYonetimClient } from "@/modules/whatsapp/components/SablonYonetimClient";
import type {
  SablonKategorisi,
  SablonKisa,
} from "@/modules/whatsapp/types";

export const dynamic = "force-dynamic";

export default async function WhatsAppSablonlarPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");

  if (!izinKontrol(oturum, "whatsapp.gecmis")) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            WhatsApp şablonlarını görme yetkiniz yok.
          </p>
        </div>
      </AppShell>
    );
  }

  const [sablonlarRaw, sirketAdi, sirketTel] = await Promise.all([
    prisma.whatsAppSablonu.findMany({
      where: { silindiMi: false },
      orderBy: [{ varsayilan: "desc" }, { ad: "asc" }],
    }),
    ayarOku("firma_adi", "Adabereket Hayvancılık"),
    ayarOku("firma_telefon", ""),
  ]);

  const sablonlar: SablonKisa[] = sablonlarRaw.map((s) => ({
    id: s.id,
    ad: s.ad,
    kategori: s.kategori as SablonKategorisi,
    icerik: s.icerik,
    aktifMi: s.aktifMi,
    varsayilan: s.varsayilan,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Mesaj Şablonları"
        altBaslik={`${sablonlar.length} şablon · Toplu gönderim için kullanılır`}
      />
      <div className="p-4 sm:p-6">
        <SablonYonetimClient
          ilkSablonlar={sablonlar}
          duzenleyebilir={adminMi(oturum.rol)}
          sirketAdi={sirketAdi}
          sirketTel={sirketTel}
        />
      </div>
    </AppShell>
  );
}
