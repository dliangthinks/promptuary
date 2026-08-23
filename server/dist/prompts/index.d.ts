/**
 * Prompt Management System
 * Main module that orchestrates prompt loading, conversion, and registration
 */
export * from "./converter.js";
export * from "./loader.js";
export * from "./registry.js";
export * from "./template-processor.js";
import { ConfigManager } from "../config/index.js";
import { Logger } from "../logging/index.js";
import { Category, CategoryPromptsResult, ConvertedPrompt, PromptData } from "../types/index.js";
import { PromptConverter } from "./converter.js";
import { PromptLoader } from "./loader.js";
import { PromptRegistry } from "./registry.js";
import { TemplateProcessor } from "./template-processor.js";
/**
 * Main Prompt Manager class that coordinates all prompt operations
 */
export declare class PromptManager {
    private logger;
    private configManager;
    private mcpServer;
    private converter;
    private loader;
    private registry?;
    private templateProcessor;
    constructor(logger: Logger, configManager: ConfigManager, mcpServer?: any);
    /**
     * Load prompts from category-specific configuration files
     */
    loadCategoryPrompts(configPath: string): Promise<CategoryPromptsResult>;
    /**
     * Convert markdown prompts to JSON structure
     */
    convertMarkdownPromptsToJson(promptsData: PromptData[], basePath?: string): Promise<ConvertedPrompt[]>;
    /**
     * Process template with text references and special context
     */
    processTemplateAsync(template: string, args: Record<string, string>, specialContext?: Record<string, string>, toolsEnabled?: boolean): Promise<string>;
    /**
     * Register prompts with MCP server
     */
    registerAllPrompts(prompts: ConvertedPrompt[]): Promise<number>;
    /**
     * Load and convert prompts in one operation
     */
    loadAndConvertPrompts(configPath: string, basePath?: string): Promise<{
        promptsData: PromptData[];
        categories: Category[];
        convertedPrompts: ConvertedPrompt[];
    }>;
    /**
     * Complete prompt system initialization
     */
    initializePromptSystem(configPath: string, basePath?: string): Promise<{
        promptsData: PromptData[];
        categories: Category[];
        convertedPrompts: ConvertedPrompt[];
        registeredCount: number;
    }>;
    /**
     * Reload prompts (useful for hot-reloading)
     */
    reloadPrompts(configPath: string, basePath?: string): Promise<{
        promptsData: PromptData[];
        categories: Category[];
        convertedPrompts: ConvertedPrompt[];
        registeredCount: number;
    }>;
    /**
     * Get all individual module instances for external access
     */
    getModules(): {
        converter: PromptConverter;
        loader: PromptLoader;
        registry: PromptRegistry | undefined;
        templateProcessor: TemplateProcessor;
    };
    /**
     * Get system statistics
     */
    getStats(prompts?: ConvertedPrompt[]): any;
}
