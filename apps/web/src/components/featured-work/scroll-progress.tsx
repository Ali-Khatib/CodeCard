'use client';

import { motion } from 'motion/react';

interface ScrollProgressProps {
  projectIds: string[];
  activeId: string;
  accentColor: string;
}

export function ScrollProgress({ projectIds, activeId, accentColor }: ScrollProgressProps) {
  if (projectIds.length <= 1) return null;

  const activeIndex = projectIds.indexOf(activeId);

  return (
    <div
      className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 md:flex"
      aria-label="Project progress"
      role="navigation"
    >
      {projectIds.map((id, i) => {
        const isActive = id === activeId;
        const isPast = activeIndex > i;
        return (
          <motion.div
            key={id}
            className="rounded-full"
            animate={{
              width: isActive ? 4 : 3,
              height: isActive ? 20 : 8,
              backgroundColor: isActive || isPast ? accentColor : 'rgba(255,255,255,0.12)',
              opacity: isActive ? 1 : 0.5,
            }}
            transition={{ duration: 0.25 }}
            aria-current={isActive ? 'step' : undefined}
            title={`Project ${i + 1}`}
          />
        );
      })}
    </div>
  );
}
