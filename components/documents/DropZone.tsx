// Phase 3 — Dashboard + Document panel
'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '@/stores/useDocumentStore';

export default function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPdf } = useDocumentStore();

  const validateAndUpload = (file: File) => {
    if (file.type !== 'application/pdf') {
      showError('Only PDF files are accepted');
      return;
    }

    if (file.size > 52428800) { // 50 MB
      showError('File exceeds 50 MB limit');
      return;
    }

    uploadPdf(file);
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => {
      setError(null);
    }, 3000);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col relative w-full">
      <motion.div
        animate={{ scale: isDragging ? 1.01 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group ${
          isDragging 
            ? 'border-accent bg-bg-panel' 
            : 'border-border-subtle hover:bg-bg-panel'
        }`}
      >
        <svg 
          className={`w-6 h-6 mb-2 transition-colors ${
            isDragging ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span className={`text-sm transition-colors ${
          isDragging ? 'text-text-primary' : 'text-text-muted group-hover:text-text-primary'
        }`}>
          Drop PDF here
        </span>
        <span className="text-xs text-text-muted mt-1">or click to browse · max 50 MB</span>
      </motion.div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute -bottom-10 left-0 right-0 text-center text-xs text-red-400 font-medium"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
