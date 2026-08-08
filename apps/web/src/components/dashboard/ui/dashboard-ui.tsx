'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ReactiveBorder } from '../reactive-border';
import { cn } from '@/lib/cn';

export function AppMono({ children }: { children: ReactNode }) {
  return <p className="cc-app-mono">{children}</p>;
}

export function MetricLabel({ children }: { children: ReactNode }) {
  return <p className="cc-app-metric__label">{children}</p>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="cc-app-section-label">{children}</p>;
}

export function AppCard({
  children,
  className = '',
  tone,
  reactive = false,
}: {
  children: ReactNode;
  className?: string;
  tone?: 'blush' | 'rose' | 'mint' | 'meringue' | 'seafoam';
  reactive?: boolean;
}) {
  const toneClass = tone ? `cc-app-card--${tone}` : '';
  const classes = cn('cc-app-card', toneClass, className);

  if (!reactive) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <ReactiveBorder className={classes}>
      {children}
    </ReactiveBorder>
  );
}

type BtnVariant = 'primary' | 'ghost' | 'soft';

function btnClass(variant: BtnVariant, extra = '') {
  return [
    'cc-app-btn',
    variant === 'primary' && 'cc-app-btn--primary',
    variant === 'ghost' && 'cc-app-btn--ghost',
    variant === 'soft' && 'cc-app-btn--soft',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

/** Action button — icon springs in on hover */
export function PopIconButton({
  children,
  icon,
  variant = 'ghost',
  className = '',
  href,
  external,
  onClick,
  type = 'button',
  ariaLabel,
  popDelay,
}: {
  children: ReactNode;
  icon: ReactNode;
  variant?: BtnVariant;
  className?: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  ariaLabel?: string;
  popDelay?: number;
}) {
  const cls = btnClass(variant, `cc-btn-pop-icon ${className}`.trim());
  const style = popDelay != null ? ({ '--pop-delay': `${popDelay}ms` } as React.CSSProperties) : undefined;
  const inner = (
    <>
      <span className="cc-btn-pop-icon__glyph">{icon}</span>
      <span className="cc-btn-pop-icon__label">{children}</span>
    </>
  );

  if (href && external) {
    return (
      <a href={href} className={cls} style={style} aria-label={ariaLabel} target="_blank" rel="noreferrer">
        {inner}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cls} style={style} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} style={style} onClick={onClick} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}

export function AppButton({
  children,
  variant = 'ghost',
  className = '',
  href,
  onClick,
  type = 'button',
  block,
  ariaLabel,
}: {
  children: ReactNode;
  variant?: BtnVariant;
  className?: string;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  block?: boolean;
  ariaLabel?: string;
}) {
  const cls = [
    'cc-app-btn',
    variant === 'primary' && 'cc-app-btn--primary',
    variant === 'ghost' && 'cc-app-btn--ghost',
    variant === 'soft' && 'cc-app-btn--soft',
    block && 'cc-app-btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <Link href={href} className={cls} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="cc-app-page-header flex flex-col gap-4 border-b border-[var(--app-border)] pb-6 md:flex-row md:items-end md:justify-between">
      <div className="cc-app-page-header__copy">
        {eyebrow && <AppMono>{eyebrow}</AppMono>}
        <h1 className={`cc-app-title ${eyebrow ? 'mt-2' : ''}`}>
          <span>{title}</span>
        </h1>
        {description && <p className="cc-app-subtitle">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  children,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  children?: ReactNode;
}) {
  return (
    <div className="cc-app-metric">
      <p className="cc-app-metric__label">{label}</p>
      <p className="cc-app-metric__value">{value}</p>
      {delta && <p className="cc-app-metric__delta">{delta}</p>}
      {children}
    </div>
  );
}

export function FilterBar<T extends string>({
  options,
  value,
  onChange,
  labels,
  ariaLabel = 'Filters',
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<T, string>;
  ariaLabel?: string;
}) {
  return (
    <div className="cc-app-filter-bar" role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = value === opt;
        const label = labels?.[opt] ?? opt;
        return (
          <button
            key={opt}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt)}
            className={`cc-app-filter-pill ${active ? 'cc-app-filter-pill--active' : ''}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
