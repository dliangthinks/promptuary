/**
 * Comprehensive type definitions for the MCP Prompts Server
 * Consolidates all type definitions from across the application
 */
// Constants and Enums
export const MAX_HISTORY_SIZE = 100;
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (LogLevel = {}));
export var TransportType;
(function (TransportType) {
    TransportType["STDIO"] = "stdio";
    TransportType["SSE"] = "sse";
})(TransportType || (TransportType = {}));
//# sourceMappingURL=index.js.map