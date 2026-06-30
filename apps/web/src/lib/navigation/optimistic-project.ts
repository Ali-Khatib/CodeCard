import type { FeaturedProject } from '@/lib/projects/featured';

export interface OptimisticProjectSnapshot {
  id: string;
  title: string;
  tagline?: string | null;
  posterUrl?: string | null;
  videoUrl?: string | null;
  profileSlug: string;
  displayName: string;
  accentColor?: string;
  cachedAt: number;
}

const KEY = 'cc-optimistic-project';
const TTL_MS = 60_000;

/** In-memory cache for synchronous reads during the same navigation tick. */
let memorySnapshot: OptimisticProjectSnapshot | null = null;

export function setOptimisticProject(
  snapshot: Omit<OptimisticProjectSnapshot, 'cachedAt'>,
): void {
  const entry = { ...snapshot, cachedAt: Date.now() };
  memorySnapshot = entry;
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(entry));
  } catch {
    /* quota / private mode */
  }
}

export function getOptimisticProject(projectId: string): OptimisticProjectSnapshot | null {
  const now = Date.now();
  if (
    memorySnapshot &&
    memorySnapshot.id === projectId &&
    now - memorySnapshot.cachedAt <= TTL_MS
  ) {
    return memorySnapshot;
  }
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as OptimisticProjectSnapshot;
    if (data.id !== projectId || now - data.cachedAt > TTL_MS) return null;
    memorySnapshot = data;
    return data;
  } catch {
    return null;
  }
}

export function clearOptimisticProject(): void {
  memorySnapshot = null;
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function snapshotFromFeatured(
  project: FeaturedProject,
  profileSlug: string,
  displayName: string,
  accentColor?: string,
): Omit<OptimisticProjectSnapshot, 'cachedAt'> {
  return {
    id: project.id,
    title: project.title,
    tagline: project.tagline,
    posterUrl: project.posterUrl,
    videoUrl: project.videoUrl,
    profileSlug,
    displayName,
    accentColor,
  };
}

export function normalizeProjectPath(path: string): string {
  return path.replace(/\/$/, '') || '/';
}
