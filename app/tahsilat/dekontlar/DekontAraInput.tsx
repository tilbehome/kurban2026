"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface DekontAraInputProps {
  baslangic: string;
}

export function DekontAraInput({ baslangic }: DekontAraInputProps) {
  const router = useRouter();
  const [deger, setDeger] = useState(baslangic);

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = deger.trim();
      router.push(
        `/tahsilat/dekontlar${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ""}`,
      );
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deger]);

  return (
    <div className="relative">
      <Search
        size={16}
        className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
      />
      <Input
        value={deger}
        onChange={(e) => setDeger(e.target.value)}
        placeholder="Dekont no veya müşteri adı..."
        className="pl-9"
        autoFocus
      />
    </div>
  );
}
