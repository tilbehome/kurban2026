"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { formatPara } from "@/shared/lib/para";
import { avatarGradient } from "@/modules/dashboard/types";
import {
  KURBAN_DURUM_RENKLERI,
  type KurbanKartVeri,
} from "@/modules/hayvanlar/types/hisse-atama";

interface ListeGorunumuProps {
  kurbanlar: KurbanKartVeri[];
}

type SiraDurumu = "siraArtan" | "siraAzalan" | "doluluk" | "boshisse";

export function ListeGorunumu({ kurbanlar }: ListeGorunumuProps) {
  const [arama, setArama] = useState("");
  const [siralama, setSiralama] = useState<SiraDurumu>("siraArtan");

  const filtreli = useMemo(() => {
    let liste = kurbanlar.flatMap((k) =>
      k.hisseler.map((h) => ({ kurban: k, hisse: h })),
    );

    const q = arama.trim().toLowerCase();
    if (q) {
      liste = liste.filter(
        (r) =>
          r.kurban.kesimSirasi.toString().includes(q) ||
          r.kurban.kupeNo?.toLowerCase().includes(q) ||
          r.hisse.musteriAdSoyad?.toLowerCase().includes(q),
      );
    }

    if (siralama === "siraArtan") {
      liste.sort(
        (a, b) =>
          a.kurban.kesimSirasi - b.kurban.kesimSirasi || a.hisse.no - b.hisse.no,
      );
    } else if (siralama === "siraAzalan") {
      liste.sort(
        (a, b) =>
          b.kurban.kesimSirasi - a.kurban.kesimSirasi || a.hisse.no - b.hisse.no,
      );
    } else if (siralama === "doluluk") {
      liste.sort((a, b) => b.kurban.dolulukYuzde - a.kurban.dolulukYuzde);
    } else if (siralama === "boshisse") {
      liste.sort((a, b) => {
        if (a.hisse.durum === "bos" && b.hisse.durum !== "bos") return -1;
        if (a.hisse.durum !== "bos" && b.hisse.durum === "bos") return 1;
        return a.kurban.kesimSirasi - b.kurban.kesimSirasi;
      });
    }
    return liste;
  }, [kurbanlar, arama, siralama]);

  function exceleAktar() {
    const baslik =
      "Kurban,Hisse,Müşteri,Fiyat,Ödenen,Durum\n";
    const satirlar = filtreli
      .map(
        (r) =>
          `${r.kurban.kesimSirasi},${r.hisse.no},${
            r.hisse.musteriAdSoyad ?? ""
          },${r.hisse.hisseFiyati},${r.hisse.odenenToplam},${r.hisse.durum}`,
      )
      .join("\n");
    const blob = new Blob([baslik + satirlar], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hisse-atama-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">
            Hisse Listesi · {filtreli.length} kayıt
          </CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exceleAktar}
            >
              CSV İndir
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={14}
              className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2"
            />
            <Input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Ara (kurban no, küpe, müşteri adı)"
              className="h-9 pl-8 text-sm"
            />
            {arama && (
              <button
                type="button"
                onClick={() => setArama("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <select
            value={siralama}
            onChange={(e) => setSiralama(e.target.value as SiraDurumu)}
            className="border-input bg-background rounded-md border px-2.5 py-2 text-xs"
          >
            <option value="siraArtan">Sıra (artan)</option>
            <option value="siraAzalan">Sıra (azalan)</option>
            <option value="doluluk">Doluluk %</option>
            <option value="boshisse">Boş hisseler önce</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-stone-50 text-left">
                <th className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase">
                  Kurban
                </th>
                <th className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase">
                  Hisse
                </th>
                <th className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase">
                  Müşteri
                </th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-wider uppercase">
                  Fiyat
                </th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold tracking-wider uppercase">
                  Ödenen
                </th>
                <th className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody>
              {filtreli.map(({ kurban, hisse }) => {
                const durum = KURBAN_DURUM_RENKLERI[kurban.durumRozeti];
                const grad = hisse.musteriId
                  ? avatarGradient(hisse.musteriId)
                  : null;
                return (
                  <tr
                    key={hisse.id}
                    className={cn(
                      "hover:bg-stone-50 border-b transition-colors",
                      hisse.durum === "bos" && "bg-stone-50/40",
                    )}
                  >
                    <td className="px-3 py-2 font-mono">
                      #{kurban.kesimSirasi}{" "}
                      <span className="text-muted-foreground text-[10px]">
                        {kurban.cins}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono font-semibold">
                      {hisse.no}
                    </td>
                    <td className="px-3 py-2">
                      {hisse.musteriId && grad ? (
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br text-[10px] font-bold text-white",
                              grad.from,
                              grad.to,
                            )}
                          >
                            {hisse.musteriBashar}
                          </span>
                          <span className="truncate">
                            {hisse.musteriAdSoyad}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          (boş)
                        </span>
                      )}
                    </td>
                    <td className="font-tabular px-3 py-2 text-right">
                      {formatPara(hisse.hisseFiyati)}
                    </td>
                    <td
                      className={cn(
                        "font-tabular px-3 py-2 text-right",
                        hisse.odenenToplam >= hisse.hisseFiyati &&
                          hisse.hisseFiyati > 0
                          ? "font-semibold text-green-700"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatPara(hisse.odenenToplam)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                          durum.bg,
                          durum.text,
                          durum.ring,
                        )}
                      >
                        {durum.etiket}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
