// Phase 4 — Chat panel
'use client';

import { motion } from 'framer-motion';

interface RateLimitBannerProps {
  secondsLeft: number;
}

export default function RateLimitBanner({ secondsLeft }: RateLimitBannerProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="px-6 py-2.5 bg-bg-panel border-t border-border-subtle flex items-center">
        <span className="text-xs text-text-secondary">
          Rate limit reached — try again in {secondsLeft}s
        </span>
      </div>
    </motion.div>
  );
}
