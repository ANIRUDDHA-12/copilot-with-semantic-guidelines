// Phase 2 — Auth screens
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

const stagger = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
};

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return (
    <div className="relative min-h-screen flex flex-col bg-bg-primary selection:bg-stone-200 selection:text-stone-900 overflow-hidden">
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          animation: 'grainShift 8s steps(10) infinite',
        }}
      />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-14 border-b border-border-subtle bg-bg-primary/80 backdrop-blur-sm">
        <div className="text-sm font-medium tracking-[0.12em] uppercase text-text-primary">
          AEGIS
        </div>
        <div>
          {mounted && isAuthenticated ? (
            <Link
              href="/dashboard"
              className="bg-transparent border border-border-subtle text-text-primary rounded-lg px-5 py-2 text-sm font-medium hover:bg-bg-panel transition-colors duration-200"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth?tab=login"
              className="bg-transparent border border-border-subtle text-text-primary rounded-lg px-5 py-2 text-sm font-medium hover:bg-bg-panel transition-colors duration-200"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center gap-6 mx-auto px-8 pt-14 max-w-4xl">
        <motion.div
          className="flex flex-col items-center gap-6"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {/* Eyebrow */}
          <motion.div
            variants={fadeUp}
            className="text-[11px] text-text-muted tracking-[0.12em] uppercase"
          >
            Document Intelligence
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-[40px] lg:text-[64px] font-medium text-text-primary leading-[1.1] tracking-[-0.04em] flex flex-col items-center"
          >
            <span className="block">Ask anything about</span>
            <span className="block">your documents.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            className="text-base text-text-secondary leading-[1.7] max-w-md"
          >
            Upload your PDFs. Ask questions in natural language. Get precise
            answers with full context.
          </motion.p>

          {/* CTA Row */}
          <motion.div variants={fadeUp} className="flex gap-4 mt-4">
            <div ref={wrapRef} className="inline-block">
              <Link
                ref={btnRef}
                href="/auth?tab=register"
                className="inline-block bg-accent text-white rounded-lg px-6 py-3 text-sm font-medium tracking-[0.05em] hover:opacity-90 will-change-transform"
              >
                Get started
              </Link>
            </div>
            {/* <Link
              href="/auth?tab=login"
              className="bg-transparent border border-border-subtle text-text-primary rounded-lg px-6 py-3 text-sm font-medium tracking-[0.05em] hover:bg-bg-panel transition-colors duration-200"
            >
              Sign in
            </Link> */}
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 flex justify-center items-center px-8 text-center">
        <div className="text-[11px] text-text-muted">
          Powered by LLaMA 3.1 · Hybrid semantic search · Streaming responses
        </div>
      </footer>

      {/* Grain animation keyframes */}
      <style jsx global>{`
        @keyframes grainShift {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1%, -1%); }
          20% { transform: translate(1%, -2%); }
          30% { transform: translate(-2%, 1%); }
          40% { transform: translate(1%, 2%); }
          50% { transform: translate(-1%, 1%); }
          60% { transform: translate(2%, -1%); }
          70% { transform: translate(-2%, -2%); }
          80% { transform: translate(1%, 1%); }
          90% { transform: translate(-1%, -1%); }
        }
      `}</style>
    </div>
  );
}
