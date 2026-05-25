"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  deger: string;
  degisti: (q: string) => void;
  yukleniyor: boolean;
  gecikmeMs?: number;
}

export function MusteriArama({
  deger,
  degisti,
  yukleniyor,
  gecikmeMs = 300,
}: Props) {
  const [yerel, setYerel] = useState(deger);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    zamanlayici.current = setTimeout(() => {
      if (yerel !== deger) degisti(yerel);
    }, gecikmeMs);
    return () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
    };
  }, [yerel, deger, degisti, gecikmeMs]);

  return (
    <div className="relative">
      <Search
        size={16}
        className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
      />
      <Input
        autoFocus
        value={yerel}
        onChange={(e) => setYerel(e.target.value)}
        placeholder="Ad, soyad veya telefon yazın..."
        className="pr-9 pl-9"
      />
      {yukleniyor ? (
        <Loader2
          size={14}
          className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 animate-spin"
        />
      ) : yerel ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setYerel("")}
          className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 p-0"
          aria-label="Temizle"
        >
          <X size={12} />
        </Button>
      ) : null}
    </div>
  );
}
