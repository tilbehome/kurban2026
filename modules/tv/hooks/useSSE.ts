"use client";

import { useEffect, useRef, useState } from "react";

export type SSEDurum = "baglaniyor" | "bagli" | "kopuk" | "hata";

export interface UseSSEOptions<T> {
  url: string;
  /** Hangi event name'ini dinleyeceğiz (default: 'message') */
  eventName?: string;
  /** İlk veri (SSR'dan gelir, SSE bağlanana kadar görünür) */
  ilkVeri?: T;
}

export interface UseSSEResult<T> {
  veri: T | null;
  durum: SSEDurum;
  sonGuncelleme: Date | null;
}

/**
 * EventSource hook'u — SSE bağlantısı + otomatik reconnect.
 *
 * EventSource native API otomatik yeniden bağlanır (3-5 sn). Biz sadece
 * state yönetiriz: durum, son veri, son güncelleme zamanı.
 */
export function useSSE<T>({
  url,
  eventName = "message",
  ilkVeri,
}: UseSSEOptions<T>): UseSSEResult<T> {
  const [veri, setVeri] = useState<T | null>(ilkVeri ?? null);
  const [durum, setDurum] = useState<SSEDurum>("baglaniyor");
  const [sonGuncelleme, setSonGuncelleme] = useState<Date | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setDurum("bagli");
    };

    const onMesaj = (ev: MessageEvent) => {
      try {
        const parsed = JSON.parse(ev.data) as T;
        setVeri(parsed);
        setSonGuncelleme(new Date());
        setDurum("bagli");
      } catch {
        // payload parse hatası — sessizce yut
      }
    };

    if (eventName === "message") {
      es.onmessage = onMesaj;
    } else {
      es.addEventListener(eventName, onMesaj as EventListener);
    }

    es.onerror = () => {
      // EventSource otomatik yeniden bağlanır
      setDurum("kopuk");
    };

    return () => {
      if (eventName !== "message") {
        es.removeEventListener(eventName, onMesaj as EventListener);
      }
      es.close();
    };
  }, [url, eventName]);

  return { veri, durum, sonGuncelleme };
}
