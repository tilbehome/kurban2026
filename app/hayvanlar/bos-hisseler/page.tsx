import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/shared/lib/prisma";
import { formatPara } from "@/shared/lib/para";
import { PackageOpen, UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BosHisselerPage() {
  const bosHisseler = await prisma.hisse.findMany({
    where: { musteriId: null },
    include: {
      kurban: { select: { kesimSirasi: true, kupeNo: true } },
    },
    orderBy: [{ kurban: { kesimSirasi: "asc" } }, { no: "asc" }],
  });

  const grupla = new Map<string, typeof bosHisseler>();
  for (const h of bosHisseler) {
    const k = h.kurbanId;
    if (!grupla.has(k)) grupla.set(k, []);
    grupla.get(k)!.push(h);
  }

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Boş Hisseler"
        altBaslik={`${bosHisseler.length} hisse atanmamış · ${grupla.size} kurban`}
        aksiyonlar={
          <Link href="/hayvanlar/hisse-atama" className={buttonVariants()}>
            <UserPlus size={16} className="mr-1" />
            Hisse Ata
          </Link>
        }
      />

      <div className="p-6 sm:p-8">
        {bosHisseler.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-12 text-center">
            <PackageOpen size={32} className="text-muted-foreground/40" />
            <p className="text-muted-foreground">Tüm hisseler atanmış 🎉</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from(grupla.entries()).map(([kurbanId, hisseler]) => {
              const k = hisseler[0]!.kurban;
              return (
                <Card key={kurbanId}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Kurban #{k.kesimSirasi}</span>
                      <span className="text-muted-foreground text-xs">
                        {k.kupeNo ?? "—"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {hisseler.map((h) => (
                        <span
                          key={h.id}
                          className="bg-amber-100 text-amber-700 inline-flex h-7 w-7 items-center justify-center rounded-md font-mono text-sm font-semibold"
                          title={`Hisse #${h.no} - ${formatPara(h.hisseFiyati)}`}
                        >
                          {h.no}
                        </span>
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-3 text-xs">
                      {hisseler.length} boş · her hisse{" "}
                      {formatPara(hisseler[0]!.hisseFiyati)}
                    </p>
                    <Link
                      href={`/hayvanlar/${kurbanId}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Kurban Detayı
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
