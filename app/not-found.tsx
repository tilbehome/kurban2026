/**
 * 404 sayfası — Next.js App Router not-found handler.
 *
 * SPRINT-P3 İŞ 2: Yanlış URL veya silinmiş kayıt için net mesaj.
 */

import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-stone-50 flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-lg">
        <div className="mb-4 text-6xl">🔍</div>
        <h1 className="text-stone-900 mb-2 text-2xl font-bold">
          Sayfa Bulunamadı
        </h1>
        <p className="text-stone-500 mb-6 text-sm">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link href="/">
          <Button size="lg" className="w-full">
            <Home className="h-4 w-4" />
            Ana Sayfaya Dön
          </Button>
        </Link>
      </div>
    </div>
  );
}
