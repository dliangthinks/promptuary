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
  app: McpApp;
  toolResult: CallToolResult | null;
}

type Theme = "system" | "light" | "dark";

export function App({ app, toolResult }: AppProps) {
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

  const {
    prompts,
    categories,
    loading,
    searchTerm,
    setSearchTerm,
    refresh,
  } = usePromptData(app);
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
      await app.callServerTool({
        name: "create_category",
        arguments: { name, after: afterId },
      });
      await refresh();
      setRenamingCategoryId(name);
    } catch (e) {
      console.error("Add category failed:", e);
    }
  }, [app, menu.categoryId, categories, hideContextMenu, refresh]);

  const handleDeleteCategory = useCallback(async () => {
    if (!menu.categoryId) return;
    hideContextMenu();
    try {
      await app.callServerTool({
        name: "delete_category",
        arguments: { name: menu.categoryId },
      });
      refresh();
    } catch (e) {
      console.error("Delete category failed:", e);
    }
  }, [app, menu.categoryId, hideContextMenu, refresh]);

  const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(null);

  const handleRenameCategorySubmit = useCallback(async (categoryId: string, newName: string) => {
    setRenamingCategoryId(null);
    const currentName = categories.find((c) => c.id === categoryId)?.name ?? categoryId;
    if (!newName || newName === currentName) return;
    try {
      await app.callServerTool({
        name: "rename_category",
        arguments: { name: categoryId, new_name: newName },
      });
      refresh();
    } catch (e) {
      console.error("Rename category failed:", e);
    }
  }, [app, categories, refresh]);

  const handleMovePrompt = useCallback(async (promptId: string, targetCategory: string) => {
    try {
      await app.callServerTool({
        name: "move_prompt",
        arguments: { id: promptId, target_category: targetCategory },
      });
      refresh();
    } catch (e) {
      console.error("Move failed:", e);
    }
  }, [app, refresh]);

  const handleDelete = useCallback(async () => {
    if (!menu.promptId) return;
    const prompt = prompts.find((p) => p.id === menu.promptId);
    if (!prompt) return;
    hideContextMenu();
    try {
      await app.callServerTool({
        name: "delete_prompt",
        arguments: { id: prompt.id },
      });
      refresh();
    } catch (e) {
      console.error("Delete failed:", e);
    }
  }, [app, menu.promptId, prompts, hideContextMenu, refresh]);

  const contextPrompt = prompts.find((p) => p.id === menu.promptId);

  if (viewState.view === "edit") {
    return (
      <EditView
        app={app}
        prompt={viewState.prompt}
        onBack={handleBack}
        onDeleted={handleDeleted}
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
