import type { Prompt } from "./types.js";

export interface IconDef {
  paths: React.ReactNode;
  color: string;
}

type IconKey = string;

// All available icons — 45+ unique icons
const iconDefs: Record<IconKey, { color: string; d: string[] }> = {
  search:        { color: "#6366f1", d: ["M11 11m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0", "M21 21l-4.3-4.3"] },
  chart:         { color: "#0891b2", d: ["M3 3v18h18", "M19 9l-5 5l-4-4l-3 3"] },
  brain:         { color: "#c026d3", d: ["M9.5 2a2.5 2.5 0 0 1 2.5 2.5v15a2.5 2.5 0 0 1-4.96.44a2.5 2.5 0 0 1-2.54-2.94a2.5 2.5 0 0 1-.46-4.96a2.5 2.5 0 0 1 2.96-3.04a2.5 2.5 0 0 1 2.5-2v-5z", "M14.5 2a2.5 2.5 0 0 0-2.5 2.5v15a2.5 2.5 0 0 0 4.96.44a2.5 2.5 0 0 0 2.54-2.94a2.5 2.5 0 0 0 .46-4.96a2.5 2.5 0 0 0-2.96-3.04a2.5 2.5 0 0 0-2.5-2v-5z"] },
  microscope:    { color: "#7c3aed", d: ["M6 18h8", "M3 22h18", "M14 22a7 7 0 1 0 0-14h-1", "M9 14h2", "M9 12a2 2 0 0 1-2-2v-4h6v4a2 2 0 0 1-2 2z", "M12 6v-3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3"] },
  code:          { color: "#059669", d: ["M16 18l6-6l-6-6", "M8 6l-6 6l6 6"] },
  terminal:      { color: "#16a34a", d: ["M4 17l6-6l-6-6", "M12 19h8"] },
  fileCode:      { color: "#0d9488", d: ["M14.5 2h-8.5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-12.5l-5.5-5.5z", "M14 2v6h6", "M10 13l-2 2l2 2", "M14 17l2-2l-2-2"] },
  gear:          { color: "#64748b", d: ["M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18v.21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0-1.18-2.82h-.21a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 2.82-1.18v-.21a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0 1.18 2.82h.21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z"] },
  wrench:        { color: "#f59e0b", d: ["M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"] },
  book:          { color: "#8b5cf6", d: ["M4 19.5v-15a2.5 2.5 0 0 1 2.5-2.5h13.5v20h-13.5a2.5 2.5 0 0 1 0-5h13.5"] },
  graduationCap: { color: "#6d28d9", d: ["M22 10v6", "M2 10l10-5l10 5l-10 5z", "M6 12v5c0 2 4 3 6 3s6-1 6-3v-5"] },
  lightbulb:     { color: "#eab308", d: ["M15 14c.2-1 .7-1.7 1.5-2.5c1-.9 1.5-2.2 1.5-3.5a6 6 0 0 0-12 0c0 1 .2 2.2 1.5 3.5c.7.7 1.2 1.5 1.5 2.5", "M9 18h6", "M10 22h4"] },
  pen:           { color: "#ec4899", d: ["M17 3a2.85 2.83 0 1 1 4 4l-13.5 13.5l-5.5 1.5l1.5-5.5z"] },
  notebook:      { color: "#f472b6", d: ["M2 6h4", "M2 10h4", "M2 14h4", "M2 18h4", "M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-16", "M16 2v20"] },
  scroll:        { color: "#d97706", d: ["M8 21h12a2 2 0 0 0 2-2v-2h-12v2a2 2 0 1 1-4 0v-14a2 2 0 1 0-4 0v3h4", "M19 17v-12a2 2 0 0 0-2-2h-13"] },
  flask:         { color: "#14b8a6", d: ["M10 2v7.527a2 2 0 0 1-.211.896l-5.069 10.127a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127a2 2 0 0 1-.211-.896v-7.527", "M8.5 2h7", "M7 16.5h10"] },
  globe:         { color: "#2563eb", d: ["M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0", "M12 2a14.5 14.5 0 0 0 0 20a14.5 14.5 0 0 0 0-20", "M2 12h20"] },
  bug:           { color: "#ef4444", d: ["M8 2l1.88 1.88", "M14.12 3.88l1.88-1.88", "M9 7.13v-1a3 3 0 1 1 6 0v1", "M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6", "M12 20v-9", "M6.53 9c-1.93-.2-3.53-1.9-3.53-3.89", "M6 13h-4", "M3 21c0-2.1 1.7-3.9 3.8-4", "M20.97 5c0 2.1-1.6 3.8-3.5 4", "M22 13h-4", "M17.2 17c2.1.1 3.8 1.9 3.8 4"] },
  alertTriangle: { color: "#f97316", d: ["M21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14a2 2 0 0 0 1.73 3h16a2 2 0 0 0 1.73-3z", "M12 9v4", "M12 17h.01"] },
  shield:        { color: "#3b82f6", d: ["M12 22s8-4 8-10v-7l-8-3l-8 3v7c0 6 8 10 8 10"] },
  dollar:        { color: "#10b981", d: ["M12 2v20", "M17 5h-6.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7h-9.5"] },
  bank:          { color: "#0ea5e9", d: ["M3 22h18", "M6 18v-7", "M10 18v-7", "M14 18v-7", "M18 18v-7", "M12 2l-9 7h18z"] },
  calendar:      { color: "#8b5cf6", d: ["M3 4h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-18a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2z", "M16 2v4", "M8 2v4", "M3 10h18"] },
  clock:         { color: "#0284c7", d: ["M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0", "M12 6v6l4 2"] },
  target:        { color: "#dc2626", d: ["M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0", "M12 12m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0", "M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"] },
  users:         { color: "#7c3aed", d: ["M16 21v-2a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v2", "M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"] },
  clipboard:     { color: "#0891b2", d: ["M8 2h8a1 1 0 0 1 1 1v1h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h2v-1a1 1 0 0 1 1-1z"] },
  checkSquare:   { color: "#16a34a", d: ["M9 11l3 3l11-10", "M21 12v7a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h11"] },
  layers:        { color: "#a855f7", d: ["M12 2l-10 5l10 5l10-5l-10-5z", "M2 17l10 5l10-5", "M2 12l10 5l10-5"] },
  compass:       { color: "#e11d48", d: ["M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0", "M16.24 7.76l-2.12 6.36l-6.36 2.12l2.12-6.36l6.36-2.12z"] },
  map:           { color: "#059669", d: ["M1 6l7-4l8 4l7-4v16l-7 4l-8-4l-7 4v-16z", "M8 2v18", "M16 6v18"] },
  megaphone:     { color: "#ea580c", d: ["M3 11l18-5v12l-18-4v-3z", "M11.6 16.8a3 3 0 1 1-5.8-1.6"] },
  star:          { color: "#eab308", d: ["M12 2l3.09 6.26l6.91 1.01l-5 4.87l1.18 6.88l-6.18-3.25l-6.18 3.25l1.18-6.88l-5-4.87l6.91-1.01l3.09-6.26z"] },
  sparkles:      { color: "#d946ef", d: ["M12 3l-1.912 5.813a2 2 0 0 1-1.275 1.275l-5.813 1.912l5.813 1.912a2 2 0 0 1 1.275 1.275l1.912 5.813l1.912-5.813a2 2 0 0 1 1.275-1.275l5.813-1.912l-5.813-1.912a2 2 0 0 1-1.275-1.275l-1.912-5.813z", "M5 3v4", "M19 17v4", "M3 5h4", "M17 19h4"] },
  file:          { color: "#64748b", d: ["M14.5 2h-8.5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-12.5l-5.5-5.5z", "M14 2v6h6"] },
  fileText:      { color: "#78716c", d: ["M14.5 2h-8.5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-12.5l-5.5-5.5z", "M14 2v6h6", "M16 13h-8", "M16 17h-8", "M10 9h-2"] },
  scissors:      { color: "#e11d48", d: ["M6 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0", "M6 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0", "M20 4l-11.88 11.88", "M14.47 14.48l5.53 5.52", "M8.12 8.12l3.88 3.88"] },
  refresh:       { color: "#0891b2", d: ["M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74l2.26 2.26", "M21 3v5h-5", "M21 12a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74l-2.26-2.26", "M3 21v-5h5"] },
  inbox:         { color: "#6366f1", d: ["M22 12l-6 0l-2 3h-4l-2-3l-6 0", "M5.45 5.11l-3.45 6.89v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89a2 2 0 0 0-1.79-1.11h-9.52a2 2 0 0 0-1.79 1.11z"] },
  filter:        { color: "#64748b", d: ["M22 3h-20l8 9.46v6.54l4 2v-8.54l8-9.46z"] },
  barChart:      { color: "#2563eb", d: ["M12 20v-10", "M18 20v-16", "M6 20v-4"] },
  pieChart:      { color: "#8b5cf6", d: ["M21.21 15.89a10 10 0 1 1-12.38-13.06", "M22 12a10 10 0 0 0-10-10v10z"] },
  database:      { color: "#0d9488", d: ["M12 5c4.97 0 9-1.34 9-3s-4.03-3-9-3s-9 1.34-9 3s4.03 3 9 3z", "M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3v-14", "M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"] },
  lock:          { color: "#dc2626", d: ["M3 11h18a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-18a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z", "M7 11v-4a5 5 0 0 1 10 0v4"] },
  mail:          { color: "#06b6d4", d: ["M2 4h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-20a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2z", "M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0l-8.97-5.7"] },
  trophy:        { color: "#f59e0b", d: ["M6 9h-1.5a2.5 2.5 0 0 1 0-5h1.5", "M18 9h1.5a2.5 2.5 0 0 0 0-5h-1.5", "M4 22h16", "M10 14.66v2.34c0 .55-.47.98-.97 1.21c-1.18.54-2.03 2.03-2.03 3.79", "M14 14.66v2.34c0 .55.47.98.97 1.21c1.18.54 2.03 2.03 2.03 3.79", "M18 2h-12v7a6 6 0 0 0 12 0v-7z"] },
  zap:           { color: "#f59e0b", d: ["M13 2l-10 12h9l-1 10l10-12h-9l1-10z"] },
  eye:           { color: "#6366f1", d: ["M2 12s3-7 10-7s10 7 10 7s-3 7-10 7s-10-7-10-7z", "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0"] },
  message:       { color: "#0ea5e9", d: ["M21 15a2 2 0 0 1-2 2h-11l-4 4v-18a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"] },
  link:          { color: "#7c3aed", d: ["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"] },
  package:       { color: "#a16207", d: ["M7.5 4.27l9 5.15", "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4a2 2 0 0 0-1 1.73v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73v-8z", "M3.3 7l8.7 5l8.7-5", "M12 22v-10"] },
  hash:          { color: "#64748b", d: ["M4 9h16", "M4 15h16", "M10 3l-2 18", "M16 3l-2 18"] },
  palette:       { color: "#ec4899", d: ["M12 2c-5.5 0-10 4.5-10 10s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688c0-.437-.18-.835-.437-1.125c-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554c.008-5.448-4.497-9.84-9.992-9.84z"] },
  newspaper:     { color: "#78716c", d: ["M4 22h16a2 2 0 0 0 2-2v-16a2 2 0 0 0-2-2h-12a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2", "M18 14h-8", "M15 18h-5", "M10 6h8v4h-8v-4z"] },
  anchor:        { color: "#475569", d: ["M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0", "M12 15v7", "M5 18h-2a1 1 0 0 1-1-1c0-5 4-9 10-9s10 4 10 9a1 1 0 0 1-1 1h-2"] },
  rocket:        { color: "#f43f5e", d: ["M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z", "M12 15l-3-3a22 22 0 0 1 2-3.95a12.88 12.88 0 0 1 5.24-4.55c2.36-1.22 5.76-1.5 5.76-1.5s-.28 3.4-1.5 5.76a12.88 12.88 0 0 1-4.55 5.24a22 22 0 0 1-3.95 2z", "M9 12h.01", "M15 6h.01"] },
  heart:         { color: "#e11d48", d: ["M20.84 4.61a5.5 5.5 0 0 0-7.78 0l-.06.06l-.06-.06a5.5 5.5 0 0 0-7.78 7.78l.06.06l7.78 7.78l7.78-7.78l.06-.06a5.5 5.5 0 0 0 0-7.78z"] },
};

// All icon keys
const allIconKeys = Object.keys(iconDefs);

// Keywords → icon key (first match wins per prompt)
const keywordMap: [string[], IconKey][] = [
  [["search", "find", "query", "lookup", "discover"], "search"],
  [["analyz", "analysis", "inspect", "examin", "assess"], "microscope"],
  [["chart", "graph", "metric", "statistic", "dashboard"], "chart"],
  [["bar chart", "bar graph", "trend"], "barChart"],
  [["pie", "distribution", "breakdown"], "pieChart"],
  [["brain", "intelligen", "cognitive", "think", "reason", "ai", "smart", "deep"], "brain"],
  [["code", "program", "syntax", "implement", "develop", "module", "refactor", "function", "coding"], "code"],
  [["terminal", "command", "shell", "cli", "bash", "console"], "terminal"],
  [["gear", "setting", "config", "preference", "option"], "gear"],
  [["tool", "wrench", "fix", "repair", "maintain"], "wrench"],
  [["book", "guide", "manual", "reference", "documentation", "study"], "book"],
  [["learn", "educat", "teach", "course", "lesson", "tutorial", "explain"], "graduationCap"],
  [["idea", "concept", "insight", "suggest", "recommend", "tip"], "lightbulb"],
  [["write", "author", "compose", "draft", "essay", "blog", "article", "story"], "pen"],
  [["note", "notebook", "journal", "diary", "log"], "notebook"],
  [["template", "scaffold", "boilerplate", "format"], "scroll"],
  [["research", "experiment", "test", "lab", "hypothesis", "scientific"], "flask"],
  [["world", "global", "international", "web", "internet", "online"], "globe"],
  [["bug", "debug", "error", "issue", "defect", "troubleshoot"], "bug"],
  [["warn", "alert", "caution", "danger", "risk", "threat", "hazard"], "alertTriangle"],
  [["secur", "protect", "shield", "guard", "safe", "defend", "compliance", "govern"], "shield"],
  [["money", "financ", "budget", "cost", "price", "revenue", "profit", "invest", "fund", "dollar", "payment"], "dollar"],
  [["bank", "treasury", "account", "ledger"], "bank"],
  [["calendar", "date", "event", "meeting", "appointment"], "calendar"],
  [["time", "clock", "schedule", "deadline", "timeline", "duration"], "clock"],
  [["target", "goal", "objective", "aim", "scope", "milestone", "kpi"], "target"],
  [["team", "user", "people", "stakeholder", "collaborat", "group", "member", "personnel"], "users"],
  [["task", "todo", "checklist", "action", "assign", "workflow", "project", "plan"], "clipboard"],
  [["check", "verify", "valid", "approv", "review", "quality", "assurance"], "checkSquare"],
  [["layer", "stack", "tier", "level", "hierarch", "structur", "architect"], "layers"],
  [["navigat", "compass", "direction", "orient", "explor"], "compass"],
  [["map", "roadmap", "journey", "path", "route"], "map"],
  [["announce", "broadcast", "megaphone", "update", "status", "report", "communicat"], "megaphone"],
  [["star", "favorite", "bookmark", "rate", "rank"], "star"],
  [["magic", "sparkle", "enhance", "transform", "creative", "generat", "chain"], "sparkles"],
  [["cut", "trim", "split", "extract", "crop", "section", "modular"], "scissors"],
  [["reload", "refresh", "sync", "renew", "repeat"], "refresh"],
  [["inbox", "receive", "collect", "gather", "aggregate"], "inbox"],
  [["filter", "sort", "refine", "narrow", "curate", "select"], "filter"],
  [["data", "database", "store", "record", "warehouse", "vault", "integrat", "preserv"], "database"],
  [["lock", "password", "encrypt", "access", "permission", "auth"], "lock"],
  [["email", "mail", "send", "notify", "outreach"], "mail"],
  [["award", "trophy", "achievement", "badge", "certif", "recognition"], "trophy"],
  [["fast", "speed", "quick", "perform", "optim", "efficient", "power", "boost", "energy", "progressive"], "zap"],
  [["view", "see", "watch", "observ", "monitor", "preview", "visual"], "eye"],
  [["chat", "conversation", "dialog", "discuss", "talk", "prompt", "message"], "message"],
  [["link", "connect", "relate", "associat", "reference", "cross"], "link"],
  [["package", "bundle", "deploy", "release", "ship", "deliver", "build"], "package"],
  [["tag", "label", "categoriz", "classif", "organiz", "meta"], "hash"],
  [["design", "style", "theme", "aesthetic", "color", "art", "paint"], "palette"],
  [["news", "summary", "digest", "overview", "brief", "recap"], "newspaper"],
  [["text", "content", "paragraph", "page", "read"], "fileText"],
  [["file", "document"], "fileCode"],
  [["launch", "rocket", "start", "deploy", "ship"], "rocket"],
  [["love", "heart", "care", "empathy", "sentiment"], "heart"],
  [["anchor", "foundation", "base", "core", "root"], "anchor"],
];

// Category fallback icons
const categoryFallback: Record<string, IconKey> = {
  analysis: "microscope",
  code: "code",
  development: "gear",
  education: "graduationCap",
  writing: "pen",
  research: "flask",
  "research-tools": "flask",
  debugging: "bug",
  finance: "dollar",
  governance: "shield",
  risk: "alertTriangle",
  schedule: "calendar",
  scope: "target",
  stakeholder: "users",
  pm: "clipboard",
  custom: "star",
  example: "lightbulb",
  content_processing: "filter",
  resources: "database",
};

function matchKeyword(prompt: Prompt): IconKey | null {
  const text = `${prompt.name} ${prompt.description || ""} ${prompt.id}`.toLowerCase();
  for (const [keywords, iconKey] of keywordMap) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        return iconKey;
      }
    }
  }
  return null;
}

/**
 * Assign unique icons to all prompts. No two prompts get the same icon
 * unless we run out of icons (45+ icons for 47 prompts).
 */
export function assignIcons(prompts: Prompt[]): Map<string, IconDef> {
  const result = new Map<string, IconDef>();
  const usedKeys = new Set<IconKey>();

  // First pass: assign best keyword match if available and not yet used
  const pending: Prompt[] = [];
  for (const p of prompts) {
    const key = matchKeyword(p);
    if (key && !usedKeys.has(key)) {
      usedKeys.add(key);
      result.set(p.id, makeIconDef(key));
    } else {
      pending.push(p);
    }
  }

  // Second pass: try category fallback for remaining
  const stillPending: Prompt[] = [];
  for (const p of pending) {
    const catKey = categoryFallback[p.category || ""];
    if (catKey && !usedKeys.has(catKey)) {
      usedKeys.add(catKey);
      result.set(p.id, makeIconDef(catKey));
    } else {
      stillPending.push(p);
    }
  }

  // Third pass: assign any remaining unused icon
  const unusedKeys = allIconKeys.filter((k) => !usedKeys.has(k));
  for (const p of stillPending) {
    const key = unusedKeys.shift();
    if (key) {
      usedKeys.add(key);
      result.set(p.id, makeIconDef(key));
    } else {
      // All icons used — allow reuse from full list by cycling
      const fallback = allIconKeys[(usedKeys.size + result.size) % allIconKeys.length];
      result.set(p.id, makeIconDef(fallback));
    }
  }

  return result;
}

function makeIconDef(key: IconKey): IconDef {
  const def = iconDefs[key] || iconDefs.file;
  return {
    color: def.color,
    paths: (
      <>
        {def.d.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </>
    ),
  };
}
