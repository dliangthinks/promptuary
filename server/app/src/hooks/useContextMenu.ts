import { useState, useCallback, useEffect } from "react";

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  promptId: string | null;
  categoryId: string | null;
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    promptId: null,
    categoryId: null,
  });

  const show = useCallback((x: number, y: number, promptId: string) => {
    setMenu({ visible: true, x, y, promptId, categoryId: null });
  }, []);

  const showCategory = useCallback((x: number, y: number, categoryId: string) => {
    setMenu({ visible: true, x, y, promptId: null, categoryId });
  }, []);

  const hide = useCallback(() => {
    setMenu((prev) => ({ ...prev, visible: false, promptId: null, categoryId: null }));
  }, []);

  useEffect(() => {
    const handleClick = () => hide();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [hide]);

  return { menu, show, showCategory, hide };
}
