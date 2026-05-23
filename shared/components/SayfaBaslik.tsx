import type { ReactNode } from "react";

interface SayfaBaslikProps {
  baslik: string;
  altBaslik?: string;
  aksiyonlar?: ReactNode;
}

export function SayfaBaslik({ baslik, altBaslik, aksiyonlar }: SayfaBaslikProps) {
  return (
    <header className="flex flex-col gap-2 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{baslik}</h1>
        {altBaslik && (
          <p className="text-muted-foreground mt-0.5 text-sm">{altBaslik}</p>
        )}
      </div>
      {aksiyonlar && <div className="flex items-center gap-2">{aksiyonlar}</div>}
    </header>
  );
}
