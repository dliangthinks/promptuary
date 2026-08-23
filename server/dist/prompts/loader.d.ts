/**
 * Prompt Loader Module
 * Handles loading prompts from category-specific configuration files and markdown templates
 */
import { Logger } from "../logging/index.js";
import { CategoryPromptsResult } from "../types/index.js";
/**
 * Prompt Loader class
 */
export declare class PromptLoader {
    private logger;
    constructor(logger: Logger);
    /**
     * Load prompts from category-specific prompts.json files
     */
    loadCategoryPrompts(configPath: string): Promise<CategoryPromptsResult>;
    /**
     * Load prompt content from markdown file
     */
    loadPromptFile(filePath: string, basePath: string): Promise<{
        systemMessage?: string;
        userMessageTemplate: string;
    }>;
}
