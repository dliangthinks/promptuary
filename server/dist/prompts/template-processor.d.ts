/**
 * Template Processor Module
 * Handles template processing with text references, validation, and placeholder extraction
 */
import { Logger } from "../logging/index.js";
/**
 * Template Processor class
 */
export declare class TemplateProcessor {
    private logger;
    constructor(logger: Logger);
    /**
     * Process template asynchronously with text reference support
     */
    processTemplateAsync(template: string, args: Record<string, string>, specialContext?: Record<string, string>, toolsEnabled?: boolean): Promise<string>;
    /**
     * Process template synchronously (no text reference storage)
     */
    processTemplateSync(template: string, args: Record<string, string>, specialContext?: Record<string, string>, toolsEnabled?: boolean): string;
    /**
     * Extract placeholders from a template
     */
    extractPlaceholders(template: string): string[];
    /**
     * Validate template against provided arguments
     *
     * @remarks
     * Current validation relies on regex-based placeholder extraction (`extractPlaceholders`).
     * This means it will accurately identify orphaned/unused arguments for simple `{{placeholder}}` syntax.
     * However, it will NOT detect variables used only within Nunjucks tags (e.g., `{% if my_var %}`)
     * or arguments used only within Nunjucks logic blocks. True Nunjucks AST-based validation
     * would be needed for comprehensive analysis and is a potential future enhancement (Phase 4+).
     */
    validateTemplate(template: string, argumentNames: string[]): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
        orphanedPlaceholders: string[];
        unusedArguments: string[];
    };
    /**
     * Check if a placeholder is a special system placeholder
     */
    private isSpecialPlaceholder;
    /**
     * Process template with special context for conversation history
     */
    processTemplateWithContext(template: string, args: Record<string, string>, contextProvider: () => string, toolsEnabled?: boolean): Promise<string>;
    /**
     * Get template processing statistics
     */
    getTemplateStats(template: string): {
        totalLength: number;
        placeholderCount: number;
        uniquePlaceholders: string[];
        specialPlaceholders: string[];
        argumentPlaceholders: string[];
    };
    /**
     * Preview template processing without actually storing text references
     */
    previewTemplate(template: string, args: Record<string, string>, specialContext?: Record<string, string>, toolsEnabled?: boolean): {
        processedTemplate: string;
        longTextArguments: string[];
        placeholdersUsed: string[];
    };
}
