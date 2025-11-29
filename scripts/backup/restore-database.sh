#!/bin/bash
# =============================================================================
# GK-Nexus Database Restore Script
# =============================================================================
#
# This script restores PostgreSQL database from backup files with support for
# encrypted backups, point-in-time recovery, and various backup formats.
#
# Usage:
#   ./restore-database.sh --backup-file /path/to/backup [--decrypt] [--point-in-time TIMESTAMP]
#
# Environment Variables Required:
#   DATABASE_URL - PostgreSQL connection string
#   BACKUP_ENCRYPTION_KEY - Key for backup decryption (if encrypted)

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESTORE_DIR="${RESTORE_DIR:-/tmp/restore}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${RESTORE_DIR}/logs/restore_${TIMESTAMP}.log"

# Database configuration
DB_NAME="${POSTGRES_DB:-gk_nexus_prod}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Restore parameters
BACKUP_FILE=""
DECRYPT_BACKUP="false"
POINT_IN_TIME=""
TARGET_DB_NAME=""
DRY_RUN="false"
FORCE_RESTORE="false"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"

    case "$level" in
        ERROR)
            echo -e "${RED}${timestamp} [${level}] ${message}${NC}" >&2
            ;;
        WARN)
            echo -e "${YELLOW}${timestamp} [${level}] ${message}${NC}"
            ;;
        INFO)
            echo -e "${GREEN}${timestamp} [${level}] ${message}${NC}"
            ;;
        DEBUG)
            echo -e "${BLUE}${timestamp} [${level}] ${message}${NC}"
            ;;
    esac
}

# Error handler
error_exit() {
    log "ERROR" "$1"
    cleanup_temp_files
    exit 1
}

# Setup directories
setup_directories() {
    log "INFO" "Setting up restore directories"
    mkdir -p "${RESTORE_DIR}"/{temp,logs}
    chmod 750 "${RESTORE_DIR}"
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites"

    # Check required tools
    local tools=("pg_restore" "psql" "gzip" "openssl")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error_exit "Required tool '$tool' is not installed"
        fi
    done

    # Verify backup file exists
    if [[ ! -f "$BACKUP_FILE" ]]; then
        error_exit "Backup file does not exist: $BACKUP_FILE"
    fi

    # Check database connectivity
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" &> /dev/null; then
        error_exit "Cannot connect to PostgreSQL server on $DB_HOST:$DB_PORT"
    fi

    log "INFO" "Prerequisites check completed"
}

# Decrypt backup if necessary
decrypt_backup() {
    local backup_file="$1"
    local decrypted_file="${RESTORE_DIR}/temp/$(basename "${backup_file%.enc}")"

    if [[ "$DECRYPT_BACKUP" == "true" ]]; then
        log "INFO" "Decrypting backup file"

        if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
            error_exit "BACKUP_ENCRYPTION_KEY environment variable not set"
        fi

        openssl enc -d -aes-256-cbc -pbkdf2 -in "$backup_file" -out "$decrypted_file" -k "$BACKUP_ENCRYPTION_KEY" \
        || error_exit "Decryption failed"

        log "INFO" "Backup decrypted successfully"
        echo "$decrypted_file"
    else
        echo "$backup_file"
    fi
}

# Decompress backup if necessary
decompress_backup() {
    local backup_file="$1"
    local decompressed_file="${backup_file%.gz}"

    if [[ "$backup_file" == *.gz ]]; then
        log "INFO" "Decompressing backup file"

        gunzip -c "$backup_file" > "$decompressed_file" \
        || error_exit "Decompression failed"

        echo "$decompressed_file"
    else
        echo "$backup_file"
    fi
}

# Verify backup integrity
verify_backup_integrity() {
    local backup_file="$1"

    log "INFO" "Verifying backup integrity"

    # Check if checksum file exists
    local checksum_file="${backup_file}.sha256"
    if [[ -f "$checksum_file" ]]; then
        local expected_checksum=$(cat "$checksum_file")
        local actual_checksum=$(sha256sum "$backup_file" | awk '{print $1}')

        if [[ "$expected_checksum" != "$actual_checksum" ]]; then
            error_exit "Backup integrity check failed. Checksum mismatch."
        fi

        log "INFO" "Backup integrity verified"
    else
        log "WARN" "No checksum file found. Skipping integrity check."
    fi
}

# Get backup information
get_backup_info() {
    local backup_file="$1"

    log "INFO" "Analyzing backup file"

    # Detect backup format
    local backup_format="unknown"
    if file "$backup_file" | grep -q "PostgreSQL custom database dump"; then
        backup_format="custom"
    elif file "$backup_file" | grep -q "SQL script" || [[ "$backup_file" == *.sql ]]; then
        backup_format="sql"
    elif [[ -d "$backup_file" ]] || [[ "$backup_file" == *.tar* ]]; then
        backup_format="directory"
    fi

    log "INFO" "Detected backup format: $backup_format"

    # For custom format, get additional info
    if [[ "$backup_format" == "custom" ]]; then
        local info=$(pg_restore --list "$backup_file" 2>/dev/null | head -20 || true)
        log "DEBUG" "Backup contents preview:"
        echo "$info" | while read line; do
            log "DEBUG" "  $line"
        done
    fi

    echo "$backup_format"
}

# Create database if it doesn't exist
create_target_database() {
    local target_db="$1"

    log "INFO" "Checking if target database exists: $target_db"

    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$target_db"; then
        if [[ "$FORCE_RESTORE" == "true" ]]; then
            log "WARN" "Target database exists. Dropping it due to --force flag"
            dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$target_db" \
            || error_exit "Failed to drop existing database"
        else
            error_exit "Target database '$target_db' already exists. Use --force to overwrite."
        fi
    fi

    log "INFO" "Creating target database: $target_db"
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$target_db" \
    || error_exit "Failed to create target database"
}

# Restore from custom format backup
restore_custom_backup() {
    local backup_file="$1"
    local target_db="$2"

    log "INFO" "Restoring from custom format backup"

    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would restore using pg_restore"
        pg_restore --list "$backup_file" | head -10
        return 0
    fi

    pg_restore \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$target_db" \
        --verbose \
        --clean \
        --no-owner \
        --no-privileges \
        --jobs=4 \
        "$backup_file" \
    || error_exit "pg_restore failed"

    log "INFO" "Custom format restore completed"
}

# Restore from SQL backup
restore_sql_backup() {
    local backup_file="$1"
    local target_db="$2"

    log "INFO" "Restoring from SQL backup"

    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would restore using psql"
        head -20 "$backup_file"
        return 0
    fi

    psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$target_db" \
        --file="$backup_file" \
        --echo-errors \
        --on-error-stop \
    || error_exit "psql restore failed"

    log "INFO" "SQL restore completed"
}

# Restore from directory/tar backup (pg_basebackup)
restore_directory_backup() {
    local backup_path="$1"
    local target_db="$2"

    log "ERROR" "Directory/tar backup restoration not implemented yet"
    log "INFO" "This type of backup requires PostgreSQL cluster restoration"
    log "INFO" "Please contact your database administrator"
    error_exit "Unsupported backup type for automatic restoration"
}

# Perform point-in-time recovery
perform_point_in_time_recovery() {
    local target_db="$1"
    local recovery_time="$2"

    log "INFO" "Performing point-in-time recovery to: $recovery_time"
    log "WARN" "Point-in-time recovery requires WAL files and is complex"
    log "INFO" "This is a placeholder for PITR implementation"

    # This would require:
    # 1. Base backup restoration
    # 2. WAL file replay up to the specified time
    # 3. PostgreSQL configuration for recovery

    error_exit "Point-in-time recovery not fully implemented. Contact DBA."
}

# Validate restored database
validate_restoration() {
    local target_db="$1"

    log "INFO" "Validating restored database"

    # Check if database is accessible
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$target_db" -c "SELECT 1;" &> /dev/null; then
        error_exit "Cannot connect to restored database"
    fi

    # Get table count
    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$target_db" -t -c "
        SELECT COUNT(*) FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    " | tr -d ' ')

    log "INFO" "Restored database contains $table_count tables"

    # Check for specific GK-Nexus tables
    local expected_tables=("users" "clients" "organizations" "audit_logs")
    for table in "${expected_tables[@]}"; do
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$target_db" -t -c "
            SELECT 1 FROM information_schema.tables
            WHERE table_name = '$table' AND table_schema = 'public';
        " | grep -q 1; then
            log "INFO" "✓ Table '$table' found"
        else
            log "WARN" "✗ Table '$table' not found"
        fi
    done

    # Basic data integrity check
    local user_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$target_db" -t -c "
        SELECT COUNT(*) FROM users;
    " 2>/dev/null | tr -d ' ' || echo "0")

    log "INFO" "Database validation completed. User records: $user_count"
}

# Cleanup temporary files
cleanup_temp_files() {
    log "INFO" "Cleaning up temporary files"
    rm -rf "${RESTORE_DIR}/temp"/*
}

# Generate restore report
generate_restore_report() {
    local backup_file="$1"
    local target_db="$2"
    local status="$3"

    local report_file="${RESTORE_DIR}/logs/restore_report_${TIMESTAMP}.json"

    cat > "$report_file" << EOF
{
    "timestamp": "$TIMESTAMP",
    "backup_file": "$backup_file",
    "target_database": "$target_db",
    "status": "$status",
    "point_in_time": "$POINT_IN_TIME",
    "decrypted": $DECRYPT_BACKUP,
    "dry_run": $DRY_RUN,
    "environment": "production"
}
EOF

    log "INFO" "Restore report generated: $report_file"
}

# Main restoration function
main() {
    log "INFO" "Starting GK-Nexus database restore process"
    log "INFO" "Backup file: $BACKUP_FILE"
    log "INFO" "Target database: ${TARGET_DB_NAME:-$DB_NAME}"

    # Setup
    setup_directories
    check_prerequisites

    # Determine target database
    local target_db="${TARGET_DB_NAME:-${DB_NAME}_restored_${TIMESTAMP}}"

    # Process backup file
    local processed_backup="$BACKUP_FILE"
    verify_backup_integrity "$processed_backup"
    processed_backup=$(decrypt_backup "$processed_backup")
    processed_backup=$(decompress_backup "$processed_backup")

    # Get backup information
    local backup_format=$(get_backup_info "$processed_backup")

    # Create target database
    create_target_database "$target_db"

    # Perform restoration based on backup format
    case "$backup_format" in
        custom)
            restore_custom_backup "$processed_backup" "$target_db"
            ;;
        sql)
            restore_sql_backup "$processed_backup" "$target_db"
            ;;
        directory)
            restore_directory_backup "$processed_backup" "$target_db"
            ;;
        *)
            error_exit "Unknown backup format: $backup_format"
            ;;
    esac

    # Point-in-time recovery if requested
    if [[ -n "$POINT_IN_TIME" ]]; then
        perform_point_in_time_recovery "$target_db" "$POINT_IN_TIME"
    fi

    # Validation
    if [[ "$DRY_RUN" != "true" ]]; then
        validate_restoration "$target_db"
    fi

    # Cleanup and reporting
    cleanup_temp_files
    generate_restore_report "$BACKUP_FILE" "$target_db" "success"

    log "INFO" "Database restore completed successfully"
    log "INFO" "Restored database: $target_db"

    if [[ "$DRY_RUN" != "true" ]]; then
        log "INFO" "You can now connect to the restored database:"
        log "INFO" "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $target_db"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backup-file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        --decrypt)
            DECRYPT_BACKUP="true"
            shift
            ;;
        --target-db)
            TARGET_DB_NAME="$2"
            shift 2
            ;;
        --point-in-time)
            POINT_IN_TIME="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --force)
            FORCE_RESTORE="true"
            shift
            ;;
        -h|--help)
            cat << EOF
Usage: $0 --backup-file BACKUP_FILE [OPTIONS]

OPTIONS:
    --backup-file FILE      Path to backup file (required)
    --decrypt               Decrypt backup file
    --target-db NAME        Target database name (default: auto-generated)
    --point-in-time TIME    Restore to specific point in time (YYYY-MM-DD HH:MM:SS)
    --dry-run               Show what would be done without executing
    --force                 Force restore, dropping existing target database
    -h, --help              Show this help message

Environment Variables:
    DATABASE_URL                PostgreSQL connection string
    BACKUP_ENCRYPTION_KEY       Key for backup decryption

Examples:
    $0 --backup-file /backups/gk_nexus_full_20231201_120000.sql.gz
    $0 --backup-file /backups/encrypted_backup.enc --decrypt
    $0 --backup-file /backups/backup.sql --target-db gk_nexus_test --dry-run
    $0 --backup-file /backups/backup.sql --point-in-time "2023-12-01 12:00:00"

EOF
            exit 0
            ;;
        *)
            error_exit "Unknown option: $1. Use --help for usage information."
            ;;
    esac
done

# Validate required arguments
if [[ -z "$BACKUP_FILE" ]]; then
    error_exit "Backup file is required. Use --backup-file option."
fi

# Run main function
main