import type { CustomDomainStatus, TenantSlug } from "@tilbecore/contracts";

export type DeploymentEnvironment = "production" | "staging" | "local";
export type OriginKind = "marketing" | "platform" | "tenant" | "system" | "customTenant";
export type PublicService =
  | "marketing"
  | "console"
  | "tenantWeb"
  | "fieldPwa"
  | "tv"
  | "customerTracking"
  | "qr"
  | "invite"
  | "tenantApi"
  | "status"
  | "help"
  | "updates"
  | "assets";
export type PrivateService =
  | "postgresql"
  | "tenantDatabaseRegistry"
  | "workerManagement"
  | "provisioningCli"
  | "migrationCommands"
  | "backupStorage"
  | "objectStorageAdmin"
  | "metrics"
  | "internalMonitoring"
  | "secretStore"
  | "debugEndpoints"
  | "prismaStudio";
export type TenantSurface =
  | "origin"
  | "login"
  | "panel"
  | "fieldPwa"
  | "tv"
  | "customerTracking"
  | "qr"
  | "invite"
  | "api";

export interface SecureCookiePolicy {
  platformCookieName: string;
  tenantCookieName: string;
  hostOnly: true;
  secure: true;
  httpOnly: true;
  sameSite: "lax" | "strict";
}

export interface SystemOrigins {
  marketing: string;
  platform: string;
  status: string;
  help: string;
  updates: string;
  assets: string;
  futureExternalApi: string;
  futureHooks: string;
}

export interface TilbeCoreDomainConfig {
  environment: DeploymentEnvironment;
  baseDomain: string;
  enforceHttps: true;
  reservedSubdomains: readonly string[];
  systemOrigins: SystemOrigins;
  trustedHostSuffix: string;
  cookiePolicy: SecureCookiePolicy;
  publicServices: readonly PublicService[];
  privateServices: readonly PrivateService[];
}

export interface HostResolution {
  kind: OriginKind;
  normalizedHost: string;
  tenantSlug?: TenantSlug;
  systemName?: keyof SystemOrigins;
}

export interface CustomDomainConfigEntry {
  hostname: string;
  tenantSlug: TenantSlug;
  status: CustomDomainStatus;
  dnsVerified: boolean;
  tlsReady: boolean;
}

export const TILBECORE_PRODUCTION_DOMAIN = "tilbecore.com";
export const TILBECORE_STAGING_DOMAIN = "staging.tilbecore.com";
export const TILBECORE_LOCAL_DOMAIN = "tilbecore.test";

export const RESERVED_SUBDOMAINS = [
  "console",
  "status",
  "help",
  "updates",
  "assets",
  "api",
  "hooks",
  "www",
  "staging",
] as const;

export function createTilbeCoreDomainConfig(
  environment: DeploymentEnvironment,
): TilbeCoreDomainConfig {
  const baseDomain = domainForEnvironment(environment);
  const environmentPrefix = environment === "production" ? "prod" : environment;

  return {
    environment,
    baseDomain,
    enforceHttps: true,
    reservedSubdomains: RESERVED_SUBDOMAINS,
    trustedHostSuffix: `.${baseDomain}`,
    systemOrigins: {
      marketing: `https://${baseDomain}`,
      platform: `https://console.${baseDomain}`,
      status: `https://status.${baseDomain}`,
      help: `https://help.${baseDomain}`,
      updates: `https://updates.${baseDomain}`,
      assets: `https://assets.${baseDomain}`,
      futureExternalApi: `https://api.${baseDomain}/v1`,
      futureHooks: `https://hooks.${baseDomain}/v1`,
    },
    cookiePolicy: {
      platformCookieName: `tc_${environmentPrefix}_platform_session`,
      tenantCookieName: `tc_${environmentPrefix}_tenant_session`,
      hostOnly: true,
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    },
    publicServices: [
      "marketing",
      "console",
      "tenantWeb",
      "fieldPwa",
      "tv",
      "customerTracking",
      "qr",
      "invite",
      "tenantApi",
      "status",
      "help",
      "updates",
      "assets",
    ],
    privateServices: [
      "postgresql",
      "tenantDatabaseRegistry",
      "workerManagement",
      "provisioningCli",
      "migrationCommands",
      "backupStorage",
      "objectStorageAdmin",
      "metrics",
      "internalMonitoring",
      "secretStore",
      "debugEndpoints",
      "prismaStudio",
    ],
  };
}

export function createTenantOrigin(
  config: TilbeCoreDomainConfig,
  tenantSlug: string,
): string {
  return `https://${normalizeTenantSlug(tenantSlug)}.${config.baseDomain}`;
}

export function createTenantUrl(
  config: TilbeCoreDomainConfig,
  tenantSlug: string,
  surface: TenantSurface,
  opaqueToken?: string,
): string {
  const origin = createTenantOrigin(config, tenantSlug);
  const safeToken = opaqueToken ? encodeURIComponent(opaqueToken) : undefined;

  switch (surface) {
    case "origin":
      return origin;
    case "login":
      return `${origin}/giris`;
    case "panel":
      return `${origin}/panel`;
    case "fieldPwa":
      return `${origin}/saha`;
    case "tv":
      return `${origin}/tv`;
    case "customerTracking":
      return `${origin}/takip/${requireOpaqueToken(safeToken, surface)}`;
    case "qr":
      return `${origin}/q/${requireOpaqueToken(safeToken, surface)}`;
    case "invite":
      return `${origin}/davet/${requireOpaqueToken(safeToken, surface)}`;
    case "api":
      return `${origin}/api/v1`;
  }
}

export function normalizeTenantSlug(value: string): TenantSlug {
  const normalized = value.trim().toLowerCase();
  if (!isValidTenantSlug(normalized)) {
    throw new Error("INVALID_TENANT_SLUG");
  }
  return normalized as TenantSlug;
}

export function isValidTenantSlug(value: string): boolean {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value)) {
    return false;
  }
  return !RESERVED_SUBDOMAINS.includes(value as (typeof RESERVED_SUBDOMAINS)[number]);
}

export function normalizeHostHeader(hostHeader: string): string {
  const raw = hostHeader.trim().toLowerCase();
  if (!raw || /[\s/@\\,[\]\r\n]/.test(raw)) {
    throw new Error("INVALID_HOST_HEADER");
  }

  const [host, maybePort, extra] = raw.split(":");
  if (extra !== undefined) throw new Error("INVALID_HOST_HEADER");
  if (maybePort !== undefined && !/^\d{1,5}$/.test(maybePort)) {
    throw new Error("INVALID_HOST_HEADER");
  }
  if (!/^[a-z0-9.-]+$/.test(host) || host.includes("..")) {
    throw new Error("INVALID_HOST_HEADER");
  }
  return host;
}

export function resolveHost(
  config: TilbeCoreDomainConfig,
  hostHeader: string,
  customDomains: readonly CustomDomainConfigEntry[] = [],
): HostResolution {
  const host = normalizeHostHeader(hostHeader);

  const system = findSystemOrigin(config, host);
  if (system) return system;

  if (host.endsWith(config.trustedHostSuffix)) {
    const slug = host.slice(0, -config.trustedHostSuffix.length);
    return {
      kind: "tenant",
      normalizedHost: host,
      tenantSlug: normalizeTenantSlug(slug),
    };
  }

  const customDomain = customDomains.find((entry) => entry.hostname.toLowerCase() === host);
  if (customDomain && customDomainCanBeActive(customDomain)) {
    return {
      kind: "customTenant",
      normalizedHost: host,
      tenantSlug: customDomain.tenantSlug,
    };
  }

  throw new Error("UNKNOWN_HOST");
}

export function customDomainCanBeActive(entry: CustomDomainConfigEntry): boolean {
  return entry.status === "ACTIVE" && entry.dnsVerified && entry.tlsReady;
}

export function publicServiceUrl(
  config: TilbeCoreDomainConfig,
  service: PublicService,
  tenantSlug?: string,
): string {
  switch (service) {
    case "marketing":
      return config.systemOrigins.marketing;
    case "console":
      return config.systemOrigins.platform;
    case "status":
      return config.systemOrigins.status;
    case "help":
      return config.systemOrigins.help;
    case "updates":
      return config.systemOrigins.updates;
    case "assets":
      return config.systemOrigins.assets;
    case "tenantWeb":
      return createTenantUrl(config, requireTenantSlug(tenantSlug, service), "origin");
    case "fieldPwa":
      return createTenantUrl(config, requireTenantSlug(tenantSlug, service), "fieldPwa");
    case "tv":
      return createTenantUrl(config, requireTenantSlug(tenantSlug, service), "tv");
    case "customerTracking":
      return createTenantUrl(config, requireTenantSlug(tenantSlug, service), "customerTracking", "opaque-token");
    case "qr":
      return createTenantUrl(config, requireTenantSlug(tenantSlug, service), "qr", "opaque-token");
    case "invite":
      return createTenantUrl(config, requireTenantSlug(tenantSlug, service), "invite", "opaque-token");
    case "tenantApi":
      return createTenantUrl(config, requireTenantSlug(tenantSlug, service), "api");
  }
}

export function privateServiceUrl(_config: TilbeCoreDomainConfig, service: PrivateService): never {
  throw new Error(`PRIVATE_SERVICE_HAS_NO_PUBLIC_URL:${service}`);
}

function domainForEnvironment(environment: DeploymentEnvironment): string {
  switch (environment) {
    case "production":
      return TILBECORE_PRODUCTION_DOMAIN;
    case "staging":
      return TILBECORE_STAGING_DOMAIN;
    case "local":
      return TILBECORE_LOCAL_DOMAIN;
  }
}

function findSystemOrigin(
  config: TilbeCoreDomainConfig,
  host: string,
): HostResolution | null {
  for (const [systemName, origin] of Object.entries(config.systemOrigins)) {
    const originHost = new URL(origin).host;
    if (host === originHost) {
      return {
        kind: systemName === "platform" ? "platform" : systemName === "marketing" ? "marketing" : "system",
        normalizedHost: host,
        systemName: systemName as keyof SystemOrigins,
      };
    }
  }
  return null;
}

function requireOpaqueToken(token: string | undefined, surface: TenantSurface): string {
  if (!token) throw new Error(`OPAQUE_TOKEN_REQUIRED:${surface}`);
  return token;
}

function requireTenantSlug(tenantSlug: string | undefined, service: PublicService): string {
  if (!tenantSlug) throw new Error(`TENANT_SLUG_REQUIRED:${service}`);
  return tenantSlug;
}
