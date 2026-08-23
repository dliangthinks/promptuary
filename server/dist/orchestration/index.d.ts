/**
 * Application Orchestration Module
 * Coordinates all modules and provides clean startup sequence
 */
import { ApiManager } from "../api/index.js";
import { ConfigManager } from "../config/index.js";
import { Logger } from "../logging/index.js";
import { McpToolsManager } from "../mcp-tools/index.js";
import { PromptManager } from "../prompts/index.js";
import { ServerManager } from "../server/index.js";
/**
 * Application Orchestrator class
 * Coordinates all modules and manages application lifecycle
 */
export declare class ApplicationOrchestrator {
    private logger;
    private configManager;
    private promptManager;
    private mcpToolsManager;
    private transportManager;
    private apiManager?;
    private serverManager?;
    private mcpServer;
    private promptsData;
    private categories;
    private convertedPrompts;
    constructor();
    /**
     * Initialize all modules in the correct order
     */
    startup(): Promise<void>;
    /**
     * Determine the server root directory using multiple strategies
     * This is more robust for different execution contexts (direct execution vs Claude Desktop)
     */
    private determineServerRoot;
    /**
     * Phase 1: Initialize foundation (configuration, logging, basic services)
     */
    private initializeFoundation;
    /**
     * Phase 2: Load and process prompt data
     */
    private loadAndProcessData;
    /**
     * Phase 3: Initialize remaining modules with loaded data
     */
    private initializeModules;
    /**
     * Phase 4: Setup and start the server
     */
    private startServer;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
    /**
     * Perform a full server refresh (hot-reload).
     * This reloads all prompts from disk and updates all relevant modules.
     */
    fullServerRefresh(): Promise<void>;
    /**
     * Restart the application by shutting down and exiting with a restart code.
     * Relies on a process manager (e.g., PM2) to restart the process.
     */
    restartServer(reason?: string): Promise<void>;
    /**
     * Get application status
     */
    getStatus(): {
        running: boolean;
        transport?: string;
        promptsLoaded: number;
        categoriesLoaded: number;
        serverStatus?: any;
    };
    /**
     * Get all module instances (for debugging/testing)
     */
    getModules(): {
        logger: Logger;
        configManager: ConfigManager;
        promptManager: PromptManager;
        mcpToolsManager: McpToolsManager;
        apiManager: ApiManager | undefined;
        serverManager: ServerManager | undefined;
    };
}
/**
 * Create and configure an application orchestrator
 */
export declare function createApplicationOrchestrator(): ApplicationOrchestrator;
/**
 * Main application entry point
 */
export declare function startApplication(): Promise<ApplicationOrchestrator>;
