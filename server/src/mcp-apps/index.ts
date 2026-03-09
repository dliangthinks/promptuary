import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";

// Resolve app dist directory relative to this file's location
// From compiled dist/mcp-apps/index.js -> ../../app/dist/
// From source  src/mcp-apps/index.ts  -> ../../app/dist/
function getAppDistDir(): string {
  const thisDir = import.meta.dirname;
  return path.resolve(thisDir, "..", "..", "app", "dist");
}

export function registerMcpApps(
  mcpServer: any,
  logger: { info: (msg: string) => void; warn: (msg: string) => void }
): void {
  const resourceUri = "ui://promptuary/index.html";
  const appDistDir = getAppDistDir();

  // Register the App tool — entry point for opening the prompt manager UI
  registerAppTool(
    mcpServer,
    "prompt_manager",
    {
      title: "Prompt Manager",
      description:
        "Opens the Promptuary prompt management UI. Browse, execute, edit, and delete prompts via an interactive icon grid interface.",
      inputSchema: {},
      _meta: { ui: { resourceUri } },
    },
    async (): Promise<CallToolResult> => {
      // Return a text summary for non-UI hosts
      return {
        content: [
          {
            type: "text",
            text: "Promptuary Prompt Manager is ready. Use the interactive UI to browse and manage your prompts. If you are in a non-UI host, use the individual tools: list_prompts, execute_prompt, update_prompt, delete_prompt, create_category, delete_category, reload_prompts.",
          },
        ],
      };
    }
  );

  // Register the HTML resource that serves the bundled React app
  registerAppResource(
    mcpServer,
    "Promptuary App",
    resourceUri,
    {
      description: "Interactive prompt management UI for Promptuary",
      mimeType: RESOURCE_MIME_TYPE,
    },
    async (): Promise<ReadResourceResult> => {
      const htmlPath = path.join(appDistDir, "index.html");
      try {
        const html = await fs.readFile(htmlPath, "utf-8");
        return {
          contents: [
            { uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html },
          ],
        };
      } catch (err) {
        logger.warn(
          `Failed to read app bundle at ${htmlPath}: ${err instanceof Error ? err.message : String(err)}`
        );
        return {
          contents: [
            {
              uri: resourceUri,
              mimeType: RESOURCE_MIME_TYPE,
              text: "<html><body><p>App bundle not found. Run <code>npm run build:app</code> to build the Promptuary UI.</p></body></html>",
            },
          ],
        };
      }
    }
  );

  logger.info("MCP Apps registered: prompt_manager tool + promptuary app resource");
}
