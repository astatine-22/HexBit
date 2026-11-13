"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    let initial = "dark";
    try {
      initial = localStorage.getItem("codementor_theme") || "dark";
    } catch (e) {
      initial = "dark";
    }
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("codementor_theme", next);
    } catch (e) {
      // ignore
    }
    window.dispatchEvent(new Event("themechange"));
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      title={isDark ? "Dark mode" : "Light mode"}
      className="inline-flex items-center gap-1.5 rounded-full border border-paper/20 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-paper/70 transition-colors hover:border-accent/50 hover:text-accent"
    >
      <span className={isDark ? "text-accent" : "text-[#c0952f]"}>
        {isDark ? "🌙" : "☀️"}
      </span>
      <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
