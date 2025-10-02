export function initTheme() {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-gpb");
  if (!root.classList.contains("theme-dark")) {
    root.classList.add("theme-dark");
  }
}
