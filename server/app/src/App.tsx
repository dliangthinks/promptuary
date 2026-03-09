import { useState, useCallback, useEffect } from "react";
import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Header } from "./components/Header.js";
import { IconGrid } from "./components/IconGrid.js";
import { EditView } from "./components/EditView.js";
import { ContextMenu } from "./components/ContextMenu.js";
import { usePromptData } from "./hooks/usePromptData.js";
import { useContextMenu } from "./hooks/useContextMenu.js";
import type { Prompt, ViewState } from "./types.js";

interface AppProps {
  app: McpApp | null;
  toolResult: CallToolResult | null;
  restMode: boolean;
}

type Theme = "system" | "light" | "dark";

export function App({ app, toolResult, restMode }: AppProps) {
  const [viewState, setViewState] = useState<ViewState>({ view: "grid" });
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      root.style.removeProperty("color-scheme");
    } else {
      root.style.colorScheme = theme;
    }
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setTheme((t) => (t === "system" ? "light" : t === "light" ? "dark" : "system"));
  }, []);

  const handleExpand = useCallback(() => {
    app?.openLink({ url: "http://localhost:9090/" });
  }, [app]);

  const {
    prompts,
    categories,
    loading,
    searchTerm,
    setSearchTerm,
    refresh,
  } = usePromptData(app, restMode);
  const { menu, show: showContextMenu, showCategory: showCategoryContextMenu, hide: hideContextMenu } = useContextMenu();

  const handleEdit = useCallback((prompt: Prompt) => {
    setViewState({ view: "edit", prompt });
  }, []);

  const handleBack = useCallback(() => {
    setViewState({ view: "grid" });
    refresh();
  }, [refresh]);

  const handleDeleted = useCallback(() => {
    setViewState({ view: "grid" });
    refresh();
  }, [refresh]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, prompt: Prompt) => {
      showContextMenu(e.clientX, e.clientY, prompt.id);
    },
    [showContextMenu]
  );

  const handleCategoryContextMenu = useCallback(
    (e: React.MouseEvent, categoryId: string) => {
      showCategoryContextMenu(e.clientX, e.clientY, categoryId);
    },
    [showCategoryContextMenu]
  );

  const handleAddCategoryAfter = useCallback(async () => {
    if (!menu.categoryId) return;
    const afterId = menu.categoryId;
    hideContextMenu();

    // Find unique placeholder name
    const existingNames = new Set(categories.map((c) => c.name.toLowerCase()));
    let name = "Untitled";
    let n = 2;
    while (existingNames.has(name.toLowerCase())) {
      name = `Untitled ${n}`;
      n++;
    }

    try {
      if (restMode) {
        const res = await fetch(`${window.location.origin}/api/v1/tools/create_category`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: name.toLowerCase().replace(/\s+/g, "-"), name, description: name }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else if (app) {
        await app.callServerTool({
          name: "create_category",
          arguments: { name, after: afterId },
        });
      }
      await refresh();
      setRenamingCategoryId(name);
    } catch (e) {
      console.error("Add category failed:", e);
    }
  }, [app, restMode, menu.categoryId, categories, hideContextMenu, refresh]);

  const handleDeleteCategory = useCallback(async () => {
    if (!menu.categoryId) return;
    hideContextMenu();
    try {
      if (restMode) {
        const res = await fetch(`${window.location.origin}/api/v1/categories/${menu.categoryId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else if (app) {
        await app.callServerTool({
          name: "delete_category",
          arguments: { name: menu.categoryId },
        });
      }
      refresh();
    } catch (e) {
      console.error("Delete category failed:", e);
    }
  }, [app, restMode, menu.categoryId, hideContextMenu, refresh]);

  const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(null);

  const handleRenameCategorySubmit = useCallback(async (categoryId: string, newName: string) => {
    setRenamingCategoryId(null);
    const currentName = categories.find((c) => c.id === categoryId)?.name ?? categoryId;
    if (!newName || newName === currentName) return;
    try {
      if (restMode) {
        const res = await fetch(`${window.location.origin}/api/v1/categories/${categoryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else if (app) {
        await app.callServerTool({
          name: "rename_category",
          arguments: { name: categoryId, new_name: newName },
        });
      }
      refresh();
    } catch (e) {
      console.error("Rename category failed:", e);
    }
  }, [app, restMode, categories, refresh]);

  const handleMovePrompt = useCallback(async (promptId: string, targetCategory: string) => {
    try {
      if (restMode) {
        const res = await fetch(`${window.location.origin}/api/v1/prompts/${promptId}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_category: targetCategory }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else if (app) {
        await app.callServerTool({
          name: "move_prompt",
          arguments: { id: promptId, target_category: targetCategory },
        });
      }
      refresh();
    } catch (e) {
      console.error("Move failed:", e);
    }
  }, [app, restMode, refresh]);

  const handleDelete = useCallback(async () => {
    if (!menu.promptId) return;
    const prompt = prompts.find((p) => p.id === menu.promptId);
    if (!prompt) return;
    hideContextMenu();
    try {
      if (restMode) {
        const res = await fetch(`${window.location.origin}/api/v1/prompts/${prompt.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else if (app) {
        await app.callServerTool({
          name: "delete_prompt",
          arguments: { id: prompt.id },
        });
      }
      refresh();
    } catch (e) {
      console.error("Delete failed:", e);
    }
  }, [app, restMode, menu.promptId, prompts, hideContextMenu, refresh]);

  const contextPrompt = prompts.find((p) => p.id === menu.promptId);

  if (viewState.view === "edit") {
    return (
      <EditView
        app={app}
        prompt={viewState.prompt}
        onBack={handleBack}
        onDeleted={handleDeleted}
        restMode={restMode}
      />
    );
  }

  return (
    <div className="app-container">
      <Header
        onReload={refresh}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        loading={loading}
        theme={theme}
        onToggleTheme={cycleTheme}
        restMode={restMode}
        onExpand={handleExpand}
      />
      {loading ? (
        <div className="loading-state">Loading prompts...</div>
      ) : (
        <IconGrid
          prompts={prompts}
          categories={categories}
          onEdit={handleEdit}
          onContextMenu={handleContextMenu}
          onCategoryContextMenu={handleCategoryContextMenu}
          onMovePrompt={handleMovePrompt}
          renamingCategoryId={renamingCategoryId}
          onStartRenameCategory={setRenamingCategoryId}
          onRenameCategorySubmit={handleRenameCategorySubmit}
          onRenameCategoryCancel={() => setRenamingCategoryId(null)}
        />
      )}
      <ContextMenu
        menu={menu}
        onEdit={() => {
          if (contextPrompt) handleEdit(contextPrompt);
          hideContextMenu();
        }}
        onDelete={handleDelete}
        onAddCategoryAfter={handleAddCategoryAfter}
        onDeleteCategory={handleDeleteCategory}
        categoryEmpty={
          menu.categoryId
            ? prompts.filter((p) => p.category === menu.categoryId).length === 0
            : false
        }
      />
    </div>
  );
}
