/**
 * Comprehensive type definitions for the MCP Prompts Server
 * Consolidates all type definitions from across the application
 */

// Import PromptData specifically for use within this module
import type { PromptData } from "../types.js";

// ===== Core Types =====

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

// Import and re-export other types from the existing types.ts
export type {
  Config,
  Message,
  MessageContent,
  MessageRole,
  PromptData, // Ensure PromptData from ../types.js is re-exported
  PromptFile,
  PromptsConfig,
  PromptsConfigFile,
  PromptsFile,
  RegistrationMode,
  ServerConfig,
  TextMessageContent,
  TransportConfig,
  TransportsConfig,
} from "../types.js";

// ===== Additional Types from index.ts =====

// Conversation History Types
export interface ConversationHistoryItem {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isProcessedTemplate?: boolean; // Flag to indicate if this is a processed template rather than original user input
}

// ConvertedPrompt interface (enhanced from existing usage in codebase)
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
  tools?: boolean; // Whether this prompt should use available tools
  /** Defines behavior when prompt is invoked without its defined arguments */
  onEmptyInvocation?: "execute_if_possible" | "return_template";
}

// Prompt Loading Types
export interface PromptFileContent {
  systemMessage?: string;
  userMessageTemplate: string;
}

export interface CategoryPromptsResult {
  promptsData: PromptData[]; // Use the directly imported PromptData
  categories: Category[];
}

// API Response Types
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

// Server Management Types
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

// File Operation Types
export interface FileOperation {
  (): Promise<boolean>;
}

export interface ModificationResult {
  success: boolean;
  message: string;
}

// Template Processing Types
export interface TemplateContext {
  specialContext?: Record<string, string>;
  toolsEnabled?: boolean;
}

// Validation Types
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  sanitizedArgs?: Record<string, any>;
}

// Express and Transport Types
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

// Constants and Enums
export const MAX_HISTORY_SIZE = 100;

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export enum TransportType {
  STDIO = "stdio",
  SSE = "sse",
}

