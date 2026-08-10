import { PrismaClient } from "../generated/client";

export type PlatformPrismaClient = PrismaClient;

export function createPlatformPrismaClient(databaseUrl: string): PlatformPrismaClient {
  return new PrismaClient({ datasources: { db: { url: databaseUrl } } });
}
