/**
 * Modüller arası gevşek bağlı iletişim için olay yayını (pub/sub).
 *
 * Kullanım:
 *   yayinla('odeme:tamamlandi', { odemeId, musteriId, tutar });
 *   const sil = dinle('odeme:tamamlandi', async (veri) => { ... });
 *   // sonradan dinleyiciyi kaldırmak için: sil();
 */

type Dinleyici<T = unknown> = (veri: T) => void | Promise<void>;

const dinleyiciler: Record<string, Dinleyici[]> = {};

export function yayinla<T = unknown>(olay: string, veri: T): void {
  const dList = dinleyiciler[olay];
  if (!dList || dList.length === 0) return;

  for (const d of dList) {
    try {
      const sonuc = d(veri);
      if (sonuc instanceof Promise) {
        sonuc.catch((e) => {
          console.error(`[events] Olay dinleyici async hatası (${olay}):`, e);
        });
      }
    } catch (hata) {
      console.error(`[events] Olay dinleyici hatası (${olay}):`, hata);
    }
  }
}

export function dinle<T = unknown>(olay: string, dinleyici: Dinleyici<T>): () => void {
  if (!dinleyiciler[olay]) dinleyiciler[olay] = [];
  dinleyiciler[olay].push(dinleyici as Dinleyici);

  return () => {
    dinleyiciler[olay] = (dinleyiciler[olay] ?? []).filter((d) => d !== dinleyici);
  };
}

export function dinleyiciSay(olay: string): number {
  return (dinleyiciler[olay] ?? []).length;
}

export function tumDinleyicileriTemizle(): void {
  for (const k of Object.keys(dinleyiciler)) {
    delete dinleyiciler[k];
  }
}
