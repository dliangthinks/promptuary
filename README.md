# Promptuary

<div align="center">

![Promptuary Logo](icon.png)

An MCP server for managing and executing AI prompt templates. Includes a built-in UI that renders inside Claude Desktop and other MCP hosts.

[![Download .mcpb](https://img.shields.io/github/v/release/dliangthinks/promptuary?label=Download&sort=semver)](https://github.com/dliangthinks/promptuary/releases/latest)

[Quick Start](#quick-start) | [UI Guide](#prompt-manager-ui) | [Chat Tools](#chat-tools) | [Configuration](#configuration) | [Download](https://github.com/dliangthinks/promptuary/releases/latest)

---

</div>

## Why "Promptuary"?

> **promptuary** _(noun)_ promp·​tu·​ary ˈprämpchəˌwerē
> 1. _obsolete_ : storehouse, repository
> 2. : a book of ready reference

If you use AI daily, you've built up prompts that work — for code reviews, writing, analysis, project planning. But without a dedicated tool, reusing them is painful. They end up scattered across chat histories, text files, and sticky notes. You re-type them from memory, losing the wording that made them effective. You can't share them across projects or tweak variables without copy-pasting the whole thing.

Promptuary is a prompt library that lives where you already work. It runs as an MCP server inside Claude Desktop, so your prompts are always one tool call away — browsable, searchable, executable with argument substitution, and editable without leaving the conversation.

## Quick Start

**Fastest path:** download the latest `promptuary.mcpb` from the [Releases page](https://github.com/dliangthinks/promptuary/releases/latest) and drag it into Claude Desktop's Settings → Extensions. No build step required.

**From source:**

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
| Read raw prompt markdown | - | `read_prompt` |

---

## Prompt Manager UI

Open the UI by invoking the `prompt_manager` tool in Claude Desktop. The UI renders inline in the conversation.

### Browser Viewer

Click the **expand button** (↗) in the UI header to open the same prompt manager in your default browser at `http://localhost:9090/`. This lets you manage prompts in a dedicated browser tab alongside your Claude conversation — useful for editing prompts while testing them in chat.

The browser viewer is the same React app with the same features; it talks to the server over REST instead of the MCP App SDK. No extra setup is needed — the viewer starts automatically when the server is running.

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

Prompts are markdown files with a structured layout:

```markdown
# Prompt Title

## Description
What this prompt does

## System Message
Instructions that shape Claude's behavior for this task

## User Message Template
The template that gets rendered with arguments and sent to Claude
```

Arguments are defined in the category's `prompts.json`:

```json
{
  "prompts": [
    {
      "id": "meeting_minutes",
      "name": "Meetings",
      "category": "stakeholder",
      "description": "Document meeting minutes with decisions and action items",
      "file": "meeting_minutes.md",
      "arguments": [
        { "name": "transcript", "description": "Meeting transcript or notes", "required": true },
        { "name": "meeting_type", "description": "Type of meeting (kickoff, status, steering committee)", "required": false }
      ]
    }
  ]
}
```

---

## Template Engine

Promptuary uses [Nunjucks](https://mozilla.github.io/nunjucks/) as its template engine. This is what sets it apart from static prompt files or Claude Code skills — prompts are not fixed text, they are rendered templates with logic that adapts based on the arguments Claude passes.

### Why not just use skills or static prompts?

Claude Code skills (slash commands like `/commit`, `/review-pr`) are static text that gets injected into context. They can't take structured arguments, can't conditionally include or exclude sections, and can't adapt their instructions based on what the user needs. Every invocation sends the exact same prompt regardless of context.

Promptuary prompts are templates. They accept arguments, render only the relevant sections, and give Claude focused guidance instead of a wall of generic instructions. The result is more deterministic output — the business logic lives in the template, not in Claude's interpretation.

### Variable substitution

The simplest feature — inject values into the template:

```nunjucks
Process the following meeting transcript into structured minutes:

Meeting type: {{meeting_type}}

Transcript:
{{transcript}}
```

### Conditionals — skip sections when arguments are empty

Without conditionals, omitting `meeting_type` renders a blank line (`Meeting type: `), which wastes tokens and can confuse the model. With conditionals:

```nunjucks
{% if meeting_type %}
Meeting type: {{meeting_type}}
{% endif %}

Transcript:
{{transcript}}
```

When `meeting_type` is not provided, the line disappears entirely. Claude gets a cleaner prompt.

### Defaults

Provide fallback values for optional arguments:

```nunjucks
Audience: {{audience or "executive stakeholders"}}
```

### Audience-aware rendering — show only what's relevant

This is where templates get powerful. The stakeholder status report prompt has guidance for 5 different audience types. Without conditionals, Claude always sees all 5 — executives, steering committee, team, business owners, end users — even when the report is for one specific audience.

With conditional rendering, only the relevant guidance is included:

```nunjucks
{% if not audience or audience == "executive" %}
**Executive Stakeholders:**
- Focus: Strategic alignment, ROI, major risks
- Length: 1-2 pages maximum
- Format: High-level summary, exception-based reporting
- Avoid: Technical details, operational minutiae
{% endif %}

{% if not audience or audience == "team" %}
**Project Team:**
- Focus: Tasks, assignments, obstacles, coordination
- Length: Detailed, comprehensive
- Format: Work-package level detail
{% endif %}
```

When `audience="executive"`, Claude only sees the executive guidance. When `audience` is omitted, all sections render (backward compatible). This makes the output more deterministic — Claude follows focused instructions rather than choosing from a menu of options.

### Method-specific rendering

The cost estimation prompt has detailed sections for bottom-up, top-down, and parametric methods. When the user specifies a method, only that method's process is rendered:

```nunjucks
{% if not estimation_method or estimation_method == "bottom-up" %}
2. BOTTOM-UP ESTIMATING: Most accurate, most time-intensive:
   - Estimate cost of individual work packages
   - Sum work package costs to get totals
   - Roll up through WBS hierarchy
   ...
{% endif %}

{% if not estimation_method or estimation_method == "parametric" %}
4. PARAMETRIC ESTIMATING: Uses statistical relationships:
   - Use cost per unit metrics
   - Multiply by quantity
   ...
{% endif %}
```

### Meeting-type-specific emphasis

The same output structure adapts its priorities based on what kind of meeting it was:

```nunjucks
{% if meeting_type == "kickoff" %}
Emphasize project objectives, scope agreements, role assignments, and ground rules.
{% elif meeting_type == "steering committee" %}
Emphasize governance decisions, approvals granted, and escalated issues.
Decisions Made should be the most detailed section.
{% elif meeting_type == "retrospective" %}
Emphasize what went well, what didn't, and improvement actions.
Reframe Action Items as improvement commitments with owners.
{% endif %}
```

### Methodology branching

Prompts that span project management approaches adapt their language and structure:

```nunjucks
{% if methodology == "agile" %}
Focus on iteration/sprint-based scheduling with rolling wave planning.
Use story points for estimation and velocity for forecasting.
{% elif methodology == "predictive" %}
Create a detailed schedule with WBS-based activities, firm dependencies,
and critical path analysis.
{% elif methodology == "hybrid" %}
Combine phase-gated milestones with iterative delivery within phases.
{% endif %}
```

### How arguments get passed

You don't need to construct the arguments yourself. When you say "take minutes from this standup," Claude sees the prompt's argument definitions, extracts the relevant values from the conversation, and calls `execute_prompt` with structured arguments:

```
>>meeting_minutes {"meeting_type": "standup", "transcript": "..."}
```

The template engine renders the prompt with those values, and Claude receives focused, relevant instructions.

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

## Packaging as MCPB

To distribute Promptuary as an installable MCP package (`.mcpb`):

```bash
# 1. Install the MCP build tool (one-time)
npm i -g @anthropic-ai/mcpb

# 2. Initialize the manifest at the repo root
mcpb init

# 3. Build and pack
cd server && npm run build && cd ..
mcpb pack
```

`mcpb init` generates a `manifest.json` at the repo root. Example:

```json
{
  "dxt_version": "0.1",
  "name": "promptuary",
  "display_name": "Promptuary",
  "version": "2.0.0",
  "description": "Interactive prompt management system within chat",
  "author": {
    "name": "Dong Liang"
  },
  "icon": "icon.png",
  "homepage": "https://dliangthinks.me",
  "server": {
    "type": "node",
    "entry_point": "server/dist/index.js",
    "mcp_config": {
      "command": "node",
      "args": ["${__dirname}/server/dist/index.js"]
    }
  }
}
```

---

## Privacy Policy

Promptuary runs entirely on your local machine. It does not collect, transmit, or share any data — no analytics, no telemetry, no outbound network requests to author-controlled services. Prompt files stay on your filesystem; the browser viewer binds only to `localhost:9090`. Full policy: [https://dliangthinks.github.io/promptuary/privacy.html](https://dliangthinks.github.io/promptuary/privacy.html).

---

## Credits

Promptuary is a fork of [minipuft/claude-prompts](https://github.com/minipuft/claude-prompts) (AGPL-3.0). The original codebase provided the MCP server scaffolding, prompt registry, template processor, and transport layer. This fork adds an interactive MCP App UI (React), a dual-mode browser viewer with REST API, and a simplified core focused on prompt library management — removing the original's gate validation, semantic analysis, and framework subsystems.

## License

Released under the [GNU Affero General Public License v3.0 or later](LICENSE).

Because Promptuary derives from an AGPL-3.0 project, it is also AGPL-3.0. This is copyleft: anyone distributing a modified version, or hosting a modified version as a network service, must share their changes under the same license. See the LICENSE file for the full terms.
