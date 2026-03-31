import type React from "react";
import { createContext, useContext, useEffect, useMemo } from "react";
import { Uniwind, useUniwind } from "uniwind";

interface AppThemeContextType {
  currentTheme: string;
  isDark: true;
}

const AppThemeContext = createContext<AppThemeContextType | undefined>(
  undefined
);

export const AppThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { theme } = useUniwind();

  useEffect(() => {
    if (theme !== "dark") {
      Uniwind.setTheme("dark");
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      currentTheme: "dark" as const,
      isDark: true as const,
    }),
    []
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
};

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return context;
}
