Claude Desktop can show a user input via user_config and map it to an env var. The issue you hit (“it always looked under server”) comes from a couple of places in your server code that still assume the prompts live under the repo, even when MCP_PROMPTS_CONFIG_PATH is set.

Here’s how to make your setup work end‑to‑end.

What to change

manifest.json: Use user_config to collect the path and wire it into env.
Startup bootstrap: If MCP_PROMPTS_CONFIG_PATH points to a new location, copy defaults (prompts + promptsConfig.json) there on first run. Also support the user giving a directory instead of the file path.
API path fix: Stop using process.cwd()/prompts in API; derive target folders from the prompts config path.
Concrete edits

manifest.json
Add env mapping and user_config. This keeps your earlier approach but clarifies the input and avoids surprises.
manifest.json: inside server.mcp_config and at the top-level

manifest.json:15 (after the args array)
"env": {
"MCP_PROMPTS_CONFIG_PATH": "${user_config.prompts_config_path}"
}
manifest.json:... (top-level sibling to server)
"user_config": {
"prompts_config_path": {
"type": "string",
"title": "Prompts config file",
"description": "Absolute path to promptsConfig.json (the server will copy default prompts here on first run)",
"required": true
}
}
Bootstrap prompts on first run
Add a helper to the orchestrator that:
Normalizes MCP_PROMPTS_CONFIG_PATH: if it’s a directory, append promptsConfig.json and update the env.
Creates the directory if needed.
Copies server/prompts and server/promptsConfig.json to the selected directory if they don’t exist yet.
server/src/orchestration/index.ts:416

Just before resolving PROMPTS_FILE, insert a call to the bootstrap:
// Ensure user-selected prompts location is initialized if using env override
const serverRoot = await this.determineServerRoot();
await this.ensurePromptsBootstrapIfNeeded(serverRoot);

Add this method to the class (near other private helpers):
private async ensurePromptsBootstrapIfNeeded(serverRoot: string): Promise<void> {
const envVal = process.env.MCP_PROMPTS_CONFIG_PATH;
if (!envVal) return;

const fs = await import("fs/promises");
const isJsonPath = envVal.toLowerCase().endsWith(".json");
const configPath = isJsonPath ? path.resolve(envVal) : path.join(path.resolve(envVal), "promptsConfig.json");
const targetDir = path.dirname(configPath);

// If user provided a directory, normalize env to the config file path
if (!isJsonPath) {
process.env.MCP_PROMPTS_CONFIG_PATH = configPath;
}

// Ensure target dir exists
await fs.mkdir(targetDir, { recursive: true });

// Source defaults under the server root
const sourceConfig = path.join(serverRoot, "promptsConfig.json");
const sourcePromptsDir = path.join(serverRoot, "prompts");
const targetPromptsDir = path.join(targetDir, "prompts");

// Copy promptsConfig.json if missing
try {
await fs.access(configPath);
} catch {
await fs.copyFile(sourceConfig, configPath);
if (this.logger) this.logger.info(Copied default promptsConfig.json to ${configPath});
}

// Copy prompts dir if missing
let needCopyPrompts = false;
try {
await fs.access(targetPromptsDir);
} catch {
needCopyPrompts = true;
}

if (needCopyPrompts) {
await this.recursiveCopyDir(sourcePromptsDir, targetPromptsDir);
if (this.logger) this.logger.info(Copied default prompts folder to ${targetPromptsDir});
}
}

// Minimal recursive copy (Node 16+ safe)
private async recursiveCopyDir(src: string, dest: string): Promise<void> {
const fs = await import("fs/promises");
await fs.mkdir(dest, { recursive: true });
const entries = await fs.readdir(src, { withFileTypes: true });
for (const entry of entries) {
const s = path.join(src, entry.name);
const d = path.join(dest, entry.name);
if (entry.isDirectory()) {
await this.recursiveCopyDir(s, d);
} else if (entry.isFile()) {
await fs.copyFile(s, d);
}
}
}

Fix API to not assume server/prompts
In create category, use the prompts config directory instead of process.cwd().
server/src/api/index.ts:259

Replace:
const categoryDirPath = path.join(process.cwd(), "prompts", id);
With:
const baseDir = path.dirname(this.getPromptsFilePath());
const categoryDirPath = path.join(baseDir, id);
Why this solves “always looked under server”

Loader pathing is already correct when MCP_PROMPTS_CONFIG_PATH is set (it uses path.dirname(PROMPTS_FILE) as the base). The sticking points were:
API create-category writing to process.cwd()/prompts.
No bootstrap to copy defaults into a user-selected location at first run.
With these changes, all read/write operations resolve relative to the selected prompts config path.
About user input type

If the user enters a directory instead of a file, the bootstrap normalizes it by appending promptsConfig.json and updates MCP_PROMPTS_CONFIG_PATH in-process, so the run succeeds and files are placed correctly.
The manifest description explicitly asks for the promptsConfig.json file path to keep the UX unambiguous.