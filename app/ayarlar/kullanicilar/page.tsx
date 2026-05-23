import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus } from "lucide-react";
import { formatTarihSaat } from "@/shared/lib/tarih";
import { KullaniciActions } from "./KullaniciActions";

export const dynamic = "force-dynamic";

export default async function KullanicilarPage() {
  const oturum = await aktifOturum();
  if (!oturum || !adminMi(oturum.rol)) {
    return (
      <AppShell>
        <SayfaBaslik baslik="Kullanıcı Yönetimi" />
        <div className="p-8">
          <p className="text-muted-foreground">
            Bu sayfayı sadece yöneticiler görüntüleyebilir.
          </p>
        </div>
      </AppShell>
    );
  }

  const kullanicilar = await prisma.kullanici.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      kullaniciAdi: true,
      adSoyad: true,
      rol: true,
      aktif: true,
      sonGiris: true,
      createdAt: true,
    },
  });

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Kullanıcı Yönetimi"
        altBaslik={`${kullanicilar.length} kullanıcı kayıtlı`}
        aksiyonlar={
          <>
            <Link href="/ayarlar" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft size={16} className="mr-1" />
              Ayarlara Dön
            </Link>
            <KullaniciActions mod="ekle" />
          </>
        }
      />
      <div className="p-6 sm:p-8">
        <Card className="max-w-4xl">
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
                <tr>
                  <th className="px-4 py-3 font-medium">Kullanıcı Adı</th>
                  <th className="px-4 py-3 font-medium">Ad Soyad</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">Son Giriş</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {kullanicilar.map((k) => (
                  <tr key={k.id}>
                    <td className="px-4 py-3 font-mono">{k.kullaniciAdi}</td>
                    <td className="px-4 py-3">{k.adSoyad}</td>
                    <td className="px-4 py-3">
                      <Badge variant={k.rol === "admin" ? "default" : "secondary"}>
                        {k.rol}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {k.aktif ? (
                        <span className="text-green-600">Aktif</span>
                      ) : (
                        <span className="text-muted-foreground">Pasif</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {k.sonGiris ? formatTarihSaat(k.sonGiris) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <KullaniciActions mod="duzenle" kullaniciId={k.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <p className="text-muted-foreground mt-3 text-xs">
          <UserPlus size={12} className="inline" /> İlk yöneticinin (admin) şifresini
          değiştirmeyi unutmayın.
        </p>
      </div>
    </AppShell>
  );
}
