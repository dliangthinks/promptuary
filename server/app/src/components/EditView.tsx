import { useState, useCallback, useEffect } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { Prompt } from "../types.js";

interface EditViewProps {
  app: App | null;
  prompt: Prompt;
  onBack: () => void;
  onDeleted: () => void;
  restMode: boolean;
}

export function EditView({ app, prompt, onBack, onDeleted, restMode }: EditViewProps) {
  const [name, setName] = useState(prompt.name);
  const [content, setContent] = useState(prompt.content || "");
  const [description, setDescription] = useState(prompt.description || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingContent, setLoadingContent] = useState(!prompt.content);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (prompt.content) return;
    (async () => {
      try {
        if (restMode) {
          const res = await fetch(`${window.location.origin}/api/v1/prompts/${prompt.id}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setContent(data.content || "");
        } else if (app) {
          const result = await app.callServerTool({
            name: "read_prompt",
            arguments: { id: prompt.id },
          });
          const text = result.content?.find((c) => c.type === "text");
          if (text && "text" in text) {
            setContent(text.text);
          }
        }
      } catch (e) {
        console.error("Failed to load prompt content:", e);
      } finally {
        setLoadingContent(false);
      }
    })();
  }, [app, prompt, restMode]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      if (restMode) {
        const res = await fetch(`${window.location.origin}/api/v1/prompts/${prompt.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else if (app) {
        const args: Record<string, string> = {
          name: prompt.name,
          content,
          description,
        };
        if (name !== prompt.name) {
          args.new_name = name;
        }
        await app.callServerTool({
          name: "update_prompt",
          arguments: args,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setSaving(false);
    }
  }, [app, restMode, prompt.id, prompt.name, name, content, description]);

  const handleDelete = useCallback(async () => {
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
      onDeleted();
    } catch (e) {
      console.error("Delete failed:", e);
    }
  }, [app, restMode, prompt.id, prompt.name, onDeleted]);

  return (
    <div className="detail-view">
      <div className="detail-header">
        <button className="btn btn-back" onClick={onBack}>
          &#x2190; Back
        </button>
      </div>

      <div className="edit-field">
        <label>Name</label>
        <input
          type="text"
          className="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="edit-meta">
        {prompt.category && (
          <span className="edit-category">{prompt.category}</span>
        )}
      </div>

      <div className="edit-field">
        <label>Description</label>
        <textarea
          className="edit-description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            // Auto-resize
            const el = e.target;
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
          }}
          ref={(el) => {
            if (el) {
              el.style.height = "auto";
              el.style.height = el.scrollHeight + "px";
            }
          }}
          rows={1}
        />
      </div>

      <div className="edit-field">
        <label>Content</label>
        {loadingContent ? (
          <div className="loading-text">Loading content&#x2026;</div>
        ) : (
          <textarea
            className="edit-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
          />
        )}
      </div>

      <div className="edit-actions">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving\u2026" : saved ? "\u2713 Saved" : "Save"}
        </button>

        <div className="edit-actions-right">
          {!confirmDelete ? (
            <button
              className="btn btn-danger"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
          ) : (
            <div className="confirm-delete">
              <span>Are you sure?</span>
              <button className="btn btn-danger" onClick={handleDelete}>
                Yes, Delete
              </button>
              <button
                className="btn"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
