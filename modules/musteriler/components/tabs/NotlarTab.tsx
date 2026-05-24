"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatTarihSaat, gorelTarih } from "@/shared/lib/tarih";
import { NOT_RENKLERI, type NotRengi } from "../../types";
import {
  StickyNote,
  Pin,
  Pencil,
  Trash2,
  Save,
  X,
  Send,
} from "lucide-react";

interface NotSatir {
  id: string;
  icerik: string;
  renk: string;
  sabitlendiMi: boolean;
  olusturanAdSoyad: string;
  olusturanId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NotlarTabProps {
  musteriId: string;
  notlar: NotSatir[];
  oturumKullaniciId: string;
  izinler: {
    yaz: boolean;
    admin: boolean; // tüm notları düzenleyebilir/silebilir
  };
}

const MAX_KARAKTER = 1000;

export function NotlarTab({
  musteriId,
  notlar,
  oturumKullaniciId,
  izinler,
}: NotlarTabProps) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();

  const [yeniIcerik, setYeniIcerik] = useState("");
  const [yeniRenk, setYeniRenk] = useState<NotRengi>("bilgi");

  const [renkFiltre, setRenkFiltre] = useState<string>("hepsi");
  const [arama, setArama] = useState("");

  const filtreli = useMemo(() => {
    return notlar.filter((n) => {
      if (renkFiltre !== "hepsi" && n.renk !== renkFiltre) return false;
      if (arama.trim()) {
        const q = arama.trim().toLowerCase();
        if (!n.icerik.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [notlar, renkFiltre, arama]);

  // Sabitlenenler önce, sonra tarih
  const sirali = [...filtreli].sort((a, b) => {
    if (a.sabitlendiMi !== b.sabitlendiMi) return a.sabitlendiMi ? -1 : 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  function notKaydet() {
    if (yeniIcerik.trim().length < 1) {
      toast.error("Not boş olamaz");
      return;
    }
    if (yeniIcerik.length > MAX_KARAKTER) {
      toast.error("Not çok uzun (max 1000 karakter)");
      return;
    }
    startTransition(async () => {
      try {
        const yanit = await fetch(`/api/musteriler/${musteriId}/notlar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ icerik: yeniIcerik.trim(), renk: yeniRenk }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Kayıt başarısız");
        }
        toast.success("Not kaydedildi");
        setYeniIcerik("");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      notKaydet();
    }
  }

  return (
    <div className="space-y-4">
      {/* Yeni not — sticky üst */}
      {izinler.yaz && (
        <Card className="border-primary/40 sticky top-12 z-[1]">
          <CardContent className="space-y-2 pt-4">
            <Textarea
              rows={3}
              value={yeniIcerik}
              onChange={(e) => setYeniIcerik(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Müşteri hakkında not yazın... (Ctrl+Enter ile kaydet)"
              maxLength={MAX_KARAKTER}
              disabled={bekleniyor}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs">Renk:</span>
              {NOT_RENKLERI.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setYeniRenk(r.id)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${r.bg} ${r.text} ${
                    yeniRenk === r.id
                      ? `ring-2 ${r.border} ring-offset-1`
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {r.ad}
                </button>
              ))}
              <span className="text-muted-foreground ml-auto text-xs">
                {yeniIcerik.length}/{MAX_KARAKTER}
              </span>
              <Button
                size="sm"
                onClick={notKaydet}
                disabled={bekleniyor || yeniIcerik.trim().length === 0}
              >
                <Send size={12} className="mr-1" />
                {bekleniyor ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtre */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Not içeriği ara..."
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={renkFiltre}
              onValueChange={(v) => v && setRenkFiltre(v)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hepsi">Tüm renkler</SelectItem>
                {NOT_RENKLERI.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.ad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground ml-auto text-xs">
              {sirali.length} / {notlar.length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Liste */}
      {sirali.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <StickyNote
              size={32}
              className="text-muted-foreground/40 mx-auto mb-2"
            />
            <p className="text-muted-foreground text-sm">
              {notlar.length === 0
                ? "Henüz not yok."
                : "Filtreye uygun not yok."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {sirali.map((n) => (
            <NotSatir
              key={n.id}
              not={n}
              musteriId={musteriId}
              kendiNotu={n.olusturanId === oturumKullaniciId}
              admin={izinler.admin}
              izinYaz={izinler.yaz}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotSatir({
  not,
  musteriId,
  kendiNotu,
  admin,
  izinYaz,
}: {
  not: NotSatir;
  musteriId: string;
  kendiNotu: boolean;
  admin: boolean;
  izinYaz: boolean;
}) {
  const router = useRouter();
  const [duzenleMod, setDuzenleMod] = useState(false);
  const [icerik, setIcerik] = useState(not.icerik);
  const [bekleniyor, startTransition] = useTransition();

  const renk =
    NOT_RENKLERI.find((r) => r.id === not.renk) ?? NOT_RENKLERI[0]!;
  const duzenleyebilir = (kendiNotu || admin) && izinYaz;

  function kaydet() {
    if (icerik.trim().length === 0) return;
    startTransition(async () => {
      try {
        const yanit = await fetch(
          `/api/musteriler/${musteriId}/notlar/${not.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ icerik: icerik.trim() }),
          },
        );
        if (!yanit.ok) throw new Error("Güncelleme başarısız");
        toast.success("Not güncellendi");
        setDuzenleMod(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  function sil() {
    if (!confirm("Bu notu silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      try {
        const yanit = await fetch(
          `/api/musteriler/${musteriId}/notlar/${not.id}`,
          {
            method: "DELETE",
          },
        );
        if (!yanit.ok) throw new Error("Silme başarısız");
        toast.success("Not silindi");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  function sabitle() {
    startTransition(async () => {
      try {
        const yanit = await fetch(
          `/api/musteriler/${musteriId}/notlar/${not.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sabitlendiMi: !not.sabitlendiMi }),
          },
        );
        if (!yanit.ok) throw new Error("Güncelleme başarısız");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  return (
    <li
      className={`rounded-lg border-l-4 ${renk.border} ${renk.bg} p-3 transition-colors`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <Badge className={`${renk.bg} ${renk.text} hover:${renk.bg}`}>
            {renk.ad}
          </Badge>
          {not.sabitlendiMi && (
            <Badge variant="secondary" className="text-xs">
              <Pin size={10} className="mr-0.5" />
              Sabit
            </Badge>
          )}
          <span className="text-muted-foreground">
            {formatTarihSaat(not.createdAt)} · {not.olusturanAdSoyad}
            {not.updatedAt > not.createdAt && " (düzenlendi)"}
          </span>
          <span className="text-muted-foreground">· {gorelTarih(not.createdAt)}</span>
        </div>
        {duzenleyebilir && !duzenleMod && (
          <div className="flex gap-0.5">
            <Button size="sm" variant="ghost" onClick={sabitle} disabled={bekleniyor}>
              <Pin size={12} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDuzenleMod(true)}
              disabled={bekleniyor}
            >
              <Pencil size={12} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={sil}
              disabled={bekleniyor}
            >
              <Trash2 size={12} />
            </Button>
          </div>
        )}
      </div>
      {duzenleMod ? (
        <div className="space-y-2">
          <Textarea
            rows={3}
            value={icerik}
            onChange={(e) => setIcerik(e.target.value)}
            maxLength={MAX_KARAKTER}
            disabled={bekleniyor}
          />
          <div className="flex justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDuzenleMod(false);
                setIcerik(not.icerik);
              }}
              disabled={bekleniyor}
            >
              <X size={12} className="mr-1" />
              Vazgeç
            </Button>
            <Button size="sm" onClick={kaydet} disabled={bekleniyor}>
              <Save size={12} className="mr-1" />
              Kaydet
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap">{not.icerik}</p>
      )}
    </li>
  );
}
