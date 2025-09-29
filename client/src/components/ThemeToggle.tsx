import { useState, useEffect } from "react";
import { getTheme, setTheme } from "../theme";

type Props = { className?: string };

export default function ThemeToggle({ className = "" }: Props) {
  // переключаем только light/dark
  const [dark, setDark] = useState(getTheme() === "dark");

  useEffect(() => {
    setTheme(dark ? "dark" : "light");
  }, [dark]);

  return (
    <label className={className}>
      <input
        type="checkbox"
        checked={dark}
        onChange={(e) => setDark(e.target.checked)}
      />
      <i />
    </label>
  );
}
