import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";

type AppMode = "connecting" | "mcp" | "rest";

function PromptManagerApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();
  const [mode, setMode] = useState<AppMode>("connecting");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setMode("mcp");
      setHostContext(app.getHostContext());
    }
  }, [app]);

  useEffect(() => {
    if (!app && mode === "connecting") {
      timerRef.current = setTimeout(() => {
        setMode("rest");
      }, 1500);
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [app, mode]);

  if (error && mode === "mcp") {
    return (
      <div className="error-state">
        <strong>Error:</strong> {error.message}
      </div>
    );
  }

  if (mode === "connecting") {
    return <div className="loading-state">Connecting...</div>;
  }

  if (mode === "rest") {
    return (
      <main>
        <App app={null} toolResult={null} restMode={true} />
      </main>
    );
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
      <App app={app} toolResult={toolResult} restMode={false} />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PromptManagerApp />
  </StrictMode>
);
