interface HeaderProps {
  onReload: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  loading: boolean;
  theme: "system" | "light" | "dark";
  onToggleTheme: () => void;
  restMode: boolean;
  onExpand?: () => void;
}

const themeIcons: Record<string, string> = {
  system: "\u25D1",
  light: "\u2600\uFE0E",
  dark: "\u263E\uFE0E",
};

export function Header({
  onReload,
  searchTerm,
  onSearchChange,
  loading,
  theme,
  onToggleTheme,
  restMode,
  onExpand,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header-top">
        <h1 className="header-title">
          Promptuary
          <span style={{ fontSize: "0.6em", opacity: 0.6, marginLeft: "0.5em", fontWeight: "normal" }}>
            v2.0.3
          </span>
        </h1>
        <div className="header-actions">
          <button
            className="btn btn-icon"
            onClick={onToggleTheme}
            title={`Theme: ${theme}`}
          >
            {themeIcons[theme]}
          </button>
          <button
            className={`btn btn-icon${loading ? " is-loading" : ""}`}
            onClick={onReload}
            disabled={loading}
            title="Reload prompts"
          >
            &#x21BB;
          </button>
          {!restMode && onExpand && (
            <button
              className="btn btn-icon"
              onClick={onExpand}
              title="Open in browser"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <input
        type="search"
        className="search-input"
        placeholder="Search prompts..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </header>
  );
}
