import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card } from "@/components/ui/card";
import { kurbanlariListele } from "@/modules/hayvanlar/lib/kurban.service";
import { formatPara } from "@/shared/lib/para";

export const dynamic = "force-dynamic";

export default async function HayvanlarPage() {
  const kurbanlar = await kurbanlariListele();

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Hayvanlar"
        altBaslik={`${kurbanlar.length} kurban kayıtlı`}
      />
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3 xl:grid-cols-4">
        {kurbanlar.map((k) => (
          <Link key={k.id} href={`/hayvanlar/${k.id}`}>
            <Card className="hover:border-primary p-4 transition-colors">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-lg font-bold">#{k.kesimSirasi}</span>
                {k.kupeNo && (
                  <span className="text-muted-foreground font-mono text-xs">
                    Küpe: {k.kupeNo}
                  </span>
                )}
              </div>

              <div className="text-muted-foreground mb-3 text-xs">
                {k.hisseSayisi} hisse · {k.bosHisseSayisi} boş
                {k.kesimSaati && ` · ${k.kesimSaati}`}
              </div>

              <div className="mb-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bedel:</span>
                  <span className="font-tabular">{formatPara(k.satisBedeli)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ödenen:</span>
                  <span className="font-tabular text-green-600">
                    {formatPara(k.toplamOdenen)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Kalan:</span>
                  <span
                    className={`font-tabular ${
                      k.kalan > 0 ? "text-amber-600" : "text-green-600"
                    }`}
                  >
                    {formatPara(k.kalan)}
                  </span>
                </div>
              </div>

              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${k.ilerlemeYuzde}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-1 text-right text-xs">
                {k.ilerlemeYuzde}%
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
