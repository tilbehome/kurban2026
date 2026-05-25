"use client";

import { useState, FormEvent } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { formatPara } from "@/shared/lib/para";

interface DekontBilgi {
  dekontNo: string;
  tarih: string;
  toplamTutar: number;
  musteriAdi: string;
  kurbanNo: number;
  hisseNo: number;
}

type Sonuc =
  | { tip: "beklemede" }
  | { tip: "yukleniyor" }
  | { tip: "gecerli"; dekont: DekontBilgi }
  | { tip: "gecersiz" }
  | { tip: "hata"; mesaj: string };

export function DogrulaForm() {
  const [dekontNo, setDekontNo] = useState("");
  const [dogrulamaKodu, setDogrulamaKodu] = useState("");
  const [sonuc, setSonuc] = useState<Sonuc>({ tip: "beklemede" });

  async function gonder(e: FormEvent) {
    e.preventDefault();
    if (!dekontNo.trim() || !dogrulamaKodu.trim()) return;

    setSonuc({ tip: "yukleniyor" });
    try {
      const yanit = await fetch("/api/dekont/dogrula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dekontNo: dekontNo.trim(),
          dogrulamaKodu: dogrulamaKodu.trim(),
        }),
      });

      if (!yanit.ok) {
        setSonuc({ tip: "hata", mesaj: "Sunucu hatası" });
        return;
      }

      const veri = (await yanit.json()) as
        | { gecerli: true; dekont: DekontBilgi }
        | { gecerli: false };

      if (veri.gecerli) {
        setSonuc({ tip: "gecerli", dekont: veri.dekont });
      } else {
        setSonuc({ tip: "gecersiz" });
      }
    } catch {
      setSonuc({ tip: "hata", mesaj: "Bağlantı hatası" });
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={gonder} className="space-y-4">
        <div>
          <Label htmlFor="dekontNo">Dekont No</Label>
          <Input
            id="dekontNo"
            value={dekontNo}
            onChange={(e) => setDekontNo(e.target.value)}
            placeholder="ABH-2026-000001"
            className="font-mono"
            autoComplete="off"
            spellCheck={false}
            required
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Dekont üzerindeki sıra numarası.
          </p>
        </div>

        <div>
          <Label htmlFor="dogrulamaKodu">Doğrulama Kodu</Label>
          <Input
            id="dogrulamaKodu"
            value={dogrulamaKodu}
            onChange={(e) => setDogrulamaKodu(e.target.value)}
            placeholder="ABH-XXXX"
            className="font-mono uppercase"
            autoComplete="off"
            spellCheck={false}
            required
          />
          <p className="text-muted-foreground mt-1 text-xs">
            QR kart altındaki 4 haneli kod.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={sonuc.tip === "yukleniyor"}
        >
          {sonuc.tip === "yukleniyor" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Doğrulanıyor...
            </>
          ) : (
            "Doğrula"
          )}
        </Button>
      </form>

      {sonuc.tip === "gecerli" && (
        <div className="border-green-200 bg-green-50 mt-6 rounded-lg border p-4">
          <div className="text-green-800 flex items-center gap-2 font-bold">
            <CheckCircle2 className="size-5" />
            Dekont Geçerli
          </div>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">Dekont No</dt>
              <dd className="font-mono font-semibold">{sonuc.dekont.dekontNo}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">Tarih</dt>
              <dd className="font-semibold">{sonuc.dekont.tarih}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">Müşteri</dt>
              <dd className="font-semibold">{sonuc.dekont.musteriAdi}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">Kurban</dt>
              <dd className="font-semibold">
                #{sonuc.dekont.kurbanNo} · {sonuc.dekont.hisseNo}. hisse
              </dd>
            </div>
            <div className="flex justify-between gap-2 border-t border-green-200 pt-2 mt-2">
              <dt className="text-slate-600">Tutar</dt>
              <dd className="font-bold text-green-900">
                {formatPara(sonuc.dekont.toplamTutar)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {sonuc.tip === "gecersiz" && (
        <div className="border-red-200 bg-red-50 mt-6 rounded-lg border p-4">
          <div className="text-red-800 flex items-center gap-2 font-bold">
            <XCircle className="size-5" />
            Dekont Geçersiz
          </div>
          <p className="text-red-700 mt-2 text-sm">
            Girdiğiniz dekont numarası veya doğrulama kodu hatalı. Lütfen
            kontrol edip tekrar deneyin.
          </p>
        </div>
      )}

      {sonuc.tip === "hata" && (
        <div className="border-amber-200 bg-amber-50 mt-6 rounded-lg border p-4 text-sm text-amber-900">
          {sonuc.mesaj}. Lütfen tekrar deneyin.
        </div>
      )}
    </Card>
  );
}
