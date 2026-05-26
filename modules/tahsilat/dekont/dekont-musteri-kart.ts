/**
 * Kurban Bilgileri kartı — sol bölüm.
 *
 * SPRINT-DEKONT-V2: Defne yapraklı büyük "KURBAN SIRA NO" bloku merkezde.
 * Üstte ad/soyad + telefon, altta dekont no + işlemi yapan.
 *
 * Public API (MusteriKartVerisi) korunur.
 */

import { DEKONT_RENKLERI } from "./dekont-tema";
import { escapeHtml } from "./dekont-html-yardimci";

export interface MusteriKartVerisi {
  musteriAdi: string;
  musteriTel: string;
  kurbanNo: number;
  hisseNo: number;
  dekontNo: string;
  kasiyer: string;
}

export function dekontMusteriKartHtml(m: MusteriKartVerisi): string {
  const e = escapeHtml;
  const defneYol =
    "M30 5 Q15 15 18 35 Q20 50 28 60 Q22 45 28 30 Z " +
    "M28 30 Q12 35 18 55 Q22 65 30 70 Q20 55 28 40 Z " +
    "M28 50 Q10 55 16 75 Q22 85 32 88 Q22 75 30 60 Z";

  return `
  <div class="dk-kart dk-musteri-kart">
    <div class="dk-kart-baslik">KURBAN BİLGİLERİ</div>

    <div class="dk-musteri-info">
      <div class="dk-musteri-satir">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span class="dk-musteri-etiket">ADI SOYADI</span>
        <span class="dk-musteri-deger">${e(m.musteriAdi)}</span>
      </div>
      <div class="dk-musteri-satir">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
        <span class="dk-musteri-etiket">TELEFONU</span>
        <span class="dk-musteri-deger">${m.musteriTel ? e(m.musteriTel) : "—"}</span>
      </div>
    </div>

    <div class="dk-kurban-sira-blok">
      <div class="dk-defne-sol">
        <svg viewBox="0 0 60 100" fill="none" preserveAspectRatio="xMidYMid meet">
          <path d="${defneYol}" fill="${DEKONT_RENKLERI.accent}" opacity="0.75"/>
        </svg>
      </div>
      <div class="dk-kurban-sira-icerik">
        <div class="dk-kurban-sira-baslik">KURBAN SIRA NO</div>
        <div class="dk-kurban-sira-numara">${m.kurbanNo}</div>
        <div class="dk-kurban-sira-hisse">Hisse Adedi: ${m.hisseNo}</div>
      </div>
      <div class="dk-defne-sag">
        <svg viewBox="0 0 60 100" fill="none" preserveAspectRatio="xMidYMid meet">
          <path d="${defneYol}" fill="${DEKONT_RENKLERI.accent}" opacity="0.75"/>
        </svg>
      </div>
    </div>

    <div class="dk-musteri-alt">
      <div class="dk-musteri-satir">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span class="dk-musteri-etiket">DEKONT NO</span>
        <span class="dk-musteri-deger dk-mono">${e(m.dekontNo)}</span>
      </div>
      <div class="dk-musteri-satir">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span class="dk-musteri-etiket">İŞLEMİ YAPAN</span>
        <span class="dk-musteri-deger">${e(m.kasiyer)}</span>
      </div>
    </div>
  </div>
  `;
}

export const DEKONT_MUSTERI_KART_CSS = `
.dk-kart {
  background: ${DEKONT_RENKLERI.background};
  border: 1px solid ${DEKONT_RENKLERI.kartCerceve};
  border-radius: 12px;
  padding: 18px;
}
.dk-kart-baslik {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: ${DEKONT_RENKLERI.primary};
  margin-bottom: 14px;
}
.dk-musteri-info,
.dk-musteri-alt {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.dk-musteri-satir {
  display: grid;
  grid-template-columns: 18px 95px 1fr;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  font-size: 11px;
  border-bottom: 1px solid ${DEKONT_RENKLERI.accent};
}
.dk-musteri-satir:last-child {
  border-bottom: none;
}
.dk-musteri-satir svg {
  color: ${DEKONT_RENKLERI.tertiary};
}
.dk-musteri-etiket {
  font-size: 10px;
  color: ${DEKONT_RENKLERI.secondary};
  letter-spacing: 0.04em;
  font-weight: 600;
}
.dk-musteri-deger {
  font-size: 12px;
  font-weight: 700;
  color: ${DEKONT_RENKLERI.primary};
  text-align: right;
}
.dk-mono {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.02em;
}
.dk-kurban-sira-blok {
  display: grid;
  grid-template-columns: 56px 1fr 56px;
  align-items: center;
  margin: 14px 0;
  padding: 14px 8px;
  background: ${DEKONT_RENKLERI.surface};
  border: 1px solid ${DEKONT_RENKLERI.kartCerceve};
  border-radius: 10px;
}
.dk-defne-sol,
.dk-defne-sag {
  height: 80px;
}
.dk-defne-sag {
  transform: scaleX(-1);
}
.dk-defne-sol svg,
.dk-defne-sag svg {
  width: 100%;
  height: 100%;
}
.dk-kurban-sira-icerik {
  text-align: center;
}
.dk-kurban-sira-baslik {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: ${DEKONT_RENKLERI.secondary};
  margin-bottom: 2px;
}
.dk-kurban-sira-numara {
  font-size: 64px;
  font-weight: 900;
  line-height: 1;
  color: ${DEKONT_RENKLERI.primary};
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}
.dk-kurban-sira-hisse {
  font-size: 10px;
  color: ${DEKONT_RENKLERI.tertiary};
  margin-top: 4px;
  letter-spacing: 0.06em;
  font-weight: 600;
}
.dk-musteri-alt {
  margin-top: 8px;
}
`;
