/**
 * Prompt Converter Module
 * Handles converting markdown prompts to JSON structure with validation
 */
import path from "path";
import { PromptLoader } from "./loader.js";
/**
 * Prompt Converter class
 */
export class PromptConverter {
    constructor(logger, loader) {
        this.logger = logger;
        this.loader = loader || new PromptLoader(logger);
    }
    /**
     * Convert markdown prompts to JSON structure in memory
     */
    async convertMarkdownPromptsToJson(promptsData, basePath) {
        const convertedPrompts = [];
        this.logger.info(`Converting ${promptsData.length} markdown prompts to JSON structure...`);
        for (const promptData of promptsData) {
            try {
                // Determine base path for loading files
                const fileBasePath = basePath || path.join(process.cwd(), "..");
                // Load the prompt file content using the loader
                const promptFile = await this.loader.loadPromptFile(promptData.file, fileBasePath);
                // Create converted prompt structure
                const convertedPrompt = {
                    id: promptData.id,
                    name: promptData.name,
                    description: promptData.description,
                    category: promptData.category,
                    systemMessage: promptFile.systemMessage,
                    userMessageTemplate: promptFile.userMessageTemplate,
                    arguments: promptData.arguments.map((arg) => ({
                        name: arg.name,
                        description: arg.description,
                        required: arg.required,
                    })),
                    tools: promptData.tools || false,
                    onEmptyInvocation: promptData.onEmptyInvocation || "execute_if_possible",
                };
                // Validate the onEmptyInvocation field
                if (promptData.onEmptyInvocation &&
                    promptData.onEmptyInvocation !== "return_template" &&
                    promptData.onEmptyInvocation !== "execute_if_possible") {
                    this.logger.warn(`Prompt '${promptData.id}' has an invalid 'onEmptyInvocation' value: "${promptData.onEmptyInvocation}". ` +
                        `Defaulting to "execute_if_possible". Allowed values are "return_template" or "execute_if_possible".`);
                    convertedPrompt.onEmptyInvocation = "execute_if_possible";
                }
                // Validate the converted prompt
                const validation = this.validateConvertedPrompt(convertedPrompt);
                if (!validation.isValid) {
                    this.logger.warn(`Prompt ${promptData.id} has validation issues: ${validation.errors.join(", ")}`);
                    // Continue processing even with warnings
                }
                convertedPrompts.push(convertedPrompt);
            }
            catch (error) {
                this.logger.error(`Error converting prompt ${promptData.id}:`, error);
                // Continue with other prompts even if one fails
            }
        }
        this.logger.info(`Successfully converted ${convertedPrompts.length} prompts`);
        return convertedPrompts;
    }
    /**
     * Validate a converted prompt
     */
    validateConvertedPrompt(prompt) {
        const errors = [];
        const warnings = [];
        // Check required fields
        if (!prompt.id) {
            errors.push("Missing required field: id");
        }
        if (!prompt.name) {
            errors.push("Missing required field: name");
        }
        if (!prompt.category) {
            errors.push("Missing required field: category");
        }
        if (!prompt.userMessageTemplate) {
            errors.push("Missing required field: userMessageTemplate");
        }
        // Validate arguments
        if (prompt.arguments) {
            prompt.arguments.forEach((arg, index) => {
                if (!arg.name) {
                    errors.push(`Argument ${index + 1} missing name`);
                }
                if (typeof arg.required !== "boolean") {
                    warnings.push(`Argument ${arg.name || index + 1} has invalid required value`);
                }
            });
        }
        // Check for placeholder validation in template
        if (prompt.userMessageTemplate) {
            const placeholders = this.extractPlaceholders(prompt.userMessageTemplate);
            const argumentNames = prompt.arguments.map((arg) => arg.name);
            // Find placeholders that don't have corresponding arguments
            const orphanedPlaceholders = placeholders.filter((placeholder) => !argumentNames.includes(placeholder) &&
                !this.isSpecialPlaceholder(placeholder));
            if (orphanedPlaceholders.length > 0) {
                warnings.push(`Template has placeholders without arguments: ${orphanedPlaceholders.join(", ")}`);
            }
            // Find arguments that aren't used in the template
            const unusedArguments = argumentNames.filter((argName) => !placeholders.includes(argName));
            if (unusedArguments.length > 0) {
                warnings.push(`Arguments not used in template: ${unusedArguments.join(", ")}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Extract placeholders from a template string
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
        return (specialPlaceholders.includes(placeholder) ||
            placeholder.startsWith("ref:"));
    }
    /**
     * Get conversion statistics
     */
    getConversionStats(originalCount, convertedPrompts) {
        const chainPrompts = 0;
        const regularPrompts = convertedPrompts.length;
        const totalArguments = convertedPrompts.reduce((sum, p) => sum + p.arguments.length, 0);
        return {
            totalOriginal: originalCount,
            totalConverted: convertedPrompts.length,
            successRate: originalCount > 0 ? convertedPrompts.length / originalCount : 0,
            chainPrompts,
            regularPrompts,
            totalArguments,
        };
    }
}
//# sourceMappingURL=converter.js.map