'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPRING = { type: 'spring' as const, damping: 22, stiffness: 280 };
/** Collapsed expand-control diameter (matches prior 3rem circle). */
export const NAV_COLLAPSED_SIZE = 48;
/**
 * Smallest uniform scale before the row wraps onto another line.
 * Below this, type gets too small to read, so the pill grows instead of clipping.
 */
const NAV_FIT_MIN = 0.78;
/** Clear space between the pill and the fixed logo / home control. */
const NAV_CHROME_GAP = 14;
/** Pill/circle states stay fully rounded; the stacked mobile panel does not. */
const NAV_PILL_RADIUS = 9999;
const NAV_PANEL_RADIUS = 28;

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
  const [openSize, setOpenSize] = React.useState({ width: 640, height: 52 });
  const [availWidth, setAvailWidth] = React.useState(1200);
  const [navFit, setNavFit] = React.useState(1);

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setPhone(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  React.useLayoutEffect(() => {
    const shell = innerRef.current?.closest('.cc-marketing-nav-shell');

    const measureAvail = () => {
      if (shell instanceof HTMLElement) {
        const shellRect = shell.getBoundingClientRect();
        const edge = 10;
        let padLeft = edge;
        let padRight = edge;
        const logo = shell.querySelector('.cc-ed-mark-logo');
        const home = shell.querySelector('.cc-ed-home-control');
        if (logo instanceof HTMLElement) {
          const rect = logo.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            padLeft = Math.max(padLeft, Math.ceil(rect.right - shellRect.left + NAV_CHROME_GAP));
          }
        }
        if (home instanceof HTMLElement) {
          const rect = home.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            padRight = Math.max(padRight, Math.ceil(shellRect.right - rect.left + NAV_CHROME_GAP));
          }
        }
        shell.style.setProperty('--cc-nav-pad-left', `${padLeft}px`);
        shell.style.setProperty('--cc-nav-pad-right', `${padRight}px`);

        const styles = window.getComputedStyle(shell);
        const next =
          shell.clientWidth -
          (Number.parseFloat(styles.paddingLeft) || 0) -
          (Number.parseFloat(styles.paddingRight) || 0);
        const safe = Math.max(NAV_COLLAPSED_SIZE, Math.floor(next));
        setAvailWidth((prev) => (prev === safe ? prev : safe));
        return;
      }
      const side = phone ? Math.max(32, Math.round(window.innerWidth * 0.14)) : 160;
      const safe = Math.max(NAV_COLLAPSED_SIZE, window.innerWidth - side * 2);
      setAvailWidth((prev) => (prev === safe ? prev : safe));
    };
    measureAvail();
    const ro = new ResizeObserver(measureAvail);
    if (shell instanceof HTMLElement) {
      ro.observe(shell);
      const logo = shell.querySelector('.cc-ed-mark-logo');
      const home = shell.querySelector('.cc-ed-home-control');
      if (logo instanceof HTMLElement) ro.observe(logo);
      if (home instanceof HTMLElement) ro.observe(home);
    }
    window.addEventListener('resize', measureAvail);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureAvail);
    };
  }, [phone, expanded]);

  // Pixel sizes only — Motion cannot reliably expand from a fixed circle back to width:auto,
  // especially once minWidth/maxWidth were locked to the collapsed size.
  // Width is capped to the gap between the logo and the home control. Labels
  // scale down together, then wrap onto another row, so nothing is clipped.
  React.useLayoutEffect(() => {
    if (!expanded) return;
    const inner = innerRef.current;
    if (!inner) return;
    const nav = inner.closest('.cc-nav-veil');

    const measure = () => {
      const panelHeight = panelRef.current?.offsetHeight ?? 0;
      const group = inner.querySelector('.cc-hume-fade-group');
      const previousWidth = inner.style.width;
      const previousMaxWidth = inner.style.maxWidth;
      const previousNavWidth = nav instanceof HTMLElement ? nav.style.width : '';
      const previousNavMax = nav instanceof HTMLElement ? nav.style.maxWidth : '';
      const previousGroupMax = group instanceof HTMLElement ? group.style.maxWidth : '';
      const previousGroupWidth = group instanceof HTMLElement ? group.style.width : '';

      const readPadX = () => {
        const styles = window.getComputedStyle(inner);
        return (
          (Number.parseFloat(styles.paddingLeft) || 0) +
          (Number.parseFloat(styles.paddingRight) || 0)
        );
      };

      const measureNatural = () => {
        inner.style.width = 'max-content';
        inner.style.maxWidth = 'none';
        if (group instanceof HTMLElement) {
          group.style.maxWidth = 'none';
          group.style.width = 'max-content';
          group.style.flexWrap = 'nowrap';
        }
        const padX = readPadX();
        const contentWidth =
          group instanceof HTMLElement
            ? group.scrollWidth + padX
            : Math.max(inner.scrollWidth, inner.offsetWidth);
        return Math.ceil(contentWidth);
      };

      if (nav instanceof HTMLElement) nav.style.setProperty('--cc-nav-fit', '1');
      const natural = measureNatural();
      const safe = Math.max(NAV_COLLAPSED_SIZE, availWidth);
      // Leave a few pixels inside the pill so the last glyph never kisses the border.
      const budget = Math.max(NAV_COLLAPSED_SIZE, safe - 8);
      let fit = 1;
      if (natural > budget) {
        const ratio = budget / natural;
        fit = ratio >= NAV_FIT_MIN ? ratio : 1;
      }
      if (nav instanceof HTMLElement) nav.style.setProperty('--cc-nav-fit', String(fit));

      let fitted = natural;
      if (fit !== 1) {
        fitted = measureNatural();
        if (fitted > budget) {
          fit = Math.max(NAV_FIT_MIN, fit * (budget / fitted));
          if (nav instanceof HTMLElement) nav.style.setProperty('--cc-nav-fit', String(fit));
          fitted = measureNatural();
        }
      }

      const borderX =
        nav instanceof HTMLElement
          ? (Number.parseFloat(window.getComputedStyle(nav).borderLeftWidth) || 0) +
            (Number.parseFloat(window.getComputedStyle(nav).borderRightWidth) || 0)
          : 0;
      const borderY =
        nav instanceof HTMLElement
          ? (Number.parseFloat(window.getComputedStyle(nav).borderTopWidth) || 0) +
            (Number.parseFloat(window.getComputedStyle(nav).borderBottomWidth) || 0)
          : 0;
      const wraps = fitted > budget + 1;
      const slack = wraps ? 0 : 8;
      const width = Math.min(safe, Math.ceil(Math.min(fitted, budget) + borderX + slack));

      if (nav instanceof HTMLElement) {
        nav.style.width = `${width}px`;
        nav.style.maxWidth = `${width}px`;
        nav.dataset.navWrap = wraps ? 'true' : 'false';
      }
      inner.style.width = '100%';
      inner.style.maxWidth = '100%';
      if (group instanceof HTMLElement) {
        group.style.width = '100%';
        group.style.maxWidth = '100%';
        group.style.flexWrap = wraps ? 'wrap' : 'nowrap';
      }
      void inner.offsetHeight;
      const height = Math.ceil(Math.max(inner.scrollHeight, 52) + panelHeight + borderY);

      inner.style.width = previousWidth;
      inner.style.maxWidth = previousMaxWidth;
      if (nav instanceof HTMLElement) {
        nav.style.width = previousNavWidth;
        nav.style.maxWidth = previousNavMax;
      }
      if (group instanceof HTMLElement) {
        group.style.maxWidth = previousGroupMax;
        group.style.width = previousGroupWidth;
        group.style.flexWrap = wraps ? 'wrap' : 'nowrap';
      }

      setNavFit((prev) => (Math.abs(prev - fit) < 0.004 ? prev : Number(fit.toFixed(4))));
      if (width > NAV_COLLAPSED_SIZE && height > 0) {
        setOpenSize((prev) =>
          Math.abs(prev.width - width) <= 1 && Math.abs(prev.height - height) <= 1
            ? prev
            : { width, height },
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
  }, [phone, children, panel, expanded, availWidth]);

  const maxOpenWidth = Math.min(openSize.width, availWidth);

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

  /*
   * A pill radius on the tall open-menu box renders as an ellipse, so the
   * radius has to drop once the panel is stacked underneath. Motion writes it
   * inline, which is the only way to beat the `rounded-full` utility class.
   */
  const menuOpen = expanded && phone && Boolean(panel);
  const radius = menuOpen ? NAV_PANEL_RADIUS : NAV_PILL_RADIUS;

  const sizeAnimate = expanded
    ? {
        width: maxOpenWidth,
        height: openSize.height,
        minWidth: 0,
        maxWidth: '100%',
        borderRadius: radius,
      }
    : {
        width: NAV_COLLAPSED_SIZE,
        height: NAV_COLLAPSED_SIZE,
        minWidth: NAV_COLLAPSED_SIZE,
        maxWidth: NAV_COLLAPSED_SIZE,
        borderRadius: NAV_PILL_RADIUS,
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
          : ({
              minWidth: 0,
              '--cc-nav-fit': String(navFit),
            } as React.CSSProperties)
      }
    >
      <motion.div
        ref={innerRef}
        initial={false}
        animate={expanded ? 'expanded' : 'collapsed'}
        variants={reduced ? undefined : navContentVariants}
        className={cn(
          'cc-nav-veil__inner min-w-0 max-w-full',
          expanded ? 'w-full' : 'w-max',
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
            className="h-5 w-5"
            aria-hidden
          />
          <span className="sr-only">{collapsedLabel}</span>
        </motion.div>
      </div>
    </motion.nav>
  );
}
