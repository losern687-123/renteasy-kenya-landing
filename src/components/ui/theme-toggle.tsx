import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeToggleProps {
  variant?: "icon" | "switch" | "dropdown";
  showLabel?: boolean;
}

export function ThemeToggle({ variant = "icon", showLabel = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { impactLight } = useHaptics();

  const handleToggle = () => {
    impactLight();
    toggleTheme();
  };

  const handleSelect = (newTheme: "light" | "dark" | "system") => {
    impactLight();
    setTheme(newTheme);
  };

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              {resolvedTheme === "dark" ? (
                <motion.div
                  key="moon"
                  initial={{ y: 20, opacity: 0, rotate: -90 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: -20, opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <Moon className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ y: 20, opacity: 0, rotate: -90 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: -20, opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <Sun className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleSelect("light")} className="gap-2">
            <Sun className="h-4 w-4" />
            Light
            {theme === "light" && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelect("dark")} className="gap-2">
            <Moon className="h-4 w-4" />
            Dark
            {theme === "dark" && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelect("system")} className="gap-2">
            <Monitor className="h-4 w-4" />
            System
            {theme === "system" && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "switch") {
    return (
      <div className="flex items-center gap-3">
        {showLabel && (
          <span className="text-sm font-medium">
            {resolvedTheme === "dark" ? "Dark Mode" : "Light Mode"}
          </span>
        )}
        <button
          onClick={handleToggle}
          className="relative h-8 w-14 rounded-full bg-muted p-1 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Toggle theme"
        >
          <motion.div
            className="flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-md"
            animate={{
              x: resolvedTheme === "dark" ? 22 : 0,
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <AnimatePresence mode="wait">
              {resolvedTheme === "dark" ? (
                <motion.div
                  key="moon"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-3.5 w-3.5 text-primary" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -180 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-3.5 w-3.5 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </button>
      </div>
    );
  }

  // Default icon variant
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="relative overflow-hidden"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait">
        {resolvedTheme === "dark" ? (
          <motion.div
            key="moon"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <Moon className="h-5 w-5" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ scale: 0, rotate: 90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -90 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <Sun className="h-5 w-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
