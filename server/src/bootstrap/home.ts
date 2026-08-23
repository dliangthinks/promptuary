/**
 * PROMPTUARY_HOME bootstrap
 *
 * When the PROMPTUARY_HOME environment variable is set, the prompt library
 * lives in that directory instead of inside the server installation. This is
 * how the Claude Code plugin keeps user prompts safe across plugin updates:
 * the plugin cache directory is replaced on every update, so anything stored
 * inside it would be lost.
 *
 * On first run the directory is seeded from the bundled default library
 * (promptsConfig.json + prompts/ next to the compiled server). After that the
 * server simply loads from PROMPTUARY_HOME via the existing
 * MCP_PROMPTS_CONFIG_PATH override, which every downstream code path already
 * honors. An explicitly set MCP_PROMPTS_CONFIG_PATH always wins.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";

/**
 * Expand a leading "~" to the user's home directory.
 */
function expandTilde(p: string): string {
  if (p === "~") return os.homedir();
  if (p.startsWith("~/") || p.startsWith("~\\")) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

/**
 * Resolve PROMPTUARY_HOME, seed it on first run, and route prompt loading
 * to it. No-op when the variable is not set.
 */
export function bootstrapPromptuaryHome(): void {
  const raw = process.env.PROMPTUARY_HOME;
  if (!raw || !raw.trim()) return;

  const home = path.resolve(expandTilde(raw.trim()));
  const configPath = path.join(home, "promptsConfig.json");

  if (!fs.existsSync(configPath)) {
    // Bundled defaults sit next to the compiled server:
    // dist/bootstrap/home.js -> ../.. = server root
    const serverRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      ".."
    );
    const defaultConfig = path.join(serverRoot, "promptsConfig.json");
    const defaultPrompts = path.join(serverRoot, "prompts");

    if (!fs.existsSync(defaultConfig) || !fs.existsSync(defaultPrompts)) {
      console.error(
        `PROMPTUARY_HOME set to "${home}" but it is empty and the bundled ` +
          `default library was not found at "${serverRoot}". Falling back ` +
          `to normal prompt path resolution.`
      );
      return;
    }

    fs.mkdirSync(home, { recursive: true });
    fs.copyFileSync(defaultConfig, configPath);
    fs.cpSync(defaultPrompts, path.join(home, "prompts"), {
      recursive: true,
      // A partially seeded directory (e.g. from an interrupted first run)
      // should not block completion of the seeding
      force: false,
      errorOnExist: false,
    });
    console.error(`Seeded prompt library at ${home}`);
  }

  if (!process.env.MCP_PROMPTS_CONFIG_PATH) {
    process.env.MCP_PROMPTS_CONFIG_PATH = configPath;
  }
}
