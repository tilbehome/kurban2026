"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

export function YedekActions() {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();
  const [sonYedek, setSonYedek] = useState<string | null>(null);

  function yedekAl() {
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/yedek", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ neden: "manuel" }),
        });
        const veri = (await yanit.json()) as {
          basarili: boolean;
          yedekYolu?: string;
          boyutKB?: number;
          hata?: string;
        };
        if (!yanit.ok || !veri.basarili) {
          throw new Error(veri.hata ?? "Yedek alınamadı");
        }
        setSonYedek(veri.yedekYolu ?? null);
        toast.success(`Yedek alındı (${veri.boyutKB} KB)`);
        router.refresh();
      } catch (e) {
        const m = e instanceof Error ? e.message : "Bilinmeyen hata";
        toast.error(m);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={yedekAl} disabled={bekleniyor} className="self-start">
        <Database size={16} className="mr-2" />
        {bekleniyor ? "Yedekleniyor..." : "Şimdi Yedek Al"}
      </Button>
      {sonYedek && (
        <p className="text-muted-foreground text-xs">
          Son yedek: <code>{sonYedek}</code>
        </p>
      )}
    </div>
  );
}
