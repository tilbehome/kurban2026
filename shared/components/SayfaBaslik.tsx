import type { ReactNode } from "react";

interface SayfaBaslikProps {
  baslik: string;
  altBaslik?: string;
  aksiyonlar?: ReactNode;
}

export function SayfaBaslik({ baslik, altBaslik, aksiyonlar }: SayfaBaslikProps) {
  return (
    <header className="flex flex-col gap-2 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-5 lg:px-8">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
          {baslik}
        </h1>
        {altBaslik && (
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
            {altBaslik}
          </p>
        )}
      </div>
      {aksiyonlar && (
        <div className="flex flex-wrap items-center gap-2">{aksiyonlar}</div>
      )}
    </header>
  );
}
