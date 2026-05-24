import Link from "next/link";
import { redirect } from "next/navigation";
import { Tv, ArrowLeft, Sparkles } from "lucide-react";
import { aktifOturum } from "@/shared/lib/session";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/**
 * TV Ekranı (fullscreen) — Faz 2'de canlı kesim akışı + müşteri sıra ekranı
 * burada render edilecek. Şimdilik açılış sayfası.
 *
 * AppShell kullanmaz — TV için tam ekran modu.
 */
export default async function TvSayfasi() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-500/30">
          <Sparkles size={12} />
          Bayram Öncesi Hazırlık
        </span>

        <div className="from-primary to-primary/70 ring-primary/30 flex h-32 w-32 items-center justify-center rounded-3xl bg-linear-to-br shadow-2xl ring-4">
          <Tv size={64} strokeWidth={1.5} />
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          TV Ekranı
        </h1>
        <p className="text-primary/90 text-xl font-semibold">
          Canlı Kesim Takip Paneli
        </p>

        <p className="max-w-2xl text-slate-300">
          Burada bayram günü canlı kesim akışı, müşteri sıra ekranı ve genel
          operasyon durumu gösterilecek. Müşterilere ve ekibe açık fullscreen
          görünüm.
        </p>

        <div className="grid w-full max-w-3xl grid-cols-1 gap-4 pt-6 sm:grid-cols-3">
          {[
            { ad: "Canlı Akış", aciklama: "7 aşamalı kesim pipeline" },
            { ad: "Sıra Ekranı", aciklama: "Sıradaki müşteriler" },
            { ad: "İstatistik", aciklama: "Günün özet rakamları" },
          ].map((k) => (
            <div
              key={k.ad}
              className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5"
            >
              <div className="text-primary text-2xl font-bold">{k.ad}</div>
              <div className="mt-1 text-sm text-slate-400">{k.aciklama}</div>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className={buttonVariants({ variant: "outline" }) + " mt-8"}
        >
          <ArrowLeft size={16} />
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
