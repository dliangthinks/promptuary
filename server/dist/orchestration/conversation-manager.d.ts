/**
 * Conversation Management Module
 * Handles conversation history tracking and context management
 */
import { Logger } from "../logging/index.js";
/**
 * Conversation history item interface
 */
export interface ConversationHistoryItem {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
    isProcessedTemplate?: boolean;
}
/**
 * Conversation Manager class
 */
export declare class ConversationManager {
    private logger;
    private conversationHistory;
    private maxHistorySize;
    constructor(logger: Logger, maxHistorySize?: number);
    /**
     * Add an item to conversation history with size management
     */
    addToConversationHistory(item: ConversationHistoryItem): void;
    /**
     * Get the previous message from conversation history
     */
    getPreviousMessage(): string;
    /**
     * Get conversation history
     */
    getConversationHistory(): ConversationHistoryItem[];
    /**
     * Get conversation statistics
     */
    getConversationStats(): {
        totalMessages: number;
        userMessages: number;
        assistantMessages: number;
        systemMessages: number;
        templatedMessages: number;
    };
    /**
     * Clear conversation history
     */
    clearHistory(): void;
    /**
     * Get recent messages (useful for context)
     */
    getRecentMessages(count?: number): ConversationHistoryItem[];
}
/**
 * Create and configure a conversation manager
 */
export declare function createConversationManager(logger: Logger, maxHistorySize?: number): ConversationManager;
