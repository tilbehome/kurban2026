#!/bin/sh
set -eu

[ "${TILBECORE_ENV:-}" = "staging" ] || { printf '%s\n' "STAGING_ONLY" >&2; exit 1; }
: "${PGHOST:?PGHOST_REQUIRED}" "${PGUSER:?PGUSER_REQUIRED}" "${BACKUP_ID:?BACKUP_ID_REQUIRED}"
: "${TENANT_INSTANCE_ID:?TENANT_INSTANCE_ID_REQUIRED}" "${DATABASE_REF_ID:?DATABASE_REF_ID_REQUIRED}"
: "${APP_VERSION:?APP_VERSION_REQUIRED}" "${MIGRATION_VERSION:?MIGRATION_VERSION_REQUIRED}"
case "$BACKUP_ID" in *[!a-zA-Z0-9_-]*|'') printf '%s\n' "BACKUP_ID_INVALID" >&2; exit 1;; esac
for value in "$TENANT_INSTANCE_ID" "$DATABASE_REF_ID" "$APP_VERSION" "$MIGRATION_VERSION"; do
  case "$value" in *[!a-zA-Z0-9._-]*|'') printf '%s\n' "BACKUP_METADATA_INVALID" >&2; exit 1;; esac
done
target="/backup-repository/$BACKUP_ID"
[ ! -e "$target" ] || { printf '%s\n' "BACKUP_TARGET_EXISTS" >&2; exit 1; }
started="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
pg_basebackup --host "$PGHOST" --username "$PGUSER" --pgdata "$target" --format plain --wal-method stream --checkpoint fast --manifest-checksums=SHA256
pg_verifybackup "$target"
sha256sum "$target/backup_manifest" > "$target/backup_manifest.sha256"
completed="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf '%s\n' "{\"tenantInstanceId\":\"$TENANT_INSTANCE_ID\",\"databaseRefId\":\"$DATABASE_REF_ID\",\"appVersion\":\"$APP_VERSION\",\"migrationVersion\":\"$MIGRATION_VERSION\"}" > "$target/tilbecore-metadata.json"
sha256sum "$target/tilbecore-metadata.json" > "$target/tilbecore-metadata.sha256"
printf '%s\n' "{\"result\":\"PASSED\",\"backupId\":\"$BACKUP_ID\",\"startedAt\":\"$started\",\"completedAt\":\"$completed\",\"productionWrite\":false}" > "$target/result.json"
