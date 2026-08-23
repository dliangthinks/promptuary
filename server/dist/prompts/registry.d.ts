/**
 * Prompt Registry Module
 * Handles registering prompts with MCP server and managing conversation history
 */
import { ConfigManager } from "../config/index.js";
import { Logger } from "../logging/index.js";
import { ConversationHistoryItem, ConvertedPrompt, RegistrationMode } from "../types/index.js";
import { TemplateProcessor } from "./template-processor.js";
/**
 * Prompt Registry class
 */
export declare class PromptRegistry {
    private logger;
    private mcpServer;
    private configManager;
    private templateProcessor;
    private conversationHistory;
    private readonly MAX_HISTORY_SIZE;
    private registeredPromptHandles;
    constructor(logger: Logger, mcpServer: any, configManager: ConfigManager, templateProcessor: TemplateProcessor);
    /**
     * Register all prompts with the MCP server
     */
    registerAllPrompts(prompts: ConvertedPrompt[]): Promise<number>;
    /**
     * Register a single prompt with the MCP server
     */
    registerSinglePrompt(promptData: ConvertedPrompt, registrationMode?: RegistrationMode | "both"): Promise<boolean>;
    /**
     * Unregister all prompts if possible
     */
    unregisterAllPrompts(): Promise<void>;
    /**
     * Helper function to determine if provided arguments are effectively empty
     * for the given prompt definition.
     */
    private areArgumentsEffectivelyEmpty;
    /**
     * Create prompt handler function
     */
    private createPromptHandler;
    /**
     * Create argument schema for a prompt
     */
    private createArgsSchema;
    /**
     * Add item to conversation history with size management
     */
    addToConversationHistory(item: ConversationHistoryItem): void;
    /**
     * Get the previous message from conversation history
     */
    getPreviousMessage(): string;
    /**
     * Get conversation history
     */
    getConversationHistory(): ConversationHistoryItem[];
    /**
     * Clear conversation history
     */
    clearConversationHistory(): void;
    /**
     * Get conversation history statistics
     */
    getConversationStats(): {
        totalMessages: number;
        userMessages: number;
        assistantMessages: number;
        processedTemplates: number;
        oldestMessage?: number;
        newestMessage?: number;
    };
    /**
     * Execute a prompt directly (for testing or internal use)
     */
    executePromptDirectly(promptId: string, args: Record<string, string>, prompts: ConvertedPrompt[]): Promise<string>;
    /**
     * Get registration statistics
     */
    getRegistrationStats(prompts: ConvertedPrompt[]): {
        totalPrompts: number;
        chainPrompts: number;
        regularPrompts: number;
        toolEnabledPrompts: number;
        categoriesCount: number;
        averageArgumentsPerPrompt: number;
    };
}
