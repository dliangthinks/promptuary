/**
 * Text Reference System Module
 * Handles storage and retrieval of text references for template processing
 */
/**
 * Text Reference Manager class
 */
export class TextReferenceManager {
    constructor(logger, maxAge = 24 * 60 * 60 * 1000, maxSize = 1000) {
        this.store = {
            references: [],
            maxAge,
            maxSize,
        };
        this.logger = logger;
    }
    /**
     * Generate a title for a text using Claude (placeholder implementation)
     */
    async generateTextTitle(text) {
        try {
            // For now, create a simple title from the first 50 characters
            // In the future, this could call Claude directly for better titles
            const title = text.substring(0, 50).trim();
            return title || `Text_${Date.now()}`;
        }
        catch (error) {
            this.logger.error("Error generating title:", error);
            return `Text_${Date.now()}`;
        }
    }
    /**
     * Store a text reference and return its reference ID
     */
    async storeTextReference(text) {
        try {
            const title = await this.generateTextTitle(text);
            const id = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const reference = {
                id,
                title,
                content: text,
                createdAt: Date.now(),
                lastUsed: Date.now(),
            };
            this.store.references.push(reference);
            // Clean up old references if we exceed maxSize
            if (this.store.references.length > this.store.maxSize) {
                this.cleanupOldReferences();
            }
            return `{{ref:${id}}}`;
        }
        catch (error) {
            this.logger.error("Error storing text reference:", error);
            throw new Error(`Failed to store text reference: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Retrieve a text reference by ID
     */
    getTextReference(refId) {
        const reference = this.store.references.find((ref) => ref.id === refId);
        if (reference) {
            reference.lastUsed = Date.now();
            return reference.content;
        }
        return null;
    }
    /**
     * Clean up old references
     */
    cleanupOldReferences() {
        const now = Date.now();
        this.store.references = this.store.references
            .filter((ref) => now - ref.lastUsed < this.store.maxAge)
            .sort((a, b) => b.lastUsed - a.lastUsed)
            .slice(0, this.store.maxSize);
    }
    /**
     * List available references
     */
    listTextReferences() {
        return this.store.references.map((ref) => ({
            id: ref.id,
            title: ref.title,
            createdAt: ref.createdAt,
        }));
    }
    /**
     * Process template text references by replacing reference placeholders with content
     */
    processTemplateReferences(template) {
        return template.replace(/{{ref:([^}]+)}}/g, (match, refId) => {
            const content = this.getTextReference(refId);
            return content || match; // Keep the reference placeholder if content not found
        });
    }
    /**
     * Get statistics about the reference store
     */
    getStats() {
        const references = this.store.references;
        if (references.length === 0) {
            return {
                totalReferences: 0,
                oldestReference: null,
                newestReference: null,
            };
        }
        const oldest = Math.min(...references.map((ref) => ref.createdAt));
        const newest = Math.max(...references.map((ref) => ref.createdAt));
        return {
            totalReferences: references.length,
            oldestReference: oldest,
            newestReference: newest,
        };
    }
    /**
     * Clear all references (useful for testing or memory management)
     */
    clearAllReferences() {
        this.store.references = [];
        this.logger.info("Cleared all text references");
    }
    /**
     * Set new limits for the reference store
     */
    setLimits(maxAge, maxSize) {
        this.store.maxAge = maxAge;
        this.store.maxSize = maxSize;
        // Clean up if current size exceeds new limit
        if (this.store.references.length > maxSize) {
            this.cleanupOldReferences();
        }
        this.logger.info(`Updated text reference limits: maxAge=${maxAge}ms, maxSize=${maxSize}`);
    }
}
/**
 * Create a text reference manager instance
 */
export function createTextReferenceManager(logger, maxAge = 24 * 60 * 60 * 1000, maxSize = 1000) {
    return new TextReferenceManager(logger, maxAge, maxSize);
}
//# sourceMappingURL=index.js.map