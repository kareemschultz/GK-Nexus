import { exec } from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";
import * as zlib from "node:zlib";

const execAsync = promisify(exec);
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// Backup configuration types
export interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  encryptionKey?: string;
  compressionLevel?: number;
  maxBackups?: number;
  retentionDays?: number;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  filePath?: string;
  sizeBytes?: number;
  compressedSizeBytes?: number;
  checksum?: string;
  durationMs: number;
  tablesBackedUp?: string[];
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  restoreId: string;
  durationMs: number;
  tablesRestored?: string[];
  recordsRestored?: number;
  error?: string;
}

export interface BackupMetadata {
  id: string;
  name: string;
  type: "FULL" | "INCREMENTAL" | "DIFFERENTIAL" | "SETTINGS" | "SELECTIVE";
  createdAt: string;
  sizeBytes: number;
  compressedSizeBytes: number;
  checksum: string;
  tables: string[];
  recordCounts: Record<string, number>;
  databaseVersion: string;
  applicationVersion: string;
  isEncrypted: boolean;
}

// Default configuration
const DEFAULT_CONFIG: Partial<BackupConfig> = {
  compressionLevel: 6,
  maxBackups: 10,
  retentionDays: 30,
};

/**
 * Backup Service - Handles database backup and restore operations
 */
export class BackupService {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a full database backup using pg_dump
   */
  async createFullBackup(options?: {
    name?: string;
    excludeTables?: string[];
    includeData?: boolean;
  }): Promise<BackupResult> {
    const startTime = Date.now();
    const backupId = crypto.randomUUID();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = options?.name || `full-backup-${timestamp}`;

    try {
      // Ensure backup directory exists
      await fs.mkdir(this.config.backupDir, { recursive: true });

      const dumpFile = path.join(
        this.config.backupDir,
        `${backupName}-${backupId}.sql`
      );
      const compressedFile = `${dumpFile}.gz`;

      // Build pg_dump command
      let pgDumpCmd = `pg_dump "${this.config.databaseUrl}" --format=plain --no-owner --no-acl`;

      // Add exclude tables if specified
      if (options?.excludeTables?.length) {
        for (const table of options.excludeTables) {
          pgDumpCmd += ` --exclude-table="${table}"`;
        }
      }

      // Schema only if no data
      if (options?.includeData === false) {
        pgDumpCmd += " --schema-only";
      }

      pgDumpCmd += ` > "${dumpFile}"`;

      // Execute pg_dump
      await execAsync(pgDumpCmd);

      // Read the dump file
      const dumpContent = await fs.readFile(dumpFile);
      const originalSize = dumpContent.length;

      // Compress the backup
      const compressed = await gzip(dumpContent, {
        level: this.config.compressionLevel,
      });

      let finalContent: Buffer = compressed;
      if (this.config.encryptionKey) {
        finalContent = this.encrypt(compressed, this.config.encryptionKey);
      }

      // Calculate checksum
      const checksum = crypto
        .createHash("sha256")
        .update(finalContent)
        .digest("hex");

      // Write compressed/encrypted file
      await fs.writeFile(compressedFile, finalContent);

      // Remove uncompressed file
      await fs.unlink(dumpFile);

      // Get table list from dump
      const tables = this.extractTablesFromDump(dumpContent.toString());

      // Create metadata file
      const metadata: BackupMetadata = {
        id: backupId,
        name: backupName,
        type: "FULL",
        createdAt: new Date().toISOString(),
        sizeBytes: originalSize,
        compressedSizeBytes: finalContent.length,
        checksum,
        tables,
        recordCounts: {},
        databaseVersion: await this.getDatabaseVersion(),
        applicationVersion: process.env.npm_package_version || "1.0.0",
        isEncrypted: !!this.config.encryptionKey,
      };

      await fs.writeFile(
        `${compressedFile}.meta.json`,
        JSON.stringify(metadata, null, 2)
      );

      // Cleanup old backups
      await this.cleanupOldBackups();

      return {
        success: true,
        backupId,
        filePath: compressedFile,
        sizeBytes: originalSize,
        compressedSizeBytes: finalContent.length,
        checksum,
        durationMs: Date.now() - startTime,
        tablesBackedUp: tables,
      };
    } catch (error) {
      return {
        success: false,
        backupId,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create a selective backup of specific tables
   */
  async createSelectiveBackup(
    tables: string[],
    name?: string
  ): Promise<BackupResult> {
    const startTime = Date.now();
    const backupId = crypto.randomUUID();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = name || `selective-backup-${timestamp}`;

    try {
      await fs.mkdir(this.config.backupDir, { recursive: true });

      const dumpFile = path.join(
        this.config.backupDir,
        `${backupName}-${backupId}.sql`
      );
      const compressedFile = `${dumpFile}.gz`;

      // Build pg_dump command with specific tables
      let pgDumpCmd = `pg_dump "${this.config.databaseUrl}" --format=plain --no-owner --no-acl`;
      for (const table of tables) {
        pgDumpCmd += ` --table="${table}"`;
      }
      pgDumpCmd += ` > "${dumpFile}"`;

      await execAsync(pgDumpCmd);

      const dumpContent = await fs.readFile(dumpFile);
      const originalSize = dumpContent.length;

      const compressed = await gzip(dumpContent, {
        level: this.config.compressionLevel,
      });

      let finalContent: Buffer = compressed;
      if (this.config.encryptionKey) {
        finalContent = this.encrypt(compressed, this.config.encryptionKey);
      }

      const checksum = crypto
        .createHash("sha256")
        .update(finalContent)
        .digest("hex");

      await fs.writeFile(compressedFile, finalContent);
      await fs.unlink(dumpFile);

      const metadata: BackupMetadata = {
        id: backupId,
        name: backupName,
        type: "SELECTIVE",
        createdAt: new Date().toISOString(),
        sizeBytes: originalSize,
        compressedSizeBytes: finalContent.length,
        checksum,
        tables,
        recordCounts: {},
        databaseVersion: await this.getDatabaseVersion(),
        applicationVersion: process.env.npm_package_version || "1.0.0",
        isEncrypted: !!this.config.encryptionKey,
      };

      await fs.writeFile(
        `${compressedFile}.meta.json`,
        JSON.stringify(metadata, null, 2)
      );

      return {
        success: true,
        backupId,
        filePath: compressedFile,
        sizeBytes: originalSize,
        compressedSizeBytes: finalContent.length,
        checksum,
        durationMs: Date.now() - startTime,
        tablesBackedUp: tables,
      };
    } catch (error) {
      return {
        success: false,
        backupId,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Export settings and configuration as JSON backup
   */
  async createSettingsBackup(
    settings: Record<string, unknown>
  ): Promise<BackupResult> {
    const startTime = Date.now();
    const backupId = crypto.randomUUID();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = `settings-backup-${timestamp}`;

    try {
      await fs.mkdir(this.config.backupDir, { recursive: true });

      const settingsFile = path.join(
        this.config.backupDir,
        `${backupName}-${backupId}.json.gz`
      );

      const settingsJson = JSON.stringify(settings, null, 2);
      const originalSize = Buffer.byteLength(settingsJson);

      const compressed = await gzip(Buffer.from(settingsJson), {
        level: this.config.compressionLevel,
      });

      let finalContent: Buffer = compressed;
      if (this.config.encryptionKey) {
        finalContent = this.encrypt(compressed, this.config.encryptionKey);
      }

      const checksum = crypto
        .createHash("sha256")
        .update(finalContent)
        .digest("hex");

      await fs.writeFile(settingsFile, finalContent);

      const metadata: BackupMetadata = {
        id: backupId,
        name: backupName,
        type: "SETTINGS",
        createdAt: new Date().toISOString(),
        sizeBytes: originalSize,
        compressedSizeBytes: finalContent.length,
        checksum,
        tables: [],
        recordCounts: {},
        databaseVersion: await this.getDatabaseVersion(),
        applicationVersion: process.env.npm_package_version || "1.0.0",
        isEncrypted: !!this.config.encryptionKey,
      };

      await fs.writeFile(
        `${settingsFile}.meta.json`,
        JSON.stringify(metadata, null, 2)
      );

      return {
        success: true,
        backupId,
        filePath: settingsFile,
        sizeBytes: originalSize,
        compressedSizeBytes: finalContent.length,
        checksum,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        backupId,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Restore database from backup file
   */
  async restoreFromBackup(
    backupFilePath: string,
    options?: {
      targetDatabase?: string;
      selectedTables?: string[];
      dropExisting?: boolean;
    }
  ): Promise<RestoreResult> {
    const startTime = Date.now();
    const restoreId = crypto.randomUUID();

    try {
      // Read and verify backup file
      const encryptedContent = await fs.readFile(backupFilePath);

      // Read metadata
      const metadataPath = `${backupFilePath}.meta.json`;
      let metadata: BackupMetadata | null = null;
      try {
        const metadataContent = await fs.readFile(metadataPath, "utf-8");
        metadata = JSON.parse(metadataContent);
      } catch {
        // Metadata file may not exist for older backups
      }

      // Verify checksum if metadata exists
      if (metadata) {
        const currentChecksum = crypto
          .createHash("sha256")
          .update(encryptedContent)
          .digest("hex");

        if (currentChecksum !== metadata.checksum) {
          return {
            success: false,
            restoreId,
            durationMs: Date.now() - startTime,
            error: "Backup file checksum verification failed",
          };
        }
      }

      let compressedContent: Buffer = encryptedContent;
      if (metadata?.isEncrypted && this.config.encryptionKey) {
        compressedContent = this.decrypt(
          encryptedContent,
          this.config.encryptionKey
        );
      }

      // Decompress
      const sqlContent = await gunzip(compressedContent);

      // Write to temp file for psql
      const tempFile = path.join(
        this.config.backupDir,
        `restore-${restoreId}.sql`
      );
      await fs.writeFile(tempFile, sqlContent);

      // Build psql command
      const targetDb = options?.targetDatabase || this.config.databaseUrl;
      const psqlCmd = `psql "${targetDb}" < "${tempFile}"`;

      // Execute restore
      await execAsync(psqlCmd);

      // Cleanup temp file
      await fs.unlink(tempFile);

      return {
        success: true,
        restoreId,
        durationMs: Date.now() - startTime,
        tablesRestored: metadata?.tables || [],
      };
    } catch (error) {
      return {
        success: false,
        restoreId,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const files = await fs.readdir(this.config.backupDir);
      const metadataFiles = files.filter((f) => f.endsWith(".meta.json"));

      const backups: BackupMetadata[] = [];
      for (const file of metadataFiles) {
        try {
          const content = await fs.readFile(
            path.join(this.config.backupDir, file),
            "utf-8"
          );
          backups.push(JSON.parse(content));
        } catch {
          // Skip invalid metadata files
        }
      }

      return backups.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch {
      return [];
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backups = await this.listBackups();
      const backup = backups.find((b) => b.id === backupId);

      if (!backup) {
        return false;
      }

      const files = await fs.readdir(this.config.backupDir);
      const backupFiles = files.filter((f) => f.includes(backupId));

      for (const file of backupFiles) {
        await fs.unlink(path.join(this.config.backupDir, file));
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupFilePath: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      const content = await fs.readFile(backupFilePath);
      const metadataPath = `${backupFilePath}.meta.json`;
      const metadataContent = await fs.readFile(metadataPath, "utf-8");
      const metadata: BackupMetadata = JSON.parse(metadataContent);

      const currentChecksum = crypto
        .createHash("sha256")
        .update(content)
        .digest("hex");

      if (currentChecksum !== metadata.checksum) {
        return {
          valid: false,
          error: "Checksum mismatch - backup may be corrupted",
        };
      }

      let compressedContent: Buffer = content;
      if (metadata.isEncrypted && this.config.encryptionKey) {
        compressedContent = this.decrypt(content, this.config.encryptionKey);
      }

      await gunzip(compressedContent);

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get backup storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalBackups: number;
    totalSizeBytes: number;
    oldestBackup?: string;
    newestBackup?: string;
  }> {
    const backups = await this.listBackups();

    if (backups.length === 0) {
      return { totalBackups: 0, totalSizeBytes: 0 };
    }

    const totalSizeBytes = backups.reduce(
      (sum, b) => sum + b.compressedSizeBytes,
      0
    );
    const sorted = backups.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return {
      totalBackups: backups.length,
      totalSizeBytes,
      oldestBackup: sorted[0]?.createdAt,
      newestBackup: sorted[sorted.length - 1]?.createdAt,
    };
  }

  // Private helper methods

  private async getDatabaseVersion(): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `psql "${this.config.databaseUrl}" -t -c "SELECT version();"`
      );
      return stdout.trim().split(" ").slice(0, 2).join(" ");
    } catch {
      return "unknown";
    }
  }

  private extractTablesFromDump(dumpContent: string): string[] {
    const tableMatches = dumpContent.match(/CREATE TABLE[^(]+/g) || [];
    return tableMatches
      .map((match) => {
        const parts = match.split(/\s+/);
        return parts[2]?.replace(/"/g, "") || "";
      })
      .filter(Boolean);
  }

  private async cleanupOldBackups(): Promise<void> {
    const backups = await this.listBackups();

    // Remove by max count
    if (this.config.maxBackups && backups.length > this.config.maxBackups) {
      const toRemove = backups.slice(this.config.maxBackups);
      for (const backup of toRemove) {
        await this.deleteBackup(backup.id);
      }
    }

    // Remove by retention days
    if (this.config.retentionDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      for (const backup of backups) {
        if (new Date(backup.createdAt) < cutoffDate) {
          await this.deleteBackup(backup.id);
        }
      }
    }
  }

  private encrypt(data: Buffer, key: string): Buffer {
    const algorithm = "aes-256-gcm";
    const iv = crypto.randomBytes(16);
    const keyBuffer = crypto.scryptSync(key, "salt", 32);
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Prepend IV and auth tag to encrypted data
    return Buffer.concat([iv, authTag, encrypted]);
  }

  private decrypt(data: Buffer, key: string): Buffer {
    const algorithm = "aes-256-gcm";
    const iv = data.subarray(0, 16);
    const authTag = data.subarray(16, 32);
    const encrypted = data.subarray(32);

    const keyBuffer = crypto.scryptSync(key, "salt", 32);
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}

// Singleton instance
let backupServiceInstance: BackupService | null = null;

export function getBackupService(): BackupService {
  if (!backupServiceInstance) {
    backupServiceInstance = new BackupService({
      databaseUrl: process.env.DATABASE_URL || "",
      backupDir: process.env.BACKUP_DIR || "./backups",
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
      compressionLevel: 6,
      maxBackups: 10,
      retentionDays: 30,
    });
  }
  return backupServiceInstance;
}

export default BackupService;
