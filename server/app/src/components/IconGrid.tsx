import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import type { Prompt, Category } from "../types.js";
import { PromptIcon } from "./PromptIcon.js";
import { assignIcons } from "../iconAssigner.jsx";

interface IconGridProps {
  prompts: Prompt[];
  categories: Category[];
  onEdit: (prompt: Prompt) => void;
  onContextMenu: (e: React.MouseEvent, prompt: Prompt) => void;
  onCategoryContextMenu: (e: React.MouseEvent, categoryId: string) => void;
  onMovePrompt: (promptId: string, targetCategory: string) => void;
  renamingCategoryId: string | null;
  onStartRenameCategory: (categoryId: string) => void;
  onRenameCategorySubmit: (categoryId: string, newName: string) => void;
  onRenameCategoryCancel: () => void;
}

export function IconGrid({
  prompts,
  categories,
  onEdit,
  onContextMenu,
  onCategoryContextMenu,
  onMovePrompt,
  renamingCategoryId,
  onStartRenameCategory,
  onRenameCategorySubmit,
  onRenameCategoryCancel,
}: IconGridProps) {
  const iconMap = useMemo(() => assignIcons(prompts), [prompts]);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, prompt: Prompt) => {
    e.dataTransfer.setData("text/plain", prompt.id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, category: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCategory(category);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCategory(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetCategory: string) => {
      e.preventDefault();
      setDragOverCategory(null);
      const promptId = e.dataTransfer.getData("text/plain");
      if (promptId) {
        onMovePrompt(promptId, targetCategory);
      }
    },
    [onMovePrompt]
  );

  // Group prompts by category
  const grouped = new Map<string, Prompt[]>();
  const uncategorized: Prompt[] = [];

  for (const p of prompts) {
    if (p.category) {
      const list = grouped.get(p.category) || [];
      list.push(p);
      grouped.set(p.category, list);
    } else {
      uncategorized.push(p);
    }
  }

  // Build ordered category list: follow categories prop order, then any extras from prompts
  const orderedCategoryNames: string[] = categories.map((c) => c.name);
  for (const key of grouped.keys()) {
    if (!orderedCategoryNames.includes(key)) {
      orderedCategoryNames.push(key);
    }
  }

  if (prompts.length === 0 && categories.length === 0) {
    return <div className="empty-state">No prompts found</div>;
  }

  return (
    <div className="icon-grid-container">
      {orderedCategoryNames.map((category) => {
        const categoryPrompts = grouped.get(category) || [];
        return (
          <div
            key={category}
            className={`category-section${dragOverCategory === category ? " drag-over" : ""}`}
            onDragOver={(e) => handleDragOver(e, category)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, category)}
          >
            <h3
              className="category-header"
              onContextMenu={(e) => {
                e.preventDefault();
                onCategoryContextMenu(e, category);
              }}
            >
              {renamingCategoryId === category ? (
                <CategoryRenameInput
                  categoryId={category}
                  currentName={category}
                  onSubmit={onRenameCategorySubmit}
                  onCancel={onRenameCategoryCancel}
                />
              ) : (
                <span
                  className="category-name"
                  onClick={() => onStartRenameCategory(category)}
                >
                  {category}
                </span>
              )}
              <span className="category-count">{categoryPrompts.length}</span>
            </h3>
            <div className="icon-grid">
              {categoryPrompts.map((p) => (
                <PromptIcon
                  key={p.id}
                  prompt={p}
                  icon={iconMap.get(p.id)!}
                  onClick={onEdit}
                  onContextMenu={onContextMenu}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </div>
        );
      })}
      {uncategorized.length > 0 && (
        <div className="category-section">
          <h3 className="category-header">
            Uncategorized
            <span className="category-count">{uncategorized.length}</span>
          </h3>
          <div className="icon-grid">
            {uncategorized.map((p) => (
              <PromptIcon
                key={p.id}
                prompt={p}
                icon={iconMap.get(p.id)!}
                onClick={onEdit}
                onContextMenu={onContextMenu}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryRenameInput({
  categoryId,
  currentName,
  onSubmit,
  onCancel,
}: {
  categoryId: string;
  currentName: string;
  onSubmit: (categoryId: string, newName: string) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(currentName);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(categoryId, trimmed);
    } else {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      className="category-rename-input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSubmit();
        if (e.key === "Escape") onCancel();
      }}
      onBlur={handleSubmit}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
