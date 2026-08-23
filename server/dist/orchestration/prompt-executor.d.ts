/**
 * Prompt Execution Module
 * Handles direct prompt execution and chain execution logic
 */
import { Logger } from "../logging/index.js";
import { PromptManager } from "../prompts/index.js";
import { ConvertedPrompt } from "../types/index.js";
import { ConversationManager } from "./conversation-manager.js";
/**
 * Chain execution state tracking
 */
interface ChainExecutionState {
    chainId: string;
    currentStepIndex: number;
    totalSteps: number;
    stepResults: Record<string, string>;
    startTime: number;
}
/**
 * Prompt Executor class
 */
export declare class PromptExecutor {
    private logger;
    private promptManager;
    private conversationManager;
    private convertedPrompts;
    private currentChainExecution;
    constructor(logger: Logger, promptManager: PromptManager, conversationManager: ConversationManager);
    /**
     * Update converted prompts data
     */
    updatePrompts(convertedPrompts: ConvertedPrompt[]): void;
    /**
     * Standardized error handling
     */
    private handleError;
    /**
     * Process a prompt directly with the parsed arguments and optional system message
     */
    runPromptDirectly(promptId: string, parsedArgs: Record<string, string>): Promise<string>;
    /**
     * Execute a chain of prompts
     */
    executePromptChain(chainPromptId: string, inputArgs?: Record<string, string>): Promise<{
        results: Record<string, string>;
        messages: {
            role: "user" | "assistant";
            content: {
                type: "text";
                text: string;
            };
        }[];
    }>;
    /**
     * Get current chain execution state
     */
    getCurrentChainExecution(): ChainExecutionState | null;
    /**
     * Get executor statistics
     */
    getExecutorStats(): {
        currentChain: ChainExecutionState | null;
        totalPrompts: number;
        conversationStats: any;
    };
}
/**
 * Create and configure a prompt executor
 */
export declare function createPromptExecutor(logger: Logger, promptManager: PromptManager, conversationManager: ConversationManager): PromptExecutor;
export {};
