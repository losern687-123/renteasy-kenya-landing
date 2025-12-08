import { useCallback } from "react";

type HapticType = "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";

export function useHaptics() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const haptic = useCallback((type: HapticType = "light") => {
    const patterns: Record<HapticType, number | number[]> = {
      light: 10,
      medium: 25,
      heavy: 50,
      selection: 5,
      success: [10, 50, 10],
      warning: [25, 25, 25],
      error: [50, 25, 50, 25, 50],
    };

    vibrate(patterns[type]);
  }, [vibrate]);

  const selectionChanged = useCallback(() => {
    haptic("selection");
  }, [haptic]);

  const impactLight = useCallback(() => {
    haptic("light");
  }, [haptic]);

  const impactMedium = useCallback(() => {
    haptic("medium");
  }, [haptic]);

  const impactHeavy = useCallback(() => {
    haptic("heavy");
  }, [haptic]);

  const notificationSuccess = useCallback(() => {
    haptic("success");
  }, [haptic]);

  const notificationWarning = useCallback(() => {
    haptic("warning");
  }, [haptic]);

  const notificationError = useCallback(() => {
    haptic("error");
  }, [haptic]);

  return {
    vibrate,
    haptic,
    selectionChanged,
    impactLight,
    impactMedium,
    impactHeavy,
    notificationSuccess,
    notificationWarning,
    notificationError,
  };
}
