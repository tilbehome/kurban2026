"use client";

import Link from "next/link";
import * as Icons from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface MusteriHizliEylemBarProps {
  musteriId: string;
  telefon: string | null;
  izinler: {
    tahsilat: boolean;
    iade: boolean;
    guncelle: boolean;
    iletisim: boolean;
    hisseAta: boolean;
    etiket: boolean;
    sil: boolean;
  };
  /** Tahsilat panelini aç/kapat (hash anchor scroll için) */
  tahsilatPanelHref: string;
  iadeAc: () => void;
  hisseAtamaAc: () => void;
  etiketAc: () => void;
  silAc: () => void;
}

/**
 * Müşteri detay sayfasının üstünde yatay buton barı.
 * 9 buton: Tahsilat, İade, Düzenle, WhatsApp, Ekstre, Excel, Hisse, Etiket, Daha Fazla.
 */
export function MusteriHizliEylemBar({
  musteriId,
  telefon,
  izinler,
  tahsilatPanelHref,
  iadeAc,
  hisseAtamaAc,
  etiketAc,
  silAc,
}: MusteriHizliEylemBarProps) {
  const waLink = telefon
    ? `https://wa.me/${telefon.replace(/\D/g, "")}`
    : undefined;

  return (
    <div className="bg-muted/30 flex flex-wrap items-center gap-1.5 border-b px-4 py-2.5 sm:px-6">
      {izinler.tahsilat && (
        <a
          href={tahsilatPanelHref}
          className={buttonVariants({ size: "sm" })}
        >
          <Icons.Wallet size={14} className="mr-1" />
          Tahsilat Al
        </a>
      )}
      {izinler.iade && (
        <Button size="sm" variant="outline" onClick={iadeAc}>
          <Icons.ArrowLeftRight size={14} className="mr-1" />
          İade Yap
        </Button>
      )}
      {izinler.guncelle && (
        <Link
          href={`/musteriler/${musteriId}/duzenle`}
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          <Icons.Pencil size={14} className="mr-1" />
          Düzenle
        </Link>
      )}
      {izinler.iletisim && waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          <Icons.MessageCircle size={14} className="mr-1 text-green-600" />
          WhatsApp
        </a>
      )}
      <a
        href={`/api/musteriler/${musteriId}/ekstre`}
        target="_blank"
        rel="noreferrer"
        className={buttonVariants({ size: "sm", variant: "outline" })}
      >
        <Icons.FileText size={14} className="mr-1" />
        Hesap Ekstresi
      </a>
      <a
        href={`/api/musteriler/${musteriId}/excel`}
        className={buttonVariants({ size: "sm", variant: "outline" })}
      >
        <Icons.Download size={14} className="mr-1" />
        Excel
      </a>
      {izinler.hisseAta && (
        <Button size="sm" variant="outline" onClick={hisseAtamaAc}>
          <Icons.Plus size={14} className="mr-1" />
          Hisse Ata
        </Button>
      )}
      {izinler.etiket && (
        <Button size="sm" variant="outline" onClick={etiketAc}>
          <Icons.Tag size={14} className="mr-1" />
          Etiket
        </Button>
      )}

      {/* Daha fazla menüsü */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="sm" variant="outline">
              <Icons.MoreHorizontal size={14} />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            render={
              <Link href={`/musteriler/${musteriId}?tab=notlar`}>
                <Icons.StickyNote size={14} className="mr-2" />
                Notlar
              </Link>
            }
          />
          {telefon && (
            <DropdownMenuItem
              render={
                <a href={`tel:${telefon}`}>
                  <Icons.Phone size={14} className="mr-2" />
                  Ara
                </a>
              }
            />
          )}
          <DropdownMenuSeparator />
          {izinler.sil && (
            <DropdownMenuItem
              className="text-destructive"
              onClick={silAc}
            >
              <Icons.Trash2 size={14} className="mr-2" />
              Müşteriyi Sil
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
