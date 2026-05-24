"use client";

import { useEffect } from "react";

export interface KlavyeKisayoluTanim {
  /** "m", "k", "t" gibi tek harf (büyük/küçük fark etmez) */
  tus: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  /** Bu kombinasyon basıldığında ne çalışacak */
  eylem: (e: KeyboardEvent) => void;
  /** Input/textarea içindeyken bile tetiklenmesi gerekiyorsa true */
  inputDahil?: boolean;
}

/**
 * Klavye kısayolu kayıt eden generic hook.
 * Input/textarea içindeyken default tetiklenmez (inputDahil:true ile zorla).
 *
 * @example
 *   useKlavyeKisayollari([
 *     { tus: "m", ctrl: true, shift: true, eylem: () => acMenu("musteriler") },
 *     { tus: "b", ctrl: true, eylem: () => toggleDaralt() },
 *   ]);
 */
export function useKlavyeKisayollari(kisayollar: KlavyeKisayoluTanim[]): void {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Input/textarea/contenteditable içinde dön
      const hedef = e.target;
      const inputIcinde =
        hedef instanceof HTMLInputElement ||
        hedef instanceof HTMLTextAreaElement ||
        (hedef instanceof HTMLElement && hedef.isContentEditable);

      for (const ks of kisayollar) {
        if (inputIcinde && !ks.inputDahil) continue;
        if (e.key.toLowerCase() !== ks.tus.toLowerCase()) continue;
        if (!!ks.ctrl !== (e.ctrlKey || e.metaKey)) continue;
        if (!!ks.shift !== e.shiftKey) continue;
        if (!!ks.alt !== e.altKey) continue;
        e.preventDefault();
        ks.eylem(e);
        break;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [kisayollar]);
}
