import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { YeniMusteriForm } from "./YeniMusteriForm";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function YeniMusteriPage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  return (
    <AppShell>
      <SayfaBaslik
        baslik="Yeni Müşteri"
        altBaslik="Hissedar bilgilerini kaydet"
      />
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <YeniMusteriForm next={next} />
        </div>
      </div>
    </AppShell>
  );
}
