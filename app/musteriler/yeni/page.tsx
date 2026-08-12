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
      <div className="mx-auto grid max-w-6xl gap-5 p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_280px] lg:p-8">
        <div className="min-w-0">
          <YeniMusteriForm next={next} />
        </div>
        <aside className="order-first rounded-2xl border bg-card p-4 shadow-sm md:order-last md:sticky md:top-5 md:self-start">
          <h2 className="font-semibold">Kayıt ilkeleri</h2>
          <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
            <li>Aynı telefonu kullanan aile bireyleri ayrı müşteri kartları olarak kalır.</li>
            <li>Telefon ve ad eşleşmeleri uyarı üretir; otomatik birleştirme yapılmaz.</li>
            <li>Müşteri kartı satış değildir. Pozitif kapora olmadan sahiplik, alacak veya vekâlet oluşmaz.</li>
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
