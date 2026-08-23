/**
 * Prompt Management MCP Tools
 * Contains update_prompt, delete_prompt, and reload_prompts tools
 */
import { ConfigManager } from "../config/index.js";
import { Logger } from "../logging/index.js";
import { ConvertedPrompt, PromptData } from "../types/index.js";
/**
 * Prompt Management Tools implementation
 */
export declare class PromptManagementTools {
    private logger;
    private mcpServer;
    private configManager;
    private promptsData;
    private convertedPrompts;
    private onRefresh;
    private onRestart;
    constructor(logger: Logger, mcpServer: any, configManager: ConfigManager, onRefresh: () => Promise<void>, onRestart: (reason: string) => Promise<void>);
    /**
     * Update internal data references
     */
    updateData(promptsData: PromptData[], convertedPrompts: ConvertedPrompt[]): void;
    /**
     * Ensure the prompt markdown contains a `## User Message Template` section.
     * The loader requires this section; without it the converter silently drops
     * the prompt. If missing, wrap the caller-provided content so it becomes the
     * template body, producing a valid prompt file.
     */
    private ensureUserMessageTemplate;
    /**
     * Register read_prompt tool — returns raw .md file content
     */
    registerReadPrompt(): void;
    /**
     * Register create_prompt tool
     */
    registerCreatePrompt(): void;
    /**
     * Implementation of create prompt logic
     */
    private createPromptImplementation;
    /**
     * Register update_prompt tool
     */
    registerUpdatePrompt(): void;
    /**
     * Implementation of update prompt logic
     */
    private updatePromptImplementation;
    /**
     * Create or update prompt file and category entry
     */
    private createOrUpdatePromptFile;
    /**
     * Register delete_prompt tool
     */
    registerDeletePrompt(): void;
    /**
     * Implementation of delete prompt logic
     */
    private deletePromptImplementation;
    /**
     * Register create_category tool
     */
    registerCreateCategory(): void;
    /**
     * Implementation of create category logic
     */
    private createCategoryImplementation;
    /**
     * Register delete_category tool
     */
    registerDeleteCategory(): void;
    /**
     * Implementation of delete category logic
     */
    private deleteCategoryImplementation;
    /**
     * Register rename_category tool
     */
    registerRenameCategory(): void;
    /**
     * Implementation of rename category logic
     */
    private renameCategoryImplementation;
    /**
     * Register move_prompt tool
     */
    registerMovePrompt(): void;
    /**
     * Implementation of move prompt logic
     */
    private movePromptImplementation;
    /**
     * Register reload_prompts tool
     */
    registerReloadPrompts(): void;
}
