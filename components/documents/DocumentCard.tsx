// Phase 3 — Dashboard + Document panel
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDocumentStore } from '@/stores/useDocumentStore';
import type { DocumentItem } from '@/stores/useDocumentStore';

interface DocumentCardProps {
  document: DocumentItem;
  index: number;
}

export default function DocumentCard({ document, index }: DocumentCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { deleteDocument } = useDocumentStore();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
    await deleteDocument(document.id);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
      className="bg-bg-primary border border-border-subtle rounded-lg p-4 flex items-start gap-3 hover:bg-bg-panel transition-colors duration-150 cursor-pointer group"
    >
      <div className="shrink-0 pt-0.5">
        <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h4 className="text-sm text-text-primary font-medium truncate" title={document.filename}>
          {document.filename}
        </h4>
        <div className="text-xs text-text-muted">
          {document.metadata.pageCount || 0} pages · {formatDate(document.created_at)}
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-end min-w-[70px]">
        {!showDeleteConfirm ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-red-400 p-1"
            title="Delete Document"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-secondary pr-1">Delete?</span>
            <button 
              onClick={handleDelete}
              className="text-red-500 font-medium hover:underline"
            >
              Yes
            </button>
            <button 
              onClick={cancelDelete}
              className="text-text-secondary hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
