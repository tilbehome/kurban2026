"use client";

import { useEffect, useState } from "react";
import type { TvTema } from "../types";

const STORAGE_KEY = "tilbe.tv.tema";

/**
 * TV tema hook'u — localStorage + system preference.
 *
 * Öncelik:
 *  1. localStorage'taki seçim
 *  2. System preference (prefers-color-scheme)
 *  3. Default: light
 */
export function useTvTema(): {
  tema: TvTema;
  toggle: () => void;
  setTema: (t: TvTema) => void;
} {
  const [tema, setTemaState] = useState<TvTema>("light");

  useEffect(() => {
    try {
      const kayit = localStorage.getItem(STORAGE_KEY) as TvTema | null;
      if (kayit === "light" || kayit === "dark") {
        setTemaState(kayit);
        return;
      }
      // System preference
      const dark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setTemaState(dark ? "dark" : "light");
    } catch {
      setTemaState("light");
    }
  }, []);

  function setTema(t: TvTema) {
    setTemaState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // localStorage yoksa sessizce geç
    }
  }

  function toggle() {
    setTema(tema === "light" ? "dark" : "light");
  }

  return { tema, toggle, setTema };
}
