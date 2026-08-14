import { createTilbeCoreDomainConfig, type DeploymentEnvironment } from "@tilbecore/config";

export function platformDeploymentEnvironment(value = process.env.TILBECORE_ENV): DeploymentEnvironment {
  if (value === "production" || value === "staging" || value === "local") return value;
  return process.env.NODE_ENV === "production" ? "production" : "local";
}

export function platformAdminHostname(environment = platformDeploymentEnvironment()): string {
  return new URL(createTilbeCoreDomainConfig(environment).systemOrigins.platform).hostname;
}

export function isAllowedPlatformAdminHost(hostHeader: string | null, environment = platformDeploymentEnvironment()): boolean {
  if (!hostHeader) return false;
  const hostname = hostHeader.trim().toLowerCase().replace(/:\d+$/, "");
  if (environment === "local" && (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1")) return true;
  return hostname === platformAdminHostname(environment);
}
