import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const FloatingThemeToggle = () => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className={cn(
          "h-12 w-12 rounded-full shadow-lg border-2",
          "bg-background/80 backdrop-blur-sm",
          "hover:scale-110 transition-all duration-200",
          "border-border/50 hover:border-primary/50"
        )}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <motion.div
          initial={false}
          animate={{ rotate: resolvedTheme === 'dark' ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="h-5 w-5 text-primary" />
          ) : (
            <Sun className="h-5 w-5 text-primary" />
          )}
        </motion.div>
      </Button>
    </motion.div>
  );
};