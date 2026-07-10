'use client';

import { LayoutGroup, motion } from 'motion/react';
import type { TimeRange } from '@/lib/dashboard/analytics-data';
import { TIME_RANGE_LABELS } from '@/lib/dashboard/analytics-data';

const RANGES: TimeRange[] = ['7d', '30d', '90d', 'lifetime'];

export function AnalyticsTimeFilter({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
}) {
  return (
    <LayoutGroup id="analytics-range">
      <div className="cc-app-filter-bar cc-analytics-filter inline-flex flex-nowrap">
        {RANGES.map((r) => {
          const active = value === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onChange(r)}
              className={`cc-app-filter-pill relative ${active ? 'cc-app-filter-pill--active' : ''}`}
            >
              {active && (
                <motion.span
                  layoutId="analytics-range-pill"
                  className="absolute inset-0 rounded-[inherit] bg-[var(--app-ink)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative z-[1]">{TIME_RANGE_LABELS[r]}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
