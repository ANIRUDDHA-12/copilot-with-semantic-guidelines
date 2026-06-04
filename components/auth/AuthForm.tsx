// Phase 2 — Auth screens
'use client';

import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/useAuthStore';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

interface AuthFormProps {
  mode: 'login' | 'register';
  onSwitchMode: (mode: 'login' | 'register') => void;
}

interface FieldErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function AuthForm({ mode, onSwitchMode }: AuthFormProps) {
  const router = useRouter();
  const { login, register, isLoading, authError, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Clear errors when switching modes
  useEffect(() => {
    setFieldErrors({});
    clearError();
  }, [mode, clearError]);

  // Sync store auth errors to field errors
  useEffect(() => {
    if (authError) {
      setFieldErrors((prev) => ({ ...prev, general: authError }));
      setIsSubmitting(false);
    }
  }, [authError]);

  // Magnetic button effect
  useEffect(() => {
    const wrap = wrapRef.current;
    const btn = btnRef.current;
    if (!wrap || !btn) return;

    const maxDisplacement = 8;

    const handleMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const displaceX = (x / (rect.width / 2)) * maxDisplacement;
      const displaceY = (y / (rect.height / 2)) * maxDisplacement;
      btn.style.transform = `translate(${displaceX}px, ${displaceY}px) scale(1.02)`;
      btn.style.transition = 'transform 0.1s linear';
    };

    const handleLeave = () => {
      btn.style.transform = 'translate(0px, 0px) scale(1)';
      btn.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    };

    const handleDown = () => {
      btn.style.transform = 'translate(0px, 0px) scale(0.97)';
      btn.style.transition = 'transform 0.1s cubic-bezier(0.16, 1, 0.3, 1)';
    };

    const handleUp = () => {
      btn.style.transform = 'translate(0px, 0px) scale(1.02)';
      btn.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    };

    wrap.addEventListener('mousemove', handleMove);
    wrap.addEventListener('mouseleave', handleLeave);
    wrap.addEventListener('mousedown', handleDown);
    wrap.addEventListener('mouseup', handleUp);

    return () => {
      wrap.removeEventListener('mousemove', handleMove);
      wrap.removeEventListener('mouseleave', handleLeave);
      wrap.removeEventListener('mousedown', handleDown);
      wrap.removeEventListener('mouseup', handleUp);
    };
  }, []);

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!email.includes('@')) {
      errors.email = 'Please enter a valid email';
    }

    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    clearError();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }

      // Check if login/register was successful (no authError set)
      const currentError = useAuthStore.getState().authError;
      if (!currentError) {
        router.push('/dashboard');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* General Error */}
      <AnimatePresence>
        {fieldErrors.general && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={spring}
            className="text-xs text-red-400 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
          >
            {fieldErrors.general}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Field */}
      <div
        className="opacity-0"
        style={{
          animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
        }}
      >
        <label
          htmlFor="auth-email"
          className="block text-xs text-text-secondary mb-2"
        >
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isFormLoading}
          className={`w-full border px-4 py-3 text-sm text-text-primary bg-bg-primary rounded-xl transition-colors duration-200 focus:outline-none focus:ring-0 placeholder:text-text-muted disabled:opacity-50 ${
            fieldErrors.email
              ? 'border-red-300 focus:border-red-300'
              : 'border-border-subtle focus:border-accent'
          }`}
        />
        <AnimatePresence>
          {fieldErrors.email && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={spring}
              className="text-xs text-red-400 mt-1 flex items-center gap-1"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {fieldErrors.email}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Password Field */}
      <div
        className="opacity-0"
        style={{
          animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both',
        }}
      >
        <label
          htmlFor="auth-password"
          className="block text-xs text-text-secondary mb-2"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isFormLoading}
            className={`w-full border px-4 py-3 pr-12 text-sm text-text-primary bg-bg-primary rounded-xl transition-colors duration-200 focus:outline-none focus:ring-0 placeholder:text-text-muted disabled:opacity-50 ${
              fieldErrors.password
                ? 'border-red-300 focus:border-red-300'
                : 'border-border-subtle focus:border-accent'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary focus:outline-none transition-colors duration-200"
            tabIndex={-1}
          >
            {showPassword ? (
              // Eye open (visibility)
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              // Eye closed (visibility_off)
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
        </div>
        <AnimatePresence>
          {fieldErrors.password && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={spring}
              className="text-xs text-red-400 mt-1 flex items-center gap-1"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {fieldErrors.password}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Submit Button */}
      <div
        ref={wrapRef}
        className="pt-2 opacity-0"
        style={{
          animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both',
        }}
      >
        <button
          ref={btnRef}
          type="submit"
          disabled={isFormLoading}
          className="w-full bg-accent text-white py-3 text-sm font-medium tracking-[0.05em] transition-opacity hover:opacity-90 focus:outline-none rounded-xl will-change-transform disabled:opacity-70"
        >
          {isFormLoading ? (
            <span className="flex justify-center items-center gap-1">
              <span className="loading-dot" style={{ animationDelay: '-0.32s' }} />
              <span className="loading-dot" style={{ animationDelay: '-0.16s' }} />
              <span className="loading-dot" />
            </span>
          ) : mode === 'login' ? (
            'Sign in to Aegis'
          ) : (
            'Create account'
          )}
        </button>
      </div>

      {/* Switch mode link */}
      <div
        className="text-center pt-2 opacity-0"
        style={{
          animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both',
        }}
      >
        <p className="text-xs text-text-muted">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => onSwitchMode('register')}
                className="text-text-primary underline underline-offset-4 decoration-border-subtle hover:decoration-text-primary transition-colors cursor-pointer"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onSwitchMode('login')}
                className="text-text-primary underline underline-offset-4 decoration-border-subtle hover:decoration-text-primary transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      {/* Loading dot + slideUp keyframes */}
      <style jsx>{`
        .loading-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background-color: currentColor;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </form>
  );
}
