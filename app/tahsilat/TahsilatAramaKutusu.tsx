"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPara } from "@/shared/lib/para";
import { buttonVariants } from "@/components/ui/button";

interface AramaSonucu {
  id: number;
  adSoyad: string;
  telefon: string | null;
  hisseSayisi: number;
  kalan: number;
  kurbanlar: { kesimSirasi: number; hisseNo: number }[];
}

export function TahsilatAramaKutusu() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sonuclar, setSonuclar] = useState<AramaSonucu[]>([]);
  const [araniyor, startTransition] = useTransition();
  const [secili, setSecili] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Ctrl+K kısayolu
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Arama (debounced)
  useEffect(() => {
    if (q.trim().length < 2) {
      setSonuclar([]);
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        try {
          const yanit = await fetch(
            `/api/musteriler/ara?q=${encodeURIComponent(q.trim())}&limit=12`,
          );
          const veri = (await yanit.json()) as { sonuclar: AramaSonucu[] };
          setSonuclar(veri.sonuclar);
          setSecili(0);
        } catch {
          setSonuclar([]);
        }
      });
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSecili((s) => Math.min(s + 1, sonuclar.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSecili((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && sonuclar[secili]) {
      e.preventDefault();
      router.push(`/tahsilat/musteri/${sonuclar[secili].id}`);
    } else if (e.key === "Escape") {
      setQ("");
      setSonuclar([]);
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={18}
          className="text-muted-foreground absolute top-1/2 left-3.5 -translate-y-1/2"
        />
        <Input
          ref={inputRef}
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ad, soyad, telefon, kurban no... (Ctrl+K)"
          className="h-12 pl-10 text-base"
        />
        <kbd className="bg-muted text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded border px-1.5 py-0.5 text-xs">
          Ctrl+K
        </kbd>
      </div>

      {q.trim().length >= 2 && (
        <Card className="absolute z-30 mt-2 max-h-[60vh] w-full overflow-y-auto p-2 shadow-lg">
          {araniyor && (
            <p className="text-muted-foreground px-3 py-2 text-sm">Aranıyor...</p>
          )}
          {!araniyor && sonuclar.length === 0 && (
            <div className="flex flex-col gap-2 px-3 py-4">
              <p className="text-muted-foreground text-sm">
                "{q}" için sonuç yok.
              </p>
              <Link
                href={`/musteriler/yeni?next=/tahsilat`}
                className={buttonVariants({ size: "sm" })}
              >
                <UserPlus size={14} className="mr-1" />
                Yeni Müşteri Ekle
              </Link>
            </div>
          )}
          {sonuclar.map((s, i) => (
            <Link
              key={s.id}
              href={`/tahsilat/musteri/${s.id}`}
              className={`flex items-center justify-between rounded-md px-3 py-2.5 transition-colors ${
                i === secili ? "bg-muted" : "hover:bg-muted/50"
              }`}
              onMouseEnter={() => setSecili(i)}
            >
              <div className="flex flex-col">
                <span className="font-medium">{s.adSoyad}</span>
                <span className="text-muted-foreground flex items-center gap-2 text-xs">
                  {s.telefon && (
                    <>
                      <Phone size={11} />
                      <span className="font-mono">{s.telefon}</span>
                    </>
                  )}
                  {s.hisseSayisi > 0 && (
                    <span>
                      {s.hisseSayisi} hisse:{" "}
                      {s.kurbanlar
                        .map((k) => `#${k.kesimSirasi}.${k.hisseNo}`)
                        .join(", ")}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {s.kalan > 0 ? (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                    Kalan: {formatPara(s.kalan)}
                  </Badge>
                ) : s.hisseSayisi > 0 ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    Ödendi
                  </Badge>
                ) : null}
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
