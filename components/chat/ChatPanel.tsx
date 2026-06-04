// Phase 4 — Chat panel
'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/stores/useChatStore';

import MessageBubble from './MessageBubble';
import StreamingMessage from './StreamingMessage';
import ThinkingIndicator from './ThinkingIndicator';
import ChatInput from './ChatInput';
import RateLimitBanner from './RateLimitBanner';

export default function ChatPanel() {
  const { 
    messages, 
    streamingMessage, 
    isStreaming, 
    isThinking, 
    rateLimitState,
    error,
    clearError
  } = useChatStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or stream chunks
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, streamingMessage, isThinking]);

  const isEmpty = messages.length === 0 && !isThinking && !isStreaming;

  return (
    <div className="flex-col h-full overflow-hidden flex bg-bg-primary w-full max-w-5xl mx-auto">
      {/* Section 1: Message History Scroll Area */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6 relative"
      >
        {isEmpty ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-text-muted">Ask a question about your documents.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto min-h-full pb-8">
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                id={msg.id} 
                role={msg.role} 
                content={msg.content} 
                isCached={msg.isCached}
              />
            ))}
            
            <AnimatePresence>
              {isThinking && <ThinkingIndicator key="thinking" />}
            </AnimatePresence>

            {isStreaming && <StreamingMessage />}
          </div>
        )}
      </div>

      {/* Section 2: Error Alert */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-100 flex justify-between items-center z-10">
          <span className="text-xs text-red-600 font-medium">{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {/* Section 3: Rate Limit Banner & Input */}
      <div className="w-full flex flex-col z-10">
        <AnimatePresence>
          {rateLimitState.blocked && (
            <RateLimitBanner key="rate-limit" secondsLeft={rateLimitState.secondsLeft} />
          )}
        </AnimatePresence>
        <ChatInput />
      </div>
    </div>
  );
}
