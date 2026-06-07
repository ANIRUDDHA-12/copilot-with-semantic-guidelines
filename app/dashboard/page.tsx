// Phase 3 — Dashboard + Document panel
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChatStore } from '@/stores/useChatStore';
import { useDocumentStore } from '@/stores/useDocumentStore';
import DocumentPanel from '@/components/documents/DocumentPanel';
import ChatPanel from '@/components/chat/ChatPanel';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuthStore();
  const { newChat } = useChatStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      <nav className="fixed top-0 w-full h-14 bg-bg-primary flex justify-between items-center px-4 md:px-8 z-50 border-b border-border-subtle">
        <div className="flex items-center gap-4">
          {/* 2. Add Mobile Hamburger Button */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 -ml-2 text-text-primary hover:text-accent transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
          <span className="text-sm font-medium tracking-widest text-text-primary uppercase">Aegis</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={newChat} // Assuming newChat is defined in your file
            className="text-xs font-medium text-text-primary hover:text-text-secondary transition-colors"
          >
            New Chat
          </button>
          <span className="text-xs text-text-muted hidden md:block">
            {user?.email || 'user@aegis.com'}
          </span>
          <button 
            onClick={logout} // Assuming logout is defined in your file
            className="text-xs text-text-muted hover:text-text-primary transition-colors hidden md:block"
          >
            Sign out
          </button>
          <div className="w-8 h-8 rounded-full bg-bg-panel overflow-hidden border border-border-subtle flex-shrink-0 flex items-center justify-center">
            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex pt-[56px] h-full overflow-hidden relative">
        
        {/* 3. Mobile Overlay Backdrop (Clicks to close sidebar) */}
        {isSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Panel: Document Management */}
        <aside className={`w-[320px] fixed md:relative h-full flex flex-col bg-bg-panel border-r border-border-subtle shrink-0 z-40 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <DocumentPanel />
        </aside>

        {/* Right Panel: Chat */}
        <section className="flex-1 bg-bg-primary flex flex-col relative overflow-hidden">
          <ChatPanel />
        </section>
      </main>
    </div>
  );
}
