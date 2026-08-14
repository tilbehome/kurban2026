#!/bin/sh
set -eu

read_secret() {
  secret_path="/run/secrets/$1"
  [ -s "$secret_path" ] || { printf '%s\n' "STAGING_SECRET_REQUIRED:$1" >&2; exit 1; }
  tr -d '\r\n' < "$secret_path"
}

postgres_scheme='postgresql://'

case "${TILBECORE_COMPONENT:-}" in
  platform)
    platform_password="$(read_secret platform_db_password)"
    export PLATFORM_DATABASE_URL="${postgres_scheme}${PLATFORM_DB_USER}:${platform_password}@${PLATFORM_DB_HOST}:5432/${PLATFORM_DB_NAME}"
    export PLATFORM_SESSION_SECRET="$(read_secret platform_session_secret)"
    export PLATFORM_MFA_ENCRYPTION_KEY="$(read_secret platform_mfa_encryption_key)"
    ;;
  tenant-a|tenant-b)
    tenant_password="$(read_secret tenant_db_password)"
    export TENANT_DATABASE_URL="${postgres_scheme}${TENANT_DB_USER}:${tenant_password}@${TENANT_DB_HOST}:5432/${TENANT_DB_NAME}"
    export TENANT_DATABASE_ADMIN_URL="${postgres_scheme}${TENANT_DB_USER}:${tenant_password}@${TENANT_DB_HOST}:5432/postgres"
    export SESSION_SECRET="$(read_secret tenant_session_secret)"
    export DEKONT_DOGRULAMA_SECRET="$(read_secret receipt_hmac_secret)"
    ;;
  worker)
    platform_password="$(read_secret platform_db_password)"
    tenant_password="$(read_secret tenant_db_password)"
    export PLATFORM_DATABASE_URL="${postgres_scheme}${PLATFORM_DB_USER}:${platform_password}@${PLATFORM_DB_HOST}:5432/${PLATFORM_DB_NAME}"
    export TENANT_DATABASE_ADMIN_URL="${postgres_scheme}${TENANT_DB_USER}:${tenant_password}@${TENANT_DB_HOST}:5432/postgres"
    ;;
  *)
    printf '%s\n' "STAGING_COMPONENT_INVALID" >&2
    exit 1
    ;;
esac

unset platform_password tenant_password
exec "$@"
