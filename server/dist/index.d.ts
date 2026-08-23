/**
 * Promptuary - Main Entry Point
 * Minimal entry point with comprehensive error handling
 */
/**
 * Health check and validation state
 */
interface ApplicationHealth {
    startup: boolean;
    modules: boolean;
    server: boolean;
    lastCheck: number;
}
/**
 * Graceful shutdown with validation
 */
declare function gracefulShutdown(exitCode?: number): Promise<void>;
/**
 * Export health check function for external monitoring
 */
export declare function getApplicationHealth(): ApplicationHealth;
/**
 * Export graceful shutdown for external management
 */
export { gracefulShutdown };
