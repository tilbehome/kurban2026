import { Construction } from "lucide-react";
import { AppShell } from "./AppShell";
import { PlaceholderSayfa } from "./PlaceholderSayfa";
import { altMenuyuBul } from "@/shared/lib/sidebar-config";

/**
 * Placeholder sayfa factory — sidebar-config'teki alt menü kaydından
 * baslik/aciklama/ikon/faz/ozellikler bilgilerini otomatik çekip
 * <PlaceholderSayfa> render eder.
 *
 * Her placeholder page.tsx tek satırla yazılır:
 *   export default placeholderSayfaUret("/musteriler/vip");
 */
export function placeholderSayfaUret(rota: string) {
  return function PlaceholderRoute() {
    const alt = altMenuyuBul(rota);
    return (
      <AppShell>
        <PlaceholderSayfa
          baslik={alt?.ad ?? "Geliyor"}
          aciklama={
            alt?.aciklama ??
            "Bu modül yakında sizinle olacak. Burhan Bey'in önceliklerine göre sıralanıyor."
          }
          ikon={alt?.ikon ?? Construction}
          faz={alt?.faz}
          ozellikler={alt?.ozellikler ?? []}
        />
      </AppShell>
    );
  };
}
