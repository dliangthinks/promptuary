/**
 * Prompt Loader Module
 * Handles loading prompts from category-specific configuration files and markdown templates
 */

import * as fs from "fs/promises";
import { readFile } from "fs/promises";
import path from "path";
import { Logger } from "../logging/index.js";
import {
  CategoryPromptsResult,
  PromptData,
  PromptsConfigFile,
} from "../types/index.js";
import { safeWriteFile } from "./promptUtils.js";

/**
 * Prompt Loader class
 */
export class PromptLoader {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Load prompts from category-specific prompts.json files
   */
  async loadCategoryPrompts(
    configPath: string
  ): Promise<CategoryPromptsResult> {
    try {
      this.logger.info(
        `🔍 PromptLoader: Starting to load category prompts from: ${configPath}`
      );

      // Read the promptsConfig.json file
      this.logger.info("📖 Reading promptsConfig.json file...");
      const configContent = await readFile(configPath, "utf8");
      this.logger.info(
        `✓ Config file read successfully, ${configContent.length} characters`
      );

      let promptsConfig: PromptsConfigFile;

      try {
        this.logger.info("🔧 Parsing promptsConfig.json...");
        promptsConfig = JSON.parse(configContent) as PromptsConfigFile;
        this.logger.info("✓ Config file parsed successfully");
      } catch (jsonError) {
        this.logger.error(
          `❌ Error parsing config file ${configPath}:`,
          jsonError
        );
        throw new Error(
          `Invalid JSON in config file: ${
            jsonError instanceof Error ? jsonError.message : String(jsonError)
          }`
        );
      }

      // Log the parsed config structure
      this.logger.info(`📋 Config structure analysis:`);
      this.logger.info(
        `   - Categories defined: ${promptsConfig.categories?.length || 0}`
      );
      this.logger.info(
        `   - Import paths defined: ${promptsConfig.imports?.length || 0}`
      );

      if (promptsConfig.categories?.length > 0) {
        this.logger.info("📂 Categories found:");
        promptsConfig.categories.forEach((cat) => {
          this.logger.info(`   - ${cat.name} (${cat.id}): ${cat.description}`);
        });
      }

      if (promptsConfig.imports?.length > 0) {
        this.logger.info("📥 Import paths to process:");
        promptsConfig.imports.forEach((importPath, index) => {
          this.logger.info(`   ${index + 1}. ${importPath}`);
        });
      }

      // Ensure required properties exist
      if (!promptsConfig.categories) {
        this.logger.warn(
          `⚠️ Config file ${configPath} does not have a 'categories' array. Initializing it.`
        );
        promptsConfig.categories = [];
      }

      if (!promptsConfig.imports || !Array.isArray(promptsConfig.imports)) {
        this.logger.warn(
          `⚠️ Config file ${configPath} does not have a valid 'imports' array. Initializing it.`
        );
        promptsConfig.imports = [];
      }

      // Get the categories from the config
      const categories = promptsConfig.categories;

      // Initialize an array to store all prompts
      let allPrompts: PromptData[] = [];
      let totalImportProcessed = 0;
      let totalImportsFailed = 0;

      this.logger.info(
        `🚀 Starting to process ${promptsConfig.imports.length} import paths...`
      );

      // Load prompts from each import path
      for (const importPath of promptsConfig.imports) {
        totalImportProcessed++;
        this.logger.info(
          `\n📦 Processing import ${totalImportProcessed}/${promptsConfig.imports.length}: ${importPath}`
        );

        try {
          // Construct the full path to the import file
          const fullImportPath = path.join(
            path.dirname(configPath),
            importPath
          );

          this.logger.info(`   🔍 Full path: ${fullImportPath}`);

          // Check if the file exists
          try {
            await fs.access(fullImportPath);
            this.logger.info(`   ✓ Import file exists`);
          } catch (error) {
            this.logger.warn(
              `   ⚠️ Import file not found: ${importPath}. Creating empty file.`
            );

            // Create the directory if it doesn't exist
            const dir = path.dirname(fullImportPath);
            await fs.mkdir(dir, { recursive: true });

            // Create an empty prompts file
            await safeWriteFile(
              fullImportPath,
              JSON.stringify({ prompts: [] }, null, 2),
              "utf8"
            );
            this.logger.info(`   ✓ Created empty prompts file`);
          }

          // Read the file
          this.logger.info(`   📖 Reading import file...`);
          const fileContent = await readFile(fullImportPath, "utf8");
          this.logger.info(
            `   ✓ File read successfully, ${fileContent.length} characters`
          );

          let categoryPromptsFile: any;

          try {
            categoryPromptsFile = JSON.parse(fileContent);
            this.logger.info(`   ✓ Import file parsed successfully`);
          } catch (jsonError) {
            this.logger.error(
              `   ❌ Error parsing import file ${importPath}:`,
              jsonError
            );
            this.logger.info(
              `   🔧 Creating empty prompts file for ${importPath} due to parsing error.`
            );
            categoryPromptsFile = { prompts: [] };
            await safeWriteFile(
              fullImportPath,
              JSON.stringify(categoryPromptsFile, null, 2),
              "utf8"
            );
          }

          // Ensure prompts property exists and is an array
          if (!categoryPromptsFile.prompts) {
            this.logger.warn(
              `   ⚠️ Import file ${importPath} does not have a 'prompts' array. Initializing it.`
            );
            categoryPromptsFile.prompts = [];
            await safeWriteFile(
              fullImportPath,
              JSON.stringify(categoryPromptsFile, null, 2),
              "utf8"
            );
          } else if (!Array.isArray(categoryPromptsFile.prompts)) {
            this.logger.warn(
              `   ⚠️ Import file ${importPath} has an invalid 'prompts' property (not an array). Resetting it.`
            );
            categoryPromptsFile.prompts = [];
            await safeWriteFile(
              fullImportPath,
              JSON.stringify(categoryPromptsFile, null, 2),
              "utf8"
            );
          }

          this.logger.info(
            `   📊 Found ${categoryPromptsFile.prompts.length} prompts in this import`
          );

          // Update the file path to be relative to the category folder
          const categoryPath = path.dirname(importPath);
          const beforeCount = categoryPromptsFile.prompts.length;

          const categoryPrompts = categoryPromptsFile.prompts
            .map((prompt: PromptData, index: number) => {
              // Ensure prompt has all required properties
              if (!prompt.id || !prompt.name || !prompt.file) {
                this.logger.warn(
                  `   ⚠️ Skipping invalid prompt ${
                    index + 1
                  } in ${importPath}: missing required properties (id: ${!!prompt.id}, name: ${!!prompt.name}, file: ${!!prompt.file})`
                );
                return null;
              }

              // Derive category strictly from the directory of the import path
              // This enforces that categories come only from promptsConfig.json structure
              const derivedCategoryId = path.basename(categoryPath);

              // If the file path is already absolute or starts with the category folder, keep it as is
              if (
                prompt.file.startsWith("/") ||
                prompt.file.startsWith(categoryPath)
              ) {
                return {
                  ...prompt,
                  // Override any category specified in the prompt with the derived category
                  category: derivedCategoryId,
                };
              }

              // Otherwise, update the file path to include the category folder
              return {
                ...prompt,
                // Override any category specified in the prompt with the derived category
                category: derivedCategoryId,
                file: path.join(categoryPath, prompt.file),
              };
            })
            .filter(Boolean); // Remove any null entries (invalid prompts)

          const afterCount = categoryPrompts.length;
          if (beforeCount !== afterCount) {
            this.logger.warn(
              `   ⚠️ ${
                beforeCount - afterCount
              } prompts were filtered out due to validation issues`
            );
          }

          this.logger.info(
            `   ✅ Successfully processed ${afterCount} valid prompts from ${importPath}`
          );

          // Add the prompts to the array
          allPrompts = [...allPrompts, ...categoryPrompts];
        } catch (error) {
          totalImportsFailed++;
          this.logger.error(
            `   ❌ Error loading prompts from ${importPath}:`,
            error
          );
        }
      }

      this.logger.info(`\n🎯 IMPORT PROCESSING SUMMARY:`);
      this.logger.info(`   Total imports processed: ${totalImportProcessed}`);
      this.logger.info(`   Imports failed: ${totalImportsFailed}`);
      this.logger.info(
        `   Imports succeeded: ${totalImportProcessed - totalImportsFailed}`
      );
      this.logger.info(`   Total prompts collected: ${allPrompts.length}`);
      this.logger.info(`   Categories available: ${categories.length}`);

      const result = { promptsData: allPrompts, categories };
      this.logger.info(
        `✅ PromptLoader.loadCategoryPrompts() completed successfully`
      );

      return result;
    } catch (error) {
      this.logger.error(`❌ PromptLoader.loadCategoryPrompts() FAILED:`, error);
      throw error;
    }
  }

  /**
   * Load prompt content from markdown file
   */
  async loadPromptFile(
    filePath: string,
    basePath: string
  ): Promise<{
    systemMessage?: string;
    userMessageTemplate: string;
  }> {
    try {
      const fullPath = path.join(basePath, filePath);
      const content = await readFile(fullPath, "utf8");

      // Extract system message and user message template from markdown
      const systemMessageMatch = content.match(
        /## System Message\s*\n([\s\S]*?)(?=\n##|$)/
      );
      const userMessageMatch = content.match(
        /## User Message Template\s*\n([\s\S]*?)(?=\n##|$)/
      );

      const systemMessage = systemMessageMatch
        ? systemMessageMatch[1].trim()
        : undefined;
      const userMessageTemplate = userMessageMatch
        ? userMessageMatch[1].trim()
        : "";

      if (!userMessageTemplate) {
        throw new Error(`No user message template found in ${filePath}`);
      }

      return { systemMessage, userMessageTemplate };
    } catch (error) {
      this.logger.error(`Error loading prompt file ${filePath}:`, error);
      throw error;
    }
  }
}
