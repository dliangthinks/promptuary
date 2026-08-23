/**
 * Prompt Converter Module
 * Handles converting markdown prompts to JSON structure with validation
 */
import { Logger } from "../logging/index.js";
import { ConvertedPrompt, PromptData } from "../types/index.js";
import { PromptLoader } from "./loader.js";
/**
 * Prompt Converter class
 */
export declare class PromptConverter {
    private logger;
    private loader;
    constructor(logger: Logger, loader?: PromptLoader);
    /**
     * Convert markdown prompts to JSON structure in memory
     */
    convertMarkdownPromptsToJson(promptsData: PromptData[], basePath?: string): Promise<ConvertedPrompt[]>;
    /**
     * Validate a converted prompt
     */
    validateConvertedPrompt(prompt: ConvertedPrompt): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * Extract placeholders from a template string
     */
    private extractPlaceholders;
    /**
     * Check if a placeholder is a special system placeholder
     */
    private isSpecialPlaceholder;
    /**
     * Get conversion statistics
     */
    getConversionStats(originalCount: number, convertedPrompts: ConvertedPrompt[]): {
        totalOriginal: number;
        totalConverted: number;
        successRate: number;
        chainPrompts: number;
        regularPrompts: number;
        totalArguments: number;
    };
}
