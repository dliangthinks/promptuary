/**
 * Comprehensive type definitions for the MCP Prompts Server
 * Consolidates all type definitions from across the application
 */
import type { PromptData } from "../types.js";
/**
 * Definition of an argument for a prompt
 */
export interface PromptArgument {
    /** Name of the argument */
    name: string;
    /** Optional description of the argument */
    description?: string;
    /** Whether this argument is required */
    required: boolean;
}
/**
 * A category for organizing prompts
 */
export interface Category {
    /** Unique identifier for the category */
    id: string;
    /** Display name for the category */
    name: string;
    /** Description of the category */
    description: string;
}
export type { Config, Message, MessageContent, MessageRole, PromptData, // Ensure PromptData from ../types.js is re-exported
PromptFile, PromptsConfig, PromptsConfigFile, PromptsFile, RegistrationMode, ServerConfig, TextMessageContent, TransportConfig, TransportsConfig, } from "../types.js";
export interface ConversationHistoryItem {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
    isProcessedTemplate?: boolean;
}
export interface ConvertedPrompt {
    id: string;
    name: string;
    description: string;
    category: string;
    systemMessage?: string;
    userMessageTemplate: string;
    arguments: Array<{
        name: string;
        description?: string;
        required: boolean;
    }>;
    tools?: boolean;
    /** Defines behavior when prompt is invoked without its defined arguments */
    onEmptyInvocation?: "execute_if_possible" | "return_template";
}
export interface PromptFileContent {
    systemMessage?: string;
    userMessageTemplate: string;
}
export interface CategoryPromptsResult {
    promptsData: PromptData[];
    categories: Category[];
}
export interface ApiResponse {
    success: boolean;
    message: string;
    data?: any;
}
export interface ToolResponse {
    content: Array<{
        type: "text";
        text: string;
    }>;
    isError?: boolean;
}
export interface ServerRefreshOptions {
    restart?: boolean;
    reason?: string;
}
export interface ServerState {
    isStarted: boolean;
    transport: string;
    port?: number;
    startTime: number;
}
export interface FileOperation {
    (): Promise<boolean>;
}
export interface ModificationResult {
    success: boolean;
    message: string;
}
export interface TemplateContext {
    specialContext?: Record<string, string>;
    toolsEnabled?: boolean;
}
export interface ValidationResult {
    valid: boolean;
    errors?: string[];
    sanitizedArgs?: Record<string, any>;
}
export interface ExpressRequest {
    body: any;
    params: Record<string, string>;
    headers: Record<string, string>;
    ip: string;
    method: string;
    url: string;
}
export interface ExpressResponse {
    json: (data: any) => void;
    status: (code: number) => ExpressResponse;
    send: (data: any) => void;
    setHeader: (name: string, value: string) => void;
    end: () => void;
    sendStatus: (code: number) => void;
    on: (event: string, callback: () => void) => void;
}
export declare const MAX_HISTORY_SIZE = 100;
export declare enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}
export declare enum TransportType {
    STDIO = "stdio",
    SSE = "sse"
}
