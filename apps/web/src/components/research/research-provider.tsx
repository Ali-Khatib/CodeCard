'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { ResearchSource } from '@/lib/research/sources';
import { RESEARCH_SOURCES } from '@/lib/research/sources';

const SourceDrawer = dynamic(
  () => import('./source-drawer').then((m) => ({ default: m.SourceDrawer })),
  { ssr: false },
);

interface ResearchContextValue {
  openSource: (sourceId: string) => void;
  closeSource: () => void;
}

const ResearchContext = createContext<ResearchContextValue | null>(null);

export function useResearchSource() {
  const ctx = useContext(ResearchContext);
  if (!ctx) throw new Error('useResearchSource must be used within ResearchProvider');
  return ctx;
}

export function ResearchProvider({ children }: { children: React.ReactNode }) {
  const [activeSource, setActiveSource] = useState<ResearchSource | null>(null);

  const openSource = useCallback((sourceId: string) => {
    const source = RESEARCH_SOURCES[sourceId];
    if (source) setActiveSource(source);
  }, []);

  const closeSource = useCallback(() => setActiveSource(null), []);

  return (
    <ResearchContext.Provider value={{ openSource, closeSource }}>
      {children}
      {activeSource ? (
        <SourceDrawer source={activeSource} onClose={closeSource} />
      ) : null}
    </ResearchContext.Provider>
  );
}
