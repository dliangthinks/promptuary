/**
 * Promptuary - Main Entry Point
 * Minimal entry point with comprehensive error handling
 */
import { bootstrapPromptuaryHome } from "./bootstrap/home.js";
import { startApplication } from "./orchestration/index.js";
/**
 * Application state for health monitoring and rollback
 */
let applicationHealth = {
    startup: false,
    modules: false,
    server: false,
    lastCheck: Date.now(),
};
let orchestrator = null;
let logger = null;
let isShuttingDown = false;
/**
 * Setup comprehensive error handlers
 */
function setupErrorHandlers() {
    // Handle uncaught exceptions with rollback
    process.on("uncaughtException", async (error) => {
        console.error("Uncaught exception detected:", error);
        if (logger) {
            logger.error("Uncaught exception - initiating emergency shutdown:", error);
        }
        isShuttingDown = true;
        try {
            if (orchestrator) {
                await orchestrator.shutdown();
            }
        }
        catch (shutdownError) {
            console.error("Error during emergency shutdown:", shutdownError);
        }
        process.exit(1);
    });
    // Handle unhandled promise rejections with rollback
    process.on("unhandledRejection", async (reason, promise) => {
        console.error("Unhandled promise rejection at:", promise, "reason:", reason);
        if (logger) {
            logger.error("Unhandled promise rejection - initiating emergency shutdown:", { reason, promise });
        }
        isShuttingDown = true;
        try {
            if (orchestrator) {
                await orchestrator.shutdown();
            }
        }
        catch (shutdownError) {
            console.error("Error during emergency shutdown:", shutdownError);
        }
        process.exit(1);
    });
    // Handle SIGINT (Ctrl+C) gracefully
    process.on("SIGINT", async () => {
        if (logger) {
            logger.info("Received SIGINT (Ctrl+C), initiating graceful shutdown...");
        }
        else {
            console.error("Received SIGINT (Ctrl+C), initiating graceful shutdown...");
        }
        await gracefulShutdown(0);
    });
    // Handle SIGTERM gracefully
    process.on("SIGTERM", async () => {
        if (logger) {
            logger.info("Received SIGTERM, initiating graceful shutdown...");
        }
        else {
            console.error("Received SIGTERM, initiating graceful shutdown...");
        }
        await gracefulShutdown(0);
    });
}
/**
 * Graceful shutdown with validation
 */
async function gracefulShutdown(exitCode = 0) {
    if (isShuttingDown) {
        return; // Prevent multiple shutdown attempts
    }
    isShuttingDown = true;
    try {
        if (logger) {
            logger.info("Starting graceful shutdown sequence...");
        }
        // Validate current state before shutdown
        if (orchestrator) {
            const status = orchestrator.getStatus();
            if (logger) {
                logger.info("Application status before shutdown:", status);
            }
            // Perform graceful shutdown
            await orchestrator.shutdown();
            if (logger) {
                logger.info("Orchestrator shutdown completed successfully");
            }
        }
        // Final health state update
        applicationHealth = {
            startup: false,
            modules: false,
            server: false,
            lastCheck: Date.now(),
        };
        if (logger) {
            logger.info("Graceful shutdown completed successfully");
        }
        else {
            console.error("Graceful shutdown completed successfully");
        }
    }
    catch (error) {
        if (logger) {
            logger.error("Error during graceful shutdown:", error);
        }
        else {
            console.error("Error during graceful shutdown:", error);
        }
        exitCode = 1;
    }
    process.exit(exitCode);
}
/**
 * Display help information
 */
function showHelp() {
    console.log(`
Promptuary - MCP Prompt Server

USAGE:
  node dist/index.js [OPTIONS]

OPTIONS:
  --transport=TYPE     Transport type: stdio (default) or sse
  --quiet             Minimal output mode (production-friendly)
  --verbose           Detailed diagnostics and strategy information
  --debug-startup     Alias for --verbose with extra debugging
  --help              Show this help message

ENVIRONMENT VARIABLES:
  MCP_SERVER_ROOT              Override server root directory detection (recommended)
  MCP_PROMPTS_CONFIG_PATH      Direct path to prompts configuration file
  PROMPTUARY_HOME              Directory for the prompt library (seeded from the
                               bundled defaults on first run; survives updates)

OPTIMIZED STARTUP MODES:
  Production:    node dist/index.js --quiet --transport=stdio
  Development:   node dist/index.js --verbose --transport=sse
  Debugging:     node dist/index.js --debug-startup
  Silent:        node dist/index.js --quiet

EXAMPLES:
  # Standard usage
  node dist/index.js

  # Claude Desktop (recommended configuration)
  node dist/index.js --transport=stdio --quiet

  # Development with detailed logging
  node dist/index.js --verbose --transport=sse

  # With environment override (fastest startup)
  MCP_SERVER_ROOT=/path/to/server node dist/index.js --quiet

PERFORMANCE FEATURES:
  ✓ Optimized strategy ordering (fastest detection first)
  ✓ Early termination on first success
  ✓ Environment variable bypass for instant detection
  ✓ Conditional logging based on verbosity level
  ✓ Intelligent fallback with user guidance

TROUBLESHOOTING:
  Use --verbose to see detailed server root detection strategies
  Set MCP_SERVER_ROOT environment variable for instant path detection
  Use --quiet in production for clean startup logs

For more information, visit: https://github.com/dliangthinks/promptuary
`);
}
/**
 * Parse and validate command line arguments
 */
function parseCommandLineArgs() {
    const args = process.argv.slice(2);
    // Check for help flag
    if (args.includes("--help") || args.includes("-h")) {
        showHelp();
        return { shouldExit: true, exitCode: 0 };
    }
    // Validate transport argument
    const transportArg = args.find((arg) => arg.startsWith("--transport="));
    if (transportArg) {
        const transport = transportArg.split("=")[1];
        if (!["stdio", "sse"].includes(transport)) {
            console.error(`Error: Invalid transport '${transport}'. Supported: stdio, sse`);
            console.error("Use --help for usage information");
            return { shouldExit: true, exitCode: 1 };
        }
    }
    // Validate that conflicting flags aren't used together
    const isQuiet = args.includes("--quiet");
    const isVerbose = args.includes("--verbose") || args.includes("--debug-startup");
    if (isQuiet && isVerbose) {
        console.error("Error: Cannot use --quiet and --verbose flags together");
        console.error("Use --help for usage information");
        return { shouldExit: true, exitCode: 1 };
    }
    return { shouldExit: false, exitCode: 0 };
}
/**
 * Main application entry point with comprehensive error handling and validation
 */
async function main() {
    try {
        // Parse and validate command line arguments
        const { shouldExit, exitCode } = parseCommandLineArgs();
        if (shouldExit) {
            process.exit(exitCode);
        }
        // Setup error handlers first
        setupErrorHandlers();
        // Use stderr for startup message to avoid interfering with stdio transport
        console.error("Starting Promptuary...");
        // Route prompt loading to PROMPTUARY_HOME (seeding it on first run)
        // before anything resolves prompt paths
        bootstrapPromptuaryHome();
        // Initialize the application using the orchestrator
        orchestrator = await startApplication();
        // Get logger reference for global error handling
        const modules = orchestrator.getModules();
        logger = modules.logger;
        // Log successful startup with details
        if (logger) {
            logger.info("🚀 Promptuary started successfully");
            // Log comprehensive application status
            const status = orchestrator.getStatus();
            logger.info("📊 Application status:", {
                running: status.running,
                transport: status.transport,
                promptsLoaded: status.promptsLoaded,
                categoriesLoaded: status.categoriesLoaded,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                pid: process.pid,
                nodeVersion: process.version,
            });
            // Log successful complete initialization
            logger.info("✅ Application initialization completed - all systems operational");
        }
    }
    catch (error) {
        // Comprehensive error handling with cleanup
        console.error("❌ Failed to start Promptuary:", error);
        if (logger) {
            logger.error("Fatal startup error:", error);
        }
        // Attempt cleanup
        if (orchestrator) {
            try {
                await orchestrator.shutdown();
            }
            catch { }
            orchestrator = null;
        }
        // Exit with error code
        process.exit(1);
    }
}
/**
 * Export health check function for external monitoring
 */
export function getApplicationHealth() {
    return { ...applicationHealth };
}
/**
 * Export graceful shutdown for external management
 */
export { gracefulShutdown };
// Start the application with comprehensive error handling
main().catch(async (error) => {
    console.error("💥 Fatal error during startup:", error);
    // Final fallback - attempt cleanup and exit
    if (orchestrator) {
        try {
            await orchestrator.shutdown();
        }
        catch { }
        orchestrator = null;
    }
    process.exit(1);
});
//# sourceMappingURL=index.js.map