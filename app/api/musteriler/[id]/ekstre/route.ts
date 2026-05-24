import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { tumAyarlar } from "@/modules/_core/ayarlar/ayar.service";
import { formatPara, topla, yuvarla } from "@/shared/lib/para";
import { formatTarihSaat, formatTarih } from "@/shared/lib/tarih";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Müşteri hesap ekstresi — print-friendly HTML (browser → PDF).
 * Borç / ödeme / bakiye sütunlu tablo.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.goruntule")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }
  const { id } = await params;

  const musteri = await prisma.musteri.findFirst({
    where: { id, silindiMi: false },
    include: {
      hisseler: {
        where: { silindiMi: false },
        include: {
          kurban: { select: { kesimSirasi: true } },
          odemeler: {
            where: { iptal: false },
            orderBy: { tarih: "asc" },
          },
        },
        orderBy: [{ kurban: { kesimSirasi: "asc" } }, { no: "asc" }],
      },
    },
  });
  if (!musteri) {
    return NextResponse.json(
      { basarili: false, hata: "Müşteri bulunamadı" },
      { status: 404 },
    );
  }

  const ayarlar = await tumAyarlar();
  const firmaAdi = ayarlar.firma_adi ?? "Tilbe Kurban";
  const firmaTel = ayarlar.firma_telefon ?? "";
  const firmaAdres = ayarlar.firma_adres ?? "";

  type Satir =
    | { tip: "borc"; tarih: Date; aciklama: string; tutar: number }
    | {
        tip: "odeme";
        tarih: Date;
        aciklama: string;
        tutar: number;
        dekontNo: string;
      };

  const satirlar: Satir[] = [];
  for (const h of musteri.hisseler) {
    satirlar.push({
      tip: "borc",
      tarih: h.createdAt,
      aciklama: `Kurban #${h.kurban.kesimSirasi} - ${h.no}. hisse atandı`,
      tutar: h.hisseFiyati,
    });
    for (const o of h.odemeler) {
      satirlar.push({
        tip: "odeme",
        tarih: o.tarih,
        aciklama: `Tahsilat (${o.yontem})`,
        tutar: o.toplamTutar,
        dekontNo: o.dekontNo,
      });
    }
  }
  satirlar.sort((a, b) => a.tarih.getTime() - b.tarih.getTime());

  const toplamBedel = yuvarla(
    topla(...musteri.hisseler.map((h) => h.hisseFiyati)),
  );
  const toplamOdeme = yuvarla(
    topla(
      ...musteri.hisseler.flatMap((h) =>
        h.odemeler.map((o) => o.toplamTutar),
      ),
    ),
  );
  const kalan = yuvarla(toplamBedel - toplamOdeme);

  let bakiye = 0;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Hesap Ekstresi — ${escapeHtml(musteri.adSoyad)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; color: #1a1a1a; background: #f5f5f5; }
    .toolbar { max-width: 800px; margin: 0 auto 16px; display: flex; gap: 8px; }
    .toolbar button { flex: 1; padding: 10px 16px; border: 1px solid #d4d4d4; background: #fff; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; }
    .toolbar button.primary { background: #FF6B2C; color: white; border-color: #FF6B2C; }
    .belge { max-width: 800px; margin: 0 auto; background: white; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); font-variant-numeric: tabular-nums; }
    .firma { text-align: center; margin-bottom: 16px; }
    .firma h1 { font-size: 22px; margin: 0 0 4px; font-weight: 800; }
    .firma p { margin: 2px 0; font-size: 12px; color: #666; }
    hr { border: 0; border-top: 1px dashed #ddd; margin: 16px 0; }
    .baslik { text-align: center; font-size: 16px; font-weight: 700; letter-spacing: 0.05em; margin: 14px 0 12px; }
    .musteri-bilgi { display: grid; grid-template-columns: 120px 1fr; gap: 4px 12px; font-size: 13px; margin-bottom: 16px; }
    .musteri-bilgi dt { color: #666; }
    .musteri-bilgi dd { margin: 0; font-weight: 500; }
    .ozet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
    .ozet > div { padding: 10px; border: 1px solid #e8eaed; border-radius: 6px; }
    .ozet p:first-child { margin: 0 0 4px; font-size: 11px; color: #666; }
    .ozet p:last-child { margin: 0; font-size: 16px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    table thead { background: #f8f9fa; }
    th, td { padding: 8px 10px; border-bottom: 1px solid #e8eaed; text-align: left; }
    th { font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase; }
    td.sayi { text-align: right; font-variant-numeric: tabular-nums; }
    .borc { color: #d97706; }
    .odeme { color: #16a34a; }
    .bakiye-borc { color: #d97706; font-weight: 600; }
    .bakiye-tamam { color: #16a34a; font-weight: 600; }
    .dekont-no { font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: #888; }
    .footer { margin-top: 24px; font-size: 11px; color: #888; text-align: center; }
    @media print {
      body { background: white; padding: 0; }
      .toolbar { display: none; }
      .belge { box-shadow: none; padding: 16mm; max-width: none; margin: 0; }
      @page { size: A4; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="primary" onclick="window.print()">🖨️ Yazdır / PDF Olarak Kaydet</button>
    <button onclick="window.close()">Kapat</button>
  </div>

  <div class="belge">
    <div class="firma">
      <h1>${escapeHtml(firmaAdi)}</h1>
      ${firmaAdres ? `<p>${escapeHtml(firmaAdres)}</p>` : ""}
      ${firmaTel ? `<p>Tel: ${escapeHtml(firmaTel)}</p>` : ""}
    </div>

    <hr>

    <div class="baslik">HESAP EKSTRESİ</div>

    <dl class="musteri-bilgi">
      <dt>Müşteri:</dt><dd>${escapeHtml(musteri.adSoyad)}</dd>
      ${musteri.telefon ? `<dt>Telefon:</dt><dd>${escapeHtml(musteri.telefon)}</dd>` : ""}
      <dt>Düzenleme:</dt><dd>${formatTarihSaat(new Date())}</dd>
      <dt>Kayıt Tarihi:</dt><dd>${formatTarih(musteri.createdAt)}</dd>
    </dl>

    <div class="ozet">
      <div>
        <p>Toplam Bedel</p>
        <p>${formatPara(toplamBedel)}</p>
      </div>
      <div>
        <p>Toplam Ödenen</p>
        <p class="odeme">${formatPara(toplamOdeme)}</p>
      </div>
      <div>
        <p>Kalan Bakiye</p>
        <p class="${kalan > 0 ? "bakiye-borc" : "bakiye-tamam"}">${formatPara(kalan)}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Tarih</th>
          <th>Açıklama</th>
          <th class="sayi">Borç</th>
          <th class="sayi">Ödeme</th>
          <th class="sayi">Bakiye</th>
        </tr>
      </thead>
      <tbody>
        ${
          satirlar.length === 0
            ? `<tr><td colspan="5" style="text-align:center;padding:20px;color:#888">Hareket yok</td></tr>`
            : satirlar
                .map((s) => {
                  if (s.tip === "borc") bakiye = yuvarla(bakiye + s.tutar);
                  else bakiye = yuvarla(bakiye - s.tutar);
                  return `
        <tr>
          <td>${formatTarihSaat(s.tarih)}</td>
          <td>${escapeHtml(s.aciklama)}${s.tip === "odeme" ? `<br><span class="dekont-no">${escapeHtml(s.dekontNo)}</span>` : ""}</td>
          <td class="sayi ${s.tip === "borc" ? "borc" : ""}">${s.tip === "borc" ? formatPara(s.tutar) : "—"}</td>
          <td class="sayi ${s.tip === "odeme" ? "odeme" : ""}">${s.tip === "odeme" ? formatPara(s.tutar) : "—"}</td>
          <td class="sayi ${bakiye > 0 ? "bakiye-borc" : "bakiye-tamam"}">${formatPara(bakiye)}</td>
        </tr>`;
                })
                .join("")
        }
      </tbody>
    </table>

    <div class="footer">
      Bu ekstre ${formatTarihSaat(new Date())} tarihinde sistemden alınmıştır.
      Resmi belge değildir.
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
