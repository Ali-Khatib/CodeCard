'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectFilterProps {
  domains: string[];
  focusAreas: string[];
  domain: string | null;
  focusArea: string | null;
  onDomainChange: (v: string | null) => void;
  onFocusAreaChange: (v: string | null) => void;
  accentColor?: string;
}

export function ProjectFilter({
  domains,
  focusAreas,
  domain,
  focusArea,
  onDomainChange,
  onFocusAreaChange,
  accentColor = '#a78bfa',
}: ProjectFilterProps) {
  const [open, setOpen] = useState(false);
  const active = domain || focusArea;

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/90 px-3 py-1.5 text-[11px] uppercase tracking-wider text-zinc-400 backdrop-blur-sm"
        aria-expanded={open}
      >
        Filter
        {active && (
          <span className="h-1 w-1 rounded-full" style={{ backgroundColor: accentColor }} />
        )}
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-zinc-600">
          ▾
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40"
              aria-label="Close filter"
              onClick={() => setOpen(false)}
            />
            <motion.div
              layout
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-zinc-800 bg-[#0a0a0a]/95 p-4 shadow-2xl backdrop-blur-xl"
            >
              {domains.length > 0 && (
                <FilterGroup
                  label="Domains"
                  options={domains}
                  value={domain}
                  onChange={onDomainChange}
                  accentColor={accentColor}
                />
              )}
              {focusAreas.length > 0 && (
                <FilterGroup
                  label="Focus"
                  options={focusAreas}
                  value={focusArea}
                  onChange={onFocusAreaChange}
                  accentColor={accentColor}
                />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
  accentColor,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
  accentColor: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        <FilterChip label="All" active={!value} onClick={() => onChange(null)} accentColor={accentColor} />
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

function FilterChip({
  label,
  active,
  onClick,
  accentColor,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  accentColor: string;
}) {
  return (
    <motion.button
      type="button"
      layout
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      className={`rounded-full px-2.5 py-1 text-xs ${
        active ? 'text-white' : 'border border-zinc-800 text-zinc-500 hover:border-zinc-600'
      }`}
      style={active ? { backgroundColor: accentColor } : undefined}
    >
      {label}
    </motion.button>
  );
}
