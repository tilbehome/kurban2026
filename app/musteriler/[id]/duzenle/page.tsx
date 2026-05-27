import { notFound, redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { MusteriDuzenleForm } from "./MusteriDuzenleForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MusteriDuzenlePage({ params }: PageProps) {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "musteriler.guncelle")) {
    redirect(`/musteriler`);
  }

  const { id } = await params;
  const musteri = await prisma.musteri.findFirst({
    where: { id, silindiMi: false },
    select: {
      id: true,
      adSoyad: true,
      telefon: true,
      tcKimlik: true,
      adres: true,
      notlar: true,
      etiketler: true,
    },
  });

  if (!musteri) notFound();

  return (
    <AppShell>
      <SayfaBaslik baslik="Müşteri Düzenle" altBaslik={musteri.adSoyad} />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <MusteriDuzenleForm musteri={musteri} />
        </div>
      </div>
    </AppShell>
  );
}
