import { Construction } from "lucide-react";
import { AppShell } from "./AppShell";
import { SayfaBaslik } from "./SayfaBaslik";

interface YakindaSayfasiProps {
  baslik: string;
  aciklama?: string;
}

/**
 * P3 öncelikli sayfalar için ortak placeholder.
 * Bayram sonrası geliştirme listesindeki sayfalar bunu kullanır.
 */
export function YakindaSayfasi({ baslik, aciklama }: YakindaSayfasiProps) {
  return (
    <AppShell>
      <SayfaBaslik baslik={baslik} altBaslik="Yakında — bayram sonrası geliştirme listesi" />
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <div className="bg-muted text-muted-foreground flex h-16 w-16 items-center justify-center rounded-2xl">
          <Construction size={28} />
        </div>
        <h2 className="text-2xl font-medium">Yakında</h2>
        <p className="text-muted-foreground max-w-md">
          {aciklama ??
            "Bu sayfa bayram sonrası geliştirme listesindedir. Acil ihtiyaç varsa lütfen bildirin."}
        </p>
      </div>
    </AppShell>
  );
}
