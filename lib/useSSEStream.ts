// Phase 4 — Chat panel
import { useChatStore } from '@/stores/useChatStore';


export function useSSEStream() {
  const startStream = async (message: string, threadId: string, token: string) => {
    const { 
      setRateLimit, 
      setError, 
      setIsThinking, 
      setIsStreaming, 
      appendToken, 
      commitStreamingMessage,
      setIsCurrentStreamCached
    } = useChatStore.getState();

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message, threadId }),
      });

      if (response.status === 429) {
        setRateLimit(10);
        setIsThinking(false);
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
                
                // Semantic Cache Micro-Interaction
                if (parsed.isCached === true) {
                  setIsCurrentStreamCached(true);
                }

                if (parsed.token) {
                  const currentState = useChatStore.getState();
                  if (currentState.isThinking) {
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
      if (useChatStore.getState().isStreaming) {
        commitStreamingMessage();
      }

    } catch (error: any) {
      setError(error.message || 'Stream connection failed');
      setIsThinking(false);
    }
  };

  return { startStream };
}
