"use client";

import { useEffect, useRef } from "react";

/**
 * Taşan listede yavaş otomatik scroll (alt → üst akış).
 *
 * Davranış:
 *   - İçerik konteynere sığıyorsa hiçbir şey yapmaz (sabit kalır).
 *   - Taşıyorsa her `aralikMs` periyotta `pixelAdim` kadar aşağı kayar.
 *   - Dipte bitince üste döner (sonsuz döngü, slayt gibi).
 *   - Kullanıcı manuel scroll yaparsa 5sn duraklar, sonra devam eder.
 */
export function useAutoScroll(
  aralikMs: number = 4000,
  pixelAdim: number = 56,
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let duraklatmaSonu = 0;

    const manuelScroll = () => {
      duraklatmaSonu = Date.now() + 5000;
    };
    el.addEventListener("wheel", manuelScroll, { passive: true });
    el.addEventListener("touchmove", manuelScroll, { passive: true });

    const id = setInterval(() => {
      const node = ref.current;
      if (!node) return;
      if (Date.now() < duraklatmaSonu) return;
      // İçerik konteynere sığıyorsa hiçbir şey yapma.
      if (node.scrollHeight <= node.clientHeight + 4) return;

      const altSinir = node.scrollHeight - node.clientHeight;
      const yeni = node.scrollTop + pixelAdim;
      if (yeni >= altSinir) {
        // Dipte: kısa bekleme sonrası başa dön
        node.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        node.scrollTo({ top: yeni, behavior: "smooth" });
      }
    }, aralikMs);

    return () => {
      clearInterval(id);
      el.removeEventListener("wheel", manuelScroll);
      el.removeEventListener("touchmove", manuelScroll);
    };
  }, [aralikMs, pixelAdim]);

  return ref;
}
