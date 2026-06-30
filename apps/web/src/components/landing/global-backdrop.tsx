'use client';

import { useGlobalPointer } from '@/hooks/use-global-pointer';
import { CosmicAtmosphere } from './cosmic-atmosphere';

export function GlobalBackdrop() {
  useGlobalPointer();
  return <CosmicAtmosphere />;
}
