"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * "Geri" butonu — client history.back() çağırır.
 * Server Component olan PlaceholderSayfa içinden kullanılır.
 */
export function GeriDonButonu() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = "/";
        }
      }}
    >
      <ArrowLeft size={16} />
      Geri Dön
    </Button>
  );
}
