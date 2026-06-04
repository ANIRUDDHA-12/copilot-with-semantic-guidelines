// Phase 4 — Chat panel
'use client';

import { motion } from 'framer-motion';

export default function ThinkingIndicator() {
  return (
    <>
      <style>{`
        @keyframes thinkingPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex items-center gap-3 p-4 justify-start"
      >
        <div className="flex gap-1.5 items-center">
          <div 
            className="w-2 h-2 rounded-full bg-border-subtle" 
            style={{ animation: 'thinkingPulse 1.2s infinite ease-in-out', animationDelay: '0s' }}
          />
          <div 
            className="w-2 h-2 rounded-full bg-border-subtle" 
            style={{ animation: 'thinkingPulse 1.2s infinite ease-in-out', animationDelay: '0.2s' }}
          />
          <div 
            className="w-2 h-2 rounded-full bg-border-subtle" 
            style={{ animation: 'thinkingPulse 1.2s infinite ease-in-out', animationDelay: '0.4s' }}
          />
        </div>
        <span className="text-xs text-text-muted">Analysing documents...</span>
      </motion.div>
    </>
  );
}
