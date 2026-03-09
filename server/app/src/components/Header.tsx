interface HeaderProps {
  onReload: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  loading: boolean;
  theme: "system" | "light" | "dark";
  onToggleTheme: () => void;
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
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header-top">
        <h1 className="header-title">Promptuary</h1>
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
