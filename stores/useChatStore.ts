// Phase 1 — Foundation (Refactored Phase 4)
import { create } from 'zustand';
// const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isCached?: boolean;
}

export interface RateLimitState {
  blocked: boolean;
  secondsLeft: number;
}

interface ChatState {
  messages: ChatMessage[];
  streamingMessage: string;
  isStreaming: boolean;
  isThinking: boolean;
  isCurrentStreamCached: boolean;
  rateLimitState: RateLimitState;
  threadId: string;
  error: string | null;

  // Fully typed action stubs
  appendToken: (t: string) => void;
  commitStreamingMessage: () => void;
  setIsThinking: (bool: boolean) => void;
  setIsStreaming: (bool: boolean) => void;
  setIsCurrentStreamCached: (bool: boolean) => void;
  setError: (msg: string | null) => void;
  clearError: () => void;

  sendMessage: (text: string) => Promise<void>;
  setRateLimit: (seconds: number) => void;
  newChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  streamingMessage: '',
  isStreaming: false,
  isThinking: false,
  isCurrentStreamCached: false,
  rateLimitState: { blocked: false, secondsLeft: 0 },
  threadId: crypto.randomUUID(),
  error: null,

  appendToken: (t: string) => {
    set((state) => ({ streamingMessage: state.streamingMessage + t }));
  },

  commitStreamingMessage: () => {
    const { streamingMessage, isCurrentStreamCached } = get();
    if (streamingMessage) {
      set((state) => ({
        messages: [
          ...state.messages,
          { 
            id: crypto.randomUUID(), 
            role: 'assistant', 
            content: streamingMessage,
            isCached: isCurrentStreamCached 
          }
        ],
        streamingMessage: '',
        isStreaming: false,
        isCurrentStreamCached: false
      }));
    }
  },

  setIsThinking: (bool: boolean) => set({ isThinking: bool }),
  
  setIsStreaming: (bool: boolean) => set({ isStreaming: bool }),

  setIsCurrentStreamCached: (bool: boolean) => set({ isCurrentStreamCached: bool }),

  setError: (msg: string | null) => set({ error: msg }),

  clearError: () => set({ error: null }),

  sendMessage: async (text: string) => {
    // Phase 4: Local state update decoupled from network fetch
    set((state) => ({
      messages: [
        ...state.messages, 
        { id: crypto.randomUUID(), role: 'user', content: text }
      ],
      isThinking: true,
      isStreaming: false,
      error: null
    }));
  },

  setRateLimit: (seconds: number) => {
    set({ rateLimitState: { blocked: true, secondsLeft: seconds } });
    
    const intervalId = setInterval(() => {
      const current = get().rateLimitState;
      if (current.secondsLeft <= 1) {
        clearInterval(intervalId);
        set({ rateLimitState: { blocked: false, secondsLeft: 0 } });
      } else {
        set({ rateLimitState: { blocked: true, secondsLeft: current.secondsLeft - 1 } });
      }
    }, 1000);
  },

  newChat: () => {
    set({
      threadId: crypto.randomUUID(),
      messages: [],
      streamingMessage: '',
      isStreaming: false,
      isThinking: false,
      isCurrentStreamCached: false,
      error: null
    });
  }
}));
