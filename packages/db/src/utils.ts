import { randomBytes } from "crypto";

/**
 * Generate a unique ID for database records
 */
export function generateId(): string {
  return randomBytes(16).toString("hex");
}
