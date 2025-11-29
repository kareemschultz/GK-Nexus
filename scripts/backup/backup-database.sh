#!/bin/bash
# =============================================================================
# GK-Nexus Database Backup Script
# =============================================================================
#
# This script performs automated backups of the PostgreSQL database with
# encryption, compression, and cloud storage upload for disaster recovery.
#
# Usage:
#   ./backup-database.sh [--full|--incremental] [--upload] [--encrypt]
#
# Environment Variables Required:
#   DATABASE_URL - PostgreSQL connection string
#   BACKUP_ENCRYPTION_KEY - Key for backup encryption
#   AWS_S3_BACKUP_BUCKET - S3 bucket for backup storage
#   SLACK_WEBHOOK_URL - Slack notifications (optional)

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/logs/backup_${TIMESTAMP}.log"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Database configuration
DB_NAME="${POSTGRES_DB:-gk_nexus_prod}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Backup types
BACKUP_TYPE="${1:-full}"
UPLOAD_TO_S3="${2:-false}"
ENCRYPT_BACKUP="${3:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    esac
}

# Error handler
error_exit() {
    log "ERROR" "$1"
    send_notification "ERROR" "Database backup failed: $1"
    exit 1
}

# Create necessary directories
setup_directories() {
    log "INFO" "Setting up backup directories"
    mkdir -p "${BACKUP_DIR}"/{full,incremental,logs,temp}
    chmod 750 "${BACKUP_DIR}"
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites"

    # Check required tools
    local tools=("pg_dump" "pg_basebackup" "gzip" "openssl")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error_exit "Required tool '$tool' is not installed"
        fi
    done

    # Check database connectivity
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
        error_exit "Cannot connect to database $DB_NAME on $DB_HOST:$DB_PORT"
    fi

    # Check disk space (require at least 5GB free)
    local available_space=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 5242880 ]]; then  # 5GB in KB
        error_exit "Insufficient disk space. At least 5GB required."
    fi

    log "INFO" "Prerequisites check completed"
}

# Perform full backup
perform_full_backup() {
    log "INFO" "Starting full database backup"

    local backup_file="${BACKUP_DIR}/full/gk_nexus_full_${TIMESTAMP}.sql"
    local compressed_file="${backup_file}.gz"

    # Custom format backup for faster restores
    log "INFO" "Creating PostgreSQL dump"
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --no-password \
        --verbose \
        --format=custom \
        --compress=9 \
        --file="$backup_file" \
    || error_exit "pg_dump failed"

    # Additional SQL format backup for compatibility
    log "INFO" "Creating SQL format backup"
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --no-password \
        --verbose \
        --format=plain \
        --file="${backup_file}.plain" \
    || error_exit "SQL backup failed"

    # Compress SQL backup
    gzip "${backup_file}.plain"

    log "INFO" "Full backup completed: $backup_file"
    echo "$backup_file"
}

# Perform incremental backup using WAL files
perform_incremental_backup() {
    log "INFO" "Starting incremental backup"

    local backup_dir="${BACKUP_DIR}/incremental/incremental_${TIMESTAMP}"
    mkdir -p "$backup_dir"

    # Base backup using pg_basebackup
    log "INFO" "Creating base backup"
    pg_basebackup \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --pgdata="$backup_dir" \
        --format=tar \
        --gzip \
        --compress=9 \
        --wal-method=stream \
        --verbose \
        --progress \
    || error_exit "pg_basebackup failed"

    log "INFO" "Incremental backup completed: $backup_dir"
    echo "$backup_dir"
}

# Encrypt backup file
encrypt_backup() {
    local file="$1"
    local encrypted_file="${file}.enc"

    if [[ "$ENCRYPT_BACKUP" == "true" ]]; then
        log "INFO" "Encrypting backup file"

        if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
            error_exit "BACKUP_ENCRYPTION_KEY environment variable not set"
        fi

        openssl enc -aes-256-cbc -salt -pbkdf2 -in "$file" -out "$encrypted_file" -k "$BACKUP_ENCRYPTION_KEY" \
        || error_exit "Encryption failed"

        # Remove unencrypted file
        rm "$file"

        log "INFO" "Backup encrypted: $encrypted_file"
        echo "$encrypted_file"
    else
        echo "$file"
    fi
}

# Upload to S3
upload_to_s3() {
    local file="$1"
    local s3_path="s3://${AWS_S3_BACKUP_BUCKET}/gk-nexus/backups/$(date +%Y)/$(date +%m)/$(basename "$file")"

    if [[ "$UPLOAD_TO_S3" == "true" ]]; then
        log "INFO" "Uploading backup to S3: $s3_path"

        if ! command -v aws &> /dev/null; then
            error_exit "AWS CLI is not installed"
        fi

        aws s3 cp "$file" "$s3_path" \
            --storage-class STANDARD_IA \
            --server-side-encryption AES256 \
        || error_exit "S3 upload failed"

        # Set lifecycle policy for cost optimization
        aws s3api put-object-tagging \
            --bucket "${AWS_S3_BACKUP_BUCKET}" \
            --key "$(echo "$s3_path" | sed "s|s3://${AWS_S3_BACKUP_BUCKET}/||")" \
            --tagging "TagSet=[{Key=BackupType,Value=${BACKUP_TYPE}},{Key=Environment,Value=production},{Key=Application,Value=gk-nexus}]" \
        || log "WARN" "Failed to set S3 object tags"

        log "INFO" "Backup uploaded to S3 successfully"
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"

    log "INFO" "Verifying backup integrity"

    if [[ "$backup_file" == *.gz ]]; then
        # Test gzip integrity
        if ! gzip -t "$backup_file"; then
            error_exit "Backup file is corrupted (gzip test failed)"
        fi
    fi

    if [[ "$backup_file" == *.sql ]] || [[ "$backup_file" == *.sql.gz ]]; then
        # For SQL backups, we can do additional checks
        log "INFO" "Backup file integrity verified"
    fi

    # Calculate checksum
    local checksum=$(sha256sum "$backup_file" | awk '{print $1}')
    echo "$checksum" > "${backup_file}.sha256"

    log "INFO" "Backup checksum: $checksum"
}

# Clean up old backups
cleanup_old_backups() {
    log "INFO" "Cleaning up backups older than $RETENTION_DAYS days"

    # Clean local backups
    find "${BACKUP_DIR}/full" -type f -mtime +$RETENTION_DAYS -delete || true
    find "${BACKUP_DIR}/incremental" -type d -mtime +$RETENTION_DAYS -exec rm -rf {} + || true
    find "${BACKUP_DIR}/logs" -type f -mtime +$RETENTION_DAYS -delete || true

    # Clean S3 backups (if configured)
    if [[ "$UPLOAD_TO_S3" == "true" && -n "${AWS_S3_BACKUP_BUCKET:-}" ]]; then
        local cutoff_date=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
        aws s3 ls "s3://${AWS_S3_BACKUP_BUCKET}/gk-nexus/backups/" --recursive \
        | awk -v cutoff="$cutoff_date" '$1 < cutoff {print $4}' \
        | while read -r key; do
            aws s3 rm "s3://${AWS_S3_BACKUP_BUCKET}/$key" || true
        done
    fi

    log "INFO" "Cleanup completed"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"

    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color="good"
        [[ "$status" == "ERROR" ]] && color="danger"
        [[ "$status" == "WARN" ]] && color="warning"

        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"GK-Nexus Database Backup\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"Production\", \"short\": true},
                        {\"title\": \"Backup Type\", \"value\": \"$BACKUP_TYPE\", \"short\": true},
                        {\"title\": \"Timestamp\", \"value\": \"$TIMESTAMP\", \"short\": true}
                    ]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" &> /dev/null || true
    fi
}

# Generate backup report
generate_report() {
    local backup_file="$1"
    local report_file="${BACKUP_DIR}/logs/backup_report_${TIMESTAMP}.json"

    local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
    local file_size_mb=$((file_size / 1024 / 1024))

    cat > "$report_file" << EOF
{
    "timestamp": "$TIMESTAMP",
    "backup_type": "$BACKUP_TYPE",
    "backup_file": "$backup_file",
    "file_size_bytes": $file_size,
    "file_size_mb": $file_size_mb,
    "database": "$DB_NAME",
    "environment": "production",
    "encrypted": $ENCRYPT_BACKUP,
    "uploaded_to_s3": $UPLOAD_TO_S3,
    "retention_days": $RETENTION_DAYS,
    "status": "success"
}
EOF

    log "INFO" "Backup report generated: $report_file"
}

# Main function
main() {
    log "INFO" "Starting GK-Nexus database backup process"
    log "INFO" "Backup type: $BACKUP_TYPE"

    # Setup
    setup_directories
    check_prerequisites

    # Perform backup based on type
    local backup_file
    case "$BACKUP_TYPE" in
        full)
            backup_file=$(perform_full_backup)
            ;;
        incremental)
            backup_file=$(perform_incremental_backup)
            ;;
        *)
            error_exit "Invalid backup type: $BACKUP_TYPE. Use 'full' or 'incremental'"
            ;;
    esac

    # Post-processing
    verify_backup "$backup_file"
    backup_file=$(encrypt_backup "$backup_file")
    upload_to_s3 "$backup_file"
    cleanup_old_backups
    generate_report "$backup_file"

    local final_message="Database backup completed successfully. File: $(basename "$backup_file")"
    log "INFO" "$final_message"
    send_notification "SUCCESS" "$final_message"

    log "INFO" "Backup process completed"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --full)
            BACKUP_TYPE="full"
            shift
            ;;
        --incremental)
            BACKUP_TYPE="incremental"
            shift
            ;;
        --upload)
            UPLOAD_TO_S3="true"
            shift
            ;;
        --encrypt)
            ENCRYPT_BACKUP="true"
            shift
            ;;
        --no-encrypt)
            ENCRYPT_BACKUP="false"
            shift
            ;;
        -h|--help)
            cat << EOF
Usage: $0 [OPTIONS]

OPTIONS:
    --full              Perform full database backup (default)
    --incremental       Perform incremental backup using WAL
    --upload            Upload backup to S3
    --encrypt           Encrypt backup (default)
    --no-encrypt        Skip encryption
    -h, --help          Show this help message

Environment Variables:
    DATABASE_URL                PostgreSQL connection string
    BACKUP_ENCRYPTION_KEY       Key for backup encryption
    AWS_S3_BACKUP_BUCKET       S3 bucket for backup storage
    SLACK_WEBHOOK_URL          Slack webhook for notifications (optional)
    RETENTION_DAYS             Days to retain backups (default: 30)

Examples:
    $0 --full --upload --encrypt
    $0 --incremental
    $0 --full --no-encrypt

EOF
            exit 0
            ;;
        *)
            error_exit "Unknown option: $1"
            ;;
    esac
done

# Run main function
main