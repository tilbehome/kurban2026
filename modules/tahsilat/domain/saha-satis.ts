import type { HataKodu } from "@/shared/lib/hata-katalogu";
import { yuvarla } from "@/shared/lib/para";

export interface SahaSatisKomutu {
  musteriId: string;
  hisseIds: string[];
  hisseFiyati: number;
  nakit: number;
  havale: number;
  kart: number;
  notlar?: string;
  clientRequestId: string;
}

export interface SahaSatisSonucu {
  basarili: true;
  musteriId: string;
  hisseIds: string[];
  odemeIds: string[];
}

export interface SahaSatisHisseKaydi {
  id: string;
  no: number;
  musteriId: string | null;
  hisseFiyati: number;
  kurban: {
    kesimSirasi: number;
    durum: string;
    kesimDurumu: string;
    silindiMi: boolean;
  };
  odemeler: Array<{ toplamTutar: number }>;
}

export class SahaSatisKuraliHatasi extends Error {
  constructor(
    public kod: HataKodu,
    public parametreler?: Record<string, string | number | boolean | null>,
  ) {
    super(kod);
    this.name = "SahaSatisKuraliHatasi";
  }
}

export function sahaSatisTutarlariHesapla(komut: SahaSatisKomutu) {
  return {
    toplamKapora: yuvarla(komut.nakit + komut.havale + komut.kart),
    toplamBedel: yuvarla(komut.hisseFiyati * komut.hisseIds.length),
    hisseFiyati: yuvarla(komut.hisseFiyati),
    nakit: yuvarla(komut.nakit),
    havale: yuvarla(komut.havale),
    kart: yuvarla(komut.kart),
  };
}

export function kaporaYetkisiniDogrula(
  toplamKapora: number,
  tahsilatYetkisiVar: boolean,
) {
  if (toplamKapora > 0 && !tahsilatYetkisiVar) {
    throw new SahaSatisKuraliHatasi("PERMISSION_DENIED");
  }
}

export function kaporaSatisBedeliniAsamaz(
  toplamKapora: number,
  toplamBedel: number,
) {
  if (toplamKapora > toplamBedel + 0.01) {
    throw new SahaSatisKuraliHatasi("FINANCE_DOWN_PAYMENT_EXCEEDS_SALE");
  }
}

export function musteriBulunmali(musteri: { id: string } | null) {
  if (!musteri) throw new SahaSatisKuraliHatasi("CUSTOMER_NOT_FOUND");
}

export function hisselerEksiksizBulunmali(
  hisseler: SahaSatisHisseKaydi[],
  beklenenSayi: number,
) {
  if (hisseler.length !== beklenenSayi) {
    throw new SahaSatisKuraliHatasi("SHARES_NOT_FOUND");
  }
}

export function hisselerBosOlmali(hisseler: SahaSatisHisseKaydi[]) {
  const doluHisse = hisseler.find((h) => h.musteriId !== null);
  if (!doluHisse) return;

  throw new SahaSatisKuraliHatasi("SHARE_ALREADY_ASSIGNED", {
    shareLabel: `${doluHisse.kurban.kesimSirasi}.${doluHisse.no}`,
  });
}

export function eszamanliAtamaBasariliOlmali(
  atananSayi: number,
  beklenenSayi: number,
) {
  if (atananSayi !== beklenenSayi) {
    throw new SahaSatisKuraliHatasi("SHARE_CONCURRENT_ASSIGNMENT");
  }
}

export function hisseKalanlariHesapla(
  hisseler: SahaSatisHisseKaydi[],
  hisseFiyati: number,
) {
  return hisseler.map((h) => ({
    id: h.id,
    no: h.no,
    kalan: yuvarla(
      hisseFiyati - h.odemeler.reduce((s, o) => s + o.toplamTutar, 0),
    ),
  }));
}

export function odemeKanaliTutarlari(
  tahsisTutari: number,
  toplamKapora: number,
  komut: SahaSatisKomutu,
) {
  const oran = toplamKapora > 0 ? tahsisTutari / toplamKapora : 0;
  const nakit = yuvarla(komut.nakit * oran);
  const havale = yuvarla(komut.havale * oran);
  const kart = yuvarla(tahsisTutari - nakit - havale);
  return { nakit, havale, kart };
}

export function hisseEtiketi(
  hisseler: SahaSatisHisseKaydi[],
  hisseId: string,
): string {
  const hisse = hisseler.find((h) => h.id === hisseId);
  return hisse ? `Hisse ${hisse.kurban.kesimSirasi}.${hisse.no}` : "Hisse";
}
