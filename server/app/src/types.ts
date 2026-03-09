export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
  type?: string;
  default?: string;
}

export interface Prompt {
  id: string;
  name: string;
  description?: string;
  category?: string;
  arguments?: PromptArgument[];
  content?: string;
}

export interface Category {
  name: string;
  description?: string;
  promptCount: number;
}

export type ViewState =
  | { view: "grid" }
  | { view: "edit"; prompt: Prompt };
