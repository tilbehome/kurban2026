"use client";

import { useEffect, useRef, useState } from "react";
import { TopBilgiSeridi } from "./TopBilgiSeridi";
import { KpiKartlari } from "./KpiKartlari";
import { TahsilatTrendGrafigi } from "./TahsilatTrendGrafigi";
import { HatirlatmalarPaneli } from "./HatirlatmalarPaneli";
import { KesimOperasyonAkisi } from "./KesimOperasyonAkisi";
import { SonIslemlerFeed } from "./SonIslemlerFeed";
import { KasaDurumuKart } from "./KasaDurumuKart";
import { WhatsAppBildirimKart } from "./WhatsAppBildirimKart";
import type {
  DashboardKpiKart,
  TahsilatTrend,
  KesimAkisi,
  SonIslem,
  KasaDurumu,
  WhatsAppMetrik,
} from "@/modules/dashboard/types";
import type { SidebarBildirimleri } from "@/shared/lib/sidebar-bildirim.service";

export interface DashboardIlkVeri {
  kpi: DashboardKpiKart[];
  trend: TahsilatTrend;
  kesim: KesimAkisi;
  islemler: SonIslem[];
  kasa: KasaDurumu | null;
  whatsapp: WhatsAppMetrik;
  bildirim: SidebarBildirimleri | null;
}

interface DashboardClientProps {
  ilkVeri: DashboardIlkVeri;
  /** Kasa görme izni — yoksa kart gizli */
  kasaGoster: boolean;
  /** Karşılama metni için kullanıcı adı */
  adSoyad: string;
  /** Son yedek string'i (HH:MM gibi) */
  sonYedek: string;
}

const REFRESH_MS = 30_000;

/**
 * Dashboard'un client orkestra'sı.
 * Server'dan ilk veri gelir, 30 sn'de bir refresh ile günceller.
 */
export function DashboardClient({
  ilkVeri,
  kasaGoster,
  adSoyad,
  sonYedek,
}: DashboardClientProps) {
  const [veri, setVeri] = useState<DashboardIlkVeri>(ilkVeri);
  const yenilenIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function yenile() {
      try {
        const [kpiR, kesimR, islemR, kasaR, bildirimR] = await Promise.all([
          fetch("/api/dashboard/kpi", { cache: "no-store" }),
          fetch("/api/dashboard/kesim-akisi", { cache: "no-store" }),
          fetch("/api/dashboard/son-islemler", { cache: "no-store" }),
          kasaGoster
            ? fetch("/api/dashboard/kasa-durumu", { cache: "no-store" })
            : null,
          fetch("/api/sidebar/bildirimler", { cache: "no-store" }),
        ]);

        const [kpiJ, kesimJ, islemJ, kasaJ, bildirimJ] = await Promise.all([
          kpiR.ok
            ? (kpiR.json() as Promise<{
                basarili: boolean;
                veri?: DashboardKpiKart[];
              }>)
            : null,
          kesimR.ok
            ? (kesimR.json() as Promise<{
                basarili: boolean;
                veri?: KesimAkisi;
              }>)
            : null,
          islemR.ok
            ? (islemR.json() as Promise<{
                basarili: boolean;
                veri?: SonIslem[];
              }>)
            : null,
          kasaR && kasaR.ok
            ? (kasaR.json() as Promise<{
                basarili: boolean;
                veri?: { kasa: KasaDurumu; whatsapp: WhatsAppMetrik };
              }>)
            : null,
          bildirimR.ok
            ? (bildirimR.json() as Promise<{
                basarili: boolean;
                veri?: SidebarBildirimleri;
              }>)
            : null,
        ]);

        setVeri((eski) => ({
          kpi: kpiJ?.basarili && kpiJ.veri ? kpiJ.veri : eski.kpi,
          trend: eski.trend, // trend kendi grafiği yeniler (tab değişince)
          kesim: kesimJ?.basarili && kesimJ.veri ? kesimJ.veri : eski.kesim,
          islemler:
            islemJ?.basarili && islemJ.veri ? islemJ.veri : eski.islemler,
          kasa: kasaJ?.basarili && kasaJ.veri ? kasaJ.veri.kasa : eski.kasa,
          whatsapp:
            kasaJ?.basarili && kasaJ.veri ? kasaJ.veri.whatsapp : eski.whatsapp,
          bildirim:
            bildirimJ?.basarili && bildirimJ.veri
              ? bildirimJ.veri
              : eski.bildirim,
        }));
      } catch {
        // sessizce yut
      }
    }

    yenilenIntervalRef.current = setInterval(yenile, REFRESH_MS);
    return () => {
      if (yenilenIntervalRef.current) clearInterval(yenilenIntervalRef.current);
    };
  }, [kasaGoster]);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <TopBilgiSeridi
        bekleyenMesaj={veri.bildirim?.bekleyenMesaj ?? 0}
        sonYedek={sonYedek}
      />

      <div className="flex flex-col gap-4 px-4 sm:px-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">
            Hoş geldiniz, {adSoyad}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            TilbeCore Kurban Operasyon Merkezi · Bayram hazırlığı sürüyor
          </p>
        </header>

        <KpiKartlari kartlar={veri.kpi} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TahsilatTrendGrafigi ilkVeri={veri.trend} />
          </div>
          <div>
            <HatirlatmalarPaneli bildirimler={veri.bildirim} />
          </div>
        </div>

        <KesimOperasyonAkisi akis={veri.kesim} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SonIslemlerFeed islemler={veri.islemler} />
          </div>
          <div className="flex flex-col gap-4">
            {/* Çift katmanlı yetki: kasaGoster sahte true olsa bile durum=null kalır;
                yetkili=false ise KasaYetkisizKart render edilir */}
            {kasaGoster ? (
              <KasaDurumuKart durum={veri.kasa} yetkili />
            ) : (
              <KasaDurumuKart durum={null} yetkili={false} />
            )}
            <WhatsAppBildirimKart metrik={veri.whatsapp} />
          </div>
        </div>
      </div>
    </div>
  );
}
