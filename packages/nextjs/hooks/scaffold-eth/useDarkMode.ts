import { useEffect } from "react";
import { useTheme } from "next-themes";

export const useDarkMode = () => {
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (!resolvedTheme) {
      setTheme(isDarkMode ? "dark" : "light");
    }
  }, [resolvedTheme, setTheme]);
}; 