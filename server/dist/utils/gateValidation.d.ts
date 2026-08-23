/**
 * Gate Validation System
 * Provides validation gates for prompt execution to ensure quality and completeness
 */
import { Logger } from "../logging/index.js";
import { GateDefinition, GateStatus } from "../types/index.js";
/**
 * Gate Evaluator class for validating content against gate requirements
 */
export declare class GateEvaluator {
    private logger;
    constructor(logger: Logger);
    /**
     * Evaluate all gates for a given content
     */
    evaluateGates(content: string, gates: GateDefinition[], context?: Record<string, any>): Promise<GateStatus[]>;
    /**
     * Evaluate a single gate
     */
    evaluateGate(content: string, gate: GateDefinition, context?: Record<string, any>): Promise<GateStatus>;
    /**
     * Evaluate a single requirement
     */
    private evaluateRequirement;
    /**
     * Evaluate content length requirements
     */
    private evaluateContentLength;
    /**
     * Evaluate keyword presence requirements
     */
    private evaluateKeywordPresence;
    /**
     * Evaluate format validation requirements
     */
    private evaluateFormatValidation;
    /**
     * Evaluate section validation requirements
     */
    private evaluateSectionValidation;
    /**
     * Evaluate custom requirements
     */
    private evaluateCustomRequirement;
    /**
     * Validate markdown format
     */
    private validateMarkdownFormat;
    /**
     * Validate JSON format
     */
    private validateJsonFormat;
    /**
     * Validate YAML format
     */
    private validateYamlFormat;
    /**
     * Calculate weighted score from evaluation results
     */
    private calculateWeightedScore;
    /**
     * Check if content needs retry based on gate failures
     */
    shouldRetry(gateStatuses: GateStatus[], maxRetries?: number): boolean;
    /**
     * Get retry message for failed gates
     */
    getRetryMessage(gateStatuses: GateStatus[]): string;
}
/**
 * Create and configure a gate evaluator
 */
export declare function createGateEvaluator(logger: Logger): GateEvaluator;
