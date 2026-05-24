"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Pencil } from "lucide-react";

interface KullaniciActionsProps {
  mod: "ekle" | "duzenle";
  kullaniciId?: string;
}

export function KullaniciActions({ mod, kullaniciId }: KullaniciActionsProps) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [bekleniyor, startTransition] = useTransition();
  const [veri, setVeri] = useState({
    kullaniciAdi: "",
    adSoyad: "",
    sifre: "",
    rol: "kasiyer" as "admin" | "kasiyer",
    aktif: true,
  });

  function alanGuncelle<K extends keyof typeof veri>(
    anahtar: K,
    deger: (typeof veri)[K],
  ) {
    setVeri((eski) => ({ ...eski, [anahtar]: deger }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const yol = kullaniciId
          ? `/api/kullanicilar/${kullaniciId}`
          : "/api/kullanicilar";
        const yontem = kullaniciId ? "PATCH" : "POST";
        const yanit = await fetch(yol, {
          method: yontem,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(veri),
        });
        const sonuc = (await yanit.json()) as { basarili: boolean; hata?: string };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Hata");
        }
        toast.success(kullaniciId ? "Kullanıcı güncellendi" : "Kullanıcı eklendi");
        setAcik(false);
        router.refresh();
      } catch (e) {
        const m = e instanceof Error ? e.message : "Hata";
        toast.error(m);
      }
    });
  }

  return (
    <Dialog open={acik} onOpenChange={setAcik}>
      <DialogTrigger
        render={
          mod === "ekle" ? (
            <Button>
              <UserPlus size={16} className="mr-1" />
              Yeni Kullanıcı
            </Button>
          ) : (
            <Button variant="ghost" size="sm">
              <Pencil size={14} />
            </Button>
          )
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mod === "ekle" ? "Yeni Kullanıcı" : "Kullanıcıyı Düzenle"}
          </DialogTitle>
          <DialogDescription>
            {mod === "duzenle"
              ? "Boş bıraktığınız alanlar değişmez (şifre dahil)."
              : "Şifreyi en az 6 karakter belirleyin."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="kullaniciAdi">Kullanıcı Adı</Label>
            <Input
              id="kullaniciAdi"
              required={mod === "ekle"}
              value={veri.kullaniciAdi}
              onChange={(e) => alanGuncelle("kullaniciAdi", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="adSoyad">Ad Soyad</Label>
            <Input
              id="adSoyad"
              required={mod === "ekle"}
              value={veri.adSoyad}
              onChange={(e) => alanGuncelle("adSoyad", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sifre">Şifre</Label>
            <Input
              id="sifre"
              type="password"
              minLength={mod === "ekle" ? 6 : 0}
              required={mod === "ekle"}
              placeholder={mod === "duzenle" ? "Boş bırak (değişmesin)" : ""}
              value={veri.sifre}
              onChange={(e) => alanGuncelle("sifre", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rol">Rol</Label>
            <Select
              value={veri.rol}
              onValueChange={(v) => alanGuncelle("rol", v as "admin" | "kasiyer")}
            >
              <SelectTrigger id="rol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Yönetici</SelectItem>
                <SelectItem value="kasiyer">Kasiyer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  İptal
                </Button>
              }
            />
            <Button type="submit" disabled={bekleniyor}>
              {bekleniyor ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
