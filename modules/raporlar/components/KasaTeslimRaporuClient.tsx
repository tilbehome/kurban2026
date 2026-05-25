"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Printer, ArrowLeft, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OdemeSatir {
  id: string;
  dekontNo: string;
  tarih: string;
  nakit: number;
  havale: number;
  kart: number;
  toplamTutar: number;
  yontem: string;
  iptal: boolean;
  iptalSebep: string | null;
  iptalTarihi: string | null;
  notlar: string | null;
  kullanici: { adSoyad: string; kullaniciAdi: string };
  hisse: {
    no: number;
    kurban: { kesimSirasi: number };
    musteri: { adSoyad: string; telefon: string | null } | null;
  };
}

interface KasaHareketSatir {
  id: string;
  tip: string;
  tutar: number;
  yontem: string;
  aciklama: string;
  tarih: string;
  kullanici: { adSoyad: string };
}

interface Props {
  tarihIso: string;
  duzenleyenAd: string;
  firmaAdi: string;
  firmaAdres: string;
  firmaTelefon: string;
  firmaWeb: string;
  odemeler: OdemeSatir[];
  kasaHareketleri: KasaHareketSatir[];
}

function paraFormat(deger: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(deger);
}

function saatFormat(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tarihGuzel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function tarihInputDeger(iso: string): string {
  return iso.slice(0, 10);
}

function yontemEtiket(y: string): string {
  switch (y) {
    case "nakit":
      return "Nakit";
    case "havale":
      return "Havale";
    case "kart":
      return "Kart";
    case "karisik":
      return "Karışık";
    default:
      return y;
  }
}

function tipEtiket(t: string): string {
  switch (t) {
    case "tahsilat":
      return "Tahsilat";
    case "iptal-tahsilat":
      return "İptal Tahsilat";
    case "gider":
      return "Gider";
    case "acilis":
      return "Açılış";
    case "kapanis":
      return "Kapanış";
    default:
      return t;
  }
}

export function KasaTeslimRaporuClient({
  tarihIso,
  duzenleyenAd,
  firmaAdi,
  firmaAdres,
  firmaTelefon,
  firmaWeb,
  odemeler,
  kasaHareketleri,
}: Props) {
  const router = useRouter();

  const aktif = useMemo(() => odemeler.filter((o) => !o.iptal), [odemeler]);
  const iptal = useMemo(() => odemeler.filter((o) => o.iptal), [odemeler]);

  const toplamNakit = aktif.reduce((s, o) => s + o.nakit, 0);
  const toplamHavale = aktif.reduce((s, o) => s + o.havale, 0);
  const toplamKart = aktif.reduce((s, o) => s + o.kart, 0);
  const toplamTahsilat = toplamNakit + toplamHavale + toplamKart;
  const toplamIptal = iptal.reduce((s, o) => s + o.toplamTutar, 0);

  const sayiNakit = aktif.filter((o) => o.nakit > 0).length;
  const sayiHavale = aktif.filter((o) => o.havale > 0).length;
  const sayiKart = aktif.filter((o) => o.kart > 0).length;

  const giderler = kasaHareketleri.filter((h) => h.tip === "gider");
  const toplamGider = giderler.reduce((s, h) => s + h.tutar, 0);
  const giderNakit = giderler
    .filter((g) => g.yontem === "nakit")
    .reduce((s, g) => s + g.tutar, 0);
  const giderHavale = giderler
    .filter((g) => g.yontem === "havale")
    .reduce((s, g) => s + g.tutar, 0);
  const giderKart = giderler
    .filter((g) => g.yontem === "kart")
    .reduce((s, g) => s + g.tutar, 0);

  const netNakit = toplamNakit - giderNakit;
  const netHavale = toplamHavale - giderHavale;
  const netKart = toplamKart - giderKart;
  const netToplam = netNakit + netHavale + netKart;

  const kasiyerOzet = useMemo(() => {
    const map = new Map<
      string,
      { sayi: number; toplam: number; nakit: number; havale: number; kart: number }
    >();
    for (const o of aktif) {
      const ad = o.kullanici.adSoyad;
      const mevcut = map.get(ad) ?? {
        sayi: 0,
        toplam: 0,
        nakit: 0,
        havale: 0,
        kart: 0,
      };
      mevcut.sayi++;
      mevcut.toplam += o.toplamTutar;
      mevcut.nakit += o.nakit;
      mevcut.havale += o.havale;
      mevcut.kart += o.kart;
      map.set(ad, mevcut);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].toplam - a[1].toplam);
  }, [aktif]);

  const seciliTarihInput = tarihInputDeger(tarihIso);
  const bugunMu =
    seciliTarihInput === tarihInputDeger(new Date().toISOString());

  function tarihDegisti(yeni: string) {
    if (!yeni) return;
    router.push(`/raporlar/kasa-teslim?tarih=${yeni}`);
  }

  function yazdir() {
    window.print();
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="bg-background sticky top-0 z-10 border-b shadow-sm print:hidden">
        <div className="container mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/raporlar">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1 size-4" />
                Raporlar
              </Button>
            </Link>
            <div className="h-6 border-l" />
            <h1 className="text-lg font-semibold">Kasa Teslim Raporu</h1>
            <span className="text-muted-foreground text-sm">
              {aktif.length} tahsilat
              {iptal.length > 0 && ` · ${iptal.length} iptal`}
              {giderler.length > 0 && ` · ${giderler.length} gider`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={seciliTarihInput}
              onChange={(e) => tarihDegisti(e.target.value)}
              className="h-9 w-44"
              aria-label="Tarih"
            />
            {!bugunMu && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  tarihDegisti(new Date().toISOString().slice(0, 10))
                }
              >
                Bugün
              </Button>
            )}
            <Button onClick={yazdir} size="sm" className="gap-2">
              <Printer className="size-4" />
              Yazdır / PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="kasa-baski-alan container mx-auto max-w-[210mm] py-4 print:max-w-none print:py-0">
        <div className="kasa-teslim-sayfa mx-auto bg-white shadow-md print:shadow-none">
          <div className="sayfa-baslik">
            <div className="baslik-firma">
              <div className="baslik-firma-adi">{firmaAdi}</div>
              {firmaAdres && (
                <div className="baslik-firma-alt">{firmaAdres}</div>
              )}
              {firmaTelefon && (
                <div className="baslik-firma-alt">Tel: {firmaTelefon}</div>
              )}
            </div>
            <div className="baslik-rapor">
              <Receipt className="size-5" />
              <span>KASA TESLİM RAPORU</span>
            </div>
            <div className="baslik-meta">
              <div>
                <strong>Tarih:</strong> {tarihGuzel(tarihIso)}
              </div>
              <div>
                <strong>Düzenleyen:</strong> {duzenleyenAd}
              </div>
              <div>
                <strong>Saat:</strong>{" "}
                {new Date().toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>

          {/* GÜN ÖZETİ */}
          <div className="bolum-baslik">GÜN ÖZETİ</div>
          <div className="ozet-grid">
            <div className="ozet-kart">
              <table className="ozet-tablo">
                <tbody>
                  <tr>
                    <td>Toplam Tahsilat</td>
                    <td className="para vurgu">
                      ₺ {paraFormat(toplamTahsilat)}
                    </td>
                    <td className="aciklama">{aktif.length} işlem</td>
                  </tr>
                  <tr className="alt-satir">
                    <td>· Nakit</td>
                    <td className="para">₺ {paraFormat(toplamNakit)}</td>
                    <td className="aciklama">{sayiNakit} işlem</td>
                  </tr>
                  <tr className="alt-satir">
                    <td>· Havale / EFT</td>
                    <td className="para">₺ {paraFormat(toplamHavale)}</td>
                    <td className="aciklama">{sayiHavale} işlem</td>
                  </tr>
                  <tr className="alt-satir">
                    <td>· Kart / POS</td>
                    <td className="para">₺ {paraFormat(toplamKart)}</td>
                    <td className="aciklama">{sayiKart} işlem</td>
                  </tr>
                  <tr>
                    <td>Toplam Gider</td>
                    <td className="para gider">₺ {paraFormat(toplamGider)}</td>
                    <td className="aciklama">{giderler.length} kayıt</td>
                  </tr>
                  <tr>
                    <td>İptal Edilen</td>
                    <td className="para iptal">₺ {paraFormat(toplamIptal)}</td>
                    <td className="aciklama">{iptal.length} işlem</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="ozet-kart">
              <table className="ozet-tablo">
                <tbody>
                  <tr>
                    <td>Net Nakit</td>
                    <td className="para">₺ {paraFormat(netNakit)}</td>
                  </tr>
                  <tr>
                    <td>Net Havale</td>
                    <td className="para">₺ {paraFormat(netHavale)}</td>
                  </tr>
                  <tr>
                    <td>Net Kart</td>
                    <td className="para">₺ {paraFormat(netKart)}</td>
                  </tr>
                  <tr className="net-toplam">
                    <td>NET TOPLAM</td>
                    <td className="para">₺ {paraFormat(netToplam)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* KASİYER ÖZETİ */}
          {kasiyerOzet.length > 0 && (
            <>
              <div className="bolum-baslik">KASİYER BAZLI ÖZET</div>
              <table className="detay-tablo">
                <thead>
                  <tr>
                    <th>Kasiyer</th>
                    <th className="sayi-col">Adet</th>
                    <th className="para-col">Nakit</th>
                    <th className="para-col">Havale</th>
                    <th className="para-col">Kart</th>
                    <th className="para-col">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {kasiyerOzet.map(([ad, v]) => (
                    <tr key={ad}>
                      <td>{ad}</td>
                      <td className="sayi-col">{v.sayi}</td>
                      <td className="para">₺ {paraFormat(v.nakit)}</td>
                      <td className="para">₺ {paraFormat(v.havale)}</td>
                      <td className="para">₺ {paraFormat(v.kart)}</td>
                      <td className="para vurgu">₺ {paraFormat(v.toplam)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* TAHSİLAT DETAY */}
          <div className="bolum-baslik">
            TAHSİLAT DETAY LİSTESİ ({aktif.length})
          </div>
          {aktif.length === 0 ? (
            <div className="bos-mesaj">Bu tarihte tahsilat yok</div>
          ) : (
            <table className="detay-tablo">
              <thead>
                <tr>
                  <th className="saat-col">Saat</th>
                  <th className="dekont-col">Dekont</th>
                  <th>Müşteri</th>
                  <th className="hisse-col">Hisse</th>
                  <th className="para-col">Tutar</th>
                  <th className="yontem-col">Yöntem</th>
                  <th>Kasiyer</th>
                </tr>
              </thead>
              <tbody>
                {aktif.map((o) => (
                  <tr key={o.id}>
                    <td className="saat-col mono">{saatFormat(o.tarih)}</td>
                    <td className="dekont-col mono">{o.dekontNo}</td>
                    <td>{o.hisse.musteri?.adSoyad ?? "—"}</td>
                    <td className="hisse-col mono">
                      #{o.hisse.kurban.kesimSirasi}.{o.hisse.no}
                    </td>
                    <td className="para">₺ {paraFormat(o.toplamTutar)}</td>
                    <td className="yontem-col">{yontemEtiket(o.yontem)}</td>
                    <td>{o.kullanici.adSoyad}</td>
                  </tr>
                ))}
                <tr className="toplam-satir">
                  <td colSpan={4}>TOPLAM</td>
                  <td className="para">₺ {paraFormat(toplamTahsilat)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          )}

          {/* GİDER */}
          {giderler.length > 0 && (
            <>
              <div className="bolum-baslik">
                GİDER / NAKİT ÇIKIŞ ({giderler.length})
              </div>
              <table className="detay-tablo">
                <thead>
                  <tr>
                    <th className="saat-col">Saat</th>
                    <th>Açıklama</th>
                    <th className="para-col">Tutar</th>
                    <th className="yontem-col">Yöntem</th>
                    <th>Kullanıcı</th>
                  </tr>
                </thead>
                <tbody>
                  {giderler.map((g) => (
                    <tr key={g.id}>
                      <td className="saat-col mono">{saatFormat(g.tarih)}</td>
                      <td>{g.aciklama}</td>
                      <td className="para gider">₺ {paraFormat(g.tutar)}</td>
                      <td className="yontem-col">{yontemEtiket(g.yontem)}</td>
                      <td>{g.kullanici.adSoyad}</td>
                    </tr>
                  ))}
                  <tr className="toplam-satir">
                    <td colSpan={2}>TOPLAM</td>
                    <td className="para gider">₺ {paraFormat(toplamGider)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* İPTAL */}
          {iptal.length > 0 && (
            <>
              <div className="bolum-baslik">
                İPTAL EDİLEN TAHSİLATLAR ({iptal.length})
              </div>
              <table className="detay-tablo">
                <thead>
                  <tr>
                    <th className="saat-col">Saat</th>
                    <th className="dekont-col">Dekont</th>
                    <th>Müşteri</th>
                    <th className="para-col">Tutar</th>
                    <th>İptal Sebebi</th>
                  </tr>
                </thead>
                <tbody>
                  {iptal.map((o) => (
                    <tr key={o.id} className="iptal-satir">
                      <td className="saat-col mono">{saatFormat(o.tarih)}</td>
                      <td className="dekont-col mono">{o.dekontNo}</td>
                      <td>{o.hisse.musteri?.adSoyad ?? "—"}</td>
                      <td className="para iptal">
                        ₺ {paraFormat(o.toplamTutar)}
                      </td>
                      <td>{o.iptalSebep ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* TÜM KASA HAREKETLERİ — non-tahsilat kayıtlar (açılış/kapanış vs.) */}
          {kasaHareketleri.filter((h) => h.tip !== "gider" && h.tip !== "tahsilat" && h.tip !== "iptal-tahsilat").length > 0 && (
            <>
              <div className="bolum-baslik">DİĞER KASA HAREKETLERİ</div>
              <table className="detay-tablo">
                <thead>
                  <tr>
                    <th className="saat-col">Saat</th>
                    <th className="tip-col">Tip</th>
                    <th>Açıklama</th>
                    <th className="para-col">Tutar</th>
                    <th className="yontem-col">Yöntem</th>
                  </tr>
                </thead>
                <tbody>
                  {kasaHareketleri
                    .filter(
                      (h) =>
                        h.tip !== "gider" &&
                        h.tip !== "tahsilat" &&
                        h.tip !== "iptal-tahsilat",
                    )
                    .map((h) => (
                      <tr key={h.id}>
                        <td className="saat-col mono">{saatFormat(h.tarih)}</td>
                        <td>{tipEtiket(h.tip)}</td>
                        <td>{h.aciklama}</td>
                        <td className="para">₺ {paraFormat(h.tutar)}</td>
                        <td className="yontem-col">{yontemEtiket(h.yontem)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </>
          )}

          {/* İMZA */}
          <div className="imza-alani">
            <div className="imza-blok">
              <div className="imza-baslik">TESLİM EDEN</div>
              <div className="imza-isim">{duzenleyenAd}</div>
              <div className="imza-cizgi" />
              <div className="imza-etiket">İmza</div>
              <div className="imza-tarih">
                Tarih: {new Date(tarihIso).toLocaleDateString("tr-TR")}
              </div>
            </div>
            <div className="imza-blok">
              <div className="imza-baslik">TESLİM ALAN</div>
              <div className="imza-isim">&nbsp;</div>
              <div className="imza-cizgi" />
              <div className="imza-etiket">İmza</div>
              <div className="imza-tarih">Tarih: ____________________</div>
            </div>
          </div>

          <div className="sayfa-alt">
            <span>{firmaWeb}</span>
            <span>{firmaAdi} · Kurban 2026</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .kasa-teslim-sayfa {
          width: 210mm;
          min-height: 297mm;
          padding: 10mm 12mm;
          box-sizing: border-box;
          color: #000;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .sayfa-baslik {
          display: grid;
          grid-template-columns: 1fr 1.2fr 1fr;
          align-items: center;
          gap: 6mm;
          padding-bottom: 4mm;
          margin-bottom: 5mm;
          border-bottom: 1.5pt solid #000;
        }
        .baslik-firma {
          font-size: 8pt;
          line-height: 1.4;
        }
        .baslik-firma-adi {
          font-size: 11pt;
          font-weight: 700;
          color: #000;
        }
        .baslik-firma-alt {
          color: #555;
          font-size: 7.5pt;
        }
        .baslik-rapor {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13pt;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #000;
        }
        .baslik-meta {
          font-size: 8pt;
          color: #333;
          line-height: 1.5;
          text-align: right;
        }
        .baslik-meta strong {
          color: #555;
          font-weight: 600;
        }

        .bolum-baslik {
          font-size: 9pt;
          font-weight: 700;
          letter-spacing: 1.2px;
          padding: 1.5mm 2mm;
          background: #e8f1f8;
          border-left: 2pt solid #1e40af;
          margin: 5mm 0 2mm;
          color: #1e3a8a;
        }

        .ozet-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 4mm;
          margin-bottom: 3mm;
        }
        .ozet-kart {
          border: 0.75pt solid #000;
          padding: 2mm;
          background: #fafafa;
        }
        .ozet-tablo {
          width: 100%;
          border-collapse: collapse;
          font-size: 9pt;
        }
        .ozet-tablo td {
          padding: 1mm 1.5mm;
          border-bottom: 0.25pt solid #ddd;
          vertical-align: middle;
        }
        .ozet-tablo tr:last-child td {
          border-bottom: none;
        }
        .ozet-tablo .alt-satir td {
          font-size: 8pt;
          color: #555;
          padding-left: 4mm;
        }
        .ozet-tablo .vurgu {
          font-weight: 700;
          font-size: 10pt;
        }
        .ozet-tablo .gider {
          color: #c00;
        }
        .ozet-tablo .iptal {
          color: #777;
          text-decoration: line-through;
        }
        .ozet-tablo .aciklama {
          font-size: 8pt;
          color: #777;
          text-align: right;
          padding-left: 4mm;
        }
        .ozet-tablo .net-toplam td {
          background: #fff4e6;
          font-weight: 700;
          font-size: 11pt;
          border-top: 0.75pt solid #000;
          padding-top: 2mm;
          padding-bottom: 2mm;
        }

        .detay-tablo {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
          margin-bottom: 3mm;
        }
        .detay-tablo th {
          background: #f5f5f5;
          border: 0.5pt solid #000;
          padding: 1mm 1.5mm;
          font-weight: 600;
          font-size: 7.5pt;
          text-align: left;
          letter-spacing: 0.3px;
        }
        .detay-tablo td {
          border: 0.25pt solid #ddd;
          padding: 0.8mm 1.5mm;
          vertical-align: middle;
        }
        .detay-tablo .mono {
          font-family: ui-monospace, Consolas, monospace;
          font-size: 7.5pt;
        }
        .detay-tablo .saat-col {
          width: 14mm;
        }
        .detay-tablo .dekont-col {
          width: 30mm;
        }
        .detay-tablo .hisse-col {
          width: 14mm;
          text-align: center;
        }
        .detay-tablo .para-col {
          width: 24mm;
          text-align: right;
        }
        .detay-tablo .yontem-col {
          width: 18mm;
        }
        .detay-tablo .sayi-col {
          width: 14mm;
          text-align: center;
        }
        .detay-tablo .tip-col {
          width: 26mm;
        }
        .detay-tablo .para {
          text-align: right;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .detay-tablo .vurgu {
          font-weight: 700;
        }
        .detay-tablo .gider {
          color: #c00;
          font-weight: 600;
        }
        .detay-tablo .iptal {
          color: #c00;
          font-weight: 600;
        }
        .iptal-satir td {
          color: #777;
          text-decoration: line-through;
        }
        .iptal-satir td.iptal {
          text-decoration: none;
        }
        .toplam-satir td {
          background: #f0f0f0;
          border-top: 0.75pt solid #000;
          font-weight: 700;
          font-size: 8.5pt;
        }

        .bos-mesaj {
          padding: 6mm 2mm;
          text-align: center;
          color: #888;
          font-style: italic;
          font-size: 9pt;
          border: 0.25pt dashed #ccc;
          margin-bottom: 3mm;
        }

        .imza-alani {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20mm;
          margin-top: 10mm;
          padding-top: 5mm;
          border-top: 0.5pt solid #999;
        }
        .imza-blok {
          text-align: center;
        }
        .imza-baslik {
          font-size: 9pt;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 1mm;
        }
        .imza-isim {
          font-size: 9pt;
          font-weight: 500;
          min-height: 5mm;
        }
        .imza-cizgi {
          border-bottom: 0.75pt solid #000;
          margin: 10mm 5mm 1mm;
        }
        .imza-etiket {
          font-size: 8pt;
          color: #555;
        }
        .imza-tarih {
          font-size: 8pt;
          color: #555;
          margin-top: 3mm;
        }

        .sayfa-alt {
          margin-top: 6mm;
          padding-top: 1.5mm;
          border-top: 0.5pt solid #ccc;
          display: flex;
          justify-content: space-between;
          font-size: 7pt;
          color: #888;
        }

        @media print {
          body {
            background: white !important;
          }
          .kasa-teslim-sayfa {
            box-shadow: none !important;
            margin: 0 !important;
          }
          .kasa-baski-alan {
            max-width: 100% !important;
            padding: 0 !important;
          }
          .detay-tablo {
            page-break-inside: auto;
          }
          .detay-tablo tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          .imza-alani {
            page-break-inside: avoid;
          }
        }
        @page {
          size: A4 portrait;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
