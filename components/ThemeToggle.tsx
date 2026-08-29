"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with DOM class set by inline script
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage unavailable — theme just won't persist
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-mist transition hover:border-comfort-high hover:text-halo"
    >
      <span className="font-data">{isDark ? "DARK" : "LIGHT"}</span>
      <span>{isDark ? "\u2600" : "\u263D"}</span>
    </button>
  );
}
