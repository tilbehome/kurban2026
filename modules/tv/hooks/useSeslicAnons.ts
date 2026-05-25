"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Web Speech API ile Türkçe sesli anons.
 * Tarayıcıda yerel ses kullanır, paket gerektirmez.
 */

const STORAGE_KEY = "tilbe.tv.sesliAnonsAktif";

export interface SeslicAnonsOpsiyon {
  hiz?: number; // 0.1-10, default 0.95
  tiz?: number; // 0-2, default 1.0
  ses?: number; // 0-1, default 1.0
}

export function useSeslicAnons() {
  const [destek, setDestek] = useState(false);
  const [aktif, setAktif] = useState(false);
  const turkceSes = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setDestek(false);
      return;
    }
    setDestek(true);
    try {
      const k = localStorage.getItem(STORAGE_KEY);
      setAktif(k === "1");
    } catch {
      setAktif(false);
    }

    function sesleriYukle() {
      const sesler = window.speechSynthesis.getVoices();
      turkceSes.current =
        sesler.find((s) => s.lang === "tr-TR") ??
        sesler.find((s) => s.lang.startsWith("tr")) ??
        null;
    }
    sesleriYukle();
    window.speechSynthesis.addEventListener("voiceschanged", sesleriYukle);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", sesleriYukle);
    };
  }, []);

  const aktifEt = useCallback((yeni: boolean) => {
    setAktif(yeni);
    try {
      localStorage.setItem(STORAGE_KEY, yeni ? "1" : "0");
    } catch {
      // localStorage yoksa sessiz geç
    }
  }, []);

  const anons = useCallback(
    (metin: string, opsiyonlar: SeslicAnonsOpsiyon = {}) => {
      if (!destek || !aktif) return;
      try {
        const u = new SpeechSynthesisUtterance(metin);
        u.lang = "tr-TR";
        u.rate = opsiyonlar.hiz ?? 0.95;
        u.pitch = opsiyonlar.tiz ?? 1.0;
        u.volume = opsiyonlar.ses ?? 1.0;
        if (turkceSes.current) u.voice = turkceSes.current;
        window.speechSynthesis.speak(u);
      } catch {
        // SSR veya hata durumunda sessizce yut
      }
    },
    [destek, aktif],
  );

  return { destek, aktif, aktifEt, anons };
}
