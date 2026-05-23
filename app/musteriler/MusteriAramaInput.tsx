"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function MusteriAramaInput({ baslangic }: { baslangic: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [deger, setDeger] = useState(baslangic);

  useEffect(() => {
    const handler = setTimeout(() => {
      const yeni = new URLSearchParams(sp.toString());
      if (deger.trim().length >= 2) {
        yeni.set("arama", deger.trim());
      } else {
        yeni.delete("arama");
      }
      router.push(`/musteriler${yeni.toString() ? `?${yeni}` : ""}`);
    }, 250);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deger]);

  return (
    <div className="relative flex-1">
      <Search
        size={16}
        className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
      />
      <Input
        autoFocus
        value={deger}
        onChange={(e) => setDeger(e.target.value)}
        placeholder="Ad, soyad, telefon..."
        className="pl-9"
      />
    </div>
  );
}
