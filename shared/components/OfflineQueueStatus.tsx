"use client";

export interface OfflineQueueStatusProps {
  pending: number;
  failed: number;
  conflicts: number;
  syncing: boolean;
}

export function OfflineQueueStatus({ pending, failed, conflicts, syncing }: OfflineQueueStatusProps) {
  const label = conflicts > 0
    ? `${conflicts} işlem çatışma incelemesi bekliyor`
    : failed > 0
      ? `${failed} işlem senkronize edilemedi`
      : syncing
        ? "İzinler yeniden doğrulanıyor ve kuyruk senkronize ediliyor"
        : pending > 0
          ? `${pending} işlem kuyrukta; sunucuda henüz tamamlanmadı`
          : "Çevrimdışı işlem kuyruğu boş";
  const state = conflicts > 0 ? "conflict" : failed > 0 ? "failed" : syncing ? "syncing" : pending > 0 ? "pending" : "synced";

  return (
    <output aria-live="polite" data-offline-state={state} className="rounded-lg border px-3 py-2 text-sm">
      {label}
    </output>
  );
}
