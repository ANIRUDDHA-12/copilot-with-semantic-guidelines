// Phase 3 — Dashboard + Document panel
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChatStore } from '@/stores/useChatStore';
import { useDocumentStore } from '@/stores/useDocumentStore';
import DocumentPanel from '@/components/documents/DocumentPanel';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuthStore();
  const { newChat } = useChatStore();
  const { fetchDocuments } = useDocumentStore();

  useEffect(() => {
    setMounted(true);
    fetchDocuments();
  }, [fetchDocuments]);

  // Prevent hydration mismatch for user info
  if (!mounted) {
    return <div className="h-screen bg-bg-primary" />;
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-bg-primary text-text-primary selection:bg-accent selection:text-white">
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full h-14 bg-bg-primary flex justify-between items-center px-8 z-50 border-b border-border-subtle">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium tracking-widest text-text-primary uppercase">Aegis</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={newChat}
            className="text-xs font-medium text-text-primary hover:text-text-secondary transition-colors"
          >
            New Chat
          </button>
          <span className="text-xs text-text-muted hidden md:block">
            {user?.email || 'user@aegis.com'}
          </span>
          <button 
            onClick={logout}
            className="text-xs text-text-muted hover:text-text-primary transition-colors hidden md:block"
          >
            Sign out
          </button>
          <div className="w-8 h-8 rounded-full bg-bg-panel overflow-hidden border border-border-subtle flex-shrink-0 flex items-center justify-center">
            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex pt-[56px] h-full overflow-hidden">
        {/* Left Panel: Document Management */}
        <aside className="w-[320px] fixed md:relative h-full flex flex-col bg-bg-panel border-r border-border-subtle shrink-0 z-40 transform -translate-x-full md:translate-x-0 transition-transform duration-300">
          <DocumentPanel />
        </aside>

        {/* Right Panel: Chat (Placeholder for Phase 4) */}
        <section className="flex-1 bg-bg-primary flex flex-col items-center justify-center relative p-8 overflow-y-auto">
          <div className="text-sm text-text-muted">
            Chat coming in Phase 4
          </div>
        </section>
      </main>
    </div>
  );
}
