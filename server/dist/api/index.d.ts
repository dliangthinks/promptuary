/**
 * API Management Module
 * Handles Express app setup, middleware, and REST API endpoints
 */
import express from "express";
import { ConfigManager } from "../config/index.js";
import { Logger } from "../logging/index.js";
import { McpToolsManager } from "../mcp-tools/index.js";
import { PromptManager } from "../prompts/index.js";
import { Category, ConvertedPrompt, PromptData } from "../types/index.js";
/**
 * API Manager class
 */
export declare class ApiManager {
    private logger;
    private configManager;
    private promptManager?;
    private mcpToolsManager?;
    private promptsData;
    private categories;
    private convertedPrompts;
    constructor(logger: Logger, configManager: ConfigManager, promptManager?: PromptManager, mcpToolsManager?: McpToolsManager);
    /**
     * Update data references
     */
    updateData(promptsData: PromptData[], categories: Category[], convertedPrompts: ConvertedPrompt[]): void;
    /**
     * Create and configure Express application
     */
    createApp(): express.Application;
    /**
     * Setup Express middleware
     */
    private setupMiddleware;
    /**
     * Setup API routes
     */
    private setupRoutes;
    /**
     * Setup basic routes (home, health)
     */
    private setupBasicRoutes;
    /**
     * Setup prompt and category routes
     */
    private setupPromptRoutes;
    /**
     * Setup tool API routes
     */
    private setupToolRoutes;
    /**
     * Handle create category API endpoint
     */
    private handleCreateCategory;
    /**
     * Handle update prompt API endpoint
     */
    private handleUpdatePrompt;
    /**
     * Handle create prompt API endpoint
     */
    private handleCreatePrompt;
    /**
     * Handle delete prompt API endpoint
     */
    private handleDeletePrompt;
    /**
     * Handle delete category endpoint
     */
    private handleDeleteCategory;
    private handleUpdateCategory;
    /**
     * Handle modify prompt section API endpoint
     */
    private handleModifyPromptSection;
    /**
     * Handle reload prompts API endpoint
     */
    private handleReloadPrompts;
    /**
     * Helper method to reload prompt data
     */
    private reloadPromptData;
    /**
     * Find prompt metadata and corresponding markdown file path
     */
    private findPromptById;
    /**
     * Resolve absolute prompt file path for the provided prompt metadata
     */
    private getPromptFilePath;
    /**
     * Ensure prompts directory and JSON file for a category exist
     */
    private ensureCategoryPromptsFile;
    /**
     * Resolve path to the MCP App's bundled HTML file
     */
    private getAppHtmlPath;
    /**
     * Resolve absolute path to the static prompt viewer assets directory
     */
    private getViewerDirectory;
    /**
     * Get prompts file path using consistent resolution logic
     * This ensures all API operations use the same path resolution as the orchestration module
     */
    private getPromptsFilePath;
}
/**
 * Create and configure an API manager
 */
export declare function createApiManager(logger: Logger, configManager: ConfigManager, promptManager?: PromptManager, mcpToolsManager?: McpToolsManager): ApiManager;
