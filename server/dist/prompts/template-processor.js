/**
 * Template Processor Module
 * Handles template processing with text references, validation, and placeholder extraction
 */
import { getAvailableTools } from "../utils/index.js";
import { processTemplate as originalProcessTemplate } from "../utils/jsonUtils.js";
/**
 * Template Processor class
 */
export class TemplateProcessor {
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Process template asynchronously with text reference support
     */
    async processTemplateAsync(template, args, specialContext = {}, toolsEnabled = false) {
        try {
            const enhancedSpecialContext = { ...specialContext };
            if (toolsEnabled) {
                enhancedSpecialContext["tools_available"] = getAvailableTools();
            }
            const processedTemplate = originalProcessTemplate(template, args, enhancedSpecialContext);
            return processedTemplate;
        }
        catch (error) {
            this.logger.error("Error processing template async:", error);
            throw error;
        }
    }
    /**
     * Process template synchronously (no text reference storage)
     */
    processTemplateSync(template, args, specialContext = {}, toolsEnabled = false) {
        try {
            // Add tools_available to specialContext if tools are enabled
            const enhancedSpecialContext = { ...specialContext };
            if (toolsEnabled) {
                enhancedSpecialContext["tools_available"] = getAvailableTools();
            }
            // Process the template with the arguments directly
            const processedTemplate = originalProcessTemplate(template, args, enhancedSpecialContext);
            return processedTemplate;
        }
        catch (error) {
            this.logger.error("Error processing template sync:", error);
            throw error;
        }
    }
    /**
     * Extract placeholders from a template
     */
    extractPlaceholders(template) {
        const placeholderRegex = /\{\{([^}]+)\}\}/g;
        const placeholders = [];
        let match;
        while ((match = placeholderRegex.exec(template)) !== null) {
            const placeholder = match[1].trim();
            if (!placeholders.includes(placeholder)) {
                placeholders.push(placeholder);
            }
        }
        return placeholders;
    }
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
    validateTemplate(template, argumentNames) {
        const errors = [];
        const warnings = [];
        if (!template || typeof template !== "string") {
            errors.push("Template must be a non-empty string");
            return {
                isValid: false,
                errors,
                warnings,
                orphanedPlaceholders: [],
                unusedArguments: argumentNames,
            };
        }
        const placeholders = this.extractPlaceholders(template);
        // Find placeholders that don't have corresponding arguments
        const orphanedPlaceholders = placeholders.filter((placeholder) => !argumentNames.includes(placeholder) &&
            !this.isSpecialPlaceholder(placeholder));
        // Find arguments that aren't used in the template
        const unusedArguments = argumentNames.filter((argName) => !placeholders.includes(argName));
        if (orphanedPlaceholders.length > 0) {
            warnings.push(`Template has placeholders without arguments: ${orphanedPlaceholders.join(", ")}`);
        }
        if (unusedArguments.length > 0) {
            warnings.push(`Arguments not used in template: ${unusedArguments.join(", ")}`);
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            orphanedPlaceholders,
            unusedArguments,
        };
    }
    /**
     * Check if a placeholder is a special system placeholder
     */
    isSpecialPlaceholder(placeholder) {
        const specialPlaceholders = [
            "previous_message",
            "tools_available",
            "current_step_number",
            "total_steps",
            "current_step_name",
            "step_number",
            "step_name",
        ];
        return specialPlaceholders.includes(placeholder);
    }
    /**
     * Process template with special context for conversation history
     */
    async processTemplateWithContext(template, args, contextProvider, toolsEnabled = false) {
        const specialContext = {
            previous_message: contextProvider(),
        };
        return this.processTemplateAsync(template, args, specialContext, toolsEnabled);
    }
    /**
     * Get template processing statistics
     */
    getTemplateStats(template) {
        const placeholders = this.extractPlaceholders(template);
        const specialPlaceholders = placeholders.filter((p) => this.isSpecialPlaceholder(p));
        const argumentPlaceholders = placeholders.filter((p) => !this.isSpecialPlaceholder(p));
        return {
            totalLength: template.length,
            placeholderCount: placeholders.length,
            uniquePlaceholders: placeholders,
            specialPlaceholders,
            argumentPlaceholders,
        };
    }
    /**
     * Preview template processing without actually storing text references
     */
    previewTemplate(template, args, specialContext = {}, toolsEnabled = false) {
        // Process template
        const enhancedSpecialContext = { ...specialContext };
        if (toolsEnabled) {
            enhancedSpecialContext["tools_available"] = getAvailableTools();
        }
        const processedTemplate = originalProcessTemplate(template, args, enhancedSpecialContext);
        const placeholdersUsed = this.extractPlaceholders(template);
        return {
            processedTemplate,
            longTextArguments: [],
            placeholdersUsed,
        };
    }
}
//# sourceMappingURL=template-processor.js.map