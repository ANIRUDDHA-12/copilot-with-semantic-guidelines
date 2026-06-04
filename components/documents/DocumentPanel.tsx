// Phase 3 — Dashboard + Document panel
'use client';

import { AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '@/stores/useDocumentStore';
import DropZone from './DropZone';
import UploadProgressCard from './UploadProgressCard';
import DocumentCard from './DocumentCard';

export default function DocumentPanel() {
  const { documents, activeJobs } = useDocumentStore();
  const jobs = Array.from(activeJobs.values());

  const hasNoContent = documents.length === 0 && jobs.length === 0;

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      {/* Section 1: DropZone */}
      <DropZone />

      {/* Section 2: Active Uploads */}
      {jobs.length > 0 && (
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {jobs.map((job) => (
              <UploadProgressCard
                key={job.jobId}
                jobId={job.jobId}
                filename={job.filename}
                state={job.state}
                progress={job.progress}
                error={job.error}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Section 3: Document Library Header */}
      {(documents.length > 0 || jobs.length > 0) && (
        <div className="flex justify-between items-center px-1">
          <span className="text-xs uppercase tracking-widest text-text-muted font-medium">
            Documents
          </span>
          <span className="text-xs text-text-muted">
            {documents.length}
          </span>
        </div>
      )}

      {/* Section 4: Document List */}
      {documents.length > 0 && (
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto pb-4">
          <AnimatePresence mode="popLayout">
            {documents.map((doc, index) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Section 5: Empty State */}
      {hasNoContent && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-text-muted">Upload a PDF to begin.</p>
        </div>
      )}
    </div>
  );
}
