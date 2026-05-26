/**
 * Sidebar bildirim sayısı görsel formatı.
 *
 * CLIENT-SAFE — prisma içermez, client component'lerden güvenle import edilir.
 * sidebar-bildirim.service.ts içindeki prisma import'unu client bundle'a
 * çekmemek için ayrıldı.
 *
 * 99+'tan fazlasını "99+" olarak gösterir.
 */
export function formatBildirimSayisi(sayi: number): string {
  if (sayi <= 0) return "";
  if (sayi > 99) return "99+";
  return sayi.toString();
}
