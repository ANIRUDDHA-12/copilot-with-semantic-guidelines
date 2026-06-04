// Phase 1 — Foundation
// import { create } from 'zustand/middleware';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  authError: string | null;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Manual base64 decode for JWT payload
function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to parse JWT payload", error);
    return null;
  }
}

// export const useAuthStore = create<AuthState>((set, get) => ({
//   token: null,
//   user: null,
//   isAuthenticated: false,
//   authError: null,
//   isLoading: false,

//   login: async (email:string, password:string) => {
//     set({ isLoading: true, authError: null });
    
//     try {
//       const response = await fetch('http://localhost:3000/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       });
      
//       const data = await response.json();
      
//       if (!response.ok) {
//         set({ authError: data.error || 'Login failed', isLoading: false });
//         return;
//       }
      
//       const token = data.token;
//       if (token) {
//         // This auth-token cookie set via document.cookie is a route-guard signal only.
//         // It is not httpOnly and does not replace the in-memory JWT.
//         document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`;
        
//         const payload = decodeJwtPayload(token);
//         if (payload) {
//           set({
//             token,
//             user: { id: payload.user_id, email: payload.email },
//             isAuthenticated: true,
//             isLoading: false,
//             authError: null,
//           });
//           return;
//         }
//       }
      
//       set({ authError: 'Invalid token received', isLoading: false });
//     } catch (error: any) {
//       set({ authError: error.message || 'Network error', isLoading: false });
//     }
//   },

//   register: async (email:string, password:string) => {
//     set({ isLoading: true, authError: null });
//     try {
//       const response = await fetch('http://localhost:3000/api/auth/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       });
      
//       const data = await response.json();
      
//       if (!response.ok) {
//         set({ authError: data.error || 'Registration failed', isLoading: false });
//         return;
//       }
      
//       // Auto-login on success
//       await get().login(email, password);
//     } catch (error: any) {
//       set({ authError: error.message || 'Network error', isLoading: false });
//     }
//   },

//   logout: () => {
//     // Clear the route-guard cookie
//     document.cookie = "auth-token=; path=/; max-age=0;";
//     set({
//       token: null,
//       user: null,
//       isAuthenticated: false,
//       authError: null,
//     });
//     // Redirect logic
//     if (typeof window !== 'undefined') {
//       window.location.href = '/auth';
//     }
//   },

//   clearError: () => {
//     set({ authError: null });
//   }
// }));

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      authError: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true, authError: null });
        
        try {
          const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            set({ authError: data.error || 'Login failed', isLoading: false });
            return;
          }
          
          const token = data.token;
          if (token) {
            // This auth-token cookie set via document.cookie is a route-guard signal only.
            // It is not httpOnly and does not replace the in-memory JWT.
            document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`;
            
            const payload = decodeJwtPayload(token);
            if (payload) {
              set({
                token,
                user: { id: payload.user_id, email: payload.email },
                isAuthenticated: true,
                isLoading: false,
                authError: null,
              });
              return;
            }
          }
          
          set({ authError: 'Invalid token received', isLoading: false });
        } catch (error: any) {
          set({ authError: error.message || 'Network error', isLoading: false });
        }
      },

      register: async (email: string, password: string) => {
        set({ isLoading: true, authError: null });
        try {
          const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            set({ authError: data.error || 'Registration failed', isLoading: false });
            return;
          }
          
          // Auto-login on success
          await get().login(email, password);
        } catch (error: any) {
          set({ authError: error.message || 'Network error', isLoading: false });
        }
      },

      logout: () => {
        // Clear the route-guard cookie
        document.cookie = "auth-token=; path=/; max-age=0;";
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          authError: null,
        });
        // Redirect logic
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
      },

      clearError: () => {
        set({ authError: null });
      }
    }),
    {
      name: 'auth-storage',
      // Exclude transient/loading states from being written to localStorage
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);