/**
 * Text Reference System Module
 * Handles storage and retrieval of text references for template processing
 */
import { Logger } from "../logging/index.js";
/**
 * Text Reference Manager class
 */
export declare class TextReferenceManager {
    private store;
    private logger;
    constructor(logger: Logger, maxAge?: number, maxSize?: number);
    /**
     * Generate a title for a text using Claude (placeholder implementation)
     */
    private generateTextTitle;
    /**
     * Store a text reference and return its reference ID
     */
    storeTextReference(text: string): Promise<string>;
    /**
     * Retrieve a text reference by ID
     */
    getTextReference(refId: string): string | null;
    /**
     * Clean up old references
     */
    private cleanupOldReferences;
    /**
     * List available references
     */
    listTextReferences(): Array<{
        id: string;
        title: string;
        createdAt: number;
    }>;
    /**
     * Process template text references by replacing reference placeholders with content
     */
    processTemplateReferences(template: string): string;
    /**
     * Get statistics about the reference store
     */
    getStats(): {
        totalReferences: number;
        oldestReference: number | null;
        newestReference: number | null;
    };
    /**
     * Clear all references (useful for testing or memory management)
     */
    clearAllReferences(): void;
    /**
     * Set new limits for the reference store
     */
    setLimits(maxAge: number, maxSize: number): void;
}
/**
 * Create a text reference manager instance
 */
export declare function createTextReferenceManager(logger: Logger, maxAge?: number, maxSize?: number): TextReferenceManager;
