/**
 * Semantic Analyzer Module
 * Intelligent content-based detection of prompt types and execution requirements
 * Replaces header-based detection with semantic analysis
 */
import { ConvertedPrompt } from "../types/index.js";
export type ExecutionType = "template" | "workflow" | "chain" | "auto";
export type PromptClassification = {
    executionType: ExecutionType;
    requiresExecution: boolean;
    confidence: number;
    reasoning: string[];
    suggestedGates: string[];
};
/**
 * Semantic Analyzer for intelligent prompt classification
 */
export declare class SemanticAnalyzer {
    /**
     * Analyze a prompt and classify its execution requirements
     */
    analyzePrompt(prompt: ConvertedPrompt): PromptClassification;
    /**
     * Analyze the semantic content of the prompt
     */
    private analyzeContent;
    /**
     * Analyze the structural characteristics of the prompt
     */
    private analyzeStructure;
    /**
     * Combine content and structural analyses
     */
    private combineAnalyses;
    /**
     * Get human-readable analysis summary
     */
    getAnalysisSummary(classification: PromptClassification): string;
}
