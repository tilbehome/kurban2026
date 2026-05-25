"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { TvTema } from "@/modules/tv/types";

interface TvTemaToggleProps {
  tema: TvTema;
  onToggle: () => void;
}

export function TvTemaToggle({ tema, onToggle }: TvTemaToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={tema === "light" ? "Koyu tema" : "Açık tema"}
      title={tema === "light" ? "Koyu tema" : "Açık tema"}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
        tema === "light"
          ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
          : "bg-slate-700 text-slate-200 hover:bg-slate-600",
      )}
    >
      {tema === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
