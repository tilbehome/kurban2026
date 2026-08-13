import { describe, expect, it, vi } from "vitest";
import {
  InMemoryOfflineQueueRepository,
  enqueueOfflineCommand,
  offlineCapabilityFor,
  syncOfflineQueue,
  type OfflineBinding,
  type OfflinePermissionPort,
  type OfflineSyncTransport,
} from "../src";

const binding: OfflineBinding = { tenantId: "tenant_a", seasonId: "season_2027", userId: "user_a", deviceId: "device_a", sessionVersion: 1 };
const now = "2026-08-13T10:00:00.000Z";
const allowed: OfflinePermissionPort = { revalidate: async () => ({ allowed: true }) };

describe("güvenli offline queue", () => {
  it("finans, satış, kesim ve teslimi sunucu olmadan kuyruğa almaz", async () => {
    const repository = new InMemoryOfflineQueueRepository();
    for (const operation of ["sale.create", "payment.collect", "slaughter.confirm", "delivery.close"]) {
      await expect(enqueueOfflineCommand(repository, command(operation))).rejects.toThrow("OFFLINE_OPERATION_NOT_QUEUEABLE:ONLINE_REQUIRED");
    }
  });

  it("yalnız izinli düşük riskli komutu tenant/user/device/session ve TTL ile bağlar", async () => {
    const repository = new InMemoryOfflineQueueRepository();
    const item = await enqueueOfflineCommand(repository, command("scan.observation"));
    expect(item).toMatchObject({ ...binding, status: "pending", capability: "QUEUE_ALLOWED", attempts: 0 });
    expect(Date.parse(item.expiresAt)).toBeGreaterThan(Date.parse(item.createdAt));
  });

  it("secret ve kişisel veri adayı payload alanlarını reddeder", async () => {
    const repository = new InMemoryOfflineQueueRepository();
    await expect(enqueueOfflineCommand(repository, { ...command("task.note"), payload: { phone: "+900000000000" } })).rejects.toThrow("OFFLINE_SENSITIVE_PAYLOAD_REJECTED");
    expect(offlineCapabilityFor("proxy.document.read")).toBe("NEVER_CACHE_SENSITIVE");
  });

  it("response kaybında aynı idempotency ile retry yapar ve duplicate sonucu başarı sayar", async () => {
    const repository = new InMemoryOfflineQueueRepository();
    await enqueueOfflineCommand(repository, command("scan.observation"));
    const send = vi.fn<OfflineSyncTransport["send"]>()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ kind: "duplicate", serverResultId: "scan_1" });
    await syncOfflineQueue({ repository, permission: allowed, transport: { send }, binding, now });
    const retryAt = (await repository.find("client_op_001"))!.nextAttemptAt;
    const summary = await syncOfflineQueue({ repository, permission: allowed, transport: { send }, binding, now: retryAt });
    expect(summary.synced).toBe(1);
    expect(send.mock.calls[0]![0].idempotencyKey).toBe(send.mock.calls[1]![0].idempotencyKey);
  });

  it("uygulama yeniden başlatıldıktan sonra kalıcı repository kuyruğunu sürdürür", async () => {
    const persistentRepository = new InMemoryOfflineQueueRepository();
    await enqueueOfflineCommand(persistentRepository, command("task.note"));
    const restartedRuntime = { repository: persistentRepository, permission: allowed, transport: { send: async () => ({ kind: "applied" as const, serverResultId: "task_1" }) } };
    const summary = await syncOfflineQueue({ ...restartedRuntime, binding, now });
    expect(summary.synced).toBe(1);
    expect((await persistentRepository.find("client_op_001"))?.serverResultId).toBe("task_1");
  });

  it("tekrarlanan geçici hatayı artan backoff sonrasında poison yapar", async () => {
    const repository = new InMemoryOfflineQueueRepository();
    await enqueueOfflineCommand(repository, command("device.diagnostic"));
    const transport: OfflineSyncTransport = { send: async () => ({ kind: "retryable", code: "UPSTREAM_UNAVAILABLE" }) };
    let syncTime = now;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await syncOfflineQueue({ repository, permission: allowed, transport, binding, now: syncTime });
      syncTime = (await repository.find("client_op_001"))!.nextAttemptAt;
    }
    expect((await repository.find("client_op_001"))?.status).toBe("poisoned");
    expect((await repository.find("client_op_001"))?.attempts).toBe(5);
  });

  it("iki cihaz bağını karıştırmaz ve server conflict kararını inbox durumuna taşır", async () => {
    const repository = new InMemoryOfflineQueueRepository();
    await enqueueOfflineCommand(repository, command("task.note"));
    const other = { ...binding, deviceId: "device_b" };
    const untouched = await syncOfflineQueue({ repository, permission: allowed, transport: { send: vi.fn() }, binding: other, now });
    expect(untouched.attempted).toBe(0);
    const conflicted = await syncOfflineQueue({ repository, permission: allowed, transport: { send: async () => ({ kind: "conflict", code: "VERSION_CONFLICT" }) }, binding, now });
    expect(conflicted.conflicted).toBe(1);
    expect((await repository.find("client_op_001"))?.status).toBe("conflict");
  });

  it("tenant ve sezon değişiminde başka kuyruğu açmaz", async () => {
    const repository = new InMemoryOfflineQueueRepository();
    await enqueueOfflineCommand(repository, command("task.note"));
    const foreignBinding = { ...binding, tenantId: "tenant_b", seasonId: "season_2028" };
    const summary = await syncOfflineQueue({ repository, permission: allowed, transport: { send: vi.fn() }, binding: foreignBinding, now });
    expect(summary.attempted).toBe(0);
  });

  it("cihaz/session iptali ve tenant askıya almayı yeniden doğrulamada reddeder", async () => {
    for (const code of ["DEVICE_REVOKED", "SESSION_REVOKED", "TENANT_SUSPENDED"] as const) {
      const repository = new InMemoryOfflineQueueRepository();
      await enqueueOfflineCommand(repository, command("device.diagnostic"));
      const result = await syncOfflineQueue({
        repository,
        permission: { revalidate: async () => ({ allowed: false, code }) },
        transport: { send: vi.fn() },
        binding,
        now,
      });
      expect(result.failed).toBe(1);
      expect((await repository.find("client_op_001"))?.lastErrorCode).toBe(code);
    }
  });

  it("süresi geçmiş queue kaydını poison yapar", async () => {
    const repository = new InMemoryOfflineQueueRepository();
    await enqueueOfflineCommand(repository, { ...command("task.note"), ttlMs: 1_000 });
    const expired = await syncOfflineQueue({ repository, permission: allowed, transport: { send: vi.fn() }, binding, now: "2026-08-13T10:00:02.000Z" });
    expect(expired.poisoned).toBe(1);
    expect((await repository.find("client_op_001"))?.lastErrorCode).toBe("OFFLINE_TTL_EXPIRED");
  });

  it("bozuk queue kaydını sessizce atlamaz", async () => {
    const repository = new InMemoryOfflineQueueRepository();
    const item = await enqueueOfflineCommand(repository, command("task.note"));
    await repository.put({ ...item, payload: { secret: "must-not-survive" } });
    const result = await syncOfflineQueue({ repository, permission: allowed, transport: { send: vi.fn() }, binding, now });
    expect(result.poisoned).toBe(1);
    expect((await repository.find("client_op_001"))?.lastErrorCode).toBe("OFFLINE_QUEUE_CORRUPTED");
  });
});

function command(operation: string) {
  return {
    ...binding,
    clientOperationId: "client_op_001",
    idempotencyKey: "idem:client_op_001",
    operation,
    expectedVersion: 3,
    payload: { station: "package_1", codeHash: "sha256_opaque" },
    createdAt: now,
    ttlMs: 60_000,
  };
}
