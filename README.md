# Promptuary

<div align="center">

![Promptuary Logo](assets/logo.png)

[![npm version](https://img.shields.io/npm/v/promptuary.svg?style=for-the-badge&logo=npm&color=0066cc)](https://www.npmjs.com/package/promptuary)
[![License: MIT](https://img.shields.io/badge/License-MIT-00ff88.svg?style=for-the-badge&logo=opensource)](https://opensource.org/licenses/MIT)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Compatible-ff6b35?style=for-the-badge&logo=anthropic)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)

**🚀 The Universal Model Context Protocol Server for Any MCP Client**

_Supercharge your AI workflows with battle-tested prompt engineering, intelligent orchestration, and lightning-fast hot-reload capabilities. Works seamlessly with Claude Desktop, Cursor Windsurf, and any MCP-compatible client._

[⚡ Quick Start](#-one-command-installation) • [🎯 Features](#-performance--reliability) • [📚 Docs](#-documentation-hub) • [🛠️ Advanced](#-advanced-features)

---

</div>

## 🌟 What Makes This Special? (v1.1.0 - "Intelligent Execution")

- **🧠 Semantic Analysis Engine** → Automatically detects execution types without manual configuration
- **🎯 Universal Prompt Execution** → Single tool with intelligent mode detection and auto-execution
- **🛡️ Smart Quality Gates** → Auto-assigned validation based on prompt complexity and type
- **🔄 Zero-Configuration Reliability** → No headers or manual setup required - just works intelligently
- **📊 Learning Analytics** → System improves detection accuracy through usage patterns
- **🔥 Intelligent Hot-Reload System** → Update prompts instantly without restarts
- **🎨 Advanced Template Engine** → Nunjucks-powered with conditionals, loops, and dynamic data
- **⚡ Multi-Phase Orchestration** → Robust startup sequence with comprehensive health monitoring
- **🚀 Universal MCP Compatibility** → Works flawlessly with Claude Desktop, Cursor Windsurf, and any MCP client

Transform your AI assistant experience from scattered prompts to a **truly intelligent execution engine** that automatically understands and optimally executes any prompt across any MCP-compatible platform.

## 🚀 Revolutionary Interactive Prompt Management

**🎯 The Future is Here: Manage Your AI's Capabilities FROM WITHIN the AI Conversation**

This isn't just another prompt server – it's a **living, breathing prompt ecosystem** that evolves through natural conversation with your AI assistant. Imagine being able to:

```bash
# 🗣️ Create new prompts by talking to your AI
"Hey Claude, create a new prompt called 'code_reviewer' that analyzes code for security issues"
→ Claude creates, tests, and registers the prompt instantly

# ✏️ Refine prompts through conversation
"That code reviewer prompt needs to also check for performance issues"
→ Claude modifies the prompt and hot-reloads it immediately

# 🔍 Discover and iterate on your prompt library
>>listprompts
→ Browse your growing collection, then ask: "Improve the research_assistant prompt to be more thorough"

# 🧠 Execute prompts with zero configuration - system auto-detects everything
>>content_analysis my content
→ Automatic semantic analysis detects workflow type, applies quality gates, executes perfectly
```

**🌟 Why This Changes Everything:**

- **🧠 True Intelligence**: System understands prompts like a human - no configuration needed
- **🔄 Self-Evolving System**: Your AI assistant literally builds and improves its own capabilities in real-time  
- **🎮 Zero Friction**: Never configure execution modes, quality gates, or headers - everything just works
- **⚡ Instant Perfection**: Create → Auto-detect → Execute optimally in one seamless flow
- **🌱 Learning System**: Detection accuracy improves through usage - gets smarter over time

This is what **truly intelligent AI infrastructure** looks like – where the system understands intent as naturally as reading human language.

## ⚡ Features & Reliability

<table>
<tr>
<td width="50%">

**🎯 Developer Experience**

- 🔥 **One-Command Installation** in under 60 seconds
- ⚡ **Hot-Reload Everything** → prompts, configs, templates
- 🎨 **Rich Template Engine** → conditionals, loops, data injection
- 🚀 **Universal MCP Integration** → works with Claude Desktop, Cursor Windsurf, and any MCP client
- 📱 **Multi-Transport Support** → STDIO for Claude Desktop + SSE/REST for web
- 🛠️ **Dynamic Management Tools** → update, delete, reload prompts on-the-fly

</td>
<td width="50%">

**🚀 Enterprise Architecture**

- 🏗️ **Orchestration** → phased startup with dependency management
- 🔧 **Robust Error Handling** → graceful degradation with comprehensive logging
- 📊 **Real-Time Health Monitoring** → module status, performance metrics, diagnostics
- 🎯 **Smart Environment Detection** → works across development and production contexts
- ⚙️ **Modular Plugin System** → extensible architecture for custom workflows
- 🔐 **Production-Ready Security** → input validation, sanitization, error boundaries

</td>
</tr>
<tr>
<td colspan="2">

**🛠️ Enhanced MCP Tools Suite (v1.1.0)**

- 🎯 **Universal Prompt Execution** → `execute_prompt` tool with automatic mode detection and gate validation
- 🛡️ **Quality Assurance Gates** → Automatic content validation with intelligent retry mechanisms
- 📊 **Execution Analytics** → `execution_analytics` tool for performance monitoring and insights
- 🔄 **Step-by-Step Chain Execution** → Optional confirmation between chain steps for quality control
- 📋 **List Prompts** → `listprompts` to discover all available commands with enhanced usage examples
- ✏️ **Update Prompts** → Modify existing prompts through conversation with full validation and hot-reload
- 🗑️ **Delete Prompts** → Remove prompts by asking your AI assistant - automatic file cleanup included
- 🔧 **Modify Sections** → "Edit the description of my research prompt" → Done instantly
- 🔄 **Reload System** → Force refresh through chat - no terminal access needed
- ⚙️ **Smart Argument Parsing** → JSON objects, single arguments, or fallback to `{{previous_message}}`
- 🔗 **Chain Execution** → Multi-step workflow management with conversational guidance
- 🎨 **Conversational Creation** → "Create a new prompt that..." → AI builds it for you interactively

</td>
</tr>
</table>

## 🎯 One-Command Installation

Get your AI command center running in **under a minute**:

```bash
# Clone → Install → Launch → Profit! 🚀
git clone https://github.com/dliangthinks/promptuary.git
cd promptuary/server && npm install && npm run build && npm start
```

### 🔌 **Universal MCP Client Integration**

#### **Claude Desktop**

Drop this into your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "promptuary": {
      "command": "node",
      "args": ["E:\\path\\to\\promptuary\\server\\dist\\index.js"]
    }
  }
}
```

> ✅ Once the extension starts, Promptuary automatically serves the viewer at `http://localhost:9090/viewer` so you can inspect and edit prompts without running additional commands.

#### **Cursor Windsurf & Other MCP Clients**

Configure your MCP client to connect via STDIO transport:

- **Command**: `node`
- **Args**: `["path/to/promptuary/server/dist/index.js"]`

> 💡 **Pro Tip**: Use absolute paths for bulletproof integration across all MCP clients!

### 🎮 **Start Building Immediately (v1.1.0 Enhanced)**

Your AI command arsenal is ready with **enhanced reliability**:

```bash
# 🧠 Discover your intelligent superpowers
>>listprompts

# 🎯 Zero-config intelligent execution - system auto-detects everything
>>friendly_greeting name="Developer"
→ Auto-detected as template, returns personalized greeting

>>content_analysis my research data
→ Auto-detected as workflow, applies quality gates, executes analysis framework

>>notes my content
→ Auto-detected as chain, validates each step, executes sequence

# 📊 Monitor intelligent detection performance
>>execution_analytics {"include_history": true}
→ See how accurately the system detects prompt types and applies gates

# 🚀 Create prompts that just work (zero configuration)
"Create a prompt called 'bug_analyzer' that finds and explains code issues"
→ AI creates prompt, system auto-detects workflow type, assigns quality gates

# 🔄 Refine prompts through conversation (intelligence improves)
"Make the bug_analyzer prompt also suggest performance improvements"
→ Prompt updated, system re-analyzes, updates detection profile automatically

# 🧠 Build intelligent AI workflows
"Create a prompt chain that reviews code, validates output, tests it, then documents it"
→ Chain created, each step auto-analyzed, appropriate gates assigned automatically

# 🎛️ Manual override when needed (but rarely necessary)
>>execute_prompt {"command": ">>content_analysis data", "step_confirmation": true}
→ Force step confirmation for sensitive analysis
```

**🌟 The Magic**: Your prompt library becomes a **living extension of your workflow**, growing and adapting as you work with your AI assistant.

## 🔥 Why Developers Choose This Server

<details>
<summary><strong>⚡ Lightning-Fast Hot-Reload</strong> → Edit prompts, see changes instantly</summary>

Our sophisticated orchestration engine monitors your files and reloads everything seamlessly:

```bash
# Edit any prompt file → Server detects → Reloads automatically → Zero downtime
```

- **Instant Updates**: Change templates, arguments, descriptions in real-time
- **Zero Restart Required**: Advanced hot-reload system keeps everything running
- **Smart Dependency Tracking**: Only reloads what actually changed
- **Graceful Error Recovery**: Invalid changes don't crash the server

</details>

<details>
<summary><strong>🎨 Next-Gen Template Engine</strong> → Nunjucks-powered dynamic prompts</summary>

Go beyond simple text replacement with a full template engine:

```nunjucks
Analyze {{content}} for {% if focus_area %}{{focus_area}}{% else %}general{% endif %} insights.

{% for requirement in requirements %}
- Consider: {{requirement}}
{% endfor %}

{% if previous_context %}
Build upon: {{previous_context}}
{% endif %}
```

- **Conditional Logic**: Smart prompts that adapt based on input
- **Loops & Iteration**: Handle arrays and complex data structures
- **Template Inheritance**: Reuse and extend prompt patterns
- **Real-Time Processing**: Templates render with live data injection

</details>

<details>
<summary><strong>🏗️ Enterprise-Grade Orchestration</strong> → Multi-phase startup with health monitoring</summary>

Built like production software with comprehensive architecture:

```typescript
Phase 1: Foundation → Config, logging, core services
Phase 2: Data Loading → Prompts, categories, validation
Phase 3: Module Init → Tools, executors, managers
Phase 4: Server Launch → Transport, API, diagnostics
```

- **Dependency Management**: Modules start in correct order with validation
- **Health Monitoring**: Real-time status of all components
- **Performance Metrics**: Memory usage, uptime, connection tracking
- **Diagnostic Tools**: Built-in troubleshooting and debugging

</details>

<details>
<summary><strong>🔄 Intelligent Prompt Chains</strong> → Multi-step AI workflows</summary>

Create sophisticated workflows where each step builds on the previous:

```json
{
  "id": "content_analysis_chain",
  "name": "Content Analysis Chain",
  "isChain": true,
  "chainSteps": [
    {
      "stepName": "Extract Key Points",
      "promptId": "extract_key_points",
      "inputMapping": { "content": "original_content" },
      "outputMapping": { "key_points": "extracted_points" }
    },
    {
      "stepName": "Analyze Sentiment",
      "promptId": "sentiment_analysis",
      "inputMapping": { "text": "extracted_points" },
      "outputMapping": { "sentiment": "analysis_result" }
    }
  ]
}
```

- **Visual Step Planning**: See your workflow before execution
- **Input/Output Mapping**: Data flows seamlessly between steps
- **Error Recovery**: Failed steps don't crash the entire chain
- **Flexible Execution**: Run chains or individual steps as needed

</details>

## 📊 System Architecture

```mermaid
graph TB
    A[Claude Desktop] -->|MCP Protocol| B[Transport Layer]
    B --> C[🧠 Orchestration Engine]
    C --> D[📝 Prompt Manager]
    C --> E[🛠️ MCP Tools Manager]
    C --> F[⚙️ Config Manager]
    D --> G[🎨 Template Engine]
    E --> H[🔧 Management Tools]
    F --> I[🔥 Hot Reload System]

    style C fill:#ff6b35
    style D fill:#00ff88
    style E fill:#0066cc
```

## 🌐 MCP Client Compatibility

This server implements the **Model Context Protocol (MCP)** standard and works with any compatible client:

<table>
<tr>
<td width="33%">

**✅ Tested & Verified**

- 🎯 **Claude Desktop** → Full integration support
- 🚀 **Cursor Windsurf** → Native MCP compatibility

</td>
<td width="33%">

**🔌 Transport Support**

- 📡 **STDIO** → Primary transport for desktop clients
- 🌐 **Server-Sent Events (SSE)** → Web-based clients and integrations
- 🔗 **HTTP Endpoints** → Basic endpoints for health checks and data queries

</td>
<td width="34%">

**🎯 Integration Features**

- 🔄 **Auto-Discovery** → Clients detect tools automatically
- 📋 **Tool Registration** → Dynamic capability announcement
- ⚡ **Hot Reload** → Changes appear instantly in clients
- 🛠️ **Error Handling** → Graceful degradation across clients

</td>
</tr>
</table>

> 💡 **Developer Note**: As MCP adoption grows, this server will work with any new MCP-compatible AI assistant or development environment without modification.

## 🛠️ Advanced Configuration

### ⚙️ **Server Powerhouse** (`config.json`)

Fine-tune your server's behavior:

```json
{
  "server": {
    "name": "Promptuary MCP Server",
    "version": "1.0.0",
    "port": 9090
  },
  "prompts": {
    "file": "promptsConfig.json",
    "registrationMode": "name"
  },
  "transports": {
    "default": "stdio",
    "sse": { "enabled": false },
    "stdio": { "enabled": true }
  }
}
```

### 🗂️ **Prompt Organization** (`promptsConfig.json`)

Structure your AI command library:

```json
{
  "categories": [
    {
      "id": "development",
      "name": "🔧 Development",
      "description": "Code review, debugging, and development workflows"
    },
    {
      "id": "analysis",
      "name": "📊 Analysis",
      "description": "Content analysis and research prompts"
    },
    {
      "id": "creative",
      "name": "🎨 Creative",
      "description": "Content creation and creative writing"
    }
  ],
  "imports": [
    "prompts/development/prompts.json",
    "prompts/analysis/prompts.json",
    "prompts/creative/prompts.json"
  ]
}
```

## 🚀 Advanced Features

<details>
<summary><strong>🔄 Multi-Step Prompt Chains</strong> → Build sophisticated AI workflows</summary>

Create complex workflows that chain multiple prompts together:

```markdown
# Research Analysis Chain

## User Message Template

Research {{topic}} and provide {{analysis_type}} analysis.

## Chain Configuration

Steps: research → extract → analyze → summarize
Input Mapping: {topic} → {content} → {key_points} → {insights}
Output Format: Structured report with executive summary
```

**Capabilities:**

- **Sequential Processing**: Each step uses output from previous step
- **Parallel Execution**: Run multiple analysis streams simultaneously
- **Error Recovery**: Graceful handling of failed steps
- **Custom Logic**: Conditional branching based on intermediate results

</details>

<details>
<summary><strong>🎨 Advanced Template Features</strong> → Dynamic, intelligent prompts</summary>

Leverage the full power of Nunjucks templating:

```nunjucks
# {{ title | title }} Analysis

## Context
{% if previous_analysis %}
Building upon previous analysis: {{ previous_analysis | summary }}
{% endif %}

## Requirements
{% for req in requirements %}
{{loop.index}}. **{{req.priority | upper}}**: {{req.description}}
   {% if req.examples %}
   Examples: {% for ex in req.examples %}{{ex}}{% if not loop.last %}, {% endif %}{% endfor %}
   {% endif %}
{% endfor %}

## Focus Areas
{% set focus_areas = focus.split(',') %}
{% for area in focus_areas %}
- {{ area | trim | title }}
{% endfor %}
```

**Template Features:**

- **Filters & Functions**: Transform data on-the-fly
- **Conditional Logic**: Smart branching based on input
- **Loops & Iteration**: Handle complex data structures
- **Template Inheritance**: Build reusable prompt components

</details>

<details>
<summary><strong>🔧 Real-Time Management Tools</strong> → Hot management without downtime</summary>

Manage your prompts dynamically while the server runs:

```bash
# Update prompts on-the-fly
>>update_prompt id="analysis_prompt" content="new template"

# Add new sections dynamically
>>modify_prompt_section id="research" section="examples" content="new examples"

# Hot-reload everything
>>reload_prompts reason="updated templates"
```

**Management Capabilities:**

- **Live Updates**: Change prompts without server restart
- **Section Editing**: Modify specific parts of prompts
- **Bulk Operations**: Update multiple prompts at once
- **Rollback Support**: Undo changes when things go wrong

</details>

<details>
<summary><strong>📊 Production Monitoring</strong> → Enterprise-grade observability</summary>

Built-in monitoring and diagnostics for production environments:

```typescript
// Health Check Response
{
  healthy: true,
  modules: {
    foundation: true,
    dataLoaded: true,
    modulesInitialized: true,
    serverRunning: true
  },
  performance: {
    uptime: 86400,
    memoryUsage: { rss: 45.2, heapUsed: 23.1 },
    promptsLoaded: 127,
    categoriesLoaded: 8
  }
}
```

**Monitoring Features:**

- **Real-Time Health Checks**: All modules continuously monitored
- **Performance Metrics**: Memory, uptime, connection tracking
- **Diagnostic Tools**: Comprehensive troubleshooting information
- **Error Tracking**: Graceful error handling with detailed logging

</details>

## 📚 Documentation Hub

| Guide                                                     | Description                                                       |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| [📥 Installation Guide](docs/installation-guide.md)       | Complete setup walkthrough with troubleshooting                   |
| [🛠️ Troubleshooting Guide](docs/troubleshooting.md)       | Common issues, diagnostic tools, and solutions                    |
| [🏗️ Architecture Overview](docs/architecture.md)          | A deep dive into the orchestration engine, modules, and data flow |
| [📝 Prompt Format Guide](docs/prompt-format-guide.md)     | Master prompt creation with examples                              |
| [🔗 Chain Execution Guide](docs/chain-execution-guide.md) | Build complex multi-step workflows                                |
| [⚙️ Prompt Management](docs/prompt-management.md)         | Dynamic management and hot-reload features                        |
| [🚀 MCP Tools Reference](docs/mcp-tools-reference.md)     | Complete MCP tools documentation                                  |
| [🗺️ Roadmap & TODO](docs/TODO.md)                         | Planned features and development roadmap                          |
| [🤝 Contributing](docs/contributing.md)                   | Join our development community                                    |

## 🤝 Contributing

We're building the future of AI prompt engineering! Join our community:

- 🐛 **Found a bug?** [Open an issue](https://github.com/dliangthinks/promptuary/issues)
- 💡 **Have an idea?** [Start a discussion](https://github.com/dliangthinks/promptuary/discussions)
- 🔧 **Want to contribute?** Check our [Contributing Guide](docs/contributing.md)
- 📖 **Need help?** Visit our [Documentation](docs/README.md)

## 📄 License

Released under the [MIT License](LICENSE) - see the file for details.

---

<div align="center">

**⭐ Star this repo if it's transforming your AI workflow!**

[Report Bug](https://github.com/dliangthinks/promptuary/issues) • [Request Feature](https://github.com/dliangthinks/promptuary/issues) • [View Docs](docs/README.md)

_Built with ❤️ for the AI development community_

</div>
