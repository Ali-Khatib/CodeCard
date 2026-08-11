'use client';

/**
 * Public project stack entry — keeps this module free of motion imports
 * (WS14-T019 LCP contract) while delegating scroll stacking below the fold.
 */
export { PublicProjectStacking as PublicProjectStack } from './public-project-stacking';
export { PublicProjectCard } from './public-project-card';
