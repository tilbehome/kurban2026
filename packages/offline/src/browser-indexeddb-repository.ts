import type { OfflineBinding, OfflineQueueItem, OfflineQueueRepository } from "./types";

const DATABASE_NAME = "tilbecore-offline-v1";
const STORE_NAME = "queue";

export class BrowserIndexedDbOfflineQueueRepository implements OfflineQueueRepository {
  async put(item: OfflineQueueItem): Promise<void> {
    const db = await openDatabase();
    await requestResult(db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(item));
    db.close();
  }

  async find(clientOperationId: string): Promise<OfflineQueueItem | null> {
    const db = await openDatabase();
    const result = await requestResult<OfflineQueueItem | undefined>(db.transaction(STORE_NAME).objectStore(STORE_NAME).get(clientOperationId));
    db.close();
    return result ?? null;
  }

  async listByBinding(binding: OfflineBinding): Promise<readonly OfflineQueueItem[]> {
    const db = await openDatabase();
    const all = await requestResult<OfflineQueueItem[]>(db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll());
    db.close();
    return all
      .filter((item) => item.tenantId === binding.tenantId && item.seasonId === binding.seasonId && item.userId === binding.userId && item.deviceId === binding.deviceId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("OFFLINE_INDEXEDDB_UNAVAILABLE"));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "clientOperationId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("OFFLINE_INDEXEDDB_OPEN_FAILED"));
  });
}

function requestResult<T = IDBValidKey>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("OFFLINE_INDEXEDDB_OPERATION_FAILED"));
  });
}
