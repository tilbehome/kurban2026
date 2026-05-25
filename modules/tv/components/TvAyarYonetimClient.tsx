"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Megaphone, ListOrdered, ShieldCheck, MessageCircle, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AyarAnahtari =
  | "duyuru"
  | "sira_hatirlatma"
  | "hijyen"
  | "whatsapp_tel"
  | "lokasyon";

export interface AyarKisa {
  anahtarKey: AyarAnahtari;
  deger: string;
}

interface TvAyarYonetimClientProps {
  ilkAyarlar: AyarKisa[];
}

interface AyarTanim {
  anahtar: AyarAnahtari;
  baslik: string;
  ikon: typeof Megaphone;
  aciklama: string;
  textarea: boolean;
  maxLength: number;
  placeholder: string;
}

const TANIMLAR: AyarTanim[] = [
  {
    anahtar: "duyuru",
    baslik: "Duyurular",
    ikon: Megaphone,
    aciklama: "TV ekranı alt şeridinde gösterilir.",
    textarea: true,
    maxLength: 300,
    placeholder: "Kesim alanında anonsları takip ediniz.",
  },
  {
    anahtar: "sira_hatirlatma",
    baslik: "Sıra Hatırlatması",
    ikon: ListOrdered,
    aciklama: "Müşterilere sıra bilgisi nasıl iletilecek.",
    textarea: true,
    maxLength: 300,
    placeholder:
      "Sıranız geldiğinde ekranda ve anonsla bilgilendirileceksiniz.",
  },
  {
    anahtar: "hijyen",
    baslik: "Hijyen Önceliğimiz",
    ikon: ShieldCheck,
    aciklama: "Hijyen kuralları kısa mesajı.",
    textarea: true,
    maxLength: 300,
    placeholder:
      "Hijyen kurallarına uyalım, sağlığımızı birlikte koruyalım.",
  },
  {
    anahtar: "whatsapp_tel",
    baslik: "WhatsApp İletişim",
    ikon: MessageCircle,
    aciklama:
      "Müşteriler bu numaraya tıklayarak WhatsApp'tan iletişime geçer.",
    textarea: false,
    maxLength: 30,
    placeholder: "0532 123 45 67",
  },
  {
    anahtar: "lokasyon",
    baslik: "Lokasyon",
    ikon: MapPin,
    aciklama: "TV ekranı üst barında görünen lokasyon adı.",
    textarea: false,
    maxLength: 80,
    placeholder: "Merkez Kesim Alanı",
  },
];

export function TvAyarYonetimClient({
  ilkAyarlar,
}: TvAyarYonetimClientProps) {
  const router = useRouter();
  const [degerler, setDegerler] = useState<Record<AyarAnahtari, string>>(() => {
    const m = new Map(ilkAyarlar.map((a) => [a.anahtarKey, a.deger]));
    return {
      duyuru: m.get("duyuru") ?? "",
      sira_hatirlatma: m.get("sira_hatirlatma") ?? "",
      hijyen: m.get("hijyen") ?? "",
      whatsapp_tel: m.get("whatsapp_tel") ?? "",
      lokasyon: m.get("lokasyon") ?? "",
    };
  });
  const [bekleyenAnahtar, setBekleyenAnahtar] = useState<AyarAnahtari | null>(
    null,
  );
  const [, startTransition] = useTransition();

  function kaydet(anahtar: AyarAnahtari) {
    const deger = degerler[anahtar].trim();
    if (deger.length === 0) {
      toast.error("Değer boş olamaz");
      return;
    }
    setBekleyenAnahtar(anahtar);
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/tv/ayarlar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anahtarKey: anahtar, deger }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Kaydetme başarısız");
        }
        toast.success("Kaydedildi");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      } finally {
        setBekleyenAnahtar(null);
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {TANIMLAR.map((t) => {
        const Ikon = t.ikon;
        const deger = degerler[t.anahtar];
        return (
          <Card key={t.anahtar}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="bg-orange-100 text-orange-700 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Ikon size={15} />
                </span>
                {t.baslik}
              </CardTitle>
              <p className="text-muted-foreground text-[11px]">
                {t.aciklama}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor={`ayar-${t.anahtar}`}
                  className="text-muted-foreground flex items-center justify-between text-xs"
                >
                  <span>Değer</span>
                  <span className="font-tabular">
                    {deger.length} / {t.maxLength}
                  </span>
                </Label>
                {t.textarea ? (
                  <Textarea
                    id={`ayar-${t.anahtar}`}
                    value={deger}
                    onChange={(e) =>
                      setDegerler((eski) => ({
                        ...eski,
                        [t.anahtar]: e.target.value.slice(0, t.maxLength),
                      }))
                    }
                    placeholder={t.placeholder}
                    rows={3}
                    className="text-sm"
                  />
                ) : (
                  <Input
                    id={`ayar-${t.anahtar}`}
                    value={deger}
                    onChange={(e) =>
                      setDegerler((eski) => ({
                        ...eski,
                        [t.anahtar]: e.target.value.slice(0, t.maxLength),
                      }))
                    }
                    placeholder={t.placeholder}
                    className="h-9 text-sm"
                  />
                )}
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => kaydet(t.anahtar)}
                disabled={bekleyenAnahtar === t.anahtar}
                className="self-end"
              >
                <Save size={13} />
                {bekleyenAnahtar === t.anahtar ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
