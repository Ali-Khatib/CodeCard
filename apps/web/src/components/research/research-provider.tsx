'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import type { ResearchSource } from '@/lib/research/sources';
import { RESEARCH_SOURCES } from '@/lib/research/sources';
import { SourceDrawer } from './source-drawer';

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
      <SourceDrawer source={activeSource} onClose={closeSource} />
    </ResearchContext.Provider>
  );
}
