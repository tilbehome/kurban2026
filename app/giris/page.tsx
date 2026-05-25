import Image from "next/image";
import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { ayarOku } from "@/modules/_core/ayarlar/ayar.service";
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

  const firmaAdi = await ayarOku("firma_adi", "Ada Bereket Hayvancılık");
  const firmaSlogan = await ayarOku(
    "firma_slogan",
    "Güvenilir Hizmet, Bereketli Kazanç",
  );

  return (
    <div className="bg-muted/30 flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Image
            src="/icons/logo-tam.png"
            alt={firmaAdi}
            width={245}
            height={108}
            priority
            className="h-auto w-48"
            unoptimized
          />
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">{firmaAdi}</h1>
            <p className="text-muted-foreground text-xs italic">
              {firmaSlogan}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Kurban Bayramı 2026
            </p>
          </div>
        </div>
        <GirisForm next={next} hata={hata} />
        <p className="text-muted-foreground/60 mt-6 text-center text-[10px]">
          Bu sistem{" "}
          <span className="font-semibold">TilbeCore</span> Kurban Yönetim
          Sistemi tarafından sağlanmaktadır
        </p>
      </div>
    </div>
  );
}
