# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

### Essential Commands
- **Build**: `npm run build` - Compiles TypeScript to JavaScript in `dist/`
- **Start**: `npm start` - Runs the compiled server
- **Development**: `npm run dev` - Watches TypeScript files and restarts on changes
- **Test**: `npm test` - Runs the test server

### Transport-Specific Commands
- **STDIO Transport**: `npm run start:stdio` - For MCP clients like Claude Desktop
- **SSE Transport**: `npm run start:sse` - For web-based clients
- **Production**: `npm run start:production` - Quiet mode with STDIO transport
- **Development**: `npm run start:development` - Verbose mode with SSE transport

### Debugging Commands
- **Verbose Mode**: `npm run start:verbose` - Detailed diagnostics
- **Debug Startup**: `npm run start:debug` - Extra debugging information
- **Help**: `npm run help` - Show command line options

### Working Directory
All commands should be run from the `server/` directory: `cd server && npm run build`

## Project Architecture

### Core System Structure
This is a **Model Context Protocol (MCP) server** that provides AI prompt management with hot-reloading capabilities. The architecture follows a multi-phase orchestration pattern:

1. **Foundation Phase**: Configuration loading, logging setup, core services
2. **Data Loading Phase**: Prompt loading, category parsing, validation
3. **Module Initialization Phase**: Tools, executors, conversation managers
4. **Server Launch Phase**: Transport layer, API endpoints, health monitoring

### Key Components

#### `/server/src/orchestration/`
- **Main entry point** with comprehensive health monitoring and graceful shutdown
- **Multi-phase startup** with dependency management and error recovery
- **Performance monitoring** with memory usage tracking and uptime metrics

#### `/server/src/prompts/`
- **Template processor** using Nunjucks with advanced features (conditionals, loops, macros)
- **Prompt registry** for dynamic loading and hot-reloading
- **Converter system** for format transformation and validation

#### `/server/src/mcp-tools/`

**Chat tools** (used by Claude in conversation):
- `execute_prompt` — Renders prompt template with Nunjucks variable substitution
- `listprompts` — Lists all available prompts (ONE WORD, not `list_prompts`)
- `process_slash_command` — DEPRECATED alias for `execute_prompt`
- `execution_analytics` — View execution metrics

**Prompt management tools** (used by both Claude and the MCP App UI):
- `read_prompt` — Reads raw .md file (no rendering). Used by App for editing.
- `create_prompt` — Creates new prompt. Category is required and must already exist (no auto-create).
- `update_prompt` — Updates existing prompt content/description. No category parameter — use `move_prompt` to change category.
- `delete_prompt` — Deletes prompt by ID (arg is `{ id }`, NOT `{ name }`).
- `move_prompt` — Moves prompt between categories. Auto-cleans empty source category.
- `delete_category` — Deletes empty category. Errors if prompts still exist.
- `modify_prompt_section` — Modifies a specific section of a prompt.
- `reload_prompts` — Hot-reloads prompts or triggers full server restart.

**App entry tool:**
- `prompt_manager` — Opens the MCP App UI in Claude Desktop

**Chain execution** support for multi-step workflows

#### `/server/src/transport/`
- **STDIO transport** for Claude Desktop integration
- **SSE transport** for web-based clients
- **Transport-aware logging** to avoid interference with STDIO protocol

### Configuration System

#### Main Configuration (`server/config.json`)
- Server settings (name, version, port)
- Transport configuration (STDIO/SSE)
- Logging configuration (directory, level)
- Prompts file reference

#### Prompts Configuration (`server/promptsConfig.json`)
- **Category organization** with logical grouping
- **Modular import system** using category-specific `prompts.json` files
- **Registration modes** (ID, NAME, or BOTH)

### Prompt Organization

#### File Structure
```
server/prompts/
├── category-name/
│   ├── prompts.json          # Category prompt registry
│   ├── prompt-name.md        # Individual prompt files
│   └── ...
└── promptsConfig.json        # Main configuration
```

#### Prompt Format
- **Markdown files** with structured sections
- **Nunjucks templating** with `{{variable}}` syntax
- **Argument definitions** with type information and validation
- **Category association** for organization

### TypeScript Architecture

#### Core Types (`src/types.ts`)
- **Config interfaces** for application configuration
- **PromptData** for prompt metadata and structure
- **Message types** for conversation handling
- **Transport types** for protocol abstraction

#### Key Interfaces
- `PromptData`: Complete prompt structure with metadata, arguments, and configuration
- `PromptArgument`: Typed argument definitions with validation
- `Category`: Prompt organization and categorization
- `MessageContent`: Extensible content type system

### Development Patterns

#### Hot-Reloading System
- **File watching** for prompt changes
- **Registry updates** without server restart
- **Template recompilation** on modification
- **MCP client notification** of changes

#### Error Handling
- **Comprehensive error boundaries** at all levels
- **Graceful degradation** for partial failures
- **Health monitoring** with periodic validation
- **Rollback mechanisms** for startup failures

#### Template Processing
- **Nunjucks engine** with full feature support
- **Dynamic variable substitution** from arguments
- **Conditional logic** and loops in templates
- **Macro system** for reusable components

### MCP Integration

#### Protocol Implementation
- **Model Context Protocol SDK** integration
- **Tool registration** for prompt management
- **Conversation management** with state tracking
- **Transport abstraction** for multiple client types

#### Client Compatibility
- **Claude Desktop** via STDIO transport
- **Cursor Windsurf** via STDIO transport
- **Web clients** via SSE transport
- **Custom MCP clients** via standard protocol

### Performance Considerations

#### Startup Optimization
- **Strategy-based server detection** with early termination
- **Environment variable bypass** for instant path detection
- **Conditional logging** based on verbosity level
- **Dependency management** with proper initialization order

#### Runtime Performance
- **Memory usage monitoring** with periodic reporting
- **Health check validation** every 30 seconds
- **Diagnostic collection** for troubleshooting
- **Graceful shutdown** with resource cleanup

### MCP App (Interactive UI)

#### Dual-Mode Architecture
- **Single React app** serves both MCP App (Claude Desktop) and REST browser modes
- `main.tsx` tries MCP handshake via `useApp()`; if no host responds within 1.5s, falls back to REST mode
- Three states: `"connecting"` → `"mcp"` (host found) or `"rest"` (timeout)
- `<App>` receives `app: McpApp | null` and `restMode: boolean` — same component tree for both modes
- **MCP mode** (`restMode=false`): uses `app.callServerTool()` for all data operations, `app.openLink()` for external links
- **REST mode** (`restMode=true`): uses `fetch()` against `/api/v1/...` HTTP endpoints, `app` is `null`
- Components branch on `restMode` for data calls but share all UI code
- Expand button uses `app.openLink()` in MCP mode; hidden in REST mode (already in browser)

#### Server Registration
- `server/app/` — React app bundled into single HTML via `vite-plugin-singlefile`
- `server/src/mcp-apps/index.ts` — Registers `prompt_manager` tool + app resource
- Registration uses `@modelcontextprotocol/ext-apps/server`: `registerAppTool`, `registerAppResource`
- Resource URI: `ui://promptuary/index.html`
- Called from orchestration Phase 3 after `registerAllPrompts()`
- `viewer.autoStart: true` in config.json also serves the same HTML on HTTP (port 9090)

#### Build
- `npm run build:app` builds the React app into `server/app/dist/index.html`
- `npm run build` runs `build:app` then `tsc`
- App bundle is ~600KB (single-file HTML)

#### Critical Gotchas
- Tool name is `listprompts` (one word), NOT `list_prompts`
- `delete_prompt` takes `{ id }`, NOT `{ name }`
- App is SANDBOXED: `callServerTool()` results stay in JS, cannot inject into Claude conversation
- `execute_prompt` must NEVER be used in the App UI — use `read_prompt` to load raw .md for editing
- Saving `execute_prompt` output (rendered template) back to .md file CORRUPTS the prompt and it disappears after reload
- `create_prompt` does NOT auto-create categories — category must already exist
- `update_prompt` has NO category parameter — use `move_prompt` to change category
- App dist path from compiled `dist/mcp-apps/`: resolve `../..` then `app/dist/`
- MCP SDK 1.27.1+: do NOT pass `capabilities` to `McpServer` constructor
- `viewer.autoStart: true` in config.json makes STDIO mode also bind HTTP port — will crash if port is in use
- CSS must use `height: auto` (not `100vh`) and no `max-width` constraints — host iframe determines size

### Key Development Guidelines

#### Configuration Management
- Use environment variables for path overrides (`MCP_SERVER_ROOT`, `MCP_PROMPTS_CONFIG_PATH`)
- Maintain separation between server config and prompts config
- Follow modular import patterns for prompt organization

#### Prompt Development
- Use Nunjucks templating for dynamic content
- Define clear argument structures with validation
- Organize prompts by logical categories
- Test templates with various input scenarios

#### Error Handling
- Implement comprehensive error boundaries
- Use structured logging with appropriate levels
- Provide meaningful error messages
- Include diagnostic information for debugging

#### Testing
- Test transport layer compatibility
- Validate prompt template rendering
- Check hot-reloading functionality
- Verify MCP protocol compliance

### Environment Setup

#### Required Environment Variables
- `MCP_SERVER_ROOT`: Override server root directory detection
- `MCP_PROMPTS_CONFIG_PATH`: Direct path to prompts configuration file

#### Development Environment
- Node.js 16+ required
- TypeScript compilation with `tsc`
- File watching for hot-reloading
- Transport-specific testing modes

This architecture provides a robust, scalable system for AI prompt management with enterprise-grade features including hot-reloading, comprehensive error handling, and multi-transport support.