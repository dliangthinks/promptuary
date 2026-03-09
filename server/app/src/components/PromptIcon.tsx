import type { Prompt } from "../types.js";
import type { IconDef } from "../iconAssigner.jsx";

interface PromptIconProps {
  prompt: Prompt;
  icon: IconDef;
  onClick: (prompt: Prompt) => void;
  onContextMenu: (e: React.MouseEvent, prompt: Prompt) => void;
  onDragStart: (e: React.DragEvent, prompt: Prompt) => void;
}

export function PromptIcon({
  prompt,
  icon,
  onClick,
  onContextMenu,
  onDragStart,
}: PromptIconProps) {
  return (
    <div
      className="prompt-card"
      draggable
      onClick={() => onClick(prompt)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, prompt);
      }}
      onDragStart={(e) => onDragStart(e, prompt)}
    >
      <div className="prompt-card-icon" style={{ color: icon.color }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          {icon.paths}
        </svg>
      </div>
      <div className="prompt-card-body">
        <div className="prompt-card-name">{prompt.name}</div>
        {prompt.description && (
          <div className="prompt-card-description">{prompt.description}</div>
        )}
      </div>
    </div>
  );
}
