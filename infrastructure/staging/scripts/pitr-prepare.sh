#!/bin/sh
set -eu

[ "${TILBECORE_ENV:-}" = "staging" ] || { printf '%s\n' "STAGING_ONLY" >&2; exit 1; }
: "${BACKUP_ID:?BACKUP_ID_REQUIRED}" "${RECOVERY_TARGET:?RECOVERY_TARGET_REQUIRED}"
: "${EXPECTED_TENANT_INSTANCE_ID:?EXPECTED_TENANT_INSTANCE_ID_REQUIRED}" "${EXPECTED_DATABASE_REF_ID:?EXPECTED_DATABASE_REF_ID_REQUIRED}"
source="/backup-repository/$BACKUP_ID"
target="/var/lib/postgresql/data"
[ -f "$source/backup_manifest" ] || { printf '%s\n' "BASE_BACKUP_NOT_FOUND" >&2; exit 1; }
[ -f "$source/tilbecore-metadata.json" ] || { printf '%s\n' "BACKUP_METADATA_NOT_FOUND" >&2; exit 1; }
sha256sum -c "$source/tilbecore-metadata.sha256"
grep -Fq "\"tenantInstanceId\":\"$EXPECTED_TENANT_INSTANCE_ID\"" "$source/tilbecore-metadata.json" || { printf '%s\n' "BACKUP_TENANT_MISMATCH" >&2; exit 1; }
grep -Fq "\"databaseRefId\":\"$EXPECTED_DATABASE_REF_ID\"" "$source/tilbecore-metadata.json" || { printf '%s\n' "BACKUP_DATABASE_REF_MISMATCH" >&2; exit 1; }
[ ! -e "$target/PG_VERSION" ] || { printf '%s\n' "PITR_TARGET_NOT_EMPTY" >&2; exit 1; }
pg_verifybackup "$source"
cp -a "$source/." "$target/"
touch "$target/recovery.signal"
printf "%s\n" "restore_command = 'cp /wal-archive/%f %p'" >> "$target/postgresql.auto.conf"
case "${RECOVERY_TARGET_KIND:-time}" in
  time) printf "%s\n" "recovery_target_time = '$RECOVERY_TARGET'" >> "$target/postgresql.auto.conf" ;;
  lsn) printf "%s\n" "recovery_target_lsn = '$RECOVERY_TARGET'" >> "$target/postgresql.auto.conf" ;;
  *) printf '%s\n' "RECOVERY_TARGET_KIND_INVALID" >&2; exit 1 ;;
esac
printf "%s\n" "recovery_target_action = 'promote'" >> "$target/postgresql.auto.conf"
chmod 700 "$target"
