// Phase 1 — Foundation
// Tailwind v4: Theme configuration moved to app/globals.css via @theme blocks.
// This file only exports shared animation constants for Framer Motion components.

export const springConfig = { type: 'spring' as const, stiffness: 300, damping: 30 };

export const fadeUpVariant = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: springConfig },
};
