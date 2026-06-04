// Phase 1 — Foundation

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Use lazy dynamic imports inside the function to avoid circular dependencies
  const { useAuthStore } = await import('@/stores/useAuthStore');
  const { useChatStore } = await import('@/stores/useChatStore');

  const { token, logout } = useAuthStore.getState();
  const { setRateLimit } = useChatStore.getState();

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `http://localhost:3000${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure JSON Content-Type for body requests unless specified otherwise or it's FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, { ...options, headers });

    // Handle JWT failures (401 Unauthorized, 403 Forbidden)
    if (response.status === 403 || response.status === 401) {
      logout();
      return { error: 'session_expired', status: response.status };
    }

    // Handle Rate Limiting
    if (response.status === 429) {
      setRateLimit(10);
      return { error: 'rate_limited', status: 429 };
    }

    // Handle other errors
    if (!response.ok) {
      return { error: response.statusText, status: response.status };
    }

    // Handle empty responses
    if (response.status === 204) {
      return { success: true };
    }

    // Return parsed JSON
    const data = await response.json();
    return data;
  } catch (err: any) {
    return { error: err.message || 'Network error', status: 500 };
  }
}
