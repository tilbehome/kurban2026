"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Beef, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { KurbanOzet } from "@/modules/hayvanlar/lib/kurban.service";
import {
  type DurumKategori,
  type SiralaTip,
  type GorunumTip,
  type HisseGrubuFiltre,
  aramaUygunMu,
  kategoriyeUygunMu,
  kategoriSayilari,
  hisseGrubuUygunMu,
  sirala as siralaListe,
} from "@/modules/hayvanlar/lib/kurban-filtre";
import { HayvanlarGaleriUst } from "./HayvanlarGaleriUst";
import { KurbanKart } from "./KurbanKart";
import { HayvanlarGaleriListe } from "./HayvanlarGaleriListe";

interface Props {
  kurbanlar: KurbanOzet[];
}

export function HayvanlarGaleri({ kurbanlar }: Props) {
  const [sorgu, setSorgu] = useState("");
  const [kategori, setKategori] = useState<DurumKategori>("hepsi");
  const [hisseGrubuFiltre, setHisseGrubuFiltre] =
    useState<HisseGrubuFiltre>("tum");
  const [sirala, setSirala] = useState<SiralaTip>("sira");
  const [gorunum, setGorunum] = useState<GorunumTip>("grid");

  const sayilar = useMemo(() => kategoriSayilari(kurbanlar), [kurbanlar]);

  const filtreli = useMemo(() => {
    const filtreList = kurbanlar
      .filter((k) => kategoriyeUygunMu(k, kategori))
      .filter((k) => hisseGrubuUygunMu(k, hisseGrubuFiltre))
      .filter((k) => aramaUygunMu(k, sorgu));
    return siralaListe(filtreList, sirala);
  }, [kurbanlar, kategori, hisseGrubuFiltre, sorgu, sirala]);

  if (kurbanlar.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <Beef size={36} className="text-muted-foreground/40" />
        <p className="text-muted-foreground">Henüz kurban kayıtlı değil.</p>
        <Link href="/hayvanlar/yeni">
          <Button>
            <Plus size={14} className="mr-1" />
            Yeni Kurban Ekle
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <HayvanlarGaleriUst
        sorgu={sorgu}
        setSorgu={setSorgu}
        kategori={kategori}
        setKategori={setKategori}
        hisseGrubuFiltre={hisseGrubuFiltre}
        setHisseGrubuFiltre={setHisseGrubuFiltre}
        sirala={sirala}
        setSirala={setSirala}
        gorunum={gorunum}
        setGorunum={setGorunum}
        sayilar={sayilar}
      />

      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>
          {filtreli.length} kurban gösteriliyor
          {sorgu && ` · "${sorgu}" araması`}
        </span>
        <Link href="/hayvanlar/yeni">
          <Button size="sm" variant="outline">
            <Plus size={14} className="mr-1" />
            Yeni Kurban
          </Button>
        </Link>
      </div>

      {filtreli.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center">
          <Beef size={28} className="text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            Bu filtrelere uygun kurban yok.
          </p>
        </Card>
      ) : gorunum === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtreli.map((k) => (
            <KurbanKart key={k.id} kurban={k} />
          ))}
        </div>
      ) : (
        <HayvanlarGaleriListe kurbanlar={filtreli} />
      )}
    </div>
  );
}
