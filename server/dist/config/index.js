/**
 * Configuration Management Module
 * Handles loading and validation of server configuration from config.json
 */
import { readFile } from "fs/promises";
import path from "path";
/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
    server: {
        name: "Promptuary",
        version: "1.0.0",
        port: 9090,
    },
    prompts: {
        file: "promptsConfig.json",
    },
    transports: {
        default: "sse",
        sse: { enabled: true },
        stdio: { enabled: true },
    },
    viewer: {
        autoStart: false,
    },
};
/**
 * Configuration manager class
 */
export class ConfigManager {
    constructor(configPath) {
        this.configPath = configPath;
        this.config = DEFAULT_CONFIG;
    }
    /**
     * Load configuration from file
     */
    async loadConfig() {
        try {
            const configContent = await readFile(this.configPath, "utf8");
            this.config = JSON.parse(configContent);
            // Validate and set defaults for any missing properties
            this.validateAndSetDefaults();
            return this.config;
        }
        catch (error) {
            console.error(`Error loading configuration from ${this.configPath}:`, error);
            console.info("Using default configuration");
            this.config = DEFAULT_CONFIG;
            return this.config;
        }
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Get viewer configuration
     */
    getViewerConfig() {
        return this.config.viewer ?? DEFAULT_CONFIG.viewer;
    }
    /**
     * Get server configuration
     */
    getServerConfig() {
        return this.config.server;
    }
    /**
     * Get prompts configuration
     */
    getPromptsConfig() {
        return this.config.prompts;
    }
    /**
     * Get transports configuration
     */
    getTransportsConfig() {
        return this.config.transports;
    }
    /**
     * Get the port number, with environment variable override
     */
    getPort() {
        return process.env.PORT
            ? parseInt(process.env.PORT, 10)
            : this.config.server.port;
    }
    /**
     * Determine transport from command line arguments or configuration
     */
    getTransport(args) {
        const transportArg = args.find((arg) => arg.startsWith("--transport="));
        return transportArg
            ? transportArg.split("=")[1]
            : this.config.transports.default;
    }
    /**
     * Check if a transport is enabled
     */
    isTransportEnabled(transport) {
        const transportConfig = this.config.transports[transport];
        if (transportConfig &&
            typeof transportConfig === "object" &&
            "enabled" in transportConfig) {
            const config = transportConfig;
            return config.enabled === true;
        }
        return false;
    }
    /**
     * Get prompts file path relative to config directory
     */
    getPromptsFilePath() {
        const configDir = path.dirname(this.configPath);
        return path.join(configDir, this.config.prompts.file);
    }
    /**
     * Validate configuration and set defaults for missing properties
     */
    validateAndSetDefaults() {
        // Ensure server config exists
        if (!this.config.server) {
            this.config.server = DEFAULT_CONFIG.server;
        }
        else {
            this.config.server = {
                ...DEFAULT_CONFIG.server,
                ...this.config.server,
            };
        }
        // Ensure prompts config exists
        if (!this.config.prompts) {
            this.config.prompts = DEFAULT_CONFIG.prompts;
        }
        else {
            this.config.prompts = {
                ...DEFAULT_CONFIG.prompts,
                ...this.config.prompts,
            };
        }
        // Ensure transports config exists
        if (!this.config.transports) {
            this.config.transports = DEFAULT_CONFIG.transports;
        }
        else {
            this.config.transports = {
                ...DEFAULT_CONFIG.transports,
                ...this.config.transports,
            };
        }
        // Ensure viewer config exists
        if (!this.config.viewer) {
            this.config.viewer = DEFAULT_CONFIG.viewer;
        }
        else {
            this.config.viewer = {
                ...DEFAULT_CONFIG.viewer,
                ...this.config.viewer,
            };
        }
    }
}
/**
 * Create and initialize a configuration manager
 */
export async function createConfigManager(configPath) {
    const configManager = new ConfigManager(configPath);
    await configManager.loadConfig();
    return configManager;
}
/**
 * Validate that the selected transport is enabled
 */
export function validateTransport(configManager, transport) {
    if (!configManager.isTransportEnabled(transport)) {
        throw new Error(`Transport '${transport}' is not enabled in the configuration`);
    }
}
//# sourceMappingURL=index.js.map