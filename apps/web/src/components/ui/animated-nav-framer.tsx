'use client';

import * as React from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 300 };

export const navContainerVariants: Variants = {
  expanded: {
    width: 'auto',
    height: 'auto',
    transition: {
      ...SPRING,
      staggerChildren: 0.07,
      delayChildren: 0.12,
    },
  },
  collapsed: {
    width: '3rem',
    height: '3rem',
    minWidth: '3rem',
    maxWidth: '3rem',
    transition: {
      ...SPRING,
      when: 'afterChildren',
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const navContentVariants: Variants = {
  expanded: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring', damping: 15, stiffness: 280 },
  },
  collapsed: {
    opacity: 0,
    x: -16,
    scale: 0.96,
    transition: { duration: 0.2 },
  },
};

export const navCollapsedIconVariants: Variants = {
  expanded: { opacity: 0, scale: 0.8, transition: { duration: 0.18 } },
  collapsed: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', damping: 15, stiffness: 300, delay: 0.12 },
  },
};

type AnimatedNavFramerProps = {
  isExpanded: boolean;
  onCollapsedClick?: () => void;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
  panel?: React.ReactNode;
  collapsedLabel?: string;
};

export function AnimatedNavFramer({
  isExpanded,
  onCollapsedClick,
  className,
  innerClassName,
  children,
  panel,
  collapsedLabel = 'Open navigation',
}: AnimatedNavFramerProps) {
  const reduced = useReducedMotion();
  const expanded = isExpanded;
  const [phone, setPhone] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setPhone(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const containerVariants = React.useMemo<Variants>(
    () => ({
      expanded: {
        ...navContainerVariants.expanded,
        width: phone ? 'calc(100% - 24px)' : 'auto',
      },
      collapsed: navContainerVariants.collapsed,
    }),
    [phone],
  );

  const expand = React.useCallback(() => {
    onCollapsedClick?.();
  }, [onCollapsedClick]);

  const handleClick = (event: React.MouseEvent) => {
    if (expanded || !onCollapsedClick) return;
    event.preventDefault();
    expand();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (expanded || !onCollapsedClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      expand();
    }
  };

  return (
    <motion.nav
      initial={false}
      animate={expanded ? 'expanded' : 'collapsed'}
      variants={reduced ? undefined : containerVariants}
      whileHover={!expanded && !reduced ? { scale: 1.08 } : undefined}
      whileTap={!expanded && !reduced ? { scale: 0.95 } : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label="Primary"
      aria-expanded={expanded}
      data-expanded={expanded ? 'true' : 'false'}
      tabIndex={expanded ? undefined : 0}
      role={expanded ? undefined : 'button'}
      className={cn(
        'cc-nav-veil relative flex flex-col overflow-hidden rounded-full',
        !expanded && 'cc-nav-veil--collapsed mx-auto cursor-pointer justify-center',
        className,
      )}
      style={
        !expanded
          ? {
              background: 'transparent',
              borderColor: 'transparent',
              boxShadow: 'none',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
            }
          : undefined
      }
    >
      <motion.div
        variants={reduced ? undefined : navContentVariants}
        className={cn(
          'cc-nav-veil__inner w-full',
          !expanded && 'pointer-events-none',
          innerClassName,
        )}
        aria-hidden={!expanded}
        {...(!expanded ? { inert: true } : {})}
      >
        {children}
      </motion.div>
      {expanded ? panel : null}

      <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
        <motion.div
          variants={reduced ? undefined : navCollapsedIconVariants}
          animate={expanded ? 'expanded' : 'collapsed'}
          initial={false}
          aria-hidden={expanded}
        >
          <Menu
            className="h-5 w-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
            aria-hidden
          />
          <span className="sr-only">{collapsedLabel}</span>
        </motion.div>
      </div>
    </motion.nav>
  );
}
