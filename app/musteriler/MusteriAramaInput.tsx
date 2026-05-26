"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface MusteriAramaInputProps {
  baslangic: string;
  /** Aramanın yönlendirileceği yol (default /musteriler) */
  hedef?: string;
}

export function MusteriAramaInput({
  baslangic,
  hedef = "/musteriler",
}: MusteriAramaInputProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [deger, setDeger] = useState(baslangic);
  const [, startTransition] = useTransition();

  // Server tarafından gelen ilk değeri yansıt
  useEffect(() => {
    setDeger(baslangic);
  }, [baslangic]);

  // Debounced URL güncellemesi
  useEffect(() => {
    if (deger === baslangic) return;
    const handler = setTimeout(() => {
      const yeni = new URLSearchParams(sp.toString());
      if (deger.trim().length >= 2) {
        yeni.set("arama", deger.trim());
      } else {
        yeni.delete("arama");
      }
      // Arama değişince sayfa ve harf filtresini sıfırla
      yeni.delete("sayfa");
      yeni.delete("harf");
      startTransition(() => {
        router.replace(`${hedef}${yeni.toString() ? `?${yeni}` : ""}`);
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [deger, baslangic, sp, router, hedef]);

  function temizle() {
    setDeger("");
  }

  return (
    <div className="relative w-full">
      <Search
        size={20}
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="text"
        value={deger}
        onChange={(e) => setDeger(e.target.value)}
        placeholder="Ad, soyad veya telefon ile ara..."
        className="h-12 w-full rounded-xl border-2 border-border bg-white pl-12 pr-12 text-base placeholder:text-muted-foreground transition-all hover:border-muted-foreground/40 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
        autoComplete="off"
        spellCheck={false}
        autoFocus
        aria-label="Müşteri ara"
      />
      {deger && (
        <button
          type="button"
          onClick={temizle}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted-foreground/20"
          aria-label="Aramayı temizle"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
