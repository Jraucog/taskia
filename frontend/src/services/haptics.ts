/**
 * Haptic feedback utility for mobile touch ergonomics and PWA environments.
 * Uses window.navigator.vibrate with safe feature-detection fallbacks.
 */
export const triggerHaptic = (pattern: number | number[] = 25) => {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration error on unsupported platforms/permissions
    }
  }
};

/** Pre-configured haptic profiles for distinct tactile feel */
export const haptics = {
  /** Ultra-light tap for navigation buttons, chips, tabs */
  tap: () => triggerHaptic(12),
  /** Positive confirm for completing a habit or series step */
  success: () => triggerHaptic([30, 40, 60]),
  /** Double pulse for special rewards or streak milestones */
  celebrate: () => triggerHaptic([50, 40, 80, 40, 120]),
  /** Soft warning / attention pulse */
  warning: () => triggerHaptic([40, 60, 40]),
  /** Gentle selection toggle */
  selection: () => triggerHaptic(20),
};
