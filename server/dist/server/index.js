/**
 * Server Management Module
 * Handles HTTP server lifecycle, process management, and orchestration
 */
import { createServer } from "http";
/**
 * Server Manager class
 */
export class ServerManager {
    constructor(logger, configManager, transportManager, apiManager) {
        this.logger = logger;
        this.configManager = configManager;
        this.transportManager = transportManager;
        this.apiManager = apiManager;
        this.port = configManager.getPort();
    }
    /**
     * Start the server based on transport type
     */
    async startServer() {
        try {
            this.logger.info(`Starting server with ${this.transportManager.getTransportType()} transport`);
            // Setup process event handlers
            this.setupProcessEventHandlers();
            if (this.transportManager.isStdio()) {
                await this.startStdioServer();
            }
            else if (this.transportManager.isSse()) {
                await this.startSseServer();
            }
            else {
                throw new Error(`Unsupported transport type: ${this.transportManager.getTransportType()}`);
            }
            this.logger.info("Server started successfully");
        }
        catch (error) {
            this.logger.error("Error starting server:", error);
            throw error;
        }
    }
    /**
     * Start server with STDIO transport
     */
    async startStdioServer() {
        // Start the viewer HTTP server first so it is available even if STDIO setup blocks
        const viewerConfig = this.configManager.getViewerConfig();
        if (!this.apiManager) {
            this.logger.warn("API Manager not available - viewer HTTP server will not be started");
        }
        else if (viewerConfig?.autoStart) {
            await this.startViewerServer();
        }
        else {
            this.logger.debug("Viewer auto-start disabled. HTTP viewer server will not be started.");
        }
        // Trigger STDIO transport setup without awaiting to prevent blocking the viewer startup
        void this.transportManager.setupStdioTransport();
    }
    /**
     * Start server with SSE transport
     */
    async startSseServer() {
        if (!this.apiManager) {
            throw new Error("API Manager is required for SSE transport");
        }
        // Create Express app
        const app = this.apiManager.createApp();
        // Setup SSE transport endpoints
        this.transportManager.setupSseTransport(app);
        // Create HTTP server
        this.httpServer = createServer(app);
        // Start listening
        await new Promise((resolve, reject) => {
            this.httpServer.listen(this.port, "127.0.0.1", () => {
                this.logger.info(`Promptuary running on http://localhost:${this.port}`);
                this.logger.info(`Connect to http://localhost:${this.port}/mcp for MCP connections`);
                resolve();
            });
            this.httpServer.once("error", (error) => {
                if (error.code === "EADDRINUSE") {
                    this.logger.error(`Port ${this.port} is already in use. Set a different port in config.json or use the PORT environment variable.`);
                }
                else {
                    this.logger.error("Server error:", error);
                }
                reject(error);
            });
        });
        // Attach runtime handlers only after a successful listen, so startup
        // errors reject the promise above instead of hard-exiting the process
        this.setupHttpServerEventHandlers();
    }
    /**
     * Start HTTP server for viewer while running STDIO transport
     */
    async startViewerServer() {
        if (!this.apiManager) {
            throw new Error("API Manager is required for viewer server");
        }
        if (this.httpServer) {
            this.logger.debug("Viewer server already running - skipping");
            return;
        }
        const app = this.apiManager.createApp();
        this.httpServer = createServer(app);
        // The viewer is optional in STDIO mode: never attach the exiting error
        // handler here, and treat every startup failure as non-fatal. A second
        // server instance (e.g. spawned for Cowork/Code sessions) must survive
        // the port already being held by the first one.
        await new Promise((resolve) => {
            this.httpServer.listen(this.port, "127.0.0.1", () => {
                this.logger.info(`Promptuary viewer available at http://localhost:${this.port}/viewer`);
                this.logger.info(`REST API available at http://localhost:${this.port}/prompts`);
                resolve();
            });
            this.httpServer.once("error", (error) => {
                if (error.code === "EADDRINUSE") {
                    this.logger.warn(`Port ${this.port} is already in use. Viewer HTTP server will not be started. STDIO transport will continue normally.`);
                }
                else {
                    this.logger.warn("Viewer HTTP server failed to start. STDIO transport will continue normally.", error);
                }
                this.httpServer = undefined;
                resolve();
            });
        });
        if (this.httpServer) {
            this.httpServer.on("close", () => {
                this.logger.info("HTTP server closed");
            });
        }
    }
    /**
     * Setup HTTP server event handlers
     */
    setupHttpServerEventHandlers() {
        if (!this.httpServer)
            return;
        this.httpServer.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                this.logger.error(`Port ${this.port} is already in use. Please choose a different port or stop the other service.`);
            }
            else {
                this.logger.error("Server error:", error);
            }
            process.exit(1);
        });
        this.httpServer.on("close", () => {
            this.logger.info("HTTP server closed");
        });
    }
    /**
     * Setup process event handlers
     */
    setupProcessEventHandlers() {
        // Handle graceful shutdown
        process.on("SIGINT", () => {
            this.logger.info("Received SIGINT, shutting down server...");
            this.shutdown();
        });
        process.on("SIGTERM", () => {
            this.logger.info("Received SIGTERM, shutting down server...");
            this.shutdown();
        });
        // Handle uncaught exceptions
        process.on("uncaughtException", (error) => {
            this.logger.error("Uncaught exception:", error);
            this.shutdown(1);
        });
        // Handle unhandled promise rejections
        process.on("unhandledRejection", (reason, promise) => {
            this.logger.error("Unhandled Rejection at:", promise, "reason:", reason);
            this.shutdown(1);
        });
        // Log system info for debugging
        this.logSystemInfo();
    }
    /**
     * Log system information
     */
    logSystemInfo() {
        this.logger.info(`Server process memory usage: ${JSON.stringify(process.memoryUsage())}`);
        this.logger.info(`Process ID: ${process.pid}`);
        this.logger.info(`Node version: ${process.version}`);
        this.logger.info(`Working directory: ${process.cwd()}`);
    }
    /**
     * Graceful shutdown
     */
    shutdown(exitCode = 0) {
        this.logger.info("Initiating graceful shutdown...");
        // Close HTTP server if running
        if (this.httpServer) {
            this.httpServer.close((error) => {
                if (error) {
                    this.logger.error("Error closing HTTP server:", error);
                }
                else {
                    this.logger.info("HTTP server closed successfully");
                }
                this.finalizeShutdown(exitCode);
            });
        }
        else {
            this.finalizeShutdown(exitCode);
        }
    }
    /**
     * Finalize shutdown process
     */
    finalizeShutdown(exitCode) {
        // Close transport connections
        if (this.transportManager.isSse()) {
            this.transportManager.closeAllConnections();
        }
        this.logger.info("Server shutdown complete");
        process.exit(exitCode);
    }
    /**
     * Restart the server
     */
    async restart(reason = "Manual restart") {
        this.logger.info(`Restarting server: ${reason}`);
        try {
            // Shutdown current server
            if (this.httpServer) {
                await new Promise((resolve) => {
                    this.httpServer.close(() => {
                        this.logger.info("Server closed for restart");
                        resolve();
                    });
                });
            }
            // Wait a moment before restarting
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Start server again
            await this.startServer();
            this.logger.info("Server restarted successfully");
        }
        catch (error) {
            this.logger.error("Error during server restart:", error);
            throw error;
        }
    }
    /**
     * Check if server is running
     */
    isRunning() {
        if (this.transportManager.isStdio()) {
            // For STDIO, we consider it running if the process is alive
            return true;
        }
        else {
            // For SSE, check if HTTP server is listening
            return this.httpServer?.listening || false;
        }
    }
    /**
     * Get server status information
     */
    getStatus() {
        return {
            running: this.isRunning(),
            transport: this.transportManager.getTransportType(),
            port: this.transportManager.isSse() ? this.port : undefined,
            connections: this.transportManager.isSse()
                ? this.transportManager.getActiveConnectionsCount()
                : undefined,
            uptime: process.uptime(),
        };
    }
    /**
     * Get the HTTP server instance (for SSE transport)
     */
    getHttpServer() {
        return this.httpServer;
    }
    /**
     * Get the port number
     */
    getPort() {
        return this.port;
    }
}
/**
 * Create and configure a server manager
 */
export function createServerManager(logger, configManager, transportManager, apiManager) {
    return new ServerManager(logger, configManager, transportManager, apiManager);
}
/**
 * Server startup helper function
 */
export async function startMcpServer(logger, configManager, transportManager, apiManager) {
    const serverManager = createServerManager(logger, configManager, transportManager, apiManager);
    await serverManager.startServer();
    return serverManager;
}
//# sourceMappingURL=index.js.map