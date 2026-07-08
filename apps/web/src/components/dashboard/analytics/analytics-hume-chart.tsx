'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  buildEngagementRows,
  ENGAGEMENT_BAR_COLOR,
  formatEngagementValue,
} from '@/lib/dashboard/analytics-chart-data';
import type { TimeRange } from '@/lib/dashboard/analytics-data';
import { SectionLabel } from '../ui/dashboard-ui';

const EASE = [0.22, 1, 0.36, 1] as const;

export function AnalyticsHumeChart({ range = '30d' }: { range?: TimeRange }) {
  const reduced = useReducedMotion() ?? false;
  const rows = useMemo(() => buildEngagementRows(range), [range]);
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="cc-metric-chart">
      <div className="cc-metric-chart__head">
        <SectionLabel>Engagement</SectionLabel>
        <p className="cc-metric-chart__unit">Top actions</p>
      </div>

      <ul className="cc-metric-chart__rows" aria-label="Engagement by action">
        {rows.map((row, index) => {
          const pct = (row.value / max) * 100;

          return (
            <li key={row.id} className="cc-metric-chart__row">
              <span className="cc-metric-chart__label" title={row.label}>
                {row.label}
              </span>

              <div className="cc-metric-chart__track" aria-hidden>
                <motion.div
                  className="cc-metric-chart__bar"
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, delay: index * 0.04, ease: EASE }}
                  style={{ backgroundColor: ENGAGEMENT_BAR_COLOR }}
                />
              </div>

              <span className="cc-metric-chart__value">{formatEngagementValue(row.value)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
