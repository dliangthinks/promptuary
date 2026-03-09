import type { ContextMenuState } from "../hooks/useContextMenu.js";

interface ContextMenuProps {
  menu: ContextMenuState;
  onEdit: () => void;
  onDelete: () => void;
  onAddCategoryAfter: () => void;
  onDeleteCategory: () => void;
  categoryEmpty: boolean;
}

export function ContextMenu({
  menu,
  onEdit,
  onDelete,
  onAddCategoryAfter,
  onDeleteCategory,
  categoryEmpty,
}: ContextMenuProps) {
  if (!menu.visible) return null;

  // Category context menu
  if (menu.categoryId) {
    return (
      <div
        className="context-menu"
        style={{ top: menu.y, left: menu.x }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="context-menu-item" onClick={onAddCategoryAfter}>
          &#x2795;&ensp;Add Category After
        </button>
        <hr className="context-menu-divider" />
        <button
          className="context-menu-item context-menu-item-danger"
          onClick={onDeleteCategory}
          disabled={!categoryEmpty}
          title={categoryEmpty ? undefined : "Move or delete all prompts first"}
        >
          &#x2715;&ensp;Delete Category
        </button>
        {!categoryEmpty && (
          <div className="context-menu-hint">Category is not empty</div>
        )}
      </div>
    );
  }

  // Prompt context menu
  return (
    <div
      className="context-menu"
      style={{ top: menu.y, left: menu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="context-menu-item" onClick={onEdit}>
        &#x270E;&#xFE0E;&ensp;View / Edit
      </button>
      <hr className="context-menu-divider" />
      <button className="context-menu-item context-menu-item-danger" onClick={onDelete}>
        &#x2715;&ensp;Delete
      </button>
    </div>
  );
}
