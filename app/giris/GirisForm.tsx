"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GirisFormProps {
  next?: string;
  hata?: string;
}

export function GirisForm({ next, hata }: GirisFormProps) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [hataMsj, setHataMsj] = useState<string | undefined>(hata);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHataMsj(undefined);

    startTransition(async () => {
      try {
        const yanit = await fetch("/api/auth/giris", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kullaniciAdi, sifre }),
        });

        const veri = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };

        if (!yanit.ok || !veri.basarili) {
          setHataMsj(veri.hata ?? "Giriş yapılamadı.");
          toast.error(veri.hata ?? "Giriş yapılamadı.");
          return;
        }

        toast.success("Hoş geldiniz!");
        router.push(next ?? "/");
        router.refresh();
      } catch {
        setHataMsj("Sunucuya bağlanılamadı.");
        toast.error("Sunucuya bağlanılamadı.");
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="kullaniciAdi">Kullanıcı Adı</Label>
            <Input
              id="kullaniciAdi"
              name="kullaniciAdi"
              autoComplete="username"
              autoFocus
              required
              value={kullaniciAdi}
              onChange={(e) => setKullaniciAdi(e.target.value)}
              disabled={bekleniyor}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sifre">Şifre</Label>
            <Input
              id="sifre"
              name="sifre"
              type="password"
              autoComplete="current-password"
              required
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              disabled={bekleniyor}
            />
          </div>

          {hataMsj && (
            <div className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-sm">
              {hataMsj}
            </div>
          )}

          <Button type="submit" disabled={bekleniyor} className="w-full">
            {bekleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
