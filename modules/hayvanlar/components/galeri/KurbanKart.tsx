import Link from "next/link";
import { Beef, Clock, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { KurbanOzet } from "@/modules/hayvanlar/lib/kurban.service";
import { formatPara } from "@/shared/lib/para";
import { HissedarAvatarGrup } from "./HissedarAvatarGrup";
import { DurumRozeti } from "./DurumRozeti";

interface Props {
  kurban: KurbanOzet;
}

export function KurbanKart({ kurban }: Props) {
  return (
    <Link href={`/hayvanlar/${kurban.id}`} className="block group">
      <Card className="hover:border-primary hover:shadow-md flex h-full flex-col p-4 transition-all">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Beef size={16} className="text-muted-foreground" />
            <span className="text-lg font-bold">#{kurban.kesimSirasi}</span>
            <span className="text-muted-foreground text-xs">Büyükbaş</span>
          </div>
          <DurumRozeti kurban={kurban} />
        </div>

        <div className="text-muted-foreground mb-3 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          {kurban.kupeNo && (
            <span className="font-mono">Küpe: {kurban.kupeNo}</span>
          )}
          {kurban.hisseGrubu && (
            <span className="inline-flex items-center rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">
              {kurban.hisseGrubu} KG
            </span>
          )}
          {kurban.kesimSaati && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {kurban.kesimSaati}
            </span>
          )}
          {kurban.canliAgirlik != null && kurban.canliAgirlik > 0 && (
            <span className="flex items-center gap-1">
              <Scale size={11} />
              {kurban.canliAgirlik} kg
            </span>
          )}
        </div>

        <div className="mb-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bedel</span>
            <span className="font-tabular">{formatPara(kurban.satisBedeli)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ödenen</span>
            <span className="font-tabular text-green-600">
              {formatPara(kurban.toplamOdenen)}
            </span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Kalan</span>
            <span
              className={`font-tabular ${
                kurban.kalan > 0 ? "text-amber-600" : "text-green-600"
              }`}
            >
              {formatPara(kurban.kalan)}
            </span>
          </div>
        </div>

        <div className="mb-3 border-t pt-3">
          <HissedarAvatarGrup hissedarlar={kurban.hissedarlar} maxGorunur={5} />
        </div>

        <div className="mt-auto">
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${kurban.ilerlemeYuzde}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-right text-xs">
            %{kurban.ilerlemeYuzde}
          </p>
        </div>
      </Card>
    </Link>
  );
}
