"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import type { Rol } from "@/shared/types/module.types";

interface MobileSidebarProps {
  kullaniciAdSoyad: string;
  kullaniciRol: Rol;
}

/**
 * Mobile için hamburger menü + Sheet drawer (slide-from-left).
 * 1024px altında AppShell tarafından kullanılır.
 */
export function MobileSidebar({
  kullaniciAdSoyad,
  kullaniciRol,
}: MobileSidebarProps) {
  const [acik, setAcik] = useState(false);

  return (
    <div className="lg:hidden">
      <Sheet open={acik} onOpenChange={setAcik}>
        <SheetTrigger
          render={
            <button
              type="button"
              className="hover:bg-accent text-foreground flex h-9 w-9 items-center justify-center rounded-md transition-colors"
              aria-label="Menüyü aç"
            >
              <Menu size={20} />
            </button>
          }
        />
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Ana Menü</SheetTitle>
          <Sidebar
            kullaniciAdSoyad={kullaniciAdSoyad}
            kullaniciRol={kullaniciRol}
            mobil
            onMobilKapat={() => setAcik(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
