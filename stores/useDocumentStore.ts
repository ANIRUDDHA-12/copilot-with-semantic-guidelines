// Phase 1 — Foundation
import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export interface DocumentMetadata {
  title: string;
  author: string;
  pageCount: number;
  source: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  metadata: DocumentMetadata;
  created_at: string;
}

export interface JobState {
  jobId: string;
  filename: string;
  progress: number;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  error: string | null;
}

interface DocumentStore {
  documents: DocumentItem[];
  activeJobs: Map<string, JobState>;
  isLoadingDocuments: boolean;

  fetchDocuments: () => Promise<void>;
  uploadPdf: (file: File) => Promise<void>;
  startPolling: (jobId: string) => void;
  deleteDocument: (id: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  activeJobs: new Map(),
  isLoadingDocuments: false,

  fetchDocuments: async () => {
    set({ isLoadingDocuments: true });
    const response = await apiFetch('/api/documents');
    
    if (!response.error && Array.isArray(response)) {
      set({ documents: response, isLoadingDocuments: false });
    } else {
      console.error('Failed to fetch documents', response.error);
      set({ isLoadingDocuments: false });
    }
  },

  uploadPdf: async (file: File) => {
    // Client-side validation
    if (file.type !== 'application/pdf') {
      console.error('Only PDF files are allowed');
      return;
    }
    
    // Max 50MB (52428800 bytes)
    if (file.size > 52428800) {
      console.error('File exceeds 50MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);

    const response = await apiFetch('/api/upload/pdf', {
      method: 'POST',
      body: formData,
    });

    if (response.jobId) {
      const { jobId } = response;
      const newJobs = new Map(get().activeJobs);
      newJobs.set(jobId, {
        jobId,
        filename: file.name,
        progress: 0,
        state: 'waiting',
        error: null,
      });
      set({ activeJobs: newJobs });
      
      get().startPolling(jobId);
    } else {
      console.error('Failed to queue upload job', response.error);
    }
  },

  startPolling: (jobId: string) => {
    let attempts = 0;
    const maxAttempts = 400; // 400 * 1500ms = 10 minutes timeout

    const intervalId = setInterval(async () => {
      attempts++;
      
      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        const newJobs = new Map(get().activeJobs);
        const job = newJobs.get(jobId);
        if (job) {
          job.state = 'failed';
          job.error = 'Polling timeout (10 minutes)';
          newJobs.set(jobId, job);
          set({ activeJobs: newJobs });
        }
        return;
      }

      const response = await apiFetch(`/api/upload/status/${jobId}`);
      
      if (response.error) {
        clearInterval(intervalId);
        const newJobs = new Map(get().activeJobs);
        const job = newJobs.get(jobId);
        if (job) {
          job.state = 'failed';
          job.error = response.error;
          newJobs.set(jobId, job);
          set({ activeJobs: newJobs });
        }
        return;
      }

      const { state, progress, error } = response;
      
      const newJobs = new Map(get().activeJobs);
      const job = newJobs.get(jobId);
      
      if (job) {
        job.state = state;
        job.progress = progress;
        job.error = error;
        newJobs.set(jobId, job);
        set({ activeJobs: newJobs });
      }

      if (state === 'completed') {
        clearInterval(intervalId);
        setTimeout(() => {
          get().fetchDocuments();
          const finalJobs = new Map(get().activeJobs);
          finalJobs.delete(jobId);
          set({ activeJobs: finalJobs });
        }, 2000);
      } else if (state === 'failed') {
        clearInterval(intervalId);
      }
    }, 1500);
  },

  deleteDocument: async (id: string) => {
    // Optimistic UI update
    const previousDocuments = get().documents;
    set({ documents: previousDocuments.filter(doc => doc.id !== id) });

    const response = await apiFetch(`/api/documents/${id}`, {
      method: 'DELETE',
    });

    if (response.error) {
      // Revert optimistic update
      console.error('Failed to delete document', response.error);
      set({ documents: previousDocuments });
    }
  },
}));
