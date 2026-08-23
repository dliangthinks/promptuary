/**
 * Configuration Management Module
 * Handles loading and validation of server configuration from config.json
 */
import { Config } from "../types/index.js";
/**
 * Configuration manager class
 */
export declare class ConfigManager {
    private config;
    private configPath;
    constructor(configPath: string);
    /**
     * Load configuration from file
     */
    loadConfig(): Promise<Config>;
    /**
     * Get current configuration
     */
    getConfig(): Config;
    /**
     * Get viewer configuration
     */
    getViewerConfig(): import("../types.js").ViewerConfig | undefined;
    /**
     * Get server configuration
     */
    getServerConfig(): import("../types.js").ServerConfig;
    /**
     * Get prompts configuration
     */
    getPromptsConfig(): import("../types.js").PromptsConfig;
    /**
     * Get transports configuration
     */
    getTransportsConfig(): import("../types.js").TransportsConfig;
    /**
     * Get the port number, with environment variable override
     */
    getPort(): number;
    /**
     * Determine transport from command line arguments or configuration
     */
    getTransport(args: string[]): string;
    /**
     * Check if a transport is enabled
     */
    isTransportEnabled(transport: string): boolean;
    /**
     * Get prompts file path relative to config directory
     */
    getPromptsFilePath(): string;
    /**
     * Validate configuration and set defaults for missing properties
     */
    private validateAndSetDefaults;
}
/**
 * Create and initialize a configuration manager
 */
export declare function createConfigManager(configPath: string): Promise<ConfigManager>;
/**
 * Validate that the selected transport is enabled
 */
export declare function validateTransport(configManager: ConfigManager, transport: string): void;
