/**
 * Logging Module
 * Handles file logging and transport-aware console logging
 */
import { appendFile, writeFile } from "fs/promises";
import { LogLevel, TransportType } from "../types/index.js";
/**
 * Enhanced logger implementation with file and console logging
 */
export class EnhancedLogger {
    constructor(config) {
        this.logFile = config.logFile;
        this.transport = config.transport;
        this.enableDebug = config.enableDebug || false;
    }
    /**
     * Initialize the log file with a clean start
     */
    async initLogFile() {
        try {
            const timestamp = new Date().toISOString();
            await writeFile(this.logFile, `--- MCP Server Log Started at ${timestamp} ---\n`, "utf8");
        }
        catch (error) {
            console.error(`Error initializing log file:`, error);
        }
    }
    /**
     * Write a message to the log file
     */
    async logToFile(level, message, ...args) {
        try {
            let logMessage = `[${new Date().toISOString()}] [${level}] ${message}`;
            if (args.length > 0) {
                logMessage += ` ${args
                    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
                    .join(" ")}`;
            }
            await appendFile(this.logFile, logMessage + "\n", "utf8");
        }
        catch (error) {
            console.error("Error writing to log file:", error);
        }
    }
    /**
     * Log to console only when not using STDIO transport
     */
    logToConsole(level, message, ...args) {
        if (this.transport !== TransportType.STDIO) {
            switch (level) {
                case LogLevel.INFO:
                    console.log(`[INFO] ${message}`, ...args);
                    break;
                case LogLevel.ERROR:
                    console.error(`[ERROR] ${message}`, ...args);
                    break;
                case LogLevel.WARN:
                    console.warn(`[WARN] ${message}`, ...args);
                    break;
                case LogLevel.DEBUG:
                    if (this.enableDebug) {
                        console.log(`[DEBUG] ${message}`, ...args);
                    }
                    break;
            }
        }
    }
    /**
     * Info level logging
     */
    info(message, ...args) {
        this.logToConsole(LogLevel.INFO, message, ...args);
        this.logToFile(LogLevel.INFO, message, ...args);
    }
    /**
     * Error level logging
     */
    error(message, ...args) {
        this.logToConsole(LogLevel.ERROR, message, ...args);
        this.logToFile(LogLevel.ERROR, message, ...args);
    }
    /**
     * Warning level logging
     */
    warn(message, ...args) {
        this.logToConsole(LogLevel.WARN, message, ...args);
        this.logToFile(LogLevel.WARN, message, ...args);
    }
    /**
     * Debug level logging
     */
    debug(message, ...args) {
        this.logToConsole(LogLevel.DEBUG, message, ...args);
        this.logToFile(LogLevel.DEBUG, message, ...args);
    }
    /**
     * Update transport type (useful when transport is determined after logger creation)
     */
    setTransport(transport) {
        this.transport = transport;
    }
    /**
     * Enable or disable debug logging
     */
    setDebugEnabled(enabled) {
        this.enableDebug = enabled;
    }
    /**
     * Log startup information
     */
    logStartupInfo(transport, config) {
        this.info(`Server starting up - Process ID: ${process.pid}`);
        this.info(`Node version: ${process.version}`);
        this.info(`Working directory: ${process.cwd()}`);
        this.info(`Using transport: ${transport}`);
        this.info(`Command-line arguments: ${JSON.stringify(process.argv)}`);
        this.debug("Configuration:", JSON.stringify(config, null, 2));
    }
    /**
     * Log memory usage information
     */
    logMemoryUsage() {
        this.info(`Server process memory usage: ${JSON.stringify(process.memoryUsage())}`);
    }
}
/**
 * Create a logger instance
 */
export function createLogger(config) {
    return new EnhancedLogger(config);
}
/**
 * Create a simple logger for areas that don't need the full enhanced logger
 * Now supports verbosity control via command-line flags
 */
export function createSimpleLogger(transport = "sse") {
    const enableConsole = transport !== TransportType.STDIO;
    // Check command-line flags for verbosity control
    const args = process.argv.slice(2);
    const isVerbose = args.includes("--verbose") || args.includes("--debug-startup");
    const isQuiet = args.includes("--quiet");
    return {
        info: (message, ...args) => {
            if (enableConsole && !isQuiet) {
                console.log(`[INFO] ${message}`, ...args);
            }
        },
        error: (message, ...args) => {
            if (enableConsole && !isQuiet) {
                console.error(`[ERROR] ${message}`, ...args);
            }
        },
        warn: (message, ...args) => {
            if (enableConsole && !isQuiet) {
                console.warn(`[WARN] ${message}`, ...args);
            }
        },
        debug: (message, ...args) => {
            if (enableConsole && isVerbose) {
                console.log(`[DEBUG] ${message}`, ...args);
            }
        },
    };
}
/**
 * Setup console redirection for STDIO transport
 * This prevents log messages from interfering with JSON MCP messages
 */
export function setupConsoleRedirection(logger) {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    console.log = (...args) => {
        logger.debug("CONSOLE: " + args.join(" "));
    };
    console.error = (...args) => {
        logger.error("CONSOLE_ERROR: " + args.join(" "));
    };
}
/**
 * Setup process event handlers for logging
 */
export function setupProcessEventHandlers(logger) {
    // Handle graceful shutdown
    process.on("SIGINT", () => {
        logger.info("Shutting down server...");
        process.exit(0);
    });
    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
        logger.error("Uncaught exception:", error);
    });
    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
        logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    });
    // Log when the stdin closes (which happens when the parent process terminates)
    process.stdin.on("end", () => {
        logger.info("STDIN stream ended - parent process may have terminated");
        process.exit(0);
    });
}
//# sourceMappingURL=index.js.map