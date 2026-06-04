// Phase 2 — Auth screens
'use client';

import { Suspense } from 'react';
import AuthTabs from '@/components/auth/AuthTabs';

function AuthPageInner() {
  return (
    <div className="flex min-h-screen bg-bg-primary selection:bg-stone-200 selection:text-stone-900 relative overflow-hidden">
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          animation: 'grainShift 8s steps(10) infinite',
        }}
      />

      {/* Left Brand Column — hidden on mobile */}
      <div
        className="hidden md:flex flex-col justify-between w-[40%] p-12 border-r border-border-subtle relative z-10"
        style={{ backgroundColor: '#ECECEB' }}
      >
        <div
          className="opacity-0"
          style={{
            animation: 'slideRightFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
          }}
        >
          <h1 className="text-2xl font-medium text-text-primary tracking-tighter">
            Aegis
          </h1>
          <p className="text-xs text-text-secondary mt-2">Secure Intelligence</p>
        </div>
        <div
          className="max-w-sm opacity-0"
          style={{
            animation: 'slideRightFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
          }}
        >
          <p className="text-base text-text-secondary italic leading-relaxed">
            &ldquo;The height of sophistication is simplicity.&rdquo;
          </p>
        </div>
      </div>

      {/* Right Auth Column */}
      <div className="w-full md:w-[60%] bg-bg-primary flex flex-col justify-center items-center p-8 relative z-10">
        {/* Mobile Brand Header */}
        <div className="md:hidden absolute top-0 left-0 w-full p-8 flex justify-between items-center">
          <h1 className="text-2xl font-medium text-text-primary tracking-tighter">
            Aegis
          </h1>
        </div>

        <div className="w-full max-w-sm">
          <AuthTabs />
        </div>
      </div>

      {/* Grain + slide animation keyframes */}
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
        @keyframes slideRightFade {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// Wrap in Suspense because AuthTabs uses useSearchParams
export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <div className="text-text-muted text-sm">Loading…</div>
        </div>
      }
    >
      <AuthPageInner />
    </Suspense>
  );
}
