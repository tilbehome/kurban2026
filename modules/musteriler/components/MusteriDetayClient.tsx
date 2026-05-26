"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import type { MusteriTabId } from "../types";
import { MusteriTabBar } from "./MusteriTabBar";
import { MusteriHizliEylemBar } from "./MusteriHizliEylemBar";
import { HizliOdemePanel } from "./HizliOdemePanel";
import { GenelTab } from "./tabs/GenelTab";
import { HisselerTab } from "./tabs/HisselerTab";
import { TahsilatlarTab } from "./tabs/TahsilatlarTab";
import { VekaletlerTab } from "./tabs/VekaletlerTab";
import { NotlarTab } from "./tabs/NotlarTab";
import { EtiketModal } from "./modals/EtiketModal";
import { HisseAtamaModal } from "./modals/HisseAtamaModal";
import { IadeModal } from "./modals/IadeModal";
import { MusteriSilModal } from "./modals/MusteriSilModal";
import { etiketleriParse } from "../lib/aktivite-format";
import type { AktiviteSatir } from "../lib/aktivite-format";

interface MusteriDetayClientProps {
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
  oturumKullaniciId: string;
  izinler: {
    tahsilat: boolean;
    iade: boolean;
    guncelle: boolean;
    iletisim: boolean;
    hisseAta: boolean;
    etiket: boolean;
    sil: boolean;
    notlar: {
      oku: boolean;
      yaz: boolean;
      admin: boolean;
    };
    vekalet: {
      oku: boolean;
      yaz: boolean;
    };
    hisse: {
      iptal: boolean;
      transfer: boolean;
    };
    tahsilatGoruntule: boolean;
  };
  istatistik: {
    hisseSayisi: number;
    toplamBedel: number;
    odenen: number;
    kalan: number;
  };
  hisselerForOdeme: {
    id: string;
    no: number;
    kurbanKesimSirasi: number;
    hisseFiyati: number;
    kalan: number;
  }[];
  hisselerForListe: React.ComponentProps<typeof HisselerTab>["hisseler"];
  tahsilatlar: React.ComponentProps<typeof TahsilatlarTab>["tahsilatlar"];
  tahsilatOzet: React.ComponentProps<typeof TahsilatlarTab>["ozet"];
  vekaletSatirlari: React.ComponentProps<typeof VekaletlerTab>["satirlar"];
  notlar: React.ComponentProps<typeof NotlarTab>["notlar"];
  aktiviteler: AktiviteSatir[];
  sonNotlar: {
    id: string;
    icerik: string;
    renk: string;
    createdAt: Date;
  }[];
  gorunenTabIdleri: MusteriTabId[];
}

export function MusteriDetayClient(props: MusteriDetayClientProps) {
  const sp = useSearchParams();
  const tabParam = sp.get("tab") as MusteriTabId | null;
  const aktif: MusteriTabId =
    tabParam && props.gorunenTabIdleri.includes(tabParam) ? tabParam : "genel";

  const [etiketAcik, setEtiketAcik] = useState(false);
  const [hisseAtamaAcik, setHisseAtamaAcik] = useState(false);
  const [iadeAcik, setIadeAcik] = useState(false);
  const [silAcik, setSilAcik] = useState(false);

  const {
    musteri,
    oturumKullaniciId,
    izinler,
    istatistik,
    hisselerForOdeme,
    hisselerForListe,
    tahsilatlar,
    tahsilatOzet,
    vekaletSatirlari,
    notlar,
    aktiviteler,
    sonNotlar,
    gorunenTabIdleri,
  } = props;

  const etiketler = etiketleriParse(musteri.etiketler);

  return (
    <>
      <MusteriHizliEylemBar
        musteriId={musteri.id}
        telefon={musteri.telefon}
        izinler={{
          tahsilat: izinler.tahsilat,
          iade: izinler.iade,
          guncelle: izinler.guncelle,
          iletisim: izinler.iletisim,
          hisseAta: izinler.hisseAta,
          etiket: izinler.etiket,
          sil: izinler.sil,
        }}
        tahsilatPanelHref="#hizli-odeme"
        iadeAc={() => setIadeAcik(true)}
        hisseAtamaAc={() => setHisseAtamaAcik(true)}
        etiketAc={() => setEtiketAcik(true)}
        silAc={() => setSilAcik(true)}
      />

      <MusteriTabBar gorunenTabIdleri={gorunenTabIdleri} aktif={aktif} />

      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {aktif === "genel" && (
            <GenelTab
              musteri={musteri}
              istatistik={istatistik}
              aktiviteler={aktiviteler}
              sonNotlar={sonNotlar}
              etiketYazabilir={izinler.etiket}
              etiketEkleHref={"#"}
            />
          )}
          {aktif === "hisseler" && (
            <HisselerTab
              musteriId={musteri.id}
              hisseler={hisselerForListe}
              ozet={{
                toplamHisse: istatistik.hisseSayisi,
                toplamBedel: istatistik.toplamBedel,
                odenen: istatistik.odenen,
                kalan: istatistik.kalan,
              }}
              izinler={{
                iptal: izinler.hisse.iptal,
                transfer: izinler.hisse.transfer,
                ata: izinler.hisseAta,
              }}
              hisseAtamaAc={() => setHisseAtamaAcik(true)}
            />
          )}
          {aktif === "tahsilatlar" && izinler.tahsilatGoruntule && (
            <TahsilatlarTab
              musteriId={musteri.id}
              musteriTel={musteri.telefon}
              tahsilatlar={tahsilatlar}
              ozet={tahsilatOzet}
            />
          )}
          {aktif === "vekaletler" && izinler.vekalet.oku && (
            <VekaletlerTab
              musteriId={musteri.id}
              satirlar={vekaletSatirlari}
              izinler={{ yaz: izinler.vekalet.yaz }}
            />
          )}
          {aktif === "notlar" && izinler.notlar.oku && (
            <NotlarTab
              musteriId={musteri.id}
              notlar={notlar}
              oturumKullaniciId={oturumKullaniciId}
              izinler={{
                yaz: izinler.notlar.yaz,
                admin: izinler.notlar.admin,
              }}
            />
          )}
        </div>

        {/* Sticky hızlı ödeme panel */}
        <aside className="space-y-3" id="hizli-odeme">
          {hisselerForOdeme.length > 0 && izinler.tahsilat ? (
            <Card className="lg:sticky lg:top-16">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet size={16} className="text-primary" />
                  Hızlı Ödeme Al
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HizliOdemePanel
                  musteriId={musteri.id}
                  hisseler={hisselerForOdeme}
                  kalanBakiye={istatistik.kalan}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="lg:sticky lg:top-16">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground text-sm">
                  {istatistik.hisseSayisi === 0
                    ? "Müşteriye atanmış hisse yok."
                    : "Tüm ödemeler tamamlanmış 🎉"}
                </p>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {/* Modals */}
      <EtiketModal
        musteriId={musteri.id}
        mevcutEtiketler={etiketler}
        acik={etiketAcik}
        onClose={() => setEtiketAcik(false)}
      />
      <HisseAtamaModal
        musteriId={musteri.id}
        musteriAdSoyad={musteri.adSoyad}
        acik={hisseAtamaAcik}
        onClose={() => setHisseAtamaAcik(false)}
      />
      <IadeModal
        musteriId={musteri.id}
        acik={iadeAcik}
        onClose={() => setIadeAcik(false)}
      />
      <MusteriSilModal
        musteriId={musteri.id}
        musteriAdSoyad={musteri.adSoyad}
        acik={silAcik}
        onClose={() => setSilAcik(false)}
      />
    </>
  );
}
