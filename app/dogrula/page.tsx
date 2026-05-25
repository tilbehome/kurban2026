import type { Metadata } from "next";
import { DogrulaForm } from "./DogrulaForm";
import { tumAyarlar } from "@/modules/_core/ayarlar/ayar.service";
import Image from "next/image";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dekont Doğrulama",
  description: "Aldığınız dekontun gerçek olduğunu kontrol edin.",
};

export default async function DogrulaPage() {
  const ayarlar = await tumAyarlar();
  const firmaAdi = ayarlar.firma_adi ?? "Ada Bereket Hayvancılık";
  const firmaKisaAd = ayarlar.firma_kisa_ad ?? "Ada Bereket";
  const yazilimBranding =
    ayarlar.yazilim_branding ??
    "Bu sistem TilbeCore Kurban Yönetim Sistemi tarafından sağlanmaktadır.";

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/icons/logo-tam.png"
            alt={firmaKisaAd}
            width={200}
            height={88}
            priority
            unoptimized
            className="mx-auto h-16 w-auto object-contain"
          />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Dekont Doğrulama
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Aldığınız {firmaAdi} dekontunun gerçekliğini kontrol edin.
          </p>
        </div>

        <DogrulaForm />

        <p className="mt-10 text-center text-[10px] text-slate-400 italic">
          {yazilimBranding}
        </p>
      </div>
    </div>
  );
}
