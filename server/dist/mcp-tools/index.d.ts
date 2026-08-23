/**
 * MCP Tools Module
 * Handles registration and implementation of MCP tools for the server
 */
import { ConfigManager } from "../config/index.js";
import { Logger } from "../logging/index.js";
import { PromptManager } from "../prompts/index.js";
import { Category, ConvertedPrompt, PromptData } from "../types/index.js";
/**
 * MCP Tools Manager class
 */
export declare class McpToolsManager {
    private logger;
    private mcpServer;
    private promptManager;
    private configManager;
    private promptManagementTools;
    private promptsData;
    private convertedPrompts;
    private categories;
    constructor(logger: Logger, mcpServer: any, promptManager: PromptManager, configManager: ConfigManager, onRefresh: () => Promise<void>, onRestart: (reason: string) => Promise<void>);
    /**
     * Register all MCP tools with the server
     */
    registerAllTools(): Promise<void>;
    /**
     * Update internal data references
     */
    updateData(promptsData: PromptData[], convertedPrompts: ConvertedPrompt[], categories: Category[]): void;
    /**
     * Register execute_prompt tool
     */
    private registerExecutePrompt;
    /**
     * Parse command arguments
     */
    private parseCommandArguments;
    /**
     * Parse simple text arguments for prompts with 2-3 parameters
     */
    private parseSimpleTextArguments;
    /**
     * Apply intelligent defaults when parsing fails or for complex prompts
     */
    private applyIntelligentDefaults;
    /**
     * Process regular (non-chain) prompt
     */
    private processRegularPrompt;
    /**
     * Generate template information response
     */
    private generateTemplateInfo;
    /**
     * Register listprompts tool
     */
    private registerListPrompts;
    /**
     * Generate formatted prompts list with optional text filtering
     */
    private generateIntelligentPromptsList;
    /**
     * Error handling helper
     */
    private handleError;
}
/**
 * Create and configure MCP tools manager
 */
export declare function createMcpToolsManager(logger: Logger, mcpServer: any, promptManager: PromptManager, configManager: ConfigManager, onRefresh: () => Promise<void>, onRestart: (reason: string) => Promise<void>): McpToolsManager;
