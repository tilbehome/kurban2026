"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SidebarCollapseButtonProps {
  daraltilmis: boolean;
  onToggle: () => void;
}

/**
 * Sidebar daralt/aç butonu. Ctrl+B ile de tetiklenir.
 */
export function SidebarCollapseButton({
  daraltilmis,
  onToggle,
}: SidebarCollapseButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "border-sidebar-border hover:bg-sidebar-accent absolute top-3.5 -right-3 z-10 hidden h-6 w-6 items-center justify-center rounded-full border bg-white shadow-sm transition-colors lg:flex",
        "text-muted-foreground hover:text-foreground",
      )}
      aria-label={daraltilmis ? "Sidebar'ı genişlet" : "Sidebar'ı daralt"}
      title={`${daraltilmis ? "Genişlet" : "Daralt"} (Ctrl+B)`}
    >
      {daraltilmis ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
    </button>
  );
}
