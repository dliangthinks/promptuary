/**
 * Prompt Management MCP Tools
 * Contains update_prompt, delete_prompt, and reload_prompts tools
 */

import * as fs from "fs/promises";
import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { ConfigManager } from "../config/index.js";
import { Logger } from "../logging/index.js";
import { safeWriteFile } from "../prompts/promptUtils.js";
import {
  ConvertedPrompt,
  PromptData,
  PromptsConfigFile,
} from "../types/index.js";

/**
 * Prompt Management Tools implementation
 */
export class PromptManagementTools {
  private logger: Logger;
  private mcpServer: any;
  private configManager: ConfigManager;
  private promptsData: PromptData[] = [];
  private convertedPrompts: ConvertedPrompt[] = [];
  private onRefresh: () => Promise<void>;
  private onRestart: (reason: string) => Promise<void>;

  constructor(
    logger: Logger,
    mcpServer: any,
    configManager: ConfigManager,
    onRefresh: () => Promise<void>,
    onRestart: (reason: string) => Promise<void>
  ) {
    this.logger = logger;
    this.mcpServer = mcpServer;
    this.configManager = configManager;
    this.onRefresh = onRefresh;
    this.onRestart = onRestart;
  }

  /**
   * Update internal data references
   */
  updateData(
    promptsData: PromptData[],
    convertedPrompts: ConvertedPrompt[]
  ): void {
    this.promptsData = promptsData;
    this.convertedPrompts = convertedPrompts;
  }

  /**
   * Register read_prompt tool — returns raw .md file content
   */
  registerReadPrompt(): void {
    this.mcpServer.tool(
      "read_prompt",
      "Read raw markdown content of a prompt. IMPORTANT: Call listprompts first to get valid prompt IDs. Use the exact ID shown in listprompts output (e.g. 'meeting_minutes', not 'meetingMinutes' or 'meeting-minutes').",
      {
        id: z.string().describe("Prompt ID or name from listprompts output"),
      },
      async ({ id }: { id: string }, extra: any) => {
        try {
          const PROMPTS_FILE = this.configManager.getPromptsFilePath();
          const promptsConfigDir = path.dirname(PROMPTS_FILE);
          const fileContent = await readFile(PROMPTS_FILE, "utf8");
          const promptsConfig = JSON.parse(fileContent) as PromptsConfigFile;

          for (const categoryImport of promptsConfig.imports || []) {
            const fullPath = path.join(promptsConfigDir, categoryImport);
            let categoryJson;
            try {
              const content = await readFile(fullPath, "utf8");
              categoryJson = JSON.parse(content);
            } catch { continue; }

            if (!categoryJson.prompts || !Array.isArray(categoryJson.prompts)) continue;

            const match = categoryJson.prompts.find((p: PromptData) => p.id === id || p.name === id);
            if (match) {
              const mdPath = path.join(path.dirname(fullPath), match.file);
              const rawContent = await readFile(mdPath, "utf8");
              return {
                content: [{ type: "text" as const, text: rawContent }],
              };
            }
          }

          return {
            content: [{ type: "text" as const, text: `Prompt '${id}' not found.` }],
            isError: true,
          };
        } catch (error) {
          return {
            content: [{
              type: "text" as const,
              text: `Failed to read prompt: ${error instanceof Error ? error.message : String(error)}`,
            }],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Register create_prompt tool
   */
  registerCreatePrompt(): void {
    this.mcpServer.tool(
      "create_prompt",
      "Create a new prompt in an existing category. IMPORTANT: Call listprompts first to see existing categories. Category must already exist — this tool does not auto-create categories.",
      {
        name: z.string().describe("Display name for the prompt"),
        category: z.string().describe("Category this prompt belongs to (must be an existing category)"),
        content: z.string().describe("The full markdown content for the prompt file"),
        description: z.string().optional().describe("Optional description of the prompt"),
        fullServerRestart: z
          .boolean()
          .optional()
          .describe(
            "Whether to perform a full server restart after creating the prompt. Defaults to false (hot-reload only)."
          ),
      },
      async (
        args: {
          name: string;
          category: string;
          content: string;
          description?: string;
          fullServerRestart?: boolean;
        },
        extra: any
      ) => {
        try {
          this.logger.info(`Creating prompt: ${args.name}`);

          const result = await this.createPromptImplementation(args);

          if (args.fullServerRestart) {
            setTimeout(
              () => this.onRestart(`Prompt created: ${args.name}`),
              1000
            );
            return {
              content: [
                {
                  type: "text" as const,
                  text: `${result.message}\nFull server restart initiated as requested...`,
                },
              ],
            };
          } else {
            await this.onRefresh();
            this.logger.info(
              `Hot-reload after creating prompt: ${args.name} completed.`
            );
            return {
              content: [
                {
                  type: "text" as const,
                  text: `${result.message}\nChanges were hot-reloaded.`,
                },
              ],
            };
          }
        } catch (error) {
          this.logger.error(`Error in create_prompt:`, error);
          return {
            content: [
              {
                type: "text" as const,
                text: `Failed to create prompt: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Implementation of create prompt logic
   */
  private async createPromptImplementation(
    args: {
      name: string;
      category: string;
      content: string;
      description?: string;
    }
  ): Promise<{ message: string }> {
    const PROMPTS_FILE = this.configManager.getPromptsFilePath();
    const messages: string[] = [];

    const fileContent = await readFile(PROMPTS_FILE, "utf8");
    const promptsConfig = JSON.parse(fileContent) as PromptsConfigFile;

    if (!promptsConfig.categories) promptsConfig.categories = [];
    if (!promptsConfig.imports) promptsConfig.imports = [];

    // Validate that category exists - do NOT auto-create
    const effectiveCategory = args.category.toLowerCase().replace(/\s+/g, "-");
    const categoryExists = promptsConfig.categories.some(
      (cat) => cat.id === effectiveCategory
    );

    if (!categoryExists) {
      const availableCategories = promptsConfig.categories.map((cat) => cat.id).join(", ");
      throw new Error(
        `Category '${args.category}' does not exist. Available categories: ${availableCategories}`
      );
    }

    // Generate ID from name
    const id = args.name.toLowerCase().replace(/\s+/g, "_");

    // Check that prompt doesn't already exist
    const promptDirPath = path.join(
      path.dirname(PROMPTS_FILE),
      "prompts",
      effectiveCategory
    );
    const categoryPromptsPath = path.join(promptDirPath, "prompts.json");
    let categoryPrompts: { prompts: PromptData[] };

    try {
      const content = await readFile(categoryPromptsPath, "utf8");
      categoryPrompts = JSON.parse(content);
    } catch {
      categoryPrompts = { prompts: [] };
    }

    const existingPrompt = categoryPrompts.prompts.find((p) => p.id === id);
    if (existingPrompt) {
      throw new Error(
        `Prompt with ID '${id}' already exists in category '${effectiveCategory}'. Use 'update_prompt' to modify it.`
      );
    }

    // Write the .md file
    const promptFilename = `${id}.md`;
    const fullPromptFilePath = path.join(promptDirPath, promptFilename);
    await safeWriteFile(fullPromptFilePath, args.content, "utf8");

    // Add entry to category's prompts.json
    const promptEntry: PromptData = {
      id,
      name: args.name,
      category: effectiveCategory,
      description: args.description || args.name,
      file: promptFilename,
      arguments: [],
    };

    categoryPrompts.prompts.push(promptEntry);
    await safeWriteFile(
      categoryPromptsPath,
      JSON.stringify(categoryPrompts, null, 2),
      "utf8"
    );

    messages.push(`✅ Created prompt markdown file: ${promptFilename}`);
    messages.push(`✅ Added prompt entry for '${id}' in category '${effectiveCategory}' prompts.json.`);

    return {
      message: messages.join("\n"),
    };
  }

  /**
   * Register update_prompt tool
   */
  registerUpdatePrompt(): void {
    this.mcpServer.tool(
      "update_prompt",
      "Update an existing prompt's content or description. IMPORTANT: Call listprompts first to get valid prompt names/IDs. To change category, use move_prompt instead.",
      {
        name: z.string().describe("Name or ID of an existing prompt from listprompts output"),
        new_name: z.string().optional().describe("New display name for the prompt"),
        content: z.string().optional().describe("New markdown content for the prompt file"),
        description: z.string().optional().describe("New description for the prompt"),
        fullServerRestart: z
          .boolean()
          .optional()
          .describe(
            "Whether to perform a full server restart after updating the prompt. Defaults to false (hot-reload only)."
          ),
      },
      async (
        args: {
          name: string;
          new_name?: string;
          content?: string;
          description?: string;
          fullServerRestart?: boolean;
        },
        extra: any
      ) => {
        try {
          this.logger.info(`Updating prompt: ${args.name}`);

          const result = await this.updatePromptImplementation(args);

          if (args.fullServerRestart) {
            setTimeout(
              () => this.onRestart(`Prompt updated: ${args.name}`),
              1000
            );
            return {
              content: [
                {
                  type: "text" as const,
                  text: `${result.message}\nFull server restart initiated as requested...`,
                },
              ],
            };
          } else {
            await this.onRefresh();
            this.logger.info(
              `Hot-reload after updating prompt: ${args.name} completed.`
            );
            return {
              content: [
                {
                  type: "text" as const,
                  text: `${result.message}\nChanges were hot-reloaded.`,
                },
              ],
            };
          }
        } catch (error) {
          this.logger.error(`Error in update_prompt:`, error);
          return {
            content: [
              {
                type: "text" as const,
                text: `Failed to update prompt: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Implementation of update prompt logic
   */
  private async updatePromptImplementation(
    args: {
      name: string;
      new_name?: string;
      content?: string;
      description?: string;
    }
  ): Promise<{ message: string }> {
    const PROMPTS_FILE = this.configManager.getPromptsFilePath();
    const promptsConfigDir = path.dirname(PROMPTS_FILE);
    const messages: string[] = [];

    const fileContent = await readFile(PROMPTS_FILE, "utf8");
    const promptsConfig = JSON.parse(fileContent) as PromptsConfigFile;

    if (!promptsConfig.imports) promptsConfig.imports = [];

    // Find the existing prompt across all categories
    let foundPrompt: PromptData | null = null;
    let foundCategoryPromptsPath: string | null = null;
    let foundCategoryPrompts: { prompts: PromptData[] } | null = null;

    // Generate the expected ID from the name
    const expectedId = args.name.toLowerCase().replace(/\s+/g, "_");

    for (const categoryImport of promptsConfig.imports) {
      const fullCategoryPromptsPath = path.join(promptsConfigDir, categoryImport);
      try {
        const content = await readFile(fullCategoryPromptsPath, "utf8");
        const categoryPromptsJson = JSON.parse(content);
        if (!categoryPromptsJson.prompts || !Array.isArray(categoryPromptsJson.prompts)) continue;

        const match = categoryPromptsJson.prompts.find(
          (p: PromptData) => p.name === args.name || p.id === expectedId
        );
        if (match) {
          foundPrompt = match;
          foundCategoryPromptsPath = fullCategoryPromptsPath;
          foundCategoryPrompts = categoryPromptsJson;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!foundPrompt || !foundCategoryPromptsPath || !foundCategoryPrompts) {
      throw new Error(
        `Prompt '${args.name}' not found. Use 'create_prompt' to create a new prompt.`
      );
    }

    const promptDirPath = path.dirname(foundCategoryPromptsPath);

    // Update content if provided
    if (args.content) {
      const fullPromptFilePath = path.join(promptDirPath, foundPrompt.file);
      await safeWriteFile(fullPromptFilePath, args.content, "utf8");
      messages.push(`✅ Updated prompt markdown file: ${foundPrompt.file}`);
    }

    // Update description and/or name if provided
    if (args.description || args.new_name) {
      const idx = foundCategoryPrompts.prompts.findIndex((p) => p.id === foundPrompt!.id);
      if (idx !== -1) {
        if (args.description) {
          foundCategoryPrompts.prompts[idx].description = args.description;
          messages.push(`✅ Updated description for '${foundPrompt.id}' in category's prompts.json.`);
        }
        if (args.new_name) {
          foundCategoryPrompts.prompts[idx].name = args.new_name;
          messages.push(`✅ Renamed prompt to '${args.new_name}' in category's prompts.json.`);
        }
        await safeWriteFile(
          foundCategoryPromptsPath,
          JSON.stringify(foundCategoryPrompts, null, 2),
          "utf8"
        );
      }
    }

    if (messages.length === 0) {
      messages.push(`ℹ️ No changes provided for prompt '${args.name}'. Provide 'content', 'description', and/or 'new_name' to update.`);
    }

    return {
      message: messages.join("\n"),
    };
  }

  /**
   * Create or update prompt file and category entry
   */
  private async createOrUpdatePromptFile(
    args: any,
    effectiveCategory: string,
    promptsFile: string
  ): Promise<{ exists: boolean; filePath: string }> {
    const promptFilename = `${args.id}.md`;
    const promptDirPath = path.join(
      path.dirname(promptsFile),
      "prompts",
      effectiveCategory
    );
    const fullPromptFilePath = path.join(promptDirPath, promptFilename);

    // Create prompt file content
    let promptFileContent = `# ${args.name}\n\n`;
    promptFileContent += `## Description\n${args.description}\n\n`;

    if (args.systemMessage) {
      promptFileContent += `## System Message\n${args.systemMessage}\n\n`;
    }

    promptFileContent += `## User Message Template\n${args.userMessageTemplate}\n`;

    // Write prompt file
    await safeWriteFile(fullPromptFilePath, promptFileContent, "utf8");

    // Update category prompts.json
    const categoryPromptsPath = path.join(promptDirPath, "prompts.json");
    let categoryPrompts: { prompts: PromptData[] };

    try {
      const content = await readFile(categoryPromptsPath, "utf8");
      categoryPrompts = JSON.parse(content);
    } catch {
      categoryPrompts = { prompts: [] };
    }

    const promptEntry: PromptData = {
      id: args.id,
      name: args.name,
      category: effectiveCategory,
      description: args.description,
      file: promptFilename,
      arguments: args.arguments || [],
      ...(args.onEmptyInvocation && {
        onEmptyInvocation: args.onEmptyInvocation,
      }),
    };

    const existingIndex = categoryPrompts.prompts.findIndex(
      (p) => p.id === args.id
    );
    const promptExists = existingIndex !== -1;

    if (promptExists) {
      categoryPrompts.prompts[existingIndex] = promptEntry;
    } else {
      categoryPrompts.prompts.push(promptEntry);
    }

    await safeWriteFile(
      categoryPromptsPath,
      JSON.stringify(categoryPrompts, null, 2),
      "utf8"
    );

    return { exists: promptExists, filePath: fullPromptFilePath };
  }

  /**
   * Register delete_prompt tool
   */
  registerDeletePrompt(): void {
    this.mcpServer.tool(
      "delete_prompt",
      "Delete a prompt permanently. IMPORTANT: Call listprompts first to get valid prompt IDs. Use the exact ID shown in listprompts output (e.g. 'meeting_minutes', not 'meetingMinutes' or 'meeting-minutes').",
      {
        id: z.string().describe("Prompt ID or name from listprompts output"),
        fullServerRestart: z
          .boolean()
          .optional()
          .describe(
            "Whether to perform a full server restart after deleting the prompt. Defaults to false (hot-reload only)."
          ),
      },
      async (
        { id, fullServerRestart }: { id: string; fullServerRestart?: boolean },
        extra: any
      ) => {
        try {
          this.logger.info(`Deleting prompt: ${id}`);

          const result = await this.deletePromptImplementation(id);

          if (fullServerRestart) {
            setTimeout(() => this.onRestart(`Prompt deleted: ${id}`), 1000);
            return {
              content: [
                {
                  type: "text",
                  text: `${result.message} Server restarting...`,
                },
              ],
            };
          } else {
            await this.onRefresh();
            return {
              content: [
                { type: "text", text: `${result.message} Hot-reloaded.` },
              ],
            };
          }
        } catch (error) {
          this.logger.error(`Error in delete_prompt tool:`, error);
          return {
            content: [
              {
                type: "text" as const,
                text: `Failed to delete prompt: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Implementation of delete prompt logic
   */
  private async deletePromptImplementation(
    id: string
  ): Promise<{ message: string }> {
    const PROMPTS_CONFIG_FILE_PATH = this.configManager.getPromptsFilePath();
    const promptsConfigDir = path.dirname(PROMPTS_CONFIG_FILE_PATH);
    let promptsConfig: PromptsConfigFile;
    const messages: string[] = [];

    try {
      const configContent = await readFile(PROMPTS_CONFIG_FILE_PATH, "utf8");
      promptsConfig = JSON.parse(configContent);
    } catch (e) {
      this.logger.error(
        `Failed to read or parse promptsConfig.json at ${PROMPTS_CONFIG_FILE_PATH}`,
        e
      );
      throw new Error("Could not load main prompt configuration.");
    }

    if (!promptsConfig.imports) promptsConfig.imports = [];
    if (!promptsConfig.categories) promptsConfig.categories = [];

    let promptFoundAndDeleted = false;
    let modifiedCategoryImportPath: string | null = null;
    let promptMarkdownFilePath: string | null = null;

    for (const categoryImport of [...promptsConfig.imports]) {
      const fullCategoryPromptsPath = path.join(
        promptsConfigDir,
        categoryImport
      );
      let categoryPromptsFileContent;
      let categoryPromptsJson;

      try {
        categoryPromptsFileContent = await readFile(
          fullCategoryPromptsPath,
          "utf8"
        );
        categoryPromptsJson = JSON.parse(categoryPromptsFileContent);
      } catch (e) {
        this.logger.warn(
          `Could not read or parse category prompts file: ${fullCategoryPromptsPath}`,
          e
        );
        continue;
      }

      if (
        !categoryPromptsJson.prompts ||
        !Array.isArray(categoryPromptsJson.prompts)
      ) {
        this.logger.warn(
          `Category file ${fullCategoryPromptsPath} has no valid 'prompts' array. Skipping.`
        );
        continue;
      }

      const promptToDeleteIndex = categoryPromptsJson.prompts.findIndex(
        (p: PromptData) => p.id === id || p.name === id
      );

      if (promptToDeleteIndex > -1) {
        const promptEntry = categoryPromptsJson.prompts[promptToDeleteIndex];
        promptMarkdownFilePath = path.join(
          path.dirname(fullCategoryPromptsPath),
          promptEntry.file
        );

        categoryPromptsJson.prompts.splice(promptToDeleteIndex, 1);
        await safeWriteFile(
          fullCategoryPromptsPath,
          JSON.stringify(categoryPromptsJson, null, 2),
          "utf8"
        );
        messages.push(
          `✅ Removed prompt '${id}' from category file: ${categoryImport}`
        );
        promptFoundAndDeleted = true;
        modifiedCategoryImportPath = categoryImport;

        if (promptMarkdownFilePath) {
          try {
            await fs.unlink(promptMarkdownFilePath);
            messages.push(`✅ Deleted markdown file: ${promptEntry.file}`);
          } catch (unlinkError: any) {
            if (unlinkError.code !== "ENOENT") {
              messages.push(
                `⚠️ Could not delete markdown file '${promptEntry.file}': ${unlinkError.message}`
              );
            } else {
              messages.push(
                `ℹ️ Markdown file '${promptEntry.file}' not found, possibly already deleted.`
              );
            }
          }
        }
        break;
      }
    }

    if (!promptFoundAndDeleted) {
      throw new Error(
        `Prompt with ID '${id}' not found in any category's prompts.json.`
      );
    }

    if (modifiedCategoryImportPath) {
      const fullModifiedCategoryPath = path.join(
        promptsConfigDir,
        modifiedCategoryImportPath
      );
      try {
        const categoryFileContent = await readFile(
          fullModifiedCategoryPath,
          "utf8"
        );
        const categoryPromptsConfig = JSON.parse(categoryFileContent);

        if (
          categoryPromptsConfig.prompts &&
          categoryPromptsConfig.prompts.length === 0
        ) {
          messages.push(
            `ℹ️ Category file '${modifiedCategoryImportPath}' is now empty.`
          );
          promptsConfig.imports = promptsConfig.imports.filter(
            (impPath) => impPath !== modifiedCategoryImportPath
          );
          messages.push(
            `✅ Removed empty category import from promptsConfig.json.`
          );

          const categoryIdMatch = modifiedCategoryImportPath.match(
            /(?:prompts[\\/])?([^\\/]+)[\\/]prompts\.json$/
          );
          if (categoryIdMatch && categoryIdMatch[1]) {
            const categoryIdToRemove = categoryIdMatch[1];
            const originalCategoryCount = promptsConfig.categories.length;
            promptsConfig.categories = promptsConfig.categories.filter(
              (cat) => cat.id !== categoryIdToRemove
            );
            if (promptsConfig.categories.length < originalCategoryCount) {
              messages.push(
                `✅ Removed category definition for '${categoryIdToRemove}' from promptsConfig.json.`
              );
            }

            const categoryDirPath = path.dirname(fullModifiedCategoryPath);
            try {
              const filesInDir = await fs.readdir(categoryDirPath);
              if (filesInDir.length === 1 && filesInDir[0] === "prompts.json") {
                await fs.rm(categoryDirPath, { recursive: true, force: true });
                messages.push(
                  `✅ Deleted empty category directory: ${path.basename(
                    categoryDirPath
                  )}`
                );
              } else {
                messages.push(
                  `ℹ️ Category directory '${path.basename(
                    categoryDirPath
                  )}' was not empty, so it was not deleted.`
                );
              }
            } catch (dirRemoveError: any) {
              messages.push(
                `⚠️ Could not check or delete category directory '${path.basename(
                  categoryDirPath
                )}': ${dirRemoveError.message}`
              );
            }
          } else {
            this.logger.warn(
              `Could not determine category ID from path '${modifiedCategoryImportPath}' to remove its definition.`
            );
          }
          await safeWriteFile(
            PROMPTS_CONFIG_FILE_PATH,
            JSON.stringify(promptsConfig, null, 2),
            "utf8"
          );
          this.logger.info(
            "Updated promptsConfig.json after removing empty category references."
          );
        }
      } catch (readCheckError) {
        this.logger.error(
          `Could not re-read category file '${fullModifiedCategoryPath}' to check if empty:`,
          readCheckError
        );
      }
    }
    return {
      message: messages.join("\n"),
    };
  }

  /**
   * Register create_category tool
   */
  registerCreateCategory(): void {
    this.mcpServer.tool(
      "create_category",
      "Create a new empty category for organizing prompts.",
      {
        name: z.string().describe("Display name for the new category"),
        after: z
          .string()
          .optional()
          .describe(
            "Category ID to insert the new category after. If omitted, appends to end."
          ),
        fullServerRestart: z
          .boolean()
          .optional()
          .describe(
            "Whether to perform a full server restart after creating. Defaults to false (hot-reload only)."
          ),
      },
      async (
        { name, after, fullServerRestart }: { name: string; after?: string; fullServerRestart?: boolean },
        extra: any
      ) => {
        try {
          this.logger.info(`Creating category: ${name}`);

          const result = await this.createCategoryImplementation(name, after);

          if (fullServerRestart) {
            setTimeout(() => this.onRestart(`Category created: ${name}`), 1000);
            return {
              content: [
                {
                  type: "text" as const,
                  text: `${result.message}\nServer restarting...`,
                },
              ],
            };
          } else {
            await this.onRefresh();
            return {
              content: [
                {
                  type: "text" as const,
                  text: `${result.message}\nHot-reloaded.`,
                },
              ],
            };
          }
        } catch (error) {
          this.logger.error(`Error in create_category tool:`, error);
          return {
            content: [
              {
                type: "text" as const,
                text: `Failed to create category: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Implementation of create category logic
   */
  private async createCategoryImplementation(
    name: string,
    after?: string
  ): Promise<{ message: string; id: string }> {
    const PROMPTS_FILE = this.configManager.getPromptsFilePath();
    const promptsConfigDir = path.dirname(PROMPTS_FILE);
    const messages: string[] = [];

    const fileContent = await readFile(PROMPTS_FILE, "utf8");
    const promptsConfig = JSON.parse(fileContent) as PromptsConfigFile;

    if (!promptsConfig.categories) promptsConfig.categories = [];
    if (!promptsConfig.imports) promptsConfig.imports = [];

    // Generate ID from name
    const categoryId = name.toLowerCase().replace(/\s+/g, "-");

    // Check if category already exists
    const existing = promptsConfig.categories.find(
      (cat) => cat.id === categoryId
    );
    if (existing) {
      throw new Error(
        `Category '${categoryId}' already exists.`
      );
    }

    const newCategory = { id: categoryId, name, description: "" };
    const importPath = `prompts/${categoryId}/prompts.json`;

    // Insert into categories array
    if (after) {
      const afterIndex = promptsConfig.categories.findIndex(
        (cat) => cat.id === after || cat.name.toLowerCase() === after.toLowerCase()
      );
      if (afterIndex === -1) {
        throw new Error(`Category '${after}' not found to insert after.`);
      }
      const afterCat = promptsConfig.categories[afterIndex];
      promptsConfig.categories.splice(afterIndex + 1, 0, newCategory);
      // Also insert import at corresponding position
      const afterImport = `prompts/${afterCat.id}/prompts.json`;
      const afterImportIndex = promptsConfig.imports.indexOf(afterImport);
      if (afterImportIndex !== -1) {
        promptsConfig.imports.splice(afterImportIndex + 1, 0, importPath);
      } else {
        promptsConfig.imports.push(importPath);
      }
    } else {
      promptsConfig.categories.push(newCategory);
      promptsConfig.imports.push(importPath);
    }
    messages.push(`✅ Added category '${categoryId}' to promptsConfig.json.`);

    // Save updated config
    await safeWriteFile(
      PROMPTS_FILE,
      JSON.stringify(promptsConfig, null, 2),
      "utf8"
    );

    // Create directory and empty prompts.json
    const categoryDirPath = path.join(promptsConfigDir, "prompts", categoryId);
    await fs.mkdir(categoryDirPath, { recursive: true });
    const categoryPromptsPath = path.join(categoryDirPath, "prompts.json");
    await safeWriteFile(
      categoryPromptsPath,
      JSON.stringify({ prompts: [] }, null, 2),
      "utf8"
    );
    messages.push(`✅ Created directory and prompts.json for '${categoryId}'.`);

    return {
      message: messages.join("\n"),
      id: categoryId,
    };
  }

  /**
   * Register delete_category tool
   */
  registerDeleteCategory(): void {
    this.mcpServer.tool(
      "delete_category",
      "Delete an empty category. IMPORTANT: Call listprompts first to verify the category exists and is empty. Category must have no prompts — move or delete prompts first.",
      {
        name: z.string().describe("Name or ID of the category from listprompts output"),
        fullServerRestart: z
          .boolean()
          .optional()
          .describe(
            "Whether to perform a full server restart after deleting the category. Defaults to false (hot-reload only)."
          ),
      },
      async (
        { name, fullServerRestart }: { name: string; fullServerRestart?: boolean },
        extra: any
      ) => {
        try {
          this.logger.info(`Deleting category: ${name}`);

          const result = await this.deleteCategoryImplementation(name);

          if (fullServerRestart) {
            setTimeout(() => this.onRestart(`Category deleted: ${name}`), 1000);
            return {
              content: [
                {
                  type: "text" as const,
                  text: `${result.message}\nServer restarting...`,
                },
              ],
            };
          } else {
            await this.onRefresh();
            return {
              content: [
                {
                  type: "text" as const,
                  text: `${result.message}\nHot-reloaded.`,
                },
              ],
            };
          }
        } catch (error) {
          this.logger.error(`Error in delete_category tool:`, error);
          return {
            content: [
              {
                type: "text" as const,
                text: `Failed to delete category: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Implementation of delete category logic
   */
  private async deleteCategoryImplementation(
    name: string
  ): Promise<{ message: string }> {
    const PROMPTS_FILE = this.configManager.getPromptsFilePath();
    const promptsConfigDir = path.dirname(PROMPTS_FILE);
    const messages: string[] = [];

    const fileContent = await readFile(PROMPTS_FILE, "utf8");
    const promptsConfig = JSON.parse(fileContent) as PromptsConfigFile;

    if (!promptsConfig.categories) promptsConfig.categories = [];
    if (!promptsConfig.imports) promptsConfig.imports = [];

    // Find the category by name or ID
    const categoryId = name.toLowerCase().replace(/\s+/g, "-");
    const categoryIndex = promptsConfig.categories.findIndex(
      (cat) => cat.id === categoryId || cat.name.toLowerCase() === name.toLowerCase()
    );

    if (categoryIndex === -1) {
      const availableCategories = promptsConfig.categories.map((cat) => cat.id).join(", ");
      throw new Error(
        `Category '${name}' not found. Available categories: ${availableCategories}`
      );
    }

    const category = promptsConfig.categories[categoryIndex];
    const categoryDirPath = path.join(promptsConfigDir, "prompts", category.id);
    const categoryPromptsPath = path.join(categoryDirPath, "prompts.json");

    // Check if category has prompts
    try {
      const content = await readFile(categoryPromptsPath, "utf8");
      const categoryPromptsJson = JSON.parse(content);
      if (categoryPromptsJson.prompts && categoryPromptsJson.prompts.length > 0) {
        const promptNames = categoryPromptsJson.prompts
          .map((p: PromptData) => p.id)
          .join(", ");
        throw new Error(
          `Category '${category.id}' is not empty. Delete or move these prompts first: ${promptNames}`
        );
      }
    } catch (error) {
      // Re-throw if it's our "not empty" error
      if (error instanceof Error && error.message.includes("is not empty")) {
        throw error;
      }
      // If the file doesn't exist, the category is effectively empty
    }

    // Remove from categories array
    promptsConfig.categories.splice(categoryIndex, 1);
    messages.push(`✅ Removed category '${category.id}' from promptsConfig.json categories.`);

    // Remove from imports array
    const importPath = `prompts/${category.id}/prompts.json`;
    const importIndex = promptsConfig.imports.indexOf(importPath);
    if (importIndex !== -1) {
      promptsConfig.imports.splice(importIndex, 1);
      messages.push(`✅ Removed import '${importPath}' from promptsConfig.json.`);
    }

    // Save updated config
    await safeWriteFile(
      PROMPTS_FILE,
      JSON.stringify(promptsConfig, null, 2),
      "utf8"
    );

    // Delete the category directory
    try {
      await fs.rm(categoryDirPath, { recursive: true, force: true });
      messages.push(`✅ Deleted category directory: ${category.id}`);
    } catch (dirError: any) {
      if (dirError.code !== "ENOENT") {
        messages.push(
          `⚠️ Could not delete category directory '${category.id}': ${dirError.message}`
        );
      }
    }

    return {
      message: messages.join("\n"),
    };
  }

  /**
   * Register rename_category tool
   */
  registerRenameCategory(): void {
    this.mcpServer.tool(
      "rename_category",
      "Rename a category's display name. Only changes the name — ID, directory, and filenames stay the same.",
      {
        name: z.string().describe("Current name or ID of the category from listprompts output"),
        new_name: z.string().describe("New display name for the category"),
        fullServerRestart: z
          .boolean()
          .optional()
          .describe(
            "Whether to perform a full server restart after renaming. Defaults to false (hot-reload only)."
          ),
      },
      async (
        { name, new_name, fullServerRestart }: { name: string; new_name: string; fullServerRestart?: boolean },
        extra: any
      ) => {
        try {
          this.logger.info(`Renaming category: ${name} -> ${new_name}`);

          const result = await this.renameCategoryImplementation(name, new_name);

          if (fullServerRestart) {
            setTimeout(() => this.onRestart(`Category renamed: ${name} -> ${new_name}`), 1000);
            return {
              content: [
                {
                  type: "text" as const,
                  text: `${result.message}\nServer restarting...`,
                },
              ],
            };
          } else {
            await this.onRefresh();
            return {
              content: [
                {
                  type: "text" as const,
                  text: `${result.message}\nHot-reloaded.`,
                },
              ],
            };
          }
        } catch (error) {
          this.logger.error(`Error in rename_category tool:`, error);
          return {
            content: [
              {
                type: "text" as const,
                text: `Failed to rename category: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Implementation of rename category logic
   */
  private async renameCategoryImplementation(
    name: string,
    newName: string
  ): Promise<{ message: string }> {
    const PROMPTS_FILE = this.configManager.getPromptsFilePath();
    const promptsConfigDir = path.dirname(PROMPTS_FILE);

    const fileContent = await readFile(PROMPTS_FILE, "utf8");
    const promptsConfig = JSON.parse(fileContent) as PromptsConfigFile;

    if (!promptsConfig.categories) promptsConfig.categories = [];
    if (!promptsConfig.imports) promptsConfig.imports = [];

    // Find the category by name or ID
    const lookupId = name.toLowerCase().replace(/\s+/g, "-");
    const categoryIndex = promptsConfig.categories.findIndex(
      (cat) => cat.id === lookupId || cat.name.toLowerCase() === name.toLowerCase()
    );

    if (categoryIndex === -1) {
      const availableCategories = promptsConfig.categories.map((cat) => cat.id).join(", ");
      throw new Error(
        `Category '${name}' not found. Available categories: ${availableCategories}`
      );
    }

    // Reject if another category already has this display name
    const duplicate = promptsConfig.categories.find(
      (cat, i) => i !== categoryIndex && cat.name.toLowerCase() === newName.toLowerCase()
    );
    if (duplicate) {
      throw new Error(
        `A category named '${duplicate.name}' already exists (id: ${duplicate.id}).`
      );
    }

    const category = promptsConfig.categories[categoryIndex];
    const oldId = category.id;
    const oldName = category.name;
    const newId = newName.toLowerCase().replace(/\s+/g, "-");
    const messages: string[] = [];

    if (newId !== oldId) {
      // Check that the new ID doesn't conflict with another category
      const idConflict = promptsConfig.categories.find(
        (cat, i) => i !== categoryIndex && cat.id === newId
      );
      if (idConflict) {
        throw new Error(
          `A category with ID '${newId}' already exists (name: ${idConflict.name}).`
        );
      }

      // Rename the directory
      const oldDir = path.join(promptsConfigDir, "prompts", oldId);
      const newDir = path.join(promptsConfigDir, "prompts", newId);
      try {
        await fs.rename(oldDir, newDir);
        messages.push(`✅ Renamed directory '${oldId}' → '${newId}'.`);
      } catch (err: any) {
        if (err.code !== "ENOENT") throw err;
        // Directory doesn't exist — nothing to rename
      }

      // Update import path
      const oldImport = `prompts/${oldId}/prompts.json`;
      const newImport = `prompts/${newId}/prompts.json`;
      const importIndex = promptsConfig.imports.indexOf(oldImport);
      if (importIndex !== -1) {
        promptsConfig.imports[importIndex] = newImport;
      }

      // Update category entry
      category.id = newId;
      category.name = newName;

      // Update category field in each prompt entry in the category's prompts.json
      const categoryPromptsPath = path.join(promptsConfigDir, "prompts", newId, "prompts.json");
      try {
        const catFileContent = await readFile(categoryPromptsPath, "utf8");
        const catConfig = JSON.parse(catFileContent);
        if (catConfig.prompts && Array.isArray(catConfig.prompts)) {
          for (const prompt of catConfig.prompts) {
            if (prompt.category === oldId) {
              prompt.category = newId;
            }
          }
          await safeWriteFile(
            categoryPromptsPath,
            JSON.stringify(catConfig, null, 2),
            "utf8"
          );
        }
      } catch (err: any) {
        if (err.code !== "ENOENT") throw err;
        // No prompts.json in the category — nothing to update
      }

      messages.push(`✅ Renamed category '${oldName}' (${oldId}) → '${newName}' (${newId}).`);
    } else {
      // ID stays the same (e.g. case-only rename) — just update display name
      category.name = newName;
      messages.push(`✅ Renamed category '${oldName}' to '${newName}'.`);
    }

    await safeWriteFile(
      PROMPTS_FILE,
      JSON.stringify(promptsConfig, null, 2),
      "utf8"
    );

    return {
      message: messages.join("\n"),
    };
  }

  /**
   * Register move_prompt tool
   */
  registerMovePrompt(): void {
    this.mcpServer.tool(
      "move_prompt",
      "Move a prompt from one category to another. IMPORTANT: Call listprompts first to get valid prompt IDs and category names. Both prompt and target category must exist.",
      {
        id: z.string().describe("Prompt ID or name from listprompts output"),
        target_category: z.string().describe("ID or name of the destination category from listprompts output"),
        fullServerRestart: z
          .boolean()
          .optional()
          .describe(
            "Whether to perform a full server restart after moving the prompt. Defaults to false (hot-reload only)."
          ),
      },
      async (
        { id, target_category, fullServerRestart }: { id: string; target_category: string; fullServerRestart?: boolean },
        extra: any
      ) => {
        try {
          this.logger.info(`Moving prompt '${id}' to category '${target_category}'`);

          const result = await this.movePromptImplementation(id, target_category);

          if (fullServerRestart) {
            setTimeout(() => this.onRestart(`Prompt moved: ${id}`), 1000);
            return {
              content: [
                {
                  type: "text" as const,
                  text: `${result.message}\nServer restarting...`,
                },
              ],
            };
          } else {
            await this.onRefresh();
            return {
              content: [
                {
                  type: "text" as const,
                  text: `${result.message}\nHot-reloaded.`,
                },
              ],
            };
          }
        } catch (error) {
          this.logger.error(`Error in move_prompt tool:`, error);
          return {
            content: [
              {
                type: "text" as const,
                text: `Failed to move prompt: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Implementation of move prompt logic
   */
  private async movePromptImplementation(
    id: string,
    targetCategory: string
  ): Promise<{ message: string }> {
    const PROMPTS_FILE = this.configManager.getPromptsFilePath();
    const promptsConfigDir = path.dirname(PROMPTS_FILE);
    const messages: string[] = [];

    const fileContent = await readFile(PROMPTS_FILE, "utf8");
    const promptsConfig = JSON.parse(fileContent) as PromptsConfigFile;

    if (!promptsConfig.categories) promptsConfig.categories = [];
    if (!promptsConfig.imports) promptsConfig.imports = [];

    // Find target category
    const targetCategoryId = targetCategory.toLowerCase().replace(/\s+/g, "-");
    const targetCat = promptsConfig.categories.find(
      (cat) => cat.id === targetCategoryId || cat.name.toLowerCase() === targetCategory.toLowerCase()
    );

    if (!targetCat) {
      const available = promptsConfig.categories.map((cat) => cat.id).join(", ");
      throw new Error(
        `Target category '${targetCategory}' not found. Available categories: ${available}`
      );
    }

    // Find the prompt in its current category
    let sourceImportPath: string | null = null;
    let promptEntry: any = null;
    let sourceCategoryPromptsPath: string | null = null;

    for (const categoryImport of promptsConfig.imports) {
      const fullPath = path.join(promptsConfigDir, categoryImport);
      let categoryJson;
      try {
        const content = await readFile(fullPath, "utf8");
        categoryJson = JSON.parse(content);
      } catch {
        continue;
      }

      if (!categoryJson.prompts || !Array.isArray(categoryJson.prompts)) continue;

      const idx = categoryJson.prompts.findIndex((p: PromptData) => p.id === id || p.name === id);
      if (idx > -1) {
        promptEntry = categoryJson.prompts[idx];
        sourceImportPath = categoryImport;
        sourceCategoryPromptsPath = fullPath;

        // Check if already in target category
        const sourceCatId = categoryImport.match(/prompts\/([^/]+)\/prompts\.json$/)?.[1];
        if (sourceCatId === targetCat.id) {
          throw new Error(`Prompt '${id}' is already in category '${targetCat.id}'.`);
        }

        // Remove from source
        categoryJson.prompts.splice(idx, 1);
        await safeWriteFile(fullPath, JSON.stringify(categoryJson, null, 2), "utf8");
        messages.push(`✅ Removed prompt '${id}' from source category.`);
        break;
      }
    }

    if (!promptEntry || !sourceCategoryPromptsPath) {
      throw new Error(`Prompt '${id}' not found in any category.`);
    }

    // Move the .md file
    const sourceDir = path.dirname(sourceCategoryPromptsPath);
    const sourceFile = path.join(sourceDir, promptEntry.file);
    const targetDir = path.join(promptsConfigDir, "prompts", targetCat.id);
    const targetFile = path.join(targetDir, promptEntry.file);

    try {
      const fileContent = await readFile(sourceFile, "utf8");
      await safeWriteFile(targetFile, fileContent, "utf8");
      await fs.unlink(sourceFile);
      messages.push(`✅ Moved file '${promptEntry.file}' to '${targetCat.id}/'.`);
    } catch (e: any) {
      throw new Error(`Failed to move prompt file: ${e.message}`);
    }

    // Add to target category's prompts.json
    const targetPromptsPath = path.join(targetDir, "prompts.json");
    let targetJson: any;
    try {
      const content = await readFile(targetPromptsPath, "utf8");
      targetJson = JSON.parse(content);
    } catch {
      targetJson = { prompts: [] };
    }

    if (!targetJson.prompts) targetJson.prompts = [];
    targetJson.prompts.push(promptEntry);
    await safeWriteFile(targetPromptsPath, JSON.stringify(targetJson, null, 2), "utf8");
    messages.push(`✅ Added prompt '${id}' to category '${targetCat.id}'.`);

    return { message: messages.join("\n") };
  }


  /**
   * Register reload_prompts tool
   */
  registerReloadPrompts(): void {
    this.mcpServer.tool(
      "reload_prompts",
      "Hot-reload all prompts from disk or perform a full server restart. Use after creating, updating, or deleting prompts to refresh the server state.",
      {
        fullServerRestart: z
          .boolean()
          .optional()
          .describe(
            "Whether to perform a full server restart after reloading prompts. Defaults to false (hot-reload only)."
          ),
        reason: z
          .string()
          .optional()
          .describe("Optional reason for reloading/restarting"),
      },
      async (
        {
          fullServerRestart,
          reason,
        }: { fullServerRestart?: boolean; reason?: string },
        extra: any
      ) => {
        const reloadReason = reason || "Manual reload requested";
        this.logger.info(
          `Reload prompts request received${
            fullServerRestart ? " with restart" : ""
          }: ${reloadReason}`
        );

        try {
          if (fullServerRestart) {
            setTimeout(() => this.onRestart(reloadReason), 1000);
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Server is restarting. Reason: ${reloadReason}`,
                },
              ],
            };
          } else {
            await this.onRefresh();
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Successfully hot-reloaded all prompts.",
                },
              ],
            };
          }
        } catch (error) {
          this.logger.error("Error in reload_prompts tool:", error);
          return {
            content: [
              {
                type: "text" as const,
                text: `Failed to reload prompts: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }
}
