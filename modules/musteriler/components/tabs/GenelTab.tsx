import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatPara } from "@/shared/lib/para";
import { formatTarihSaat, gorelTarih } from "@/shared/lib/tarih";
import { tcMaskele } from "../../lib/tc-maskele";
import { etiketleriParse } from "../../lib/aktivite.service";
import type { AktiviteSatir } from "../../lib/aktivite.service";
import {
  IdCard,
  MapPin,
  Calendar,
  Activity,
  StickyNote,
  Plus,
  Tag,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
} from "lucide-react";

interface GenelTabProps {
  musteri: {
    id: string;
    adSoyad: string;
    telefon: string | null;
    tcKimlik: string | null;
    adres: string | null;
    etiketler: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  istatistik: {
    hisseSayisi: number;
    toplamBedel: number;
    odenen: number;
    kalan: number;
  };
  aktiviteler: AktiviteSatir[];
  sonNotlar: {
    id: string;
    icerik: string;
    renk: string;
    createdAt: Date;
  }[];
  /** Etiket düzenleme yetkisi */
  etiketYazabilir: boolean;
  /** Etiket ekle modal'ı açar (client-side bileşenden gelir) */
  etiketEkleHref?: string;
}

export function GenelTab({
  musteri,
  istatistik,
  aktiviteler,
  sonNotlar,
  etiketYazabilir,
  etiketEkleHref,
}: GenelTabProps) {
  const etiketler = etiketleriParse(musteri.etiketler);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* SOL: Kişisel + Etiket */}
      <div className="space-y-4 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IdCard size={16} />
              Kişisel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <SatirCift ad="Telefon" deger={musteri.telefon ?? "—"} ikon={<Phone size={12} />} />
              <SatirCift
                ad="TC Kimlik"
                deger={tcMaskele(musteri.tcKimlik)}
                ipucu={musteri.tcKimlik ?? undefined}
                ikon={<IdCard size={12} />}
              />
              <SatirCift
                ad="Adres"
                deger={musteri.adres ?? "—"}
                ikon={<MapPin size={12} />}
              />
              <SatirCift
                ad="Kayıt"
                deger={`${formatTarihSaat(musteri.createdAt)} (${gorelTarih(musteri.createdAt)})`}
                ikon={<Calendar size={12} />}
              />
              <SatirCift
                ad="Son Güncelleme"
                deger={gorelTarih(musteri.updatedAt)}
                ikon={<Calendar size={12} />}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Tag size={16} />
                Etiketler
              </span>
              {etiketYazabilir && etiketEkleHref && (
                <Link
                  href={etiketEkleHref}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                  scroll={false}
                >
                  <Plus size={12} className="mr-1" />
                  Ekle
                </Link>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {etiketler.length === 0 ? (
              <p className="text-muted-foreground text-sm">Etiket yok</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {etiketler.map((e) => (
                  <Badge
                    key={e}
                    className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                  >
                    {e}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ORTA + SAĞ: KPI + Aktivite + Notlar */}
      <div className="space-y-4 lg:col-span-2">
        {/* 4 mini KPI */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniKpi ad="Hisse" deger={String(istatistik.hisseSayisi)} ikon={<CheckCircle2 size={16} />} renk="text-foreground" />
          <MiniKpi ad="Bedel" deger={formatPara(istatistik.toplamBedel)} ikon={<Receipt size={16} />} renk="text-foreground" />
          <MiniKpi ad="Ödenen" deger={formatPara(istatistik.odenen)} ikon={<CheckCircle2 size={16} />} renk="text-green-600" />
          <MiniKpi
            ad="Kalan"
            deger={formatPara(istatistik.kalan)}
            ikon={istatistik.kalan > 0 ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            renk={istatistik.kalan > 0 ? "text-amber-600" : "text-green-600"}
            vurgu
          />
        </div>

        {/* Son Aktivite */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Activity size={16} />
                Son Aktivite
              </span>
              <span className="text-muted-foreground text-xs font-normal">
                Son {aktiviteler.length} olay
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {aktiviteler.length === 0 ? (
              <p className="text-muted-foreground px-6 pb-4 text-sm">
                Henüz aktivite yok.
              </p>
            ) : (
              <ol className="divide-y">
                {aktiviteler.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                    <div className="bg-muted text-muted-foreground mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                      <Clock size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{a.baslik}</p>
                      {a.detay && (
                        <p className="text-muted-foreground text-xs">{a.detay}</p>
                      )}
                      <p className="text-muted-foreground text-[11px]">
                        {formatTarihSaat(a.tarih)}
                        {a.kullaniciAd ? ` · ${a.kullaniciAd}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Son Notlar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <StickyNote size={16} />
                Son Notlar
              </span>
              <Link
                href={`/musteriler/${musteri.id}?tab=notlar`}
                className="text-muted-foreground text-xs font-normal hover:underline"
                scroll={false}
              >
                Tümü →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sonNotlar.length === 0 ? (
              <p className="text-muted-foreground text-sm">Not yok</p>
            ) : (
              <ul className="space-y-2">
                {sonNotlar.map((n) => {
                  const renkler: Record<string, string> = {
                    bilgi: "border-blue-300 bg-blue-50",
                    uyari: "border-amber-300 bg-amber-50",
                    onemli: "border-red-300 bg-red-50",
                    hatirlat: "border-purple-300 bg-purple-50",
                  };
                  const klas = renkler[n.renk] ?? renkler.bilgi;
                  return (
                    <li
                      key={n.id}
                      className={`rounded-md border-l-2 ${klas} px-3 py-2`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{n.icerik}</p>
                      <p className="text-muted-foreground mt-1 text-[11px]">
                        {gorelTarih(n.createdAt)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SatirCift({
  ad,
  deger,
  ipucu,
  ikon,
}: {
  ad: string;
  deger: string;
  ipucu?: string;
  ikon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {ikon}
        {ad}
      </dt>
      <dd className="font-medium text-right" title={ipucu}>
        {deger}
      </dd>
    </div>
  );
}

function MiniKpi({
  ad,
  deger,
  ikon,
  renk,
  vurgu = false,
}: {
  ad: string;
  deger: string;
  ikon: React.ReactNode;
  renk: string;
  vurgu?: boolean;
}) {
  return (
    <Card className={vurgu ? "border-primary" : undefined}>
      <CardContent className="pt-3 pb-3">
        <div className={`mb-1 flex items-center gap-1.5 ${renk}`}>
          {ikon}
          <span className="text-muted-foreground text-[11px]">{ad}</span>
        </div>
        <p className="font-tabular text-lg font-bold">{deger}</p>
      </CardContent>
    </Card>
  );
}
