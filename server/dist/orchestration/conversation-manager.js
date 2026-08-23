/**
 * Conversation Management Module
 * Handles conversation history tracking and context management
 */
/**
 * Conversation Manager class
 */
export class ConversationManager {
    constructor(logger, maxHistorySize = 100) {
        this.conversationHistory = [];
        this.logger = logger;
        this.maxHistorySize = maxHistorySize;
    }
    /**
     * Add an item to conversation history with size management
     */
    addToConversationHistory(item) {
        this.conversationHistory.push(item);
        // Trim history if it exceeds maximum size
        if (this.conversationHistory.length > this.maxHistorySize) {
            // Remove oldest entries, keeping recent ones
            this.conversationHistory.splice(0, this.conversationHistory.length - this.maxHistorySize);
            this.logger.debug(`Trimmed conversation history to ${this.maxHistorySize} entries to prevent memory leaks`);
        }
    }
    /**
     * Get the previous message from conversation history
     */
    getPreviousMessage() {
        // Try to find the last user message in conversation history
        if (this.conversationHistory.length > 0) {
            // Start from the end and find the first non-template user message
            for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
                const historyItem = this.conversationHistory[i];
                // Only consider user messages that aren't processed templates
                if (historyItem.role === "user" && !historyItem.isProcessedTemplate) {
                    this.logger.debug(`Found previous user message for context: ${historyItem.content.substring(0, 50)}...`);
                    return historyItem.content;
                }
            }
        }
        // Return a default prompt if no suitable history item is found
        return "[Please check previous messages in the conversation for context]";
    }
    /**
     * Get conversation history
     */
    getConversationHistory() {
        return [...this.conversationHistory];
    }
    /**
     * Get conversation statistics
     */
    getConversationStats() {
        const stats = {
            totalMessages: this.conversationHistory.length,
            userMessages: 0,
            assistantMessages: 0,
            systemMessages: 0,
            templatedMessages: 0,
        };
        this.conversationHistory.forEach((item) => {
            switch (item.role) {
                case "user":
                    stats.userMessages++;
                    break;
                case "assistant":
                    stats.assistantMessages++;
                    break;
                case "system":
                    stats.systemMessages++;
                    break;
            }
            if (item.isProcessedTemplate) {
                stats.templatedMessages++;
            }
        });
        return stats;
    }
    /**
     * Clear conversation history
     */
    clearHistory() {
        this.conversationHistory = [];
        this.logger.info("Conversation history cleared");
    }
    /**
     * Get recent messages (useful for context)
     */
    getRecentMessages(count = 5) {
        return this.conversationHistory.slice(-count);
    }
}
/**
 * Create and configure a conversation manager
 */
export function createConversationManager(logger, maxHistorySize) {
    return new ConversationManager(logger, maxHistorySize);
}
//# sourceMappingURL=conversation-manager.js.map