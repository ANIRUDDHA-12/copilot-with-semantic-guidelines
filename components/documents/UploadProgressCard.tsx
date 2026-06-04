// Phase 3 — Dashboard + Document panel
'use client';

import { motion } from 'framer-motion';

interface UploadProgressCardProps {
  jobId: string;
  filename: string;
  state: string;
  progress: number;
  error: string | null;
}

export default function UploadProgressCard({
  filename,
  state,
  progress,
  error
}: UploadProgressCardProps) {
  
  // Badge styling based on state
  const getBadgeStyle = () => {
    switch (state) {
      case 'waiting':
        return { bg: 'bg-stone-100', text: 'text-stone-500', label: 'Queued' };
      case 'active':
        return { bg: 'bg-stone-100', text: 'text-stone-600', label: 'Processing' };
      case 'completed':
        return { bg: 'bg-green-50', text: 'text-green-700', label: 'Complete' };
      case 'failed':
        return { bg: 'bg-red-50', text: 'text-red-600', label: 'Failed' };
      case 'delayed':
        return { bg: 'bg-stone-100', text: 'text-stone-400', label: 'Retrying' };
      default:
        return { bg: 'bg-stone-100', text: 'text-stone-500', label: state };
    }
  };

  const badge = getBadgeStyle();
  const showProgress = state === 'active' || state === 'waiting';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="bg-bg-primary rounded-lg p-4 border border-border-subtle flex flex-col gap-3"
    >
      <div className="flex justify-between items-start gap-2">
        <span className="text-sm text-text-primary truncate font-medium" title={filename}>
          {filename}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded uppercase tracking-wider shrink-0 border ${badge.bg} ${badge.text} border-transparent`}>
          {badge.label}
        </span>
      </div>

      {showProgress && (
        <div className="w-full h-1 bg-border-subtle rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      )}

      {state === 'failed' && error && (
        <div className="text-xs text-red-400 truncate" title={error}>
          {error}
        </div>
      )}
    </motion.div>
  );
}
