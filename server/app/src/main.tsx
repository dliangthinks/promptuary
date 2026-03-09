import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";

function PromptManagerApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();

  const { app, error } = useApp({
    appInfo: { name: "Promptuary", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.onteardown = async () => {
        return {};
      };
      app.ontoolinput = async (input) => {
        console.info("Received tool input:", input);
      };
      app.ontoolresult = async (result) => {
        setToolResult(result);
      };
      app.ontoolcancelled = (params) => {
        console.info("Tool cancelled:", params.reason);
      };
      app.onerror = console.error;
      app.onhostcontextchanged = (params) => {
        setHostContext((prev) => ({ ...prev, ...params }));
      };
    },
  });

  useEffect(() => {
    if (app) {
      setHostContext(app.getHostContext());
    }
  }, [app]);

  if (error) {
    return (
      <div className="error-state">
        <strong>Error:</strong> {error.message}
      </div>
    );
  }

  if (!app) {
    return <div className="loading-state">Connecting...</div>;
  }

  return (
    <main
      style={{
        paddingTop: hostContext?.safeAreaInsets?.top,
        paddingRight: hostContext?.safeAreaInsets?.right,
        paddingBottom: hostContext?.safeAreaInsets?.bottom,
        paddingLeft: hostContext?.safeAreaInsets?.left,
      }}
    >
      <App app={app} toolResult={toolResult} />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PromptManagerApp />
  </StrictMode>
);
