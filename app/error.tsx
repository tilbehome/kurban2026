"use client";

/**
 * Sayfa seviyesi error boundary — Next.js App Router.
 * Bir route segmenti veya çocuk component crash ederse bu UI gösterilir.
 *
 * SPRINT-P3 İŞ 2: Bayram günü kasiyer beyaz ekran yerine net mesaj görsün
 * + "tahsilat aldıysanız liste kontrol edin" uyarısı (çift ödeme riski).
 */

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HataSayfasiProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function HataSayfasi({ error, reset }: HataSayfasiProps) {
  useEffect(() => {
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <div className="bg-stone-50 flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-red-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-red-100 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            <AlertTriangle className="text-red-600 h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-stone-900 text-lg font-bold">
              Bir Hata Oluştu
            </h1>
            <p className="text-stone-500 text-xs">
              Sistem geçici bir sorunla karşılaştı
            </p>
          </div>
        </div>

        <div className="border-amber-200 bg-amber-50 mb-4 rounded-lg border p-3">
          <p className="text-amber-900 mb-1 text-sm font-semibold">
            ⚠️ Önemli Uyarı
          </p>
          <p className="text-amber-800 text-xs leading-relaxed">
            Az önce <strong>tahsilat</strong> aldıysanız, ödeme kaydedilmiş
            olabilir. Aynı ödemeyi tekrar almadan önce{" "}
            <strong>Tahsilat Listesi</strong>&apos;ni kontrol edin.
          </p>
        </div>

        {error.digest && (
          <div className="bg-stone-100 mb-4 rounded-lg p-2">
            <p className="text-stone-500 font-mono text-xs break-all">
              Hata Kodu: {error.digest}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button onClick={reset} size="lg" className="w-full">
            <RefreshCw className="h-4 w-4" />
            Sayfayı Yenile
          </Button>

          <Link href="/" className="w-full">
            <Button variant="outline" size="lg" className="w-full">
              <Home className="h-4 w-4" />
              Ana Sayfaya Dön
            </Button>
          </Link>

          <Link href="/tahsilat/dekontlar" className="w-full">
            <Button variant="ghost" size="sm" className="w-full">
              Tahsilat Listesini Kontrol Et
            </Button>
          </Link>
        </div>

        <p className="text-stone-400 mt-4 text-center text-xs">
          Sorun devam ederse Bünyamin Tilbe ile iletişime geçin.
          <br />
          0530 889 54 34
        </p>
      </div>
    </div>
  );
}
