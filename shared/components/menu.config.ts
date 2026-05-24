/**
 * Akordiyon sidebar için menü yapısı.
 * Sidebar.tsx bu config'i okuyup render eder.
 *
 * Not: "Kurbanlar" label'ı kullanılıyor ama route hâlâ /hayvanlar (Senaryo A).
 */

import type { Rol } from "@/shared/types/module.types";

export interface MenuItem {
  /** Ana menü etiketi */
  label: string;
  /** Tıklanınca gidilecek tek-sayfa link (children yoksa) */
  href?: string;
  /** lucide-react ikon adı */
  ikon: string;
  /** Alt menüler (varsa) */
  children?: MenuChild[];
  /** Hangi roller görür (default: hepsi) */
  izinler?: Rol[];
}

export interface MenuChild {
  label: string;
  href: string;
  izinler?: Rol[];
}

export const MENU: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/",
    ikon: "LayoutDashboard",
  },
  {
    label: "Müşteriler",
    ikon: "Users",
    children: [
      { label: "Tüm Müşteriler", href: "/musteriler" },
      { label: "Yeni Müşteri Ekle", href: "/musteriler/yeni" },
      { label: "Müşteri Ara", href: "/musteriler/ara" },
      { label: "Hesap Ekstresi", href: "/musteriler/ekstre" },
      { label: "Borçlular Listesi", href: "/musteriler/borclular" },
    ],
  },
  {
    label: "Kurbanlar",
    ikon: "Beef",
    children: [
      { label: "Tüm Kurbanlar", href: "/hayvanlar" },
      { label: "Yeni Kurban Ekle", href: "/hayvanlar/yeni" },
      { label: "Hisse Atama", href: "/hayvanlar/hisse-atama" },
      { label: "Boş Hisseler", href: "/hayvanlar/bos-hisseler" },
      { label: "Vekalet Listesi", href: "/hayvanlar/vekalet" },
    ],
  },
  {
    label: "Tahsilat",
    ikon: "Wallet",
    children: [
      { label: "Yeni Tahsilat", href: "/tahsilat" },
      { label: "Bugünkü Tahsilatlar", href: "/tahsilat/bugun" },
      { label: "Tüm Tahsilatlar", href: "/tahsilat/tum" },
      { label: "Dekontlar", href: "/tahsilat/dekontlar" },
      { label: "İptal / İade", href: "/tahsilat/iptal" },
    ],
  },
  {
    label: "Kasa",
    ikon: "Calculator",
    children: [
      { label: "Genel Kasa Durumu", href: "/kasa" },
      { label: "Nakit Kasası", href: "/kasa/nakit" },
      { label: "Havale Hesabı", href: "/kasa/havale" },
      { label: "POS (Kart)", href: "/kasa/pos" },
      { label: "Gider Girişi", href: "/kasa/gider" },
      { label: "Kasa Hareketleri", href: "/kasa/hareketler" },
      { label: "Kasa Açılış", href: "/kasa/acilis" },
      { label: "Kasa Kapanış (Gün Sonu)", href: "/kasa/kapanis" },
    ],
  },
  {
    label: "Raporlar",
    ikon: "FileBarChart",
    children: [
      { label: "Günlük Özet", href: "/raporlar" },
      { label: "Borç Raporu", href: "/raporlar/borc" },
      { label: "Tahsilat Raporu", href: "/raporlar/tahsilat" },
      { label: "Müşteri Bazlı Rapor", href: "/raporlar/musteri" },
      { label: "Kurban Bazlı Rapor", href: "/raporlar/kurban" },
      { label: "Kasa Raporu", href: "/raporlar/kasa" },
      { label: "Excel İndirme Merkezi", href: "/raporlar/excel" },
    ],
  },
  {
    label: "Ayarlar",
    ikon: "Settings",
    izinler: ["admin"],
    children: [
      { label: "Firma Bilgileri", href: "/ayarlar" },
      { label: "Kullanıcılar", href: "/ayarlar/kullanicilar" },
      { label: "Yedekleme", href: "/ayarlar/yedekleme" },
      { label: "Sistem Bilgisi", href: "/ayarlar/sistem" },
    ],
  },
];

/** Rol bazlı filtreleme — admin değilse "Ayarlar" gizlenir */
export function menuyuFiltrele(menu: MenuItem[], rol: Rol): MenuItem[] {
  return menu
    .filter((m) => !m.izinler || m.izinler.includes(rol))
    .map((m) => ({
      ...m,
      children: m.children?.filter(
        (c) => !c.izinler || c.izinler.includes(rol),
      ),
    }));
}

/** Verilen yolun hangi ana menüye ait olduğunu döner */
export function aktifAnaMenu(pathname: string, menu: MenuItem[]): string | null {
  for (const m of menu) {
    if (m.href === pathname) return m.label;
    if (m.children?.some((c) => yolEslesiyorMu(c.href, pathname))) {
      return m.label;
    }
  }
  return null;
}

function yolEslesiyorMu(menuHref: string, pathname: string): boolean {
  if (menuHref === pathname) return true;
  // /musteriler altındaki /musteriler/123 gibi rotalar /musteriler'ı aktif kabul etmesin
  // ama tam eşleşme/prefix mantığı için: child yolunun kendisi veya daha alt path ise true
  return pathname.startsWith(menuHref + "/");
}
