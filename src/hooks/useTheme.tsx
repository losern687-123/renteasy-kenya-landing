import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "renteasy-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem(THEME_KEY) as Theme) || "system";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem(THEME_KEY) as Theme;
    if (stored === "system" || !stored) return getSystemTheme();
    return stored;
  });

  // Fetch theme from database on auth change
  useEffect(() => {
    const fetchThemeFromDB = async (uid: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', uid)
          .single();

        if (!error && data?.theme_preference) {
          const dbTheme = data.theme_preference as Theme;
          setThemeState(dbTheme);
          localStorage.setItem(THEME_KEY, dbTheme);
        }
      } catch (err) {
        console.error('Error fetching theme preference:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchThemeFromDB(session.user.id);
      } else {
        setUserId(null);
        setIsLoading(false);
      }
    });

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchThemeFromDB(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    
    root.classList.add("theme-transition");
    
    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
    
    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    localStorage.setItem(THEME_KEY, theme);
    
    const timeout = setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      if (theme === "system") {
        setResolvedTheme(getSystemTheme());
        const root = document.documentElement;
        if (getSystemTheme() === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Save theme to database
  const syncThemeToDB = useCallback(async (newTheme: Theme) => {
    if (!userId) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ theme_preference: newTheme })
        .eq('id', userId);
    } catch (err) {
      console.error('Error saving theme preference:', err);
    }
  }, [userId]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    syncThemeToDB(newTheme);
  }, [syncThemeToDB]);

  const toggleTheme = useCallback(() => {
    const newTheme = (() => {
      if (theme === "light") return "dark";
      if (theme === "dark") return "light";
      return getSystemTheme() === "dark" ? "light" : "dark";
    })();
    setTheme(newTheme);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
