/**
 * MCP Tools Module
 * Handles registration and implementation of MCP tools for the server
 */
import { z } from "zod";
import { PromptError, handleError as utilsHandleError, validateJsonArguments, ValidationError, } from "../utils/index.js";
import { PromptManagementTools } from "./prompt-management-tools.js";
/**
 * MCP Tools Manager class
 */
export class McpToolsManager {
    constructor(logger, mcpServer, promptManager, configManager, onRefresh, onRestart) {
        this.promptsData = [];
        this.convertedPrompts = [];
        this.categories = [];
        this.logger = logger;
        this.mcpServer = mcpServer;
        this.promptManager = promptManager;
        this.configManager = configManager;
        this.promptManagementTools = new PromptManagementTools(logger, mcpServer, configManager, onRefresh, onRestart);
    }
    /**
     * Register all MCP tools with the server
     */
    async registerAllTools() {
        this.logger.info("Registering MCP tools with server...");
        // Register each tool
        this.registerExecutePrompt();
        this.registerListPrompts();
        this.promptManagementTools.registerReadPrompt();
        this.promptManagementTools.registerCreatePrompt();
        this.promptManagementTools.registerUpdatePrompt();
        this.promptManagementTools.registerCreateCategory();
        this.promptManagementTools.registerDeleteCategory();
        this.promptManagementTools.registerRenameCategory();
        this.promptManagementTools.registerDeletePrompt();
        this.promptManagementTools.registerMovePrompt();
        this.promptManagementTools.registerReloadPrompts();
        this.logger.info("All MCP tools registered successfully");
    }
    /**
     * Update internal data references
     */
    updateData(promptsData, convertedPrompts, categories) {
        this.promptsData = promptsData;
        this.convertedPrompts = convertedPrompts;
        this.categories = categories;
        this.promptManagementTools.updateData(promptsData, convertedPrompts);
    }
    /**
     * Register execute_prompt tool
     */
    registerExecutePrompt() {
        this.mcpServer.tool("execute_prompt", "Execute a prompt by name with arguments. Simple usage: >>prompt_name your_content_here", {
            command: z
                .string()
                .describe(">>prompt_name your_content_here | For multiple arguments use JSON format: >>prompt_name {\"arg1\": \"value1\", \"arg2\": \"value2\"}"),
        }, { title: "Execute Prompt" }, async ({ command }, extra) => {
            try {
                this.logger.info(`Executing prompt command: ${command}`);
                const match = command.match(/^(>>|\/)([a-zA-Z0-9_-]+)\s*(.*)/);
                if (!match) {
                    throw new ValidationError("Invalid command format. Use >>command_name [arguments] or /command_name [arguments]");
                }
                const [, prefix, commandName, commandArgs] = match;
                const matchingPrompt = this.promptsData.find((prompt) => prompt.id === commandName || prompt.name === commandName);
                if (!matchingPrompt) {
                    throw new PromptError(`Unknown command: ${prefix}${commandName}. Type >>listprompts to see available commands.`);
                }
                const convertedPrompt = this.convertedPrompts.find((cp) => cp.id === matchingPrompt.id);
                if (!convertedPrompt) {
                    throw new PromptError(`Could not find converted prompt data for ${matchingPrompt.id}. Server data might be inconsistent.`);
                }
                const trimmedCommandArgs = commandArgs.trim();
                if (trimmedCommandArgs === "" &&
                    convertedPrompt.onEmptyInvocation === "return_template") {
                    return this.generateTemplateInfo(convertedPrompt, prefix);
                }
                const promptArgValues = {};
                if (trimmedCommandArgs !== "") {
                    this.parseCommandArguments(trimmedCommandArgs, matchingPrompt, promptArgValues, prefix, commandName);
                }
                matchingPrompt.arguments.forEach((arg) => {
                    if (!promptArgValues[arg.name]) {
                        promptArgValues[arg.name] = `{{previous_message}}`;
                    }
                });
                return await this.processRegularPrompt(convertedPrompt, promptArgValues);
            }
            catch (error) {
                const { message, isError } = this.handleError(error, "Error processing command");
                return {
                    content: [{ type: "text", text: message }],
                    isError,
                };
            }
        });
    }
    /**
     * Parse command arguments
     */
    parseCommandArguments(commandArgs, matchingPrompt, promptArgValues, prefix, commandName) {
        if (matchingPrompt.arguments.length === 0) {
            this.logger.warn(`Command '${prefix}${commandName}' doesn't accept arguments, but arguments were provided: ${commandArgs}`);
            return;
        }
        const trimmedArgs = commandArgs.trim();
        // Check if it's JSON format
        const isJsonFormat = trimmedArgs.startsWith("{") && trimmedArgs.endsWith("}");
        if (isJsonFormat) {
            // Handle JSON format (advanced usage)
            try {
                // Sanitize raw control characters (newlines, tabs, etc.) that Claude
                // embeds in JSON string values when sending multiline content like transcripts.
                // Already-escaped sequences like \\n are two chars and won't match \x0a.
                const sanitized = trimmedArgs.replace(/[\x00-\x1f]/g, (c) => {
                    switch (c) {
                        case '\n': return '\\n';
                        case '\r': return '\\r';
                        case '\t': return '\\t';
                        default: return '';
                    }
                });
                const parsedArgs = JSON.parse(sanitized);
                const validation = validateJsonArguments(parsedArgs, matchingPrompt);
                if (!validation.valid && validation.errors) {
                    this.logger.warn(`Invalid JSON arguments for ${prefix}${commandName}: ${validation.errors.join(", ")}. Using intelligent defaults.`);
                    this.applyIntelligentDefaults(matchingPrompt, promptArgValues, trimmedArgs);
                }
                else {
                    Object.assign(promptArgValues, validation.sanitizedArgs || {});
                }
            }
            catch (e) {
                this.logger.warn(`Error parsing JSON arguments for ${prefix}${commandName}: ${e instanceof Error ? e.message : String(e)}. Using intelligent defaults.`);
                this.applyIntelligentDefaults(matchingPrompt, promptArgValues, trimmedArgs);
            }
        }
        else {
            // Handle simple text format (quick start usage)
            if (matchingPrompt.arguments.length === 1) {
                // Single argument - direct assignment
                promptArgValues[matchingPrompt.arguments[0].name] = trimmedArgs;
            }
            else if (matchingPrompt.arguments.length <= 3) {
                // For 2-3 arguments, try to parse intelligently
                this.parseSimpleTextArguments(matchingPrompt, promptArgValues, trimmedArgs);
            }
            else {
                // For complex prompts (4+ args), use the first argument or primary content field
                this.applyIntelligentDefaults(matchingPrompt, promptArgValues, trimmedArgs);
            }
        }
    }
    /**
     * Parse simple text arguments for prompts with 2-3 parameters
     */
    parseSimpleTextArguments(matchingPrompt, promptArgValues, content) {
        // Try to intelligently split content for multiple arguments
        // Look for natural separators or use the whole content for the main argument
        const args = matchingPrompt.arguments;
        // Find the most likely "content" or "main" argument
        const contentArg = args.find(arg => arg.name.toLowerCase().includes('content') ||
            arg.name.toLowerCase().includes('text') ||
            arg.name.toLowerCase().includes('input') ||
            arg.name.toLowerCase().includes('data') ||
            arg.name.toLowerCase().includes('message')) || args[0]; // Default to first argument
        // Assign the content to the main argument
        promptArgValues[contentArg.name] = content;
        // Fill remaining arguments with intelligent defaults
        args.forEach(arg => {
            if (arg.name !== contentArg.name && !promptArgValues[arg.name]) {
                promptArgValues[arg.name] = `{{previous_message}}`;
            }
        });
    }
    /**
     * Apply intelligent defaults when parsing fails or for complex prompts
     */
    applyIntelligentDefaults(matchingPrompt, promptArgValues, userContent) {
        // Find the most appropriate argument for user content
        const args = matchingPrompt.arguments;
        // Priority order for content assignment
        const contentPriority = ['content', 'text', 'input', 'data', 'message', 'query', 'prompt'];
        let targetArg = null;
        for (const priority of contentPriority) {
            targetArg = args.find(arg => arg.name.toLowerCase().includes(priority));
            if (targetArg)
                break;
        }
        // If no priority match, use the first argument
        if (!targetArg) {
            targetArg = args[0];
        }
        // Assign user content to the target argument
        if (targetArg) {
            promptArgValues[targetArg.name] = userContent;
        }
        // Fill remaining arguments with placeholders
        args.forEach(arg => {
            if (!promptArgValues[arg.name]) {
                promptArgValues[arg.name] = `{{previous_message}}`;
            }
        });
    }
    /**
     * Process regular (non-chain) prompt
     */
    async processRegularPrompt(convertedPrompt, promptArgValues) {
        let userMessageText = convertedPrompt.userMessageTemplate;
        // Add system message if present
        if (convertedPrompt.systemMessage) {
            userMessageText = `[System Info: ${convertedPrompt.systemMessage}]\n\n${userMessageText}`;
        }
        // Process the template to replace all placeholders, passing the tools flag
        userMessageText = await this.promptManager.processTemplateAsync(userMessageText, promptArgValues, { previous_message: "{{previous_message}}" }, convertedPrompt.tools || false);
        return {
            content: [{ type: "text", text: userMessageText }],
        };
    }
    /**
     * Generate template information response
     */
    generateTemplateInfo(convertedPrompt, prefix) {
        let responseText = `**Template Info**: '${convertedPrompt.name}' (ID: ${convertedPrompt.id})\n\n`;
        responseText += `**Description**: ${convertedPrompt.description}\n\n`;
        if (convertedPrompt.arguments && convertedPrompt.arguments.length > 0) {
            responseText += `**Arguments**:\n`;
            convertedPrompt.arguments.forEach((arg) => {
                responseText += `  - \`${arg.name}\`${arg.required ? " (required)" : " (optional)"}: ${arg.description || "No description"}\n`;
            });
            responseText += `\n**Quick Start**:\n`;
            if (convertedPrompt.arguments.length === 1) {
                const argName = convertedPrompt.arguments[0].name;
                responseText += `\`${prefix}${convertedPrompt.id} your ${argName} here\`\n\n`;
            }
            else if (convertedPrompt.arguments.length <= 3) {
                const simpleArgs = convertedPrompt.arguments.map(arg => `<${arg.name}>`).join(' ');
                responseText += `\`${prefix}${convertedPrompt.id} ${simpleArgs}\`\n\n`;
            }
            else {
                responseText += `\`${prefix}${convertedPrompt.id} <content>\`\n\n`;
            }
            if (convertedPrompt.arguments.length > 1) {
                responseText += `**Advanced Usage**:\n`;
                const exampleArgs = {};
                convertedPrompt.arguments.forEach((arg) => {
                    exampleArgs[arg.name] = `<your ${arg.name} here>`;
                });
                responseText += `\`${prefix}${convertedPrompt.id} ${JSON.stringify(exampleArgs)}\`\n\n`;
            }
        }
        else {
            responseText += "**Arguments**: None required\n\n";
            responseText += `**Usage**: \`${prefix}${convertedPrompt.id}\`\n`;
        }
        return {
            content: [{ type: "text", text: responseText }],
            isError: false,
        };
    }
    /**
     * Register listprompts tool
     */
    registerListPrompts() {
        this.mcpServer.tool("listprompts", "List all available prompts with their exact IDs, categories, and descriptions. ALWAYS call this first before using read_prompt, delete_prompt, move_prompt, or execute_prompt to get valid prompt IDs. Do NOT guess prompt IDs.", {
            command: z
                .string()
                .optional()
                .describe("Optional filter text to show only matching commands"),
        }, { title: "List Prompts", readOnlyHint: true }, async ({ command }, extra) => {
            try {
                const match = command
                    ? command.match(/^(>>|\/)listprompts\s*(.*)/)
                    : null;
                const filterText = match ? match[2].trim() : "";
                return this.generateIntelligentPromptsList(filterText);
            }
            catch (error) {
                this.logger.error("Error executing listprompts command:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error displaying listprompts: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    /**
     * Generate formatted prompts list with optional text filtering
     */
    generateIntelligentPromptsList(filterText = "") {
        let listpromptsText = "# Available Commands\n\n";
        // Group prompts by category
        const promptsByCategory = {};
        const categoryMap = {};
        this.categories.forEach((cat) => {
            categoryMap[cat.id] = cat.name;
            promptsByCategory[cat.id] = [];
        });
        const searchText = filterText.toLowerCase();
        this.convertedPrompts.forEach((prompt) => {
            if (!promptsByCategory[prompt.category]) {
                promptsByCategory[prompt.category] = [];
            }
            // Apply simple text filtering
            if (searchText) {
                const searchableText = [
                    prompt.id,
                    prompt.name,
                    prompt.description,
                ].join(' ').toLowerCase();
                if (!searchableText.includes(searchText)) {
                    return;
                }
            }
            promptsByCategory[prompt.category].push(prompt);
        });
        // Add each category and its prompts (include empty categories so UI can show them)
        Object.entries(promptsByCategory).forEach(([categoryId, prompts]) => {
            const categoryName = categoryMap[categoryId] || categoryId;
            listpromptsText += `## ${categoryName}\n\n`;
            prompts.forEach((prompt) => {
                listpromptsText += `### /${prompt.id}\n`;
                if (prompt.name !== prompt.id) {
                    listpromptsText += `*Alias: /${prompt.name}*\n\n`;
                }
                else {
                    listpromptsText += "\n";
                }
                listpromptsText += `${prompt.description}\n\n`;
                if (prompt.arguments.length > 0) {
                    listpromptsText += "**Arguments:**\n\n";
                    prompt.arguments.forEach((arg) => {
                        listpromptsText += `- \`${arg.name}\` (optional): ${arg.description || "No description"}\n`;
                    });
                    listpromptsText += "\n**Usage:**\n\n";
                    if (prompt.arguments.length === 1) {
                        const argName = prompt.arguments[0].name;
                        listpromptsText += `\`/${prompt.id} your ${argName} here\`\n\n`;
                    }
                    else if (prompt.arguments.length > 1) {
                        const exampleArgs = {};
                        prompt.arguments.forEach((arg) => {
                            exampleArgs[arg.name] = `<your ${arg.name} here>`;
                        });
                        listpromptsText += `\`/${prompt.id} ${JSON.stringify(exampleArgs)}\`\n\n`;
                    }
                }
            });
        });
        // Special commands
        listpromptsText += "## Special Commands\n\n";
        listpromptsText += "### >>listprompts\n\n";
        listpromptsText += "Lists all available commands.\n\n";
        listpromptsText += "**Basic Usage:** `>>listprompts` or `/listprompts`\n\n";
        listpromptsText += "**Filtering:** `>>listprompts <search text>` - Filter by name or description\n\n";
        return {
            content: [{ type: "text", text: listpromptsText }],
        };
    }
    /**
     * Error handling helper
     */
    handleError(error, context) {
        return utilsHandleError(error, context, this.logger);
    }
}
/**
 * Create and configure MCP tools manager
 */
export function createMcpToolsManager(logger, mcpServer, promptManager, configManager, onRefresh, onRestart) {
    return new McpToolsManager(logger, mcpServer, promptManager, configManager, onRefresh, onRestart);
}
//# sourceMappingURL=index.js.map