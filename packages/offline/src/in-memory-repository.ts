import type { OfflineBinding, OfflineQueueItem, OfflineQueueRepository } from "./types";

export class InMemoryOfflineQueueRepository implements OfflineQueueRepository {
  readonly items = new Map<string, OfflineQueueItem>();

  async put(item: OfflineQueueItem): Promise<void> {
    this.items.set(item.clientOperationId, structuredClone(item));
  }

  async find(clientOperationId: string): Promise<OfflineQueueItem | null> {
    const item = this.items.get(clientOperationId);
    return item ? structuredClone(item) : null;
  }

  async listByBinding(binding: OfflineBinding): Promise<readonly OfflineQueueItem[]> {
    return [...this.items.values()]
      .filter((item) => item.tenantId === binding.tenantId && item.seasonId === binding.seasonId && item.userId === binding.userId && item.deviceId === binding.deviceId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map((item) => structuredClone(item));
  }
}
