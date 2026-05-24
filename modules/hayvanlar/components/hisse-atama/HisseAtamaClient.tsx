"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HisseAtamaUst } from "./HisseAtamaUst";
import { MusteriAramaPanel } from "./MusteriAramaPanel";
import { StableGrid } from "./StableGrid";
import { AtamaPanel } from "./AtamaPanel";
import { ListeGorunumu } from "./ListeGorunumu";
import { HizliModPanel } from "./HizliModPanel";
import { useKlavyeKisayollari } from "@/shared/hooks/useKlavyeKisayollari";
import {
  BOS_ATAMA_STATE,
  type AtamaIstatistik,
  type AtamaPaneliState,
  type AtamaGorunum,
  type EksikHisseliMusteri,
  type HisseKutusuVeri,
  type KurbanKartVeri,
  type DragPayload,
} from "@/modules/hayvanlar/types/hisse-atama";

interface HisseAtamaClientProps {
  ilkKurbanlar: KurbanKartVeri[];
  ilkMusteriler: EksikHisseliMusteri[];
  ilkIstatistik: AtamaIstatistik;
  /** İzinler — server'dan filtreli */
  yetkiler: {
    atamaYap: boolean;
    iptal: boolean;
    transfer: boolean;
  };
}

/**
 * Hisse atama UI'nın orkestratoru.
 * - 3 görünüm (stable / liste / hızlı)
 * - 3 sütun layout (sol panel + stable + sağ atama)
 * - Klavye kısayolları (Esc, Ctrl+F)
 */
export function HisseAtamaClient({
  ilkKurbanlar,
  ilkMusteriler,
  ilkIstatistik,
  yetkiler,
}: HisseAtamaClientProps) {
  const router = useRouter();
  const [gorunum, setGorunum] = useState<AtamaGorunum>("stable");
  const [secilenMusteri, setSecilenMusteri] =
    useState<EksikHisseliMusteri | null>(null);
  const [atamaState, setAtamaState] =
    useState<AtamaPaneliState>(BOS_ATAMA_STATE);

  const dragDevreDisi = !yetkiler.atamaYap;

  // Müşteri seçim -> sağ panele yansıt
  function musteriSec(m: EksikHisseliMusteri | null) {
    setSecilenMusteri(m);
    setAtamaState((eski) => ({
      ...eski,
      musteriId: m?.id ?? null,
      musteriAdSoyad: m?.adSoyad ?? null,
    }));
  }

  // Hisse drop edildi (drag-drop)
  const hisseDrop = useCallback(
    (
      payload: DragPayload,
      kurban: KurbanKartVeri,
      hisse: HisseKutusuVeri,
    ) => {
      if (!yetkiler.atamaYap) {
        toast.error("Atama yetkiniz yok");
        return;
      }
      if (hisse.durum !== "bos") {
        toast.error("Bu hisse zaten dolu");
        return;
      }
      setAtamaState({
        musteriId: payload.musteriId,
        musteriAdSoyad: payload.musteriAdSoyad,
        kurbanId: kurban.id,
        kurbanKesimSirasi: kurban.kesimSirasi,
        hisseId: hisse.id,
        hisseNo: hisse.no,
        hisseFiyati: hisse.hisseFiyati > 0 ? hisse.hisseFiyati : kurban.onerilenFiyat,
        not: "",
      });
    },
    [yetkiler.atamaYap],
  );

  // Hisse tıklama (click-mode)
  const hisseTikla = useCallback(
    (kurban: KurbanKartVeri, hisse: HisseKutusuVeri) => {
      if (hisse.durum !== "bos") {
        // Dolu hisseye tıklanırsa müşteri detayına git
        if (hisse.musteriId) {
          router.push(`/musteriler/${hisse.musteriId}`);
        }
        return;
      }
      // Boş hisseye tıklanırsa atama panele yansıt
      if (!secilenMusteri) {
        toast.info("Önce soldan bir müşteri seçin");
        return;
      }
      setAtamaState({
        musteriId: secilenMusteri.id,
        musteriAdSoyad: secilenMusteri.adSoyad,
        kurbanId: kurban.id,
        kurbanKesimSirasi: kurban.kesimSirasi,
        hisseId: hisse.id,
        hisseNo: hisse.no,
        hisseFiyati: hisse.hisseFiyati > 0 ? hisse.hisseFiyati : kurban.onerilenFiyat,
        not: "",
      });
    },
    [router, secilenMusteri],
  );

  // İptal et
  const hisseIptal = useCallback(
    async (kurban: KurbanKartVeri, hisse: HisseKutusuVeri) => {
      if (!yetkiler.iptal) return;
      if (!confirm(`#${kurban.kesimSirasi}.${hisse.no} atamasını iptal et?`)) {
        return;
      }
      try {
        const yanit = await fetch(`/api/hisseler/${hisse.id}/iptal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sebep: "Hisse atama UI'dan iptal" }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "İptal başarısız");
        }
        toast.success(`#${kurban.kesimSirasi}.${hisse.no} iptal edildi`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    },
    [yetkiler.iptal, router],
  );

  // Transfer (basit prompt — gelişmiş modal sonra)
  const hisseTransfer = useCallback(
    async (kurban: KurbanKartVeri, hisse: HisseKutusuVeri) => {
      if (!yetkiler.transfer) return;
      const yeniMusteriId = window.prompt(
        `#${kurban.kesimSirasi}.${hisse.no} hissesini hangi müşteriye transfer edilsin?\n(Müşteri ID girin)`,
      );
      if (!yeniMusteriId?.trim()) return;
      try {
        const yanit = await fetch(`/api/hisseler/${hisse.id}/transfer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ yeniMusteriId: yeniMusteriId.trim() }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Transfer başarısız");
        }
        toast.success(`#${kurban.kesimSirasi}.${hisse.no} transfer edildi`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    },
    [yetkiler.transfer, router],
  );

  // Atama panel değişiklikleri
  const atamaDegisikligi = useCallback((yeni: Partial<AtamaPaneliState>) => {
    setAtamaState((eski) => ({ ...eski, ...yeni }));
  }, []);

  const atamaIptal = useCallback(() => {
    setAtamaState(BOS_ATAMA_STATE);
    setSecilenMusteri(null);
  }, []);

  const atamaTamamlandi = useCallback(() => {
    setAtamaState(BOS_ATAMA_STATE);
    setSecilenMusteri(null);
  }, []);

  // Klavye: Esc -> seçimi iptal, Ctrl+F -> arama focus (basit)
  useKlavyeKisayollari(
    useMemo(
      () => [
        {
          tus: "Escape",
          eylem: () => {
            if (atamaState.musteriId || atamaState.hisseId) {
              atamaIptal();
            }
          },
        },
      ],
      [atamaState.musteriId, atamaState.hisseId, atamaIptal],
    ),
  );

  return (
    <div className="flex flex-col gap-4">
      <HisseAtamaUst
        istatistik={ilkIstatistik}
        gorunum={gorunum}
        onGorunumDegis={setGorunum}
      />

      {gorunum === "stable" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_280px]">
          <div className="lg:max-h-[calc(100vh-260px)]">
            <MusteriAramaPanel
              musteriler={ilkMusteriler}
              seciliId={secilenMusteri?.id ?? null}
              onMusteriSec={musteriSec}
              dragDevreDisi={dragDevreDisi}
            />
          </div>
          <div className="lg:max-h-[calc(100vh-260px)]">
            <StableGrid
              kurbanlar={ilkKurbanlar}
              onHisseDrop={hisseDrop}
              onHisseTikla={hisseTikla}
              onHisseIptal={yetkiler.iptal ? hisseIptal : undefined}
              onHisseTransfer={yetkiler.transfer ? hisseTransfer : undefined}
              dragDevreDisi={dragDevreDisi}
              iptalIzni={yetkiler.iptal}
              transferIzni={yetkiler.transfer}
            />
          </div>
          <div>
            <AtamaPanel
              state={atamaState}
              onDegisiklik={atamaDegisikligi}
              onIptal={atamaIptal}
              onTamamlandi={atamaTamamlandi}
            />
          </div>
        </div>
      )}

      {gorunum === "liste" && <ListeGorunumu kurbanlar={ilkKurbanlar} />}

      {gorunum === "hizli" && (
        <HizliModPanel
          kurbanlar={ilkKurbanlar}
          musteriler={ilkMusteriler}
        />
      )}
    </div>
  );
}
