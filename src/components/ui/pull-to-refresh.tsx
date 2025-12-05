import { useState, useRef, useCallback, ReactNode } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);
  
  const THRESHOLD = 80;
  const MAX_PULL = 120;
  
  const opacity = useTransform(pullDistance, [0, THRESHOLD], [0, 1]);
  const scale = useTransform(pullDistance, [0, THRESHOLD], [0.5, 1]);
  const rotate = useTransform(pullDistance, [0, THRESHOLD, MAX_PULL], [0, 180, 360]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, currentY - startY.current);
    const dampedDiff = Math.min(diff * 0.5, MAX_PULL);
    
    pullDistance.set(dampedDiff);
  }, [isPulling, isRefreshing, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    const currentPull = pullDistance.get();
    
    if (currentPull >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      pullDistance.set(60);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    pullDistance.set(0);
    setIsPulling(false);
  }, [isPulling, isRefreshing, onRefresh, pullDistance]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            className="absolute left-0 right-0 flex justify-center z-10 pointer-events-none"
            style={{ 
              top: -40,
              y: pullDistance,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={cn(
                "w-10 h-10 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center border border-primary/20",
                isRefreshing && "bg-primary/20"
              )}
              style={{ opacity, scale }}
            >
              <motion.div style={{ rotate: isRefreshing ? undefined : rotate }}>
                <RefreshCw 
                  className={cn(
                    "h-5 w-5 text-primary",
                    isRefreshing && "animate-spin"
                  )} 
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}