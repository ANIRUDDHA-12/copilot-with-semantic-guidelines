// Phase 1 — Foundation
import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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
  rateLimitState: RateLimitState;
  threadId: string;
  error: string | null;

  // Fully typed action stubs
  appendToken: (t: string) => void;
  commitStreamingMessage: () => void;
  setIsThinking: (bool: boolean) => void;
  setIsStreaming: (bool: boolean) => void;
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
  rateLimitState: { blocked: false, secondsLeft: 0 },
  threadId: crypto.randomUUID(),
  error: null,

  appendToken: (t: string) => {
    set((state) => ({ streamingMessage: state.streamingMessage + t }));
  },

  commitStreamingMessage: () => {
    const { streamingMessage } = get();
    if (streamingMessage) {
      set((state) => ({
        messages: [
          ...state.messages,
          { id: crypto.randomUUID(), role: 'assistant', content: streamingMessage }
        ],
        streamingMessage: '',
        isStreaming: false
      }));
    }
  },

  setIsThinking: (bool: boolean) => set({ isThinking: bool }),
  
  setIsStreaming: (bool: boolean) => set({ isStreaming: bool }),

  setError: (msg: string | null) => set({ error: msg }),

  clearError: () => set({ error: null }),

  sendMessage: async (text: string) => {
    const { threadId, setIsThinking, setIsStreaming, setError, appendToken, commitStreamingMessage } = get();
    
    // Add user message
    set((state) => ({
      messages: [
        ...state.messages, 
        { id: crypto.randomUUID(), role: 'user', content: text }
      ]
    }));
    
    setIsThinking(true);
    setIsStreaming(false);
    setError(null);

    // Lazy load auth store inside action to avoid circular dependency
    const { useAuthStore } = await import('@/stores/useAuthStore');
    const { token } = useAuthStore.getState();

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: text, threadId }),
      });

      if (response.status === 429) {
        get().setRateLimit(10);
        return;
      }

      if (response.status === 400) {
        const errData = await response.json();
        setError(errData.error || 'Bad Request');
        setIsThinking(false);
        return;
      }

      if (!response.ok) {
        setError(response.statusText);
        setIsThinking(false);
        return;
      }

      if (!response.body) {
        setError('No response body stream');
        setIsThinking(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            
            if (dataStr === '[DONE]') {
              commitStreamingMessage();
            } else {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.token) {
                  if (get().isThinking) {
                    setIsThinking(false);
                    setIsStreaming(true);
                  }
                  appendToken(parsed.token);
                }
              } catch (e) {
                console.error('Failed to parse SSE JSON:', e);
              }
            }
          }
        }
      }
      
      // Safety net if stream ended but no [DONE] was processed
      if (get().isStreaming) {
        commitStreamingMessage();
      }

    } catch (error: any) {
      setError(error.message || 'Stream connection failed');
      setIsThinking(false);
    }
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
      error: null
    });
  }
}));
