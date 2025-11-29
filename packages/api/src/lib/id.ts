import { nanoid } from "nanoid";

/**
 * Generate a unique ID using nanoid
 * @param length - Length of the ID (default: 12)
 * @returns Unique ID string
 */
export const generateId = (length = 12): string => nanoid(length);

/**
 * Generate a prefixed ID for specific entity types
 * @param prefix - Entity prefix (e.g., 'user', 'notification', 'search')
 * @param length - Length of the random part (default: 8)
 * @returns Prefixed ID string
 */
export const generatePrefixedId = (prefix: string, length = 8): string =>
  `${prefix}_${nanoid(length)}`;

/**
 * Generate IDs for different entity types
 */
export const generateNotificationId = () => generatePrefixedId("notif", 10);
export const generateSearchId = () => generatePrefixedId("search", 10);
export const generateTemplateId = () => generatePrefixedId("tmpl", 8);
export const generateSessionId = () => generatePrefixedId("sess", 12);
