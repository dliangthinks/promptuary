/**
 * Utility Functions Module
 * Consolidates all utility functions used across the application
 */
export * from "./errorHandling.js";
export * from "./jsonUtils.js";
/**
 * Clear the require cache for prompt-related modules
 */
export declare function clearRequireCache(): void;
/**
 * Get available tools information for template processing
 */
export declare function getAvailableTools(): string;
/**
 * Force garbage collection if available
 */
export declare function forceGarbageCollection(): boolean;
/**
 * Delay execution for a specified number of milliseconds
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Create a unique identifier
 */
export declare function createUniqueId(prefix?: string): string;
/**
 * Safely stringify an object, handling circular references
 */
export declare function safeStringify(obj: any, indent?: number): string;
/**
 * Check if a string is valid JSON
 */
export declare function isValidJson(str: string): boolean;
/**
 * Truncate text to a maximum length
 */
export declare function truncateText(text: string, maxLength: number, suffix?: string): string;
/**
 * Convert camelCase to kebab-case
 */
export declare function camelToKebab(str: string): string;
/**
 * Convert kebab-case to camelCase
 */
export declare function kebabToCamel(str: string): string;
/**
 * Validate email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Parse command line arguments into key-value pairs
 */
export declare function parseArgs(args: string[]): Record<string, string>;
