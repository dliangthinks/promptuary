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
/**
 * Resolve PROMPTUARY_HOME, seed it on first run, and route prompt loading
 * to it. No-op when the variable is not set.
 */
export declare function bootstrapPromptuaryHome(): void;
