export type Theme = "light" | "dark" | "gpb";
const KEY = "app_theme";

export function initTheme() {
  const saved = (localStorage.getItem(KEY) as Theme | null) ?? "dark";
  applyTheme(saved);
}

export function getTheme(): Theme {
  const cls = document.documentElement.className;
  if (cls.includes("theme-light")) return "light";
  if (cls.includes("theme-gpb")) return "gpb";
  return "dark";
}

export function setTheme(next: Theme) {
  localStorage.setItem(KEY, next);
  applyTheme(next);
}

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark", "theme-gpb");
  root.classList.add(`theme-${t}`);
}
