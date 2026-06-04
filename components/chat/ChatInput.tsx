// Phase 4 — Chat panel
'use client';

import { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSSEStream } from '@/lib/useSSEStream';

export default function ChatInput() {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { isStreaming, isThinking, rateLimitState, threadId } = useChatStore();
  const { token } = useAuthStore();
  const { startStream } = useSSEStream();

  const disabled = isStreaming || isThinking || rateLimitState.blocked;

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 144); // approx 6 rows
    textarea.style.height = `${newHeight}px`;
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    adjustHeight();
  };

  const handleSubmit = async () => {
    if (content.trim() === '' || disabled) return;
    const messageText = content.trim();
    setContent('');
    
    // Reset textarea height immediately
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    await useChatStore.getState().sendMessage(messageText);
    await startStream(messageText, threadId, token || '');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = content.length;
  const showWarning = charCount > 600;
  const isNearLimit = charCount > 850;

  return (
    <div className="border-t border-border-subtle bg-bg-primary p-4 w-full">
      {showWarning && (
        <div className={`text-xs mb-2 text-right px-2 ${isNearLimit ? 'text-red-400' : 'text-text-muted'}`}>
          {charCount} / 900
        </div>
      )}
      <div className="flex items-end gap-3 max-w-4xl mx-auto w-full relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          maxLength={900}
          disabled={disabled}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none bg-bg-panel border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed overflow-y-auto"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || content.trim() === ''}
          className="w-10 h-10 shrink-0 rounded-xl bg-accent flex items-center justify-center hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
}
