import * as cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { loadEnv } from '../config/env';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

let cronJob: cron.ScheduledTask | null = null;

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const BACKUP_RETENTION_DAYS = 7; // Keep backups for 7 days
const BACKUP_INTERVAL_HOURS = 6; // Backup every 6 hours

/**
 * Create backup directory if it doesn't exist
 */
const ensureBackupDir = async (): Promise<void> => {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    logger.info(`Backup directory created: ${BACKUP_DIR}`);
  }
};

/**
 * Generate backup filename with timestamp
 */
const getBackupFilename = (): string => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `backup_${timestamp}.dump`;
};

/**
 * Execute database backup using pg_dump
 */
const createBackup = async (): Promise<string> => {
  const config = loadEnv();
  const { database } = config;

  // Ensure backup directory exists
  await ensureBackupDir();

  const filename = getBackupFilename();
  const filepath = path.join(BACKUP_DIR, filename);

  // Build pg_dump command
  // Using PGPASSWORD environment variable for password (more secure than command line)
  const pgDumpCommand = `PGPASSWORD="${database.password}" pg_dump -h ${database.host} -p ${database.port} -U ${database.username} -d ${database.name} -F c -f ${filepath}`;

  try {
    logger.info(`Starting database backup: ${filename}`);

    // Execute pg_dump
    await execAsync(pgDumpCommand, {
      env: {
        ...process.env,
        PGPASSWORD: database.password,
      },
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    // Check if backup file was created
    const stats = await fs.stat(filepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    logger.info(`Database backup completed: ${filename} (${fileSizeMB} MB)`);
    return filepath;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Database backup failed: ${errorMessage}`);

    // Try to remove failed backup file if it exists
    try {
      await fs.unlink(filepath);
    } catch {
      // Ignore cleanup errors
    }

    throw error;
  }
};

/**
 * Clean up old backup files (older than retention days)
 */
const cleanupOldBackups = async (): Promise<void> => {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const now = Date.now();
    const retentionMs = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const file of files) {
      if (!file.startsWith('backup_') || !file.endsWith('.dump')) {
        continue;
      }

      const filepath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filepath);
      const fileAge = now - stats.mtimeMs;

      if (fileAge > retentionMs) {
        await fs.unlink(filepath);
        deletedCount++;
        logger.info(`Deleted old backup: ${file} (${Math.round(fileAge / (24 * 60 * 60 * 1000))} days old)`);
      }
    }

    if (deletedCount > 0) {
      logger.info(`Cleanup completed: ${deletedCount} old backup(s) deleted`);
    }
  } catch (error) {
    logger.error(`Backup cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
    // Don't throw - cleanup failures shouldn't stop backups
  }
};

/**
 * Perform backup with error handling
 */
const performBackup = async (): Promise<void> => {
  try {
    await createBackup();
    await cleanupOldBackups();
  } catch (error) {
    logger.error(`Backup process failed: ${error instanceof Error ? error.message : String(error)}`);
    // Don't throw - allow cron to continue
  }
};

/**
 * Start database backup scheduler
 * Runs every 6 hours
 */
export const startDatabaseBackupScheduler = (): void => {
  // Ensure backup directory exists
  ensureBackupDir().catch((error) => {
    logger.error(`Failed to create backup directory: ${error instanceof Error ? error.message : String(error)}`);
  });

  // Perform initial backup immediately
  performBackup().catch((error) => {
    logger.error(`Initial backup failed: ${error instanceof Error ? error.message : String(error)}`);
  });

  // Cron pattern: Every 6 hours
  // Format: "0 */6 * * *" = minute 0, every 6 hours, every day, every month, every day of week
  cronJob = cron.schedule('0 */6 * * *', async () => {
    try {
      logger.info(`[${new Date().toISOString()}] Starting scheduled database backup...`);
      await performBackup();
      logger.info(`[${new Date().toISOString()}] Scheduled database backup completed`);
    } catch (error) {
      logger.error(`[${new Date().toISOString()}] Scheduled database backup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, {
    timezone: 'Europe/Istanbul',
  });

  logger.info(`✅ Database backup scheduler started (backups every ${BACKUP_INTERVAL_HOURS} hours, retention: ${BACKUP_RETENTION_DAYS} days)`);
};

/**
 * Stop database backup scheduler
 */
export const stopDatabaseBackupScheduler = (): void => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    logger.info('Database backup scheduler stopped');
  }
};

/**
 * Get list of backup files
 */
export const listBackups = async (): Promise<Array<{ filename: string; size: number; created: Date }>> => {
  try {
    await ensureBackupDir();
    const files = await fs.readdir(BACKUP_DIR);
    const backups: Array<{ filename: string; size: number; created: Date }> = [];

    for (const file of files) {
      if (!file.startsWith('backup_') || !file.endsWith('.dump')) {
        continue;
      }

      const filepath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filepath);
      backups.push({
        filename: file,
        size: stats.size,
        created: stats.birthtime,
      });
    }

    // Sort by creation date (newest first)
    backups.sort((a, b) => b.created.getTime() - a.created.getTime());

    return backups;
  } catch (error) {
    logger.error(`Failed to list backups: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

