import Link from "next/link";
import { Beef } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPara } from "@/shared/lib/para";
import type { KurbanOzet } from "@/modules/hayvanlar/lib/kurban.service";
import { HissedarAvatarGrup } from "./HissedarAvatarGrup";
import { DurumRozeti } from "./DurumRozeti";

interface Props {
  kurbanlar: KurbanOzet[];
}

export function HayvanlarGaleriListe({ kurbanlar }: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Küpe</th>
              <th className="px-3 py-2 font-medium">Saat</th>
              <th className="px-3 py-2 font-medium">Hissedarlar</th>
              <th className="px-3 py-2 font-medium text-right">Bedel</th>
              <th className="px-3 py-2 font-medium text-right">Kalan</th>
              <th className="px-3 py-2 font-medium">Durum</th>
              <th className="px-3 py-2 font-medium text-right">%</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {kurbanlar.map((k) => (
              <tr key={k.id} className="hover:bg-muted/30 cursor-pointer">
                <td className="px-3 py-2 font-bold">
                  <Link href={`/hayvanlar/${k.id}`} className="flex items-center gap-1">
                    <Beef size={14} className="text-muted-foreground" />
                    {k.kesimSirasi}
                  </Link>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{k.kupeNo ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{k.kesimSaati ?? "—"}</td>
                <td className="px-3 py-2">
                  <HissedarAvatarGrup hissedarlar={k.hissedarlar} maxGorunur={4} />
                </td>
                <td className="px-3 py-2 text-right font-tabular">
                  {formatPara(k.satisBedeli)}
                </td>
                <td
                  className={`px-3 py-2 text-right font-tabular font-semibold ${
                    k.kalan > 0 ? "text-amber-600" : "text-green-600"
                  }`}
                >
                  {formatPara(k.kalan)}
                </td>
                <td className="px-3 py-2">
                  <DurumRozeti kurban={k} />
                </td>
                <td className="px-3 py-2 text-right text-xs font-semibold">
                  %{k.ilerlemeYuzde}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
