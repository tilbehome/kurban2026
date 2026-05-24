import { redirect } from "next/navigation";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { GecmisTablosu } from "@/modules/whatsapp/components/GecmisTablosu";
import type {
  GonderimKisa,
  SablonKategorisi,
} from "@/modules/whatsapp/types";

export const dynamic = "force-dynamic";

export default async function WhatsAppGecmisPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");

  if (!izinKontrol(oturum, "whatsapp.gecmis")) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            WhatsApp geçmişini görme yetkiniz yok.
          </p>
        </div>
      </AppShell>
    );
  }

  const gonderimlerRaw = await prisma.whatsAppGonderim.findMany({
    where: { silindiMi: false },
    orderBy: { baslamaTarihi: "desc" },
    take: 100,
    include: {
      sablon: { select: { id: true, ad: true, kategori: true } },
      kullanici: { select: { adSoyad: true } },
    },
  });

  const gonderimler: GonderimKisa[] = gonderimlerRaw.map((g) => ({
    id: g.id,
    sablonId: g.sablonId,
    sablonAd: g.sablon.ad,
    sablonKategorisi: g.sablon.kategori as SablonKategorisi,
    baslamaTarihi: g.baslamaTarihi.toISOString(),
    bitisTarihi: g.bitisTarihi?.toISOString() ?? null,
    hedefSayisi: g.hedefSayisi,
    acilanSayisi: g.acilanSayisi,
    atlananSayisi: g.atlananSayisi,
    hataSayisi: g.hataSayisi,
    telefonsuzSayisi: g.telefonsuzSayisi,
    kullaniciId: g.kullaniciId,
    kullaniciAdSoyad: g.kullanici.adSoyad,
    not: g.not,
  }));

  return (
    <AppShell>
      <SayfaBaslik
        baslik="WhatsApp Gönderim Geçmişi"
        altBaslik={`${gonderimler.length} toplu gönderim · Son 100 kayıt`}
      />
      <div className="p-4 sm:p-6">
        <GecmisTablosu gonderimler={gonderimler} />
      </div>
    </AppShell>
  );
}
