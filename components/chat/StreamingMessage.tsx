// Phase 4 — Chat panel
'use client';


import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fadeUpVariant } from '@/tailwind.config';
import { useChatStore } from '@/stores/useChatStore';

export default function StreamingMessage() {
  const { streamingMessage, isCurrentStreamCached } = useChatStore();

  const markdownComponents = {
    p: ({ children }: any) => <p className="text-text-secondary leading-relaxed mb-4 last:mb-0 inline">{children}</p>,
    h1: ({ children }: any) => <h1 className="text-text-primary text-xl font-medium mt-6 mb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-text-primary text-lg font-medium mt-5 mb-2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-text-primary text-md font-medium mt-4 mb-1">{children}</h3>,
    code: ({ className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match;
      return isInline ? (
        <code className="bg-bg-panel text-text-primary px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
          {children}
        </code>
      ) : (
        <pre className="bg-text-primary text-bg-primary p-4 rounded-xl overflow-x-auto text-xs font-mono my-4">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    },
    ul: ({ children }: any) => <ul className="list-disc list-inside pl-4 mb-4 text-text-secondary">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside pl-4 mb-4 text-text-secondary">{children}</ol>,
    li: ({ children }: any) => <li className="mb-1">{children}</li>,
    strong: ({ children }: any) => <strong className="font-semibold text-text-primary">{children}</strong>,
    blockquote: ({ children }: any) => <blockquote className="border-l-2 border-border-subtle pl-4 italic text-text-muted my-4">{children}</blockquote>
  };

  return (
    <>
      <style>{`
        @keyframes cursorBlink {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      <motion.div
        variants={fadeUpVariant}
        initial="initial"
        animate="animate"
        className="flex justify-start w-full"
      >
        <div className="px-0 py-1 max-w-[80%] text-sm w-full">
          <div className="flex items-center mb-2">
            <span className="font-medium text-text-primary text-sm">Aegis AI</span>
            {isCurrentStreamCached && (
              <span className="text-[10px] uppercase tracking-widest text-text-muted border border-border-subtle rounded-sm px-1.5 py-0.5 ml-2 select-none font-medium">
                ⚡ Cached
              </span>
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {streamingMessage}
            </ReactMarkdown>
            <span 
              className="inline-block w-1.5 h-4 bg-accent ml-1 align-middle" 
              style={{ animation: 'cursorBlink 0.8s ease-in-out infinite alternate' }} 
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}
