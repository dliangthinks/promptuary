import { useState, useEffect, useCallback } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { Prompt, Category } from "../types.js";

export function usePromptData(app: App | null, restMode: boolean = false) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadPrompts = useCallback(async () => {
    if (restMode) {
      setLoading(true);
      try {
        const res = await fetch(`${window.location.origin}/prompts`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Build ID→name lookup so prompts use display names
        const idToName: Record<string, string> = {};
        for (const c of data.categories || []) {
          idToName[c.id] = c.name;
        }
        const cats: Category[] = (data.categories || []).map(
          (c: { id: string; name: string; description?: string }) => ({
            name: c.name,
            description: c.description,
            promptCount: (data.prompts || []).filter(
              (p: { category?: string }) => p.category === c.id
            ).length,
          })
        );
        const proms: Prompt[] = (data.prompts || []).map(
          (p: {
            id: string;
            name: string;
            category?: string;
            description?: string;
            arguments?: Prompt["arguments"];
            file?: string;
          }) => ({
            id: p.id,
            name: p.name,
            category: p.category ? (idToName[p.category] || p.category) : p.category,
            description: p.description,
            arguments: p.arguments,
          })
        );
        setPrompts(proms);
        setCategories(cats);
      } catch (e) {
        console.error("Failed to load prompts via REST:", e);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!app) return;
    setLoading(true);
    try {
      const result = await app.callServerTool({
        name: "listprompts",
        arguments: {},
      });
      const textContent = result.content?.find((c) => c.type === "text");
      if (textContent && "text" in textContent) {
        const parsed = parsePromptList(textContent.text);
        setPrompts(parsed.prompts);
        setCategories(parsed.categories);
      }
    } catch (e) {
      console.error("Failed to load prompts:", e);
    } finally {
      setLoading(false);
    }
  }, [app, restMode]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") loadPrompts();
    };
    const onFocus = () => loadPrompts();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadPrompts]);

  const filteredPrompts = prompts.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term)
    );
  });

  return {
    prompts: filteredPrompts,
    allPrompts: prompts,
    categories,
    loading,
    searchTerm,
    setSearchTerm,
    refresh: loadPrompts,
  };
}

/**
 * Parse the markdown output from the listprompts tool.
 *
 * Format:
 *   ## CategoryName
 *   ### ⚙️ /prompt_id 🟡
 *   *Alias: /Prompt Name*
 *   Description text
 *   🧠 **Analysis**: ...
 *   **Arguments:**
 *   - `arg_name` (optional): description
 */
function parsePromptList(text: string): {
  prompts: Prompt[];
  categories: Category[];
} {
  const prompts: Prompt[] = [];
  const categoryMap = new Map<string, number>();

  const lines = text.split("\n");
  let currentCategory = "";
  let currentPrompt: Prompt | null = null;
  let collectingArgs = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    // Category header: "## CategoryName"
    const catMatch = trimmed.match(/^## (.+)/);
    if (catMatch) {
      const catName = catMatch[1].trim();
      // Skip "Special Commands" and similar meta sections
      if (catName.includes("Special Commands") || catName.includes("Active Filters")) {
        currentCategory = "";
        currentPrompt = null;
        continue;
      }
      currentCategory = catName;
      if (!categoryMap.has(currentCategory)) {
        categoryMap.set(currentCategory, 0);
      }
      currentPrompt = null;
      collectingArgs = false;
      continue;
    }

    // Prompt header: "### /prompt_id" or "### ⚙️ /prompt_id 🟡"
    const promptMatch = trimmed.match(/^### .*\/(\S+)/);
    if (promptMatch && currentCategory) {
      const id = promptMatch[1];
      currentPrompt = {
        id,
        name: id,
        category: currentCategory,
        arguments: [],
      };
      prompts.push(currentPrompt);
      categoryMap.set(currentCategory, (categoryMap.get(currentCategory) || 0) + 1);
      collectingArgs = false;
      continue;
    }

    if (!currentPrompt) continue;

    // Alias line: "*Alias: /Prompt Name*"
    const aliasMatch = trimmed.match(/^\*Alias:\s*\/(.+)\*$/);
    if (aliasMatch) {
      currentPrompt.name = aliasMatch[1].trim();
      continue;
    }

    // Arguments section
    if (trimmed === "**Arguments:**") {
      collectingArgs = true;
      continue;
    }

    // Argument entry: "- `arg_name` (optional): description"
    if (collectingArgs) {
      const argMatch = trimmed.match(/^- `(\w+)`(?:\s*\((\w+)\))?:\s*(.+)/);
      if (argMatch) {
        if (!currentPrompt.arguments) currentPrompt.arguments = [];
        currentPrompt.arguments.push({
          name: argMatch[1],
          required: argMatch[2] !== "optional",
          description: argMatch[3],
        });
        continue;
      }
    }

    // Skip analysis lines, usage lines, etc.
    if (trimmed.startsWith("🧠") || trimmed.startsWith("**Usage") || trimmed.startsWith("`/")) {
      continue;
    }

    // Description line (first non-special line after prompt header)
    if (!currentPrompt.description && !trimmed.startsWith("**") && !trimmed.startsWith("-") && !trimmed.startsWith("*")) {
      currentPrompt.description = trimmed;
    }
  }

  const categories: Category[] = Array.from(categoryMap.entries()).map(
    ([name, count]) => ({
      name,
      description: undefined,
      promptCount: count,
    })
  );

  return { prompts, categories };
}
