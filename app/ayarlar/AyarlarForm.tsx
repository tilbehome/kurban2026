"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Building2,
  Phone,
  MapPin,
  Share2,
  Palette,
  Globe,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AyarlarFormProps {
  ayarlar: Record<string, string>;
}

/**
 * Ada Bereket firma ayarları formu — 6 bölümlü.
 * Tüm değerler /ayarlar sayfasından canlı düzenlenebilir.
 */
export function AyarlarForm({ ayarlar }: AyarlarFormProps) {
  const [bekleniyor, startTransition] = useTransition();
  const [veri, setVeri] = useState({
    firma_adi: ayarlar.firma_adi ?? "Ada Bereket Hayvancılık",
    firma_kisa_ad: ayarlar.firma_kisa_ad ?? "Ada Bereket",
    firma_slogan:
      ayarlar.firma_slogan ?? "Güvenilir Hizmet, Bereketli Kazanç",
    firma_telefon: ayarlar.firma_telefon ?? "",
    firma_whatsapp: ayarlar.firma_whatsapp ?? "",
    firma_email: ayarlar.firma_email ?? "",
    firma_web: ayarlar.firma_web ?? "",
    firma_adres: ayarlar.firma_adres ?? "",
    firma_il: ayarlar.firma_il ?? "",
    firma_ilce: ayarlar.firma_ilce ?? "",
    firma_posta_kodu: ayarlar.firma_posta_kodu ?? "",
    firma_instagram: ayarlar.firma_instagram ?? "",
    firma_tiktok: ayarlar.firma_tiktok ?? "",
    firma_youtube: ayarlar.firma_youtube ?? "",
    firma_facebook: ayarlar.firma_facebook ?? "",
    marka_rengi: ayarlar.marka_rengi ?? "#DE0B1E",
    dekont_prefix: ayarlar.dekont_prefix ?? "ABH-2026-",
    dekont_alt_yazi: ayarlar.dekont_alt_yazi ?? "",
    public_url: ayarlar.public_url ?? "",
    firma_sube_aktif: ayarlar.firma_sube_aktif ?? "Merkez Kesim Alanı",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/ayarlar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(veri),
        });
        if (!yanit.ok) throw new Error("Kaydetme başarısız");
        toast.success("Firma bilgileri kaydedildi");
      } catch {
        toast.error("Kaydetme sırasında hata oluştu");
      }
    });
  }

  function guncelle<K extends keyof typeof veri>(
    anahtar: K,
    deger: string,
  ) {
    setVeri((eski) => ({ ...eski, [anahtar]: deger }));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <Bolum
        ikon={<Building2 size={16} />}
        baslik="Kimlik"
        aciklama="Firma adı ve marka kimliği"
      >
        <Alan label="Firma Adı (Tam)">
          <Input
            value={veri.firma_adi}
            onChange={(e) => guncelle("firma_adi", e.target.value)}
            disabled={bekleniyor}
            placeholder="Ada Bereket Hayvancılık"
          />
        </Alan>
        <Alan label="Kısa Ad (Sidebar / Bildirim)">
          <Input
            value={veri.firma_kisa_ad}
            onChange={(e) => guncelle("firma_kisa_ad", e.target.value)}
            disabled={bekleniyor}
            placeholder="Ada Bereket"
            maxLength={30}
          />
        </Alan>
        <Alan label="Slogan">
          <Input
            value={veri.firma_slogan}
            onChange={(e) => guncelle("firma_slogan", e.target.value)}
            disabled={bekleniyor}
            placeholder="Güvenilir Hizmet, Bereketli Kazanç"
          />
        </Alan>
      </Bolum>

      <Bolum
        ikon={<Phone size={16} />}
        baslik="İletişim"
        aciklama="Müşterilerle paylaşılacak kanallar"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Alan label="Telefon">
            <Input
              type="tel"
              value={veri.firma_telefon}
              onChange={(e) => guncelle("firma_telefon", e.target.value)}
              disabled={bekleniyor}
              placeholder="+90 536 390 44 18"
            />
          </Alan>
          <Alan label="WhatsApp (sadece rakam)">
            <Input
              inputMode="numeric"
              value={veri.firma_whatsapp}
              onChange={(e) => guncelle("firma_whatsapp", e.target.value)}
              disabled={bekleniyor}
              placeholder="905363904418"
            />
          </Alan>
          <Alan label="E-posta">
            <Input
              type="email"
              value={veri.firma_email}
              onChange={(e) => guncelle("firma_email", e.target.value)}
              disabled={bekleniyor}
              placeholder="adabereket@example.com"
            />
          </Alan>
          <Alan label="Web Sitesi">
            <Input
              value={veri.firma_web}
              onChange={(e) => guncelle("firma_web", e.target.value)}
              disabled={bekleniyor}
              placeholder="adaberekethayvancilik.com.tr"
            />
          </Alan>
        </div>
      </Bolum>

      <Bolum
        ikon={<MapPin size={16} />}
        baslik="Adres"
        aciklama="Dekont ve raporlarda kullanılır"
      >
        <Alan label="Adres (Sokak / Cadde)">
          <Textarea
            rows={2}
            value={veri.firma_adres}
            onChange={(e) => guncelle("firma_adres", e.target.value)}
            disabled={bekleniyor}
            placeholder="Harmantepe, Örgün Sokak No: 24"
          />
        </Alan>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Alan label="İl">
            <Input
              value={veri.firma_il}
              onChange={(e) => guncelle("firma_il", e.target.value)}
              disabled={bekleniyor}
              placeholder="Sakarya"
            />
          </Alan>
          <Alan label="İlçe">
            <Input
              value={veri.firma_ilce}
              onChange={(e) => guncelle("firma_ilce", e.target.value)}
              disabled={bekleniyor}
              placeholder="Adapazarı"
            />
          </Alan>
          <Alan label="Posta Kodu">
            <Input
              value={veri.firma_posta_kodu}
              onChange={(e) =>
                guncelle("firma_posta_kodu", e.target.value)
              }
              disabled={bekleniyor}
              placeholder="54104"
              maxLength={5}
            />
          </Alan>
        </div>
      </Bolum>

      <Bolum
        ikon={<Share2 size={16} />}
        baslik="Sosyal Medya"
        aciklama="Dekont ve müşteri ekranlarında gösterilir (opsiyonel)"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Alan label="Instagram">
            <Input
              value={veri.firma_instagram}
              onChange={(e) =>
                guncelle("firma_instagram", e.target.value)
              }
              disabled={bekleniyor}
              placeholder="@adaberekethayvancilik"
            />
          </Alan>
          <Alan label="TikTok">
            <Input
              value={veri.firma_tiktok}
              onChange={(e) => guncelle("firma_tiktok", e.target.value)}
              disabled={bekleniyor}
              placeholder="@adaberekethayvancilik"
            />
          </Alan>
          <Alan label="YouTube">
            <Input
              value={veri.firma_youtube}
              onChange={(e) => guncelle("firma_youtube", e.target.value)}
              disabled={bekleniyor}
              placeholder="@adaberekethayvancilik"
            />
          </Alan>
          <Alan label="Facebook">
            <Input
              value={veri.firma_facebook}
              onChange={(e) =>
                guncelle("firma_facebook", e.target.value)
              }
              disabled={bekleniyor}
              placeholder="(opsiyonel)"
            />
          </Alan>
        </div>
      </Bolum>

      <Bolum
        ikon={<Palette size={16} />}
        baslik="Marka & Dekont"
        aciklama="Dekont gösterimi ve tema rengi"
      >
        <Alan label="Marka Rengi (HEX)">
          <div className="flex items-center gap-3">
            <Input
              value={veri.marka_rengi}
              onChange={(e) => guncelle("marka_rengi", e.target.value)}
              disabled={bekleniyor}
              placeholder="#DE0B1E"
              maxLength={7}
              className="flex-1"
            />
            <div
              className="border-stone-300 h-9 w-12 shrink-0 rounded border"
              style={{ backgroundColor: veri.marka_rengi }}
            />
          </div>
        </Alan>
        <Alan label="Dekont Numara Ön Eki">
          <Input
            value={veri.dekont_prefix}
            onChange={(e) => guncelle("dekont_prefix", e.target.value)}
            disabled={bekleniyor}
            placeholder="ABH-2026-"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Örnek ön ek <code>ABH-2026-</code> ile dekont no{" "}
            <code>ABH-2026-00142</code>
          </p>
        </Alan>
        <Alan label="Dekont Alt Yazısı">
          <Textarea
            rows={2}
            value={veri.dekont_alt_yazi}
            onChange={(e) => guncelle("dekont_alt_yazi", e.target.value)}
            disabled={bekleniyor}
            placeholder="Güvendiğiniz için teşekkür ederiz."
          />
        </Alan>
      </Bolum>

      <Bolum
        ikon={<Globe size={16} />}
        baslik="Sistem"
        aciklama="QR kod ve kamuya açık linkler"
      >
        <Alan label="Public URL (QR kodlarda kullanılır)">
          <Input
            value={veri.public_url}
            onChange={(e) => guncelle("public_url", e.target.value)}
            disabled={bekleniyor}
            placeholder="https://adaberekethayvancilik.com.tr"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Müşteri QR okuttuğunda buraya + /tv/m/k/[no] yönlendirilir
          </p>
        </Alan>
        <Alan label="Aktif Şube / Lokasyon">
          <Input
            value={veri.firma_sube_aktif}
            onChange={(e) =>
              guncelle("firma_sube_aktif", e.target.value)
            }
            disabled={bekleniyor}
            placeholder="Merkez Kesim Alanı"
          />
        </Alan>
      </Bolum>

      <Button
        type="submit"
        disabled={bekleniyor}
        className="self-start"
        size="lg"
      >
        <Save size={16} />
        {bekleniyor ? "Kaydediliyor..." : "Tüm Ayarları Kaydet"}
      </Button>
    </form>
  );
}

interface BolumProps {
  ikon: React.ReactNode;
  baslik: string;
  aciklama: string;
  children: React.ReactNode;
}

function Bolum({ ikon, baslik, aciklama, children }: BolumProps) {
  return (
    <section className="flex flex-col gap-4 border-l-2 border-stone-200 pl-4">
      <header className="flex items-center gap-2.5">
        <span className="bg-stone-100 text-stone-700 flex h-8 w-8 items-center justify-center rounded-md">
          {ikon}
        </span>
        <div>
          <h3 className="text-base font-semibold">{baslik}</h3>
          <p className="text-muted-foreground text-xs">{aciklama}</p>
        </div>
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

interface AlanProps {
  label: string;
  children: React.ReactNode;
}

function Alan({ label, children }: AlanProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
