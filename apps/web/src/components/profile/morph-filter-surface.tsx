'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HiOutlineFunnel } from 'react-icons/hi2';

interface MorphFilterSurfaceProps {
  domains: string[];
  focusAreas: string[];
  domain: string | null;
  focusArea: string | null;
  onDomainChange: (v: string | null) => void;
  onFocusAreaChange: (v: string | null) => void;
  accentColor?: string;
}

export function MorphFilterSurface({
  domains,
  focusAreas,
  domain,
  focusArea,
  onDomainChange,
  onFocusAreaChange,
  accentColor = '#a78bfa',
}: MorphFilterSurfaceProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const firstControlRef = useRef<HTMLButtonElement>(null);
  const activeCount = (domain ? 1 : 0) + (focusArea ? 1 : 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    if (open) firstControlRef.current?.focus();
  }, [open]);

  const clear = () => {
    onDomainChange(null);
    onFocusAreaChange(null);
  };

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/90 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
        Filter
      </div>
    );
  }

  return (
    <div className="relative">
      <motion.div
        animate={{ borderRadius: open ? 16 : 16 }}
        className="overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/90 shadow-xl backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-400 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--profile-accent)]"
        >
          <HiOutlineFunnel aria-hidden />
          Filter
          {activeCount > 0 && (
            <span
              className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold text-white"
              style={{ backgroundColor: accentColor }}
            >
              {activeCount}
            </span>
          )}
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 480, damping: 38 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 border-t border-zinc-800/80 p-3">
                {domains.length > 0 && (
                  <FilterRow
                    label="Domain"
                    options={domains}
                    value={domain}
                    onChange={onDomainChange}
                    firstRef={firstControlRef}
                    accentColor={accentColor}
                  />
                )}
                {focusAreas.length > 0 && (
                  <FilterRow
                    label="Focus"
                    options={focusAreas}
                    value={focusArea}
                    onChange={onFocusAreaChange}
                    accentColor={accentColor}
                  />
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={clear}
                    className="flex-1 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-500 outline-none focus-visible:ring-2 focus-visible:ring-[var(--profile-accent)]"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 rounded-lg px-3 py-2 text-xs font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    style={{ backgroundColor: accentColor }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
  accentColor,
  firstRef,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
  accentColor: string;
  firstRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-zinc-600">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <FilterChip
          ref={firstRef}
          label="All"
          active={!value}
          onClick={() => onChange(null)}
          accentColor={accentColor}
        />
        {options.map((o) => (
          <FilterChip
            key={o}
            label={o}
            active={value === o}
            onClick={() => onChange(value === o ? null : o)}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
}

import { forwardRef } from 'react';

const FilterChip = forwardRef<
  HTMLButtonElement,
  { label: string; active: boolean; onClick: () => void; accentColor: string }
>(function FilterChip({ label, active, onClick, accentColor }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--profile-accent)] ${
        active ? 'text-white' : 'border border-zinc-800 text-zinc-500'
      }`}
      style={active ? { backgroundColor: accentColor } : undefined}
    >
      {label}
    </button>
  );
});
