'use client';

import { HiOutlineFunnel } from 'react-icons/hi2';
import { FilterBar } from './ui/dashboard-ui';

type DashFilterBarProps<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  showFilterLabel?: boolean;
};

export function DashFilterBar<T extends string>({
  options,
  value,
  onChange,
  showFilterLabel = true,
}: DashFilterBarProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {showFilterLabel && (
        <span className="cc-app-mono inline-flex items-center gap-1.5">
          <HiOutlineFunnel className="h-3.5 w-3.5" aria-hidden />
          Filter
        </span>
      )}
      <FilterBar options={options} value={value} onChange={onChange} />
    </div>
  );
}
