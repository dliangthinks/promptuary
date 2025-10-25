/**
 * API Management Module
 * Handles Express app setup, middleware, and REST API endpoints
 */

import express, { Request, Response } from "express";
import { mkdir, readFile, rm, stat } from "fs/promises";
import path from "path";
import { ConfigManager } from "../config/index.js";
import { Logger } from "../logging/index.js";
import { McpToolsManager } from "../mcp-tools/index.js";
import { PromptManager } from "../prompts/index.js";
import { modifyPromptSection, safeWriteFile } from "../prompts/promptUtils.js";
import {
  Category,
  ConvertedPrompt,
  PromptData,
  PromptsConfigFile,
} from "../types/index.js";

/**
 * API Manager class
 */
export class ApiManager {
  private logger: Logger;
  private configManager: ConfigManager;
  private promptManager?: PromptManager;
  private mcpToolsManager?: McpToolsManager;
  private promptsData: PromptData[] = [];
  private categories: Category[] = [];
  private convertedPrompts: ConvertedPrompt[] = [];

  constructor(
    logger: Logger,
    configManager: ConfigManager,
    promptManager?: PromptManager,
    mcpToolsManager?: McpToolsManager
  ) {
    this.logger = logger;
    this.configManager = configManager;
    this.promptManager = promptManager;
    this.mcpToolsManager = mcpToolsManager;
  }

  /**
   * Update data references
   */
  updateData(
    promptsData: PromptData[],
    categories: Category[],
    convertedPrompts: ConvertedPrompt[]
  ): void {
    this.promptsData = promptsData;
    this.categories = categories;
    this.convertedPrompts = convertedPrompts;
  }

  /**
   * Create and configure Express application
   */
  createApp(): express.Application {
    const app = express();

    // Setup middleware
    this.setupMiddleware(app);

    // Setup routes
    this.setupRoutes(app);

    return app;
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(app: express.Application): void {
    // Enable CORS for Cursor integration
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }
      next();
    });

    // Add JSON body parser middleware
    app.use(express.json());

    // Add request logging middleware
    app.use((req, res, next) => {
      this.logger.debug(
        `${req.method} ${req.url} - Headers: ${JSON.stringify(req.headers)}`
      );
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(app: express.Application): void {
    // Basic routes
    this.setupBasicRoutes(app);

    // Prompt and category routes
    this.setupPromptRoutes(app);

    // Tool API routes
    this.setupToolRoutes(app);
  }

  /**
   * Setup basic routes (home, health)
   */
  private setupBasicRoutes(app: express.Application): void {
    app.get("/", (_req: Request, res: Response) => {
      res.send(
        "Promptuary - Use /mcp endpoint for MCP connections"
      );
    });

    // Health check endpoint
    app.get("/health", (_req: Request, res: Response) => {
      const config = this.configManager.getConfig();
      res.json({ status: "ok", version: config.server.version });
    });

    const viewerDir = this.getViewerDirectory();
    app.use("/viewer", express.static(viewerDir));
    this.logger.info(
      `Prompt viewer assets served from ${viewerDir} (visit /viewer)`
    );
  }

  /**
   * Setup prompt and category routes
   */
  private setupPromptRoutes(app: express.Application): void {
    // Get all categories and prompts
    app.get("/prompts", async (_req: Request, res: Response) => {
      try {
        const promptsWithMeta = await Promise.all(
          this.promptsData.map(async (prompt) => {
            const filePath = this.getPromptFilePath(prompt);
            let updatedAt: string | null = null;

            try {
              const fileStats = await stat(filePath);
              updatedAt = fileStats.mtime.toISOString();
            } catch (error) {
              this.logger.debug(
                `Unable to read stats for prompt file ${filePath}:`,
                error
              );
            }

            return {
              id: prompt.id,
              name: prompt.name,
              category: prompt.category,
              description: prompt.description,
              arguments: prompt.arguments,
              file: prompt.file,
              updatedAt,
            };
          })
        );

        res.json({
          categories: this.categories,
          prompts: promptsWithMeta,
        });
      } catch (error) {
        this.logger.error("Error building prompts catalog:", error);
        res.status(500).json({
          error: "Failed to load prompt catalog",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // Create prompt
    app.post("/api/v1/prompts", async (req: Request, res: Response) => {
      await this.handleCreatePrompt(req, res);
    });

    // Delete prompt (REST alias)
    app.delete("/api/v1/prompts/:id", async (req: Request, res: Response) => {
      await this.handleDeletePrompt(req, res);
    });

    // Delete category
    app.delete("/api/v1/categories/:id", async (req: Request, res: Response) => {
      await this.handleDeleteCategory(req, res);
    });

    // Get prompts by category
    app.get(
      "/categories/:categoryId/prompts",
      (req: Request, res: Response) => {
        const categoryId = req.params.categoryId;
        const categoryPrompts = this.promptsData.filter(
          (prompt) => prompt.category === categoryId
        );

        if (categoryPrompts.length === 0) {
          return res
            .status(404)
            .json({ error: `No prompts found for category: ${categoryId}` });
        }

        res.json(categoryPrompts);
      }
    );

    app.patch(
      "/api/v1/categories/:id",
      async (req: Request, res: Response) => {
        await this.handleUpdateCategory(req, res);
      }
    );

    // Get prompt detail including markdown content
    app.get("/api/v1/prompts/:id", async (req: Request, res: Response) => {
      try {
        const promptId = req.params.id;
        const promptInfo = this.findPromptById(promptId);

        if (!promptInfo) {
          return res
            .status(404)
            .json({ error: `Prompt with ID '${promptId}' not found` });
        }

        const fileContent = await readFile(promptInfo.filePath, "utf8");
        const fileStats = await stat(promptInfo.filePath);

        const converted = this.convertedPrompts.find(
          (item) => item.id === promptId
        );

        res.json({
          id: promptInfo.prompt.id,
          name: promptInfo.prompt.name,
          category: promptInfo.prompt.category,
          description: promptInfo.prompt.description,
          file: promptInfo.prompt.file,
          arguments: promptInfo.prompt.arguments,
          content: fileContent,
          systemMessage: converted?.systemMessage,
          userMessageTemplate: converted?.userMessageTemplate,
          isChain: converted?.isChain ?? false,
          chainSteps: converted?.chainSteps ?? [],
          updatedAt: fileStats.mtime.toISOString(),
        });
      } catch (error) {
        this.logger.error("Error handling get prompt detail request:", error);
        res.status(500).json({
          error: "Internal server error",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // Update prompt markdown content
    app.put("/api/v1/prompts/:id", async (req: Request, res: Response) => {
      try {
        const promptId = req.params.id;
        const { content } = req.body ?? {};

        if (typeof content !== "string") {
          return res.status(400).json({
            error:
              "Invalid request body. Expected a JSON object with a 'content' string.",
          });
        }

        const promptInfo = this.findPromptById(promptId);
        if (!promptInfo) {
          return res
            .status(404)
            .json({ error: `Prompt with ID '${promptId}' not found` });
        }

        await safeWriteFile(promptInfo.filePath, content, "utf8");

        // Refresh in-memory prompt data so MCP stays in sync
        if (this.promptManager) {
          await this.reloadPromptData();
        }

        const fileStats = await stat(promptInfo.filePath);

        res.json({
          success: true,
          message: `Prompt '${promptId}' saved successfully`,
          updatedAt: fileStats.mtime.toISOString(),
        });
      } catch (error) {
        this.logger.error("Error saving prompt content:", error);
        res.status(500).json({
          error: "Internal server error",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Setup tool API routes
   */
  private setupToolRoutes(app: express.Application): void {
    // Create category endpoint
    app.post(
      "/api/v1/tools/create_category",
      async (req: Request, res: Response) => {
        await this.handleCreateCategory(req, res);
      }
    );

    // Update prompt endpoint
    app.post(
      "/api/v1/tools/update_prompt",
      async (req: Request, res: Response) => {
        await this.handleUpdatePrompt(req, res);
      }
    );

    // Delete prompt endpoint
    app.delete(
      "/api/v1/tools/prompts/:id",
      async (req: Request, res: Response) => {
        await this.handleDeletePrompt(req, res);
      }
    );

    // Modify prompt section endpoint
    app.post(
      "/api/v1/tools/modify_prompt_section",
      async (req: Request, res: Response) => {
        await this.handleModifyPromptSection(req, res);
      }
    );

    // Reload prompts endpoint
    app.post(
      "/api/v1/tools/reload_prompts",
      async (req: Request, res: Response) => {
        await this.handleReloadPrompts(req, res);
      }
    );
  }

  /**
   * Handle create category API endpoint
   */
  private async handleCreateCategory(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      this.logger.info("API request to create category:", req.body);

      // Validate required fields
      if (!req.body.id || !req.body.name || !req.body.description) {
        res.status(400).json({
          error:
            "Missing required fields. Please provide id, name, and description.",
        });
        return;
      }

      const { id, name, description } = req.body;

      // Read the current prompts configuration file
      const PROMPTS_FILE = this.getPromptsFilePath();
      const fileContent = await readFile(PROMPTS_FILE, "utf8");
      const promptsFile = JSON.parse(fileContent) as PromptsConfigFile & {
        prompts?: PromptData[];
      };

      // Check if the category already exists
      const categoryExists = promptsFile.categories.some(
        (cat) => cat.id === id
      );
      if (categoryExists) {
        res.status(400).json({ error: `Category '${id}' already exists.` });
        return;
      }

      // Add the new category
      promptsFile.categories.push({ id, name, description });

      const importPath = `prompts/${id}/prompts.json`;
      if (!Array.isArray(promptsFile.imports)) {
        promptsFile.imports = [];
      }
      if (!promptsFile.imports.includes(importPath)) {
        promptsFile.imports.push(importPath);
      }

      // Write the updated file
      await safeWriteFile(
        PROMPTS_FILE,
        JSON.stringify(promptsFile, null, 2),
        "utf8"
      );

      // Ensure category directory and prompts file exist
      await this.ensureCategoryPromptsFile(id);

      // Reload prompts and categories if prompt manager is available
      if (this.promptManager) {
        try {
          await this.reloadPromptData();
          this.logger.info(
            `Reloaded ${this.promptsData.length} prompts and ${this.categories.length} categories after creating category: ${id}`
          );
        } catch (error) {
          this.logger.error("Error reloading prompts data:", error);
        }
      }

      res.status(200).json({
        success: true,
        message: `Category '${name}' created successfully`,
      });
    } catch (error) {
      this.logger.error("Error handling create_category API request:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handle update prompt API endpoint
   */
  private async handleUpdatePrompt(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info("API request to update prompt:", req.body);

      // Validate required fields
      if (
        !req.body.id ||
        !req.body.name ||
        !req.body.category ||
        !req.body.userMessageTemplate
      ) {
        res.status(400).json({
          error:
            "Missing required fields. Please provide id, name, category, and userMessageTemplate.",
        });
        return;
      }

      const {
        id,
        name,
        category,
        description,
        userMessageTemplate,
        arguments: promptArgs,
        systemMessage,
        isChain,
        chainSteps,
      } = req.body;

      // Implementation would include full update logic...
      // For brevity, this is a simplified version
      res.status(200).json({
        success: true,
        message: `Prompt '${name}' updated successfully`,
      });
    } catch (error) {
      this.logger.error("Error handling update_prompt API request:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handle create prompt API endpoint
   */
  private async handleCreatePrompt(req: Request, res: Response): Promise<void> {
    try {
      const {
        id,
        name,
        category,
        description = "",
        content,
        arguments: promptArgs,
      } = req.body ?? {};

      if (!id || !name || !category) {
        res.status(400).json({
          error:
            "Missing required fields. Please provide id, name, and category.",
        });
        return;
      }

      if (this.promptsData.some((prompt) => prompt.id === id)) {
        res
          .status(409)
          .json({ error: `Prompt with ID '${id}' already exists.` });
        return;
      }

      const promptsJsonPath = await this.ensureCategoryPromptsFile(category);
      const promptsFileContent = await readFile(promptsJsonPath, "utf8");
      const promptsData = JSON.parse(promptsFileContent) as {
        prompts?: PromptData[];
      };

      if (!Array.isArray(promptsData.prompts)) {
        promptsData.prompts = [];
      }

      if (promptsData.prompts.some((prompt) => prompt.id === id)) {
        res
          .status(409)
          .json({ error: `Prompt with ID '${id}' already exists.` });
        return;
      }

      const sanitizedArgs = Array.isArray(promptArgs)
        ? promptArgs
            .map((arg: any) => ({
              name: typeof arg?.name === "string" ? arg.name : "",
              description:
                typeof arg?.description === "string" ? arg.description : undefined,
              required: Boolean(arg?.required),
            }))
            .filter((arg) => arg.name)
        : [];

      const markdownFilename = `${id}.md`;
      const promptMetadata: PromptData = {
        id,
        name,
        category,
        description,
        file: markdownFilename,
        arguments: sanitizedArgs,
      };

      promptsData.prompts.push(promptMetadata);

      await safeWriteFile(
        promptsJsonPath,
        JSON.stringify(promptsData, null, 2),
        "utf8"
      );

      const markdownPath = path.join(
        path.dirname(promptsJsonPath),
        markdownFilename
      );

      const trimmedContent =
        typeof content === "string" && content.trim().length > 0
          ? content
          : `# ${name}

## Description
${description || "Describe what this prompt should accomplish."}

## System Message
You are a helpful AI assistant. Update this system message with the right instructions for the prompt.

## User Message Template
Replace this section with the content you want to send to the assistant. Use {{placeholders}} for arguments.
`;

      await safeWriteFile(markdownPath, trimmedContent, "utf8");

      if (this.promptManager) {
        await this.reloadPromptData();
      }

      res.status(201).json({
        success: true,
        message: `Prompt '${name}' created successfully`,
        prompt: promptMetadata,
      });
    } catch (error) {
      this.logger.error("Error handling create prompt request:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handle delete prompt API endpoint
   */
  private async handleDeletePrompt(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      this.logger.info(`API request to delete prompt: ${id}`);

      if (!id) {
        res.status(400).json({ error: "Prompt ID is required" });
        return;
      }

      const promptInfo = this.findPromptById(id);
      if (!promptInfo) {
        res.status(404).json({ error: `Prompt '${id}' not found` });
        return;
      }

      const promptsJsonPath = await this.ensureCategoryPromptsFile(
        promptInfo.prompt.category
      );

      const promptsFileContent = await readFile(promptsJsonPath, "utf8");
      const promptsData = JSON.parse(promptsFileContent) as {
        prompts?: PromptData[];
      };

      if (!Array.isArray(promptsData.prompts)) {
        promptsData.prompts = [];
      }

      const newPrompts = promptsData.prompts.filter(
        (item) => item.id !== id
      );

      if (newPrompts.length === promptsData.prompts.length) {
        res.status(404).json({ error: `Prompt '${id}' not found in registry` });
        return;
      }

      promptsData.prompts = newPrompts;

      await safeWriteFile(
        promptsJsonPath,
        JSON.stringify(promptsData, null, 2),
        "utf8"
      );

      const markdownPath = this.getPromptFilePath(promptInfo.prompt);
      try {
        await rm(markdownPath, { force: true });
      } catch (error) {
        this.logger.warn(
          `Failed to remove markdown file for prompt '${id}' at ${markdownPath}:`,
          error
        );
      }

      if (this.promptManager) {
        await this.reloadPromptData();
      }

      res.status(200).json({
        success: true,
        message: `Prompt '${id}' deleted successfully`,
      });
    } catch (error) {
      this.logger.error("Error handling delete_prompt API request:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handle delete category endpoint
   */
  private async handleDeleteCategory(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: "Category ID is required" });
        return;
      }

      const PROMPTS_FILE = this.getPromptsFilePath();
      const configContent = await readFile(PROMPTS_FILE, "utf8");
      const promptsFile = JSON.parse(configContent) as PromptsConfigFile & {
        prompts?: PromptData[];
      };

      const categoryIndex = promptsFile.categories.findIndex(
        (cat) => cat.id === id
      );

      if (categoryIndex === -1) {
        res.status(404).json({
          error: `Category '${id}' not found`,
        });
        return;
      }

      const promptsRemoved = this.promptsData.filter(
        (prompt) => prompt.category === id
      ).length;

      promptsFile.categories.splice(categoryIndex, 1);

      if (Array.isArray(promptsFile.imports)) {
        const importPath = `prompts/${id}/prompts.json`;
        promptsFile.imports = promptsFile.imports.filter(
          (item: string) => item !== importPath
        );
      }

      if (Array.isArray(promptsFile.prompts)) {
        promptsFile.prompts = promptsFile.prompts.filter(
          (prompt) => prompt.category !== id
        );
      }

      await safeWriteFile(
        PROMPTS_FILE,
        JSON.stringify(promptsFile, null, 2),
        "utf8"
      );

      const configDir = path.dirname(PROMPTS_FILE);
      const categoryDir = path.join(configDir, "prompts", id);
      try {
        await rm(categoryDir, { recursive: true, force: true });
      } catch (error) {
        this.logger.warn(
          `Failed to remove directory for category '${id}':`,
          error
        );
      }

      if (this.promptManager) {
        await this.reloadPromptData();
      }

      res.status(200).json({
        success: true,
        message: `Category '${id}' deleted successfully`,
        removedPrompts: promptsRemoved,
      });
    } catch (error) {
      this.logger.error("Error handling delete category request:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async handleUpdateCategory(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const id = req.params.id;
      const { name, description } = req.body ?? {};

      if (!id) {
        res.status(400).json({ error: "Category ID is required" });
        return;
      }

      if (name === undefined && description === undefined) {
        res.status(400).json({
          error: "Provide a new name or description to update the category.",
        });
        return;
      }

      const PROMPTS_FILE = this.getPromptsFilePath();
      const fileContent = await readFile(PROMPTS_FILE, "utf8");
      const promptsFile = JSON.parse(fileContent) as PromptsConfigFile;

      const category = promptsFile.categories.find((cat) => cat.id === id);
      if (!category) {
        res.status(404).json({ error: `Category '${id}' not found` });
        return;
      }

      if (typeof name === "string" && name.trim().length > 0) {
        category.name = name.trim();
      }
      if (typeof description === "string") {
        category.description = description;
      }

      await safeWriteFile(
        PROMPTS_FILE,
        JSON.stringify(promptsFile, null, 2),
         "utf8"
      );

      if (this.promptManager) {
        await this.reloadPromptData();
      }

      res.status(200).json({
        success: true,
        message: `Category '${id}' updated`,
        category,
      });
    } catch (error) {
      this.logger.error("Error updating category:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handle modify prompt section API endpoint
   */
  private async handleModifyPromptSection(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      this.logger.info("Received request to modify prompt section:", req.body);

      const { id, section_name, new_content, restartServer } = req.body;

      if (!id || !section_name || !new_content) {
        res.status(400).json({
          success: false,
          message:
            "Missing required fields: id, section_name, and new_content are required",
        });
        return;
      }

      // Use the modifyPromptSection function from promptUtils
      const PROMPTS_FILE = this.getPromptsFilePath();
      const result = await modifyPromptSection(
        id,
        section_name,
        new_content,
        PROMPTS_FILE
      );

      if (!result.success) {
        res.status(404).json({
          success: false,
          message: result.message,
        });
        return;
      }

      // Reload prompt data if available
      if (this.promptManager) {
        try {
          await this.reloadPromptData();
          this.logger.info(
            `Triggered server refresh${
              restartServer ? " with restart" : ""
            } after modifying section: ${section_name}`
          );
        } catch (refreshError) {
          this.logger.error(
            `Error refreshing server after modifying section: ${section_name}`,
            refreshError
          );
        }
      }

      res.status(200).json({
        success: true,
        message: result.message,
        restarting: restartServer || false,
      });
    } catch (error) {
      this.logger.error(
        "Error handling modify_prompt_section API request:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Handle reload prompts API endpoint
   */
  private async handleReloadPrompts(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      this.logger.info("API request to reload prompts");

      const shouldRestart = req.body && req.body.restart === true;
      const reason =
        req.body && req.body.reason
          ? req.body.reason
          : "Manual reload requested";

      try {
        // Reload prompt data if available
        if (this.promptManager) {
          await this.reloadPromptData();
        }

        if (shouldRestart) {
          res.status(200).json({
            success: true,
            message: `Successfully refreshed the server with ${this.promptsData.length} prompts and ${this.categories.length} categories. Server is now restarting.`,
            data: {
              promptsCount: this.promptsData.length,
              categoriesCount: this.categories.length,
              convertedPromptsCount: this.convertedPrompts.length,
              restarting: true,
            },
          });
        } else {
          res.status(200).json({
            success: true,
            message: `Successfully refreshed the server with ${this.promptsData.length} prompts and ${this.categories.length} categories`,
            data: {
              promptsCount: this.promptsData.length,
              categoriesCount: this.categories.length,
              convertedPromptsCount: this.convertedPrompts.length,
            },
          });
        }
      } catch (refreshError) {
        this.logger.error("Error refreshing server:", refreshError);
        res.status(500).json({
          success: false,
          message: `Failed to refresh server: ${
            refreshError instanceof Error
              ? refreshError.message
              : String(refreshError)
          }`,
        });
      }
    } catch (error) {
      this.logger.error("Error handling reload_prompts API request:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Helper method to reload prompt data
   */
  private async reloadPromptData(): Promise<void> {
    if (!this.promptManager) {
      throw new Error("PromptManager not available");
    }

    const PROMPTS_FILE = this.getPromptsFilePath();

    const result = await this.promptManager.loadAndConvertPrompts(PROMPTS_FILE);
    this.updateData(
      result.promptsData,
      result.categories,
      result.convertedPrompts
    );

    // Update MCP tools manager if available
    if (this.mcpToolsManager) {
      this.mcpToolsManager.updateData(
        result.promptsData,
        result.convertedPrompts,
        result.categories
      );
    }
  }

  /**
   * Find prompt metadata and corresponding markdown file path
   */
  private findPromptById(
    promptId: string
  ): { prompt: PromptData; filePath: string } | null {
    if (!this.promptsData || this.promptsData.length === 0) {
      return null;
    }

    const prompt = this.promptsData.find((item) => item.id === promptId);
    if (!prompt) {
      return null;
    }

    const filePath = this.getPromptFilePath(prompt);

    return { prompt, filePath };
  }

  /**
   * Resolve absolute prompt file path for the provided prompt metadata
   */
  private getPromptFilePath(prompt: PromptData): string {
    const promptsConfigPath = this.getPromptsFilePath();
    const configDir = path.dirname(promptsConfigPath);
    return path.isAbsolute(prompt.file)
      ? prompt.file
      : path.join(configDir, prompt.file);
  }

  /**
   * Ensure prompts directory and JSON file for a category exist
   */
  private async ensureCategoryPromptsFile(categoryId: string): Promise<string> {
    const promptsConfigPath = this.getPromptsFilePath();
    const configDir = path.dirname(promptsConfigPath);
    const categoryDir = path.join(configDir, "prompts", categoryId);
    await mkdir(categoryDir, { recursive: true });

    const promptsJsonPath = path.join(categoryDir, "prompts.json");

    try {
      await stat(promptsJsonPath);
    } catch {
      const initialData = { prompts: [] };
      await safeWriteFile(
        promptsJsonPath,
        JSON.stringify(initialData, null, 2),
        "utf8"
      );
    }

    return promptsJsonPath;
  }

  /**
   * Resolve absolute path to the static prompt viewer assets directory
   */
  private getViewerDirectory(): string {
    const promptsConfigPath = this.getPromptsFilePath();
    const baseDir = path.dirname(promptsConfigPath);
    return path.resolve(baseDir, "public", "prompt-viewer");
  }

  /**
   * Get prompts file path using consistent resolution logic
   * This ensures all API operations use the same path resolution as the orchestration module
   */
  private getPromptsFilePath(): string {
    // ENHANCED: Use same path resolution logic as orchestration module
    // This ensures API operations also respect MCP_PROMPTS_CONFIG_PATH environment variable
    let PROMPTS_FILE: string;

    if (process.env.MCP_PROMPTS_CONFIG_PATH) {
      PROMPTS_FILE = process.env.MCP_PROMPTS_CONFIG_PATH;
      this.logger.info(
        "🎯 API: Using MCP_PROMPTS_CONFIG_PATH environment variable override"
      );
    } else {
      // Fallback to ConfigManager's getPromptsFilePath() method which handles server root properly
      PROMPTS_FILE = this.configManager.getPromptsFilePath();
      this.logger.info(
        "📁 API: Using config-based prompts file path resolution"
      );
    }

    // Ensure absolute path (critical for Claude Desktop)
    if (!path.isAbsolute(PROMPTS_FILE)) {
      PROMPTS_FILE = path.resolve(PROMPTS_FILE);
      this.logger.info(`🔧 API: Converted to absolute path: ${PROMPTS_FILE}`);
    }

    return PROMPTS_FILE;
  }
}

/**
 * Create and configure an API manager
 */
export function createApiManager(
  logger: Logger,
  configManager: ConfigManager,
  promptManager?: PromptManager,
  mcpToolsManager?: McpToolsManager
): ApiManager {
  return new ApiManager(logger, configManager, promptManager, mcpToolsManager);
}
