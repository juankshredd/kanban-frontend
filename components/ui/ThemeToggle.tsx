"use client";

import { useTheme } from "@/context/ThemeProvider";
import { useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
}

export default function ThemeToggle() {
  const { isDark, toggleDarkMode } = useTheme();

  // Client-only mount flag via useSyncExternalStore instead of a
  // useEffect+setState pair, so the first client render after hydration
  // reads true without triggering a render-phase setState.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="p-2 w-10 h-10" />;
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-yellow-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
