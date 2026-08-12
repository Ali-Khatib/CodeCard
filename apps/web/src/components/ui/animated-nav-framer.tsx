'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPRING = { type: 'spring' as const, damping: 22, stiffness: 280 };
/** Collapsed expand-control diameter (matches prior 3rem circle). */
export const NAV_COLLAPSED_SIZE = 48;

export const navContentVariants = {
  expanded: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring' as const, damping: 15, stiffness: 280 },
  },
  collapsed: {
    opacity: 0,
    x: -16,
    scale: 0.96,
    transition: { duration: 0.18 },
  },
};

export const navCollapsedIconVariants = {
  expanded: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
  collapsed: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, damping: 15, stiffness: 300, delay: 0.08 },
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
  const innerRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [openSize, setOpenSize] = React.useState({ width: 320, height: 58 });

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setPhone(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  // Pixel sizes only — Motion cannot reliably expand from a fixed circle back to width:auto,
  // especially once minWidth/maxWidth were locked to the collapsed size.
  React.useLayoutEffect(() => {
    if (!expanded) return;
    const inner = innerRef.current;
    if (!inner) return;

    const measure = () => {
      const panelHeight = panelRef.current?.offsetHeight ?? 0;
      const width = Math.ceil(inner.scrollWidth);
      const height = Math.ceil(Math.max(inner.scrollHeight, phone ? 52 : 58) + panelHeight);
      if (width > NAV_COLLAPSED_SIZE && height > 0) {
        setOpenSize((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height },
        );
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    if (panelRef.current) ro.observe(panelRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [phone, children, panel, expanded]);

  const maxOpenWidth = phone
    ? Math.min(
        openSize.width,
        typeof window !== 'undefined' ? Math.max(window.innerWidth - 24, NAV_COLLAPSED_SIZE) : openSize.width,
      )
    : openSize.width;

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

  const sizeAnimate = expanded
    ? phone
      ? {
          width: 'calc(100% - 24px)',
          height: openSize.height,
          minWidth: 0,
          maxWidth: 'calc(100% - 24px)',
        }
      : {
          width: maxOpenWidth,
          height: openSize.height,
          minWidth: 0,
          maxWidth: maxOpenWidth,
        }
    : {
        width: NAV_COLLAPSED_SIZE,
        height: NAV_COLLAPSED_SIZE,
        minWidth: NAV_COLLAPSED_SIZE,
        maxWidth: NAV_COLLAPSED_SIZE,
      };

  return (
    <motion.nav
      initial={false}
      animate={sizeAnimate}
      transition={reduced ? { duration: 0 } : SPRING}
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
          : { minWidth: 0 }
      }
    >
      <motion.div
        ref={innerRef}
        initial={false}
        animate={expanded ? 'expanded' : 'collapsed'}
        variants={reduced ? undefined : navContentVariants}
        className={cn(
          'cc-nav-veil__inner w-max max-w-none',
          !expanded && 'pointer-events-none',
          innerClassName,
        )}
        aria-hidden={!expanded}
        {...(!expanded ? { inert: true } : {})}
      >
        {children}
      </motion.div>
      {expanded ? (
        <div ref={panelRef}>{panel}</div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
        <motion.div
          initial={false}
          animate={expanded ? 'expanded' : 'collapsed'}
          variants={reduced ? undefined : navCollapsedIconVariants}
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
