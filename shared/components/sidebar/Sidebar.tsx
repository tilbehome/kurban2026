"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { izinKontrol } from "@/shared/lib/izinler";
import {
  sidebarMenuleri,
  aktifAnaMenuId,
} from "@/shared/lib/sidebar-config";
import type { SidebarAnaMenu } from "@/shared/lib/sidebar-config";
import type { SidebarBildirimleri } from "@/shared/lib/sidebar-bildirim.service";
import type { Rol } from "@/shared/types/module.types";
import { useKlavyeKisayollari } from "@/shared/hooks/useKlavyeKisayollari";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarMenuGroup } from "./SidebarMenuGroup";
import { SidebarCollapseButton } from "./SidebarCollapseButton";
// SidebarBayramSayaci: bayram geçti, sidebar'dan kaldırıldı (dosya korundu)
import { SidebarKullaniciKarti } from "./SidebarKullaniciKarti";

const STORAGE_ACIK = "tilbe.sidebar.acikMenu";
const STORAGE_DARALT = "tilbe.sidebar.daraltilmis";
const BILDIRIM_INTERVAL_MS = 30_000;

interface SidebarProps {
  kullaniciAdSoyad: string;
  kullaniciRol: Rol;
  /** Mobile drawer açıkken kapatma callback */
  onMobilKapat?: () => void;
  /** Mobile için sidebar görünür mü (drawer mode) */
  mobil?: boolean;
}

/**
 * 12 ana menü + akordeon + bildirim + klavye + collapse + mobile drawer.
 *
 * - Akordeon: bir menü açılınca diğerleri kapanır
 * - localStorage: son açık menü + daraltma durumu hatırlanır
 * - Bildirim: 30 sn'de bir /api/sidebar/bildirimler polling
 * - Klavye: Ctrl+B daralt, Ctrl+Shift+M/K/T/W/R menü aç
 * - Yetki: rol bazlı menü/alt menü filtrelemesi
 */
export function Sidebar({
  kullaniciAdSoyad,
  kullaniciRol,
  onMobilKapat,
  mobil = false,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Yetki bazlı filtreleme — client-side (izinKontrol rol üzerinden çalışır)
  const oturumStub = useMemo(() => ({ rol: kullaniciRol }), [kullaniciRol]);
  const menuler = useMemo<SidebarAnaMenu[]>(() => {
    return sidebarMenuleri
      .filter((m) => !m.izin || izinKontrol(oturumStub, m.izin))
      .map((m) => {
        if (!m.altMenuler) return m;
        const filtreli = m.altMenuler.filter(
          (a) => !a.izin || izinKontrol(oturumStub, a.izin),
        );
        return { ...m, altMenuler: filtreli };
      })
      .filter((m) => !m.altMenuler || m.altMenuler.length > 0 || m.rota);
  }, [oturumStub]);

  const aktifMenuId = useMemo(
    () => aktifAnaMenuId(pathname, menuler),
    [pathname, menuler],
  );

  // Akordeon state — TEK menü açık
  const [acikMenu, setAcikMenu] = useState<string | null>(null);
  const [daraltilmis, setDaraltilmis] = useState<boolean>(false);
  const [bildirimler, setBildirimler] = useState<SidebarBildirimleri | null>(
    null,
  );
  const [yuklendi, setYuklendi] = useState(false);

  // localStorage'tan ilk değerleri al + aktif sayfanın menüsünü aç
  useEffect(() => {
    try {
      const kayitAcik = localStorage.getItem(STORAGE_ACIK);
      const kayitDaralt = localStorage.getItem(STORAGE_DARALT);
      setAcikMenu(aktifMenuId ?? kayitAcik ?? null);
      setDaraltilmis(kayitDaralt === "1");
    } catch {
      setAcikMenu(aktifMenuId);
    }
    setYuklendi(true);
    // sadece pathname değişince tekrar — diğer state'ler localStorage save ile döner
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktifMenuId]);

  // localStorage save
  useEffect(() => {
    if (!yuklendi) return;
    try {
      if (acikMenu) localStorage.setItem(STORAGE_ACIK, acikMenu);
      else localStorage.removeItem(STORAGE_ACIK);
      localStorage.setItem(STORAGE_DARALT, daraltilmis ? "1" : "0");
    } catch {
      // localStorage yoksa sessizce geç
    }
  }, [acikMenu, daraltilmis, yuklendi]);

  // Bildirim polling (30 sn)
  useEffect(() => {
    let iptal = false;
    async function getir() {
      try {
        const yanit = await fetch("/api/sidebar/bildirimler", {
          cache: "no-store",
        });
        if (!yanit.ok) return;
        const json = (await yanit.json()) as {
          basarili: boolean;
          veri?: SidebarBildirimleri;
        };
        if (!iptal && json.basarili && json.veri) {
          setBildirimler(json.veri);
        }
      } catch {
        // ağ hatası sessizce yutulur
      }
    }
    getir();
    const i = setInterval(getir, BILDIRIM_INTERVAL_MS);
    return () => {
      iptal = true;
      clearInterval(i);
    };
  }, []);

  const toggleMenu = useCallback((id: string) => {
    setAcikMenu((prev) => (prev === id ? null : id));
  }, []);

  const toggleDaralt = useCallback(() => {
    setDaraltilmis((d) => !d);
  }, []);

  const grupAcKisayol = useCallback(
    (id: string) => {
      const m = menuler.find((x) => x.id === id);
      if (!m) return;
      if (daraltilmis) setDaraltilmis(false);
      if (m.altMenuler && m.altMenuler.length > 0) {
        setAcikMenu(id);
      } else if (m.rota) {
        router.push(m.rota);
      }
    },
    [menuler, daraltilmis, router],
  );

  // Klavye kısayolları
  useKlavyeKisayollari(
    useMemo(
      () => [
        {
          tus: "b",
          ctrl: true,
          eylem: () => toggleDaralt(),
        },
        {
          tus: "d",
          ctrl: true,
          shift: true,
          eylem: () => router.push("/"),
        },
        {
          tus: "m",
          ctrl: true,
          shift: true,
          eylem: () => grupAcKisayol("musteriler"),
        },
        {
          tus: "k",
          ctrl: true,
          shift: true,
          eylem: () => grupAcKisayol("kurbanlar"),
        },
        {
          tus: "t",
          ctrl: true,
          shift: true,
          eylem: () => grupAcKisayol("tahsilat"),
        },
        {
          tus: "w",
          ctrl: true,
          shift: true,
          eylem: () => grupAcKisayol("whatsapp"),
        },
        {
          tus: "r",
          ctrl: true,
          shift: true,
          eylem: () => grupAcKisayol("raporlar"),
        },
      ],
      [grupAcKisayol, toggleDaralt, router],
    ),
  );

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground border-sidebar-border relative flex h-screen shrink-0 flex-col border-r transition-[width] duration-200",
        daraltilmis ? "w-16" : "w-64",
        mobil && "w-72",
      )}
    >
      <SidebarHeader daraltilmis={daraltilmis && !mobil} />

      {!mobil && (
        <SidebarCollapseButton
          daraltilmis={daraltilmis}
          onToggle={toggleDaralt}
        />
      )}

      <nav
        className={cn(
          "flex-1 overflow-x-hidden overflow-y-auto",
          mobil ? "p-3" : "p-2",
        )}
      >
        <div className={cn("flex flex-col", mobil ? "gap-1" : "gap-0.5")}>
          {menuler.map((menu) => (
            <SidebarMenuGroup
              key={menu.id}
              menu={menu}
              acik={acikMenu === menu.id}
              aktif={aktifMenuId === menu.id}
              pathname={pathname}
              bildirimler={bildirimler}
              daraltilmis={daraltilmis && !mobil}
              mobil={mobil}
              onToggle={() => toggleMenu(menu.id)}
              onAltMenuTiklama={onMobilKapat}
            />
          ))}
        </div>
      </nav>

      <SidebarKullaniciKarti
        adSoyad={kullaniciAdSoyad}
        rol={kullaniciRol}
        daraltilmis={daraltilmis && !mobil}
      />
    </aside>
  );
}
