import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { prisma } from "@/shared/lib/prisma";
import { tumAyarlar } from "@/modules/_core/ayarlar/ayar.service";
import { topla, yuvarla, formatPara } from "@/shared/lib/para";
import { formatTarihSaat } from "@/shared/lib/tarih";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 401 });
  }

  const { id } = await params;
  const odemeId = Number.parseInt(id, 10);
  if (Number.isNaN(odemeId)) {
    return NextResponse.json({ hata: "Geçersiz id" }, { status: 400 });
  }

  const odeme = await prisma.odeme.findUnique({
    where: { id: odemeId },
    include: {
      hisse: {
        include: {
          kurban: true,
          musteri: true,
          odemeler: { where: { iptal: false } },
        },
      },
      kullanici: { select: { adSoyad: true } },
    },
  });

  if (!odeme) {
    return NextResponse.json({ hata: "Ödeme bulunamadı" }, { status: 404 });
  }

  const ayarlar = await tumAyarlar();
  const firmaAdi = ayarlar.firma_adi ?? "Tilbe Kurban";
  const firmaTel = ayarlar.firma_telefon ?? "";
  const firmaAdres = ayarlar.firma_adres ?? "";
  const altYazi =
    ayarlar.dekont_alt_yazi ?? "Tilbe Kurban'a güvendiğiniz için teşekkür ederiz.";

  const hisse = odeme.hisse;
  const hisseToplamOdenen = yuvarla(
    topla(...hisse.odemeler.map((o) => o.toplamTutar)),
  );
  const hisseKalan = yuvarla(hisse.hisseFiyati - hisseToplamOdenen);
  const oncekiOdemeler = yuvarla(hisseToplamOdenen - odeme.toplamTutar);

  const html = dekontHTML({
    firmaAdi,
    firmaTel,
    firmaAdres,
    altYazi,
    dekontNo: odeme.dekontNo,
    tarih: formatTarihSaat(odeme.tarih),
    musteriAdi: hisse.musteri?.adSoyad ?? "—",
    musteriTel: hisse.musteri?.telefon ?? "",
    kurbanNo: hisse.kurban.kesimSirasi,
    hisseNo: hisse.no,
    hisseBedeli: hisse.hisseFiyati,
    oncekiOdemeler,
    nakit: odeme.nakit,
    havale: odeme.havale,
    kart: odeme.kart,
    toplam: odeme.toplamTutar,
    kalan: hisseKalan,
    notlar: odeme.notlar ?? "",
    kasiyer: odeme.kullanici.adSoyad,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

interface DekontVeri {
  firmaAdi: string;
  firmaTel: string;
  firmaAdres: string;
  altYazi: string;
  dekontNo: string;
  tarih: string;
  musteriAdi: string;
  musteriTel: string;
  kurbanNo: number;
  hisseNo: number;
  hisseBedeli: number;
  oncekiOdemeler: number;
  nakit: number;
  havale: number;
  kart: number;
  toplam: number;
  kalan: number;
  notlar: string;
  kasiyer: string;
}

function dekontHTML(d: DekontVeri): string {
  const escape = (s: string) =>
    s.replace(/[&<>"']/g, (c) =>
      c === "&"
        ? "&amp;"
        : c === "<"
          ? "&lt;"
          : c === ">"
            ? "&gt;"
            : c === '"'
              ? "&quot;"
              : "&#39;",
    );

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Dekont ${escape(d.dekontNo)} — ${escape(d.musteriAdi)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
      color: #1a1a1a;
    }
    .toolbar {
      max-width: 480px;
      margin: 0 auto 16px;
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .toolbar button, .toolbar a {
      flex: 1;
      padding: 10px 16px;
      border: 1px solid #d4d4d4;
      background: #fff;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      color: inherit;
      text-align: center;
    }
    .toolbar button.primary {
      background: #FF6B2C;
      color: white;
      border-color: #FF6B2C;
    }
    .dekont {
      max-width: 480px;
      margin: 0 auto;
      background: white;
      padding: 32px 28px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      font-variant-numeric: tabular-nums;
    }
    .firma {
      text-align: center;
      margin-bottom: 16px;
    }
    .firma h1 {
      font-size: 22px;
      margin: 0 0 4px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .firma p {
      margin: 2px 0;
      font-size: 12px;
      color: #666;
    }
    hr {
      border: 0;
      border-top: 1px dashed #ddd;
      margin: 18px 0;
    }
    .baslik {
      text-align: center;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.1em;
      margin: 14px 0 6px;
    }
    .dekont-no {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #666;
      margin-bottom: 18px;
    }
    .bilgi {
      display: grid;
      grid-template-columns: 90px 1fr;
      gap: 6px 10px;
      font-size: 14px;
      margin-bottom: 18px;
    }
    .bilgi dt { color: #666; }
    .bilgi dd { margin: 0; font-weight: 500; }
    .satir {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 14px;
    }
    .satir.alt {
      padding-left: 14px;
      color: #555;
    }
    .toplam {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-top: 1px solid #333;
      margin-top: 6px;
      font-weight: 700;
      font-size: 16px;
    }
    .kalan {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-weight: 600;
    }
    .kalan.odendi {
      color: #16a34a;
    }
    .kalan.borc {
      color: #d97706;
    }
    .footer {
      margin-top: 22px;
      font-size: 11px;
      color: #666;
      text-align: center;
    }
    .footer .tesekkur {
      font-style: italic;
      margin-top: 8px;
      color: #444;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .toolbar { display: none; }
      .dekont {
        box-shadow: none;
        border: 0;
        padding: 12mm;
        max-width: none;
        margin: 0;
      }
      @page {
        size: A5;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="primary" onclick="window.print()">🖨️ Yazdır / PDF Olarak Kaydet</button>
    <a href="javascript:window.close()">Kapat</a>
  </div>

  <div class="dekont">
    <div class="firma">
      <h1>${escape(d.firmaAdi)}</h1>
      <p>Kurban Bayramı 2026</p>
      ${d.firmaAdres ? `<p>${escape(d.firmaAdres)}</p>` : ""}
      ${d.firmaTel ? `<p>Tel: ${escape(d.firmaTel)}</p>` : ""}
    </div>

    <hr>

    <div class="baslik">TAHSİLAT MAKBUZU</div>
    <div class="dekont-no">
      <span>No: <strong>${escape(d.dekontNo)}</strong></span>
      <span>${escape(d.tarih)}</span>
    </div>

    <dl class="bilgi">
      <dt>Müşteri:</dt><dd>${escape(d.musteriAdi)}</dd>
      ${d.musteriTel ? `<dt>Telefon:</dt><dd>${escape(d.musteriTel)}</dd>` : ""}
      <dt>Kurban:</dt><dd>#${d.kurbanNo} (${d.hisseNo}. hisse)</dd>
    </dl>

    <hr>

    <div class="satir"><span>Hisse Bedeli:</span><span>${formatPara(d.hisseBedeli)}</span></div>
    ${
      d.oncekiOdemeler > 0
        ? `<div class="satir"><span>Önceki Ödemeler:</span><span>${formatPara(d.oncekiOdemeler)}</span></div>`
        : ""
    }

    <div style="margin-top: 12px; font-weight: 600;">Bu Ödeme:</div>
    ${d.nakit > 0 ? `<div class="satir alt"><span>Nakit:</span><span>${formatPara(d.nakit)}</span></div>` : ""}
    ${d.havale > 0 ? `<div class="satir alt"><span>Havale:</span><span>${formatPara(d.havale)}</span></div>` : ""}
    ${d.kart > 0 ? `<div class="satir alt"><span>Kart:</span><span>${formatPara(d.kart)}</span></div>` : ""}

    <div class="toplam"><span>TOPLAM:</span><span>${formatPara(d.toplam)}</span></div>

    <div class="kalan ${d.kalan <= 0 ? "odendi" : "borc"}">
      <span>Kalan Bakiye:</span>
      <span>${d.kalan <= 0 ? "TAMAMI ÖDENDİ ✓" : formatPara(d.kalan)}</span>
    </div>

    ${d.notlar ? `<hr><div style="font-size:12px;color:#666"><strong>Not:</strong> ${escape(d.notlar)}</div>` : ""}

    <div class="footer">
      <div>İşlemi Yapan: ${escape(d.kasiyer)}</div>
      ${d.altYazi ? `<div class="tesekkur">${escape(d.altYazi)}</div>` : ""}
    </div>
  </div>

  <script>
    // Otomatik print önizleme açma (opsiyonel)
    // window.addEventListener('load', () => setTimeout(() => window.print(), 300));
  </script>
</body>
</html>`;
}
