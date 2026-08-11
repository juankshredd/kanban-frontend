"use client";

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";

interface ThemeContextType {
  isDark: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function subscribeNoop() {
  return () => {};
}

function applyTheme(dark: boolean) {
  const htmlElement = document.documentElement;
  if (dark) {
    htmlElement.classList.add("dark");
  } else {
    htmlElement.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  // Client-only mount flag via useSyncExternalStore instead of a
  // useEffect+setState pair, so the first client render after hydration
  // reads true without triggering a render-phase setState.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  useEffect(() => {
    // Check localStorage for saved preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const shouldBeDark = savedTheme ? savedTheme === "dark" : prefersDark;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage/matchMedia, not derivable at render time
    setIsDark(shouldBeDark);
    applyTheme(shouldBeDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
    applyTheme(newDarkMode);
  };

  if (!mounted) {
    // Return children without theme context during mounting to prevent hydration mismatch
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a safe default instead of throwing during SSR
    return { isDark: false, toggleDarkMode: () => {} };
  }
  return context;
}
