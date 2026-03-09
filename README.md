# Promptuary

<div align="center">

![Promptuary Logo](icon.png)

An MCP server for managing and executing AI prompt templates. Includes a built-in UI that renders inside Claude Desktop and other MCP hosts.

[Quick Start](#quick-start) | [UI Guide](#prompt-manager-ui) | [Chat Tools](#chat-tools) | [Configuration](#configuration)

---

</div>

## Quick Start

```bash
git clone https://github.com/dliangthinks/promptuary.git
cd promptuary/server && npm install && npm run build && npm start
```

`npm run build` builds both the MCP App UI and the server TypeScript.

### Connect to Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "promptuary": {
      "command": "node",
      "args": ["/absolute/path/to/promptuary/server/dist/index.js"]
    }
  }
}
```

### Connect to Cursor, Windsurf, or other MCP clients

Configure STDIO transport with command `node` and args `["/path/to/promptuary/server/dist/index.js"]`.

---

## Two Ways to Manage Prompts

Promptuary gives you two interfaces to work with. Some things can only be done in one or the other.

| Action | UI | Chat |
|---|:---:|:---:|
| Browse all prompts by category | Y | `listprompts` |
| Execute a prompt with arguments | - | `execute_prompt` |
| Edit prompt name, description, content | Y | `update_prompt` |
| Create a new prompt | - | `create_prompt` |
| Delete a prompt | Y | `delete_prompt` |
| Move prompt between categories | Y (drag & drop) | `move_prompt` |
| Create / rename / delete categories | Y (right-click) | `create_category`, `rename_category`, `delete_category` |
| Search / filter prompts | Y (search bar) | - |
| Reload prompts from disk | Y (reload button) | `reload_prompts` |
| View execution analytics | - | `execution_analytics` |
| Read raw prompt markdown | - | `read_prompt` |
| Modify a specific section | - | `modify_prompt_section` |

---

## Prompt Manager UI

Open the UI by invoking the `prompt_manager` tool in Claude Desktop. The UI renders inline in the conversation.

### Grid View

The main view shows all prompts as icons grouped by category.

- **Click** a prompt to open the edit view
- **Right-click** a prompt to get a context menu (View/Edit, Delete)
- **Drag & drop** a prompt onto another category to move it
- **Search bar** filters prompts across all categories
- **Reload button** refreshes prompts from disk without restarting

### Edit View

Click any prompt to open it. From here you can:

- Edit the **name**, **description**, and **markdown content**
- **Save** changes (writes to disk and hot-reloads)
- **Delete** the prompt (with confirmation)
- **Back** button returns to the grid

### Category Management

All category operations are done through the category headers:

- **Click** a category name to rename it inline (press Enter to confirm, Escape to cancel). Renaming also updates the folder name and ID on disk.
- **Right-click** a category header for a context menu:
  - **Add Category After** — creates a new "Untitled" category below and enters rename mode
  - **Delete Category** — removes the category (only enabled when empty; move or delete prompts first)

---

## Chat Tools

These tools are available to Claude (or any MCP client) during conversation.

### Executing Prompts

| Tool | Description |
|---|---|
| `listprompts` | List all available prompts with their IDs, categories, and descriptions |
| `execute_prompt` | Render and execute a prompt template with argument substitution |
| `execution_analytics` | View execution metrics and detection accuracy |

```
# List everything available
>>listprompts

# Execute with arguments
>>execute_prompt {"command": ">>prompt_name arg1=\"value\""}
```

### Managing Prompts

| Tool | Description |
|---|---|
| `create_prompt` | Create a new prompt. Category must already exist. |
| `update_prompt` | Update name, description, or content of an existing prompt |
| `delete_prompt` | Delete a prompt by ID |
| `read_prompt` | Read raw markdown content (no rendering) |
| `modify_prompt_section` | Edit a specific section of a prompt |
| `move_prompt` | Move a prompt from one category to another |

### Managing Categories

| Tool | Description |
|---|---|
| `create_category` | Create a new category (optionally positioned after another) |
| `rename_category` | Rename a category — also renames the folder and updates all references |
| `delete_category` | Delete an empty category |

### System

| Tool | Description |
|---|---|
| `reload_prompts` | Hot-reload prompts from disk, or trigger a full server restart |
| `prompt_manager` | Open the interactive UI inside the MCP host |

---

## Configuration

### Server Config (`server/config.json`)

```json
{
  "server": { "name": "Promptuary MCP Server", "version": "1.0.0", "port": 9090 },
  "prompts": { "file": "promptsConfig.json", "registrationMode": "name" },
  "transports": {
    "default": "stdio",
    "sse": { "enabled": false },
    "stdio": { "enabled": true }
  }
}
```

### Prompt Organization (`server/promptsConfig.json`)

Categories and imports define the prompt library structure:

```json
{
  "categories": [
    { "id": "governance", "name": "Governance", "description": "Project governance prompts" },
    { "id": "finance", "name": "Finance", "description": "Financial analysis prompts" }
  ],
  "imports": [
    "prompts/governance/prompts.json",
    "prompts/finance/prompts.json"
  ]
}
```

### File Structure

```
server/prompts/
├── category-name/
│   ├── prompts.json          # Lists prompts in this category
│   └── prompt-name.md        # Prompt template file
└── ...
```

### Prompt Format

Prompts are markdown files with Nunjucks templating:

```nunjucks
Analyze {{content}} for {% if focus_area %}{{focus_area}}{% else %}general{% endif %} insights.

{% for item in items %}
- {{item}}
{% endfor %}
```

Arguments are defined in the category's `prompts.json`:

```json
{
  "prompts": [
    {
      "id": "my_prompt",
      "name": "My Prompt",
      "category": "my-category",
      "description": "What this prompt does",
      "file": "my_prompt.md",
      "arguments": [
        { "name": "content", "description": "The content to analyze", "required": true }
      ]
    }
  ]
}
```

---

## Development

```bash
cd server

npm run dev              # Watch mode — recompiles and restarts on changes
npm run build            # Build app UI + compile TypeScript
npm start                # Run the compiled server

npm run start:sse        # SSE transport (for web clients)
npm run start:stdio      # STDIO transport (for Claude Desktop)
npm run start:verbose    # Verbose logging
```

### Environment Variables

- `MCP_SERVER_ROOT` — Override server root directory detection
- `MCP_PROMPTS_CONFIG_PATH` — Direct path to prompts configuration file

---

## License

Released under the [MIT License](LICENSE).
