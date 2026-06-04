// Phase 2 — Auth screens
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import AuthForm from '@/components/auth/AuthForm';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

type AuthMode = 'login' | 'register';

export default function AuthTabs() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState<AuthMode>(initialTab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
    >
      {/* Tab Switcher */}
      <div className="relative flex gap-6 mb-8 border-b border-border-subtle pb-2">
        <button
          onClick={() => setActiveTab('login')}
          className={`text-sm font-medium tracking-[0.05em] transition-colors duration-200 focus:outline-none pb-2 ${
            activeTab === 'login'
              ? 'text-text-primary'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Sign in
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`text-sm font-medium tracking-[0.05em] transition-colors duration-200 focus:outline-none pb-2 ${
            activeTab === 'register'
              ? 'text-text-primary'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Create account
        </button>

        {/* Animated underline indicator */}
        <motion.div
          layoutId="auth-tab-indicator"
          className="absolute bottom-0 h-[2px] bg-accent"
          style={{
            left: activeTab === 'login' ? 0 : undefined,
          }}
          transition={spring}
        />
      </div>

      {/* Auth Form */}
      <AuthForm mode={activeTab} onSwitchMode={setActiveTab} />
    </motion.div>
  );
}
