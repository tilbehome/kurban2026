import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { GirisForm } from "./GirisForm";

interface GirisPageProps {
  searchParams: Promise<{ next?: string; hata?: string }>;
}

export default async function GirisPage({ searchParams }: GirisPageProps) {
  const oturum = await aktifOturum();
  const { next, hata } = await searchParams;

  if (oturum) {
    redirect(next ?? "/");
  }

  return (
    <div className="bg-muted/30 flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="bg-primary text-primary-foreground flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold shadow-lg">
            T
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Tilbe Kurban</h1>
            <p className="text-muted-foreground text-sm">Bayram 2026</p>
          </div>
        </div>
        <GirisForm next={next} hata={hata} />
      </div>
    </div>
  );
}
