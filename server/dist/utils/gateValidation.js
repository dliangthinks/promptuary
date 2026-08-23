/**
 * Gate Validation System
 * Provides validation gates for prompt execution to ensure quality and completeness
 */
/**
 * Gate Evaluator class for validating content against gate requirements
 */
export class GateEvaluator {
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Evaluate all gates for a given content
     */
    async evaluateGates(content, gates, context) {
        const gateStatuses = [];
        for (const gate of gates) {
            this.logger.debug(`Evaluating gate: ${gate.name} (${gate.id})`);
            const gateStatus = await this.evaluateGate(content, gate, context);
            gateStatuses.push(gateStatus);
            this.logger.debug(`Gate ${gate.id} result: ${gateStatus.passed ? 'PASSED' : 'FAILED'}`);
        }
        return gateStatuses;
    }
    /**
     * Evaluate a single gate
     */
    async evaluateGate(content, gate, context) {
        const evaluationResults = [];
        let overallPassed = true;
        for (const requirement of gate.requirements) {
            const result = await this.evaluateRequirement(content, requirement, context);
            evaluationResults.push(result);
            // If this is a required requirement and it failed, the gate fails
            if (requirement.required !== false && !result.passed) {
                overallPassed = false;
            }
        }
        // Calculate weighted score if needed
        if (!overallPassed && gate.requirements.some(req => req.weight)) {
            overallPassed = this.calculateWeightedScore(evaluationResults, gate.requirements) >= 0.7;
        }
        return {
            gateId: gate.id,
            passed: overallPassed,
            requirements: gate.requirements,
            evaluationResults,
            timestamp: Date.now(),
        };
    }
    /**
     * Evaluate a single requirement
     */
    async evaluateRequirement(content, requirement, context) {
        switch (requirement.type) {
            case 'content_length':
                return this.evaluateContentLength(content, requirement);
            case 'keyword_presence':
                return this.evaluateKeywordPresence(content, requirement);
            case 'format_validation':
                return this.evaluateFormatValidation(content, requirement);
            case 'section_validation':
                return this.evaluateSectionValidation(content, requirement);
            case 'custom':
                return this.evaluateCustomRequirement(content, requirement, context);
            default:
                return {
                    requirementId: requirement.type,
                    passed: false,
                    message: `Unknown requirement type: ${requirement.type}`,
                };
        }
    }
    /**
     * Evaluate content length requirements
     */
    evaluateContentLength(content, requirement) {
        const { min, max } = requirement.criteria;
        const length = content.length;
        let passed = true;
        let message = `Content length: ${length} characters`;
        if (min && length < min) {
            passed = false;
            message += ` (minimum: ${min})`;
        }
        if (max && length > max) {
            passed = false;
            message += ` (maximum: ${max})`;
        }
        return {
            requirementId: 'content_length',
            passed,
            score: passed ? 1.0 : 0.0,
            message,
            details: { length, min, max },
        };
    }
    /**
     * Evaluate keyword presence requirements
     */
    evaluateKeywordPresence(content, requirement) {
        const { keywords, caseSensitive = false } = requirement.criteria;
        const contentToCheck = caseSensitive ? content : content.toLowerCase();
        const foundKeywords = [];
        const missingKeywords = [];
        for (const keyword of keywords) {
            const keywordToCheck = caseSensitive ? keyword : keyword.toLowerCase();
            if (contentToCheck.includes(keywordToCheck)) {
                foundKeywords.push(keyword);
            }
            else {
                missingKeywords.push(keyword);
            }
        }
        const passed = missingKeywords.length === 0;
        const score = foundKeywords.length / keywords.length;
        return {
            requirementId: 'keyword_presence',
            passed,
            score,
            message: passed
                ? `All required keywords found: ${foundKeywords.join(', ')}`
                : `Missing keywords: ${missingKeywords.join(', ')}`,
            details: { foundKeywords, missingKeywords, total: keywords.length },
        };
    }
    /**
     * Evaluate format validation requirements
     */
    evaluateFormatValidation(content, requirement) {
        const { format } = requirement.criteria;
        switch (format) {
            case 'markdown':
                return this.validateMarkdownFormat(content);
            case 'json':
                return this.validateJsonFormat(content);
            case 'yaml':
                return this.validateYamlFormat(content);
            default:
                return {
                    requirementId: 'format_validation',
                    passed: false,
                    message: `Unknown format: ${format}`,
                };
        }
    }
    /**
     * Evaluate section validation requirements
     */
    evaluateSectionValidation(content, requirement) {
        const { sections, allowExtra = true } = requirement.criteria;
        const foundSections = [];
        const missingSections = [];
        for (const section of sections) {
            if (content.includes(section)) {
                foundSections.push(section);
            }
            else {
                missingSections.push(section);
            }
        }
        const passed = missingSections.length === 0;
        const score = foundSections.length / sections.length;
        return {
            requirementId: 'section_validation',
            passed,
            score,
            message: passed
                ? `All required sections found: ${foundSections.join(', ')}`
                : `Missing sections: ${missingSections.join(', ')}`,
            details: { foundSections, missingSections, total: sections.length },
        };
    }
    /**
     * Evaluate custom requirements
     */
    async evaluateCustomRequirement(content, requirement, context) {
        // This would be extended to support custom validation functions
        // For now, return a basic implementation
        return {
            requirementId: 'custom',
            passed: true,
            message: 'Custom requirement evaluation not implemented',
        };
    }
    /**
     * Validate markdown format
     */
    validateMarkdownFormat(content) {
        const hasHeaders = /^#+\s+/m.test(content);
        const hasProperStructure = content.includes('\n\n');
        const passed = hasHeaders && hasProperStructure;
        return {
            requirementId: 'markdown_format',
            passed,
            score: passed ? 1.0 : 0.5,
            message: passed
                ? 'Valid markdown format detected'
                : 'Content lacks proper markdown structure',
            details: { hasHeaders, hasProperStructure },
        };
    }
    /**
     * Validate JSON format
     */
    validateJsonFormat(content) {
        try {
            JSON.parse(content);
            return {
                requirementId: 'json_format',
                passed: true,
                score: 1.0,
                message: 'Valid JSON format',
            };
        }
        catch (error) {
            return {
                requirementId: 'json_format',
                passed: false,
                score: 0.0,
                message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }
    /**
     * Validate YAML format
     */
    validateYamlFormat(content) {
        // Basic YAML validation - would need yaml parser for full validation
        const hasYamlStructure = /^[\w-]+:\s*/m.test(content);
        return {
            requirementId: 'yaml_format',
            passed: hasYamlStructure,
            score: hasYamlStructure ? 1.0 : 0.0,
            message: hasYamlStructure
                ? 'Basic YAML structure detected'
                : 'Content does not appear to be YAML format',
        };
    }
    /**
     * Calculate weighted score from evaluation results
     */
    calculateWeightedScore(results, requirements) {
        let totalWeight = 0;
        let weightedScore = 0;
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const requirement = requirements[i];
            const weight = requirement.weight || 1;
            totalWeight += weight;
            weightedScore += (result.score || (result.passed ? 1 : 0)) * weight;
        }
        return totalWeight > 0 ? weightedScore / totalWeight : 0;
    }
    /**
     * Check if content needs retry based on gate failures
     */
    shouldRetry(gateStatuses, maxRetries = 3) {
        const failedGates = gateStatuses.filter(gate => !gate.passed);
        if (failedGates.length === 0)
            return false;
        // Check if any failed gate allows retries and hasn't exceeded retry count
        return failedGates.some(gate => {
            const retryCount = gate.retryCount || 0;
            return retryCount < maxRetries;
        });
    }
    /**
     * Get retry message for failed gates
     */
    getRetryMessage(gateStatuses) {
        const failedGates = gateStatuses.filter(gate => !gate.passed);
        if (failedGates.length === 0) {
            return 'All gates passed';
        }
        const messages = failedGates.map(gate => {
            const failedRequirements = gate.evaluationResults
                .filter(result => !result.passed)
                .map(result => result.message)
                .join('; ');
            return `Gate '${gate.gateId}' failed: ${failedRequirements}`;
        });
        return `Gate validation failed. Issues to address:\n${messages.join('\n')}`;
    }
}
/**
 * Create and configure a gate evaluator
 */
export function createGateEvaluator(logger) {
    return new GateEvaluator(logger);
}
//# sourceMappingURL=gateValidation.js.map