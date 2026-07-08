'use client';

import { motion } from 'motion/react';
import { CyberThemeLogo, PunkThemeLogo } from '@/components/theme/theme-logos';
import type { CodecardTheme } from '@/lib/themes/codecard-themes';
import { cn } from '@/lib/utils';

type ThemePreviewMockProps = {
  theme: CodecardTheme;
  active?: boolean;
  onClick?: () => void;
};

function ThemeLogo({ theme }: { theme: CodecardTheme }) {
  if (theme.logo === 'punk') return <PunkThemeLogo className="h-5 w-5" />;
  if (theme.logo === 'cyber') return <CyberThemeLogo className="h-5 w-5" />;
  return null;
}

export function ThemePreviewMock({ theme, active, onClick }: ThemePreviewMockProps) {
  const isPro = theme.pro;
  const isCyber = theme.id === 'neon-grid';
  const isPunk = theme.id === 'riot-brass';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'cc-theme-preview-mock group relative w-full text-left transition-transform duration-200',
        active && 'cc-theme-preview-mock--active',
        isPro && 'cc-theme-preview-mock--pro',
        isCyber && 'cc-theme-preview-mock--cyber',
        isPunk && 'cc-theme-preview-mock--punk',
      )}
      style={theme.vars as React.CSSProperties}
      aria-pressed={active}
      aria-label={`Apply ${theme.label} theme`}
    >
      {isPro && (
        <span className="cc-theme-preview-mock__pro-badge font-eyebrow">PRO</span>
      )}

      <div className="cc-theme-preview-mock__frame overflow-hidden rounded-[14px] border">
        <div className="cc-theme-preview-mock__chrome flex items-center gap-1.5 px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400/60" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/50" />
          <span className="ml-1 flex-1 text-center font-eyebrow text-[8px] uppercase tracking-wider text-graphite">
            codecard.app
          </span>
        </div>

        <div className="cc-theme-preview-mock__body p-3">
          <div className="flex items-center gap-2">
            {theme.logo ? (
              <div className="cc-theme-preview-mock__logo flex h-8 w-8 items-center justify-center rounded-lg border">
                <ThemeLogo theme={theme} />
              </div>
            ) : (
              <div className="cc-theme-preview-mock__avatar h-8 w-8 rounded-lg border" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[11px] text-vellum">Alex Chen</p>
              <p className="truncate text-[8px] text-ash">Senior Engineer</p>
            </div>
            <span className="cc-theme-preview-mock__pill font-eyebrow text-[7px] uppercase">Live</span>
          </div>

          <div className="mt-2.5 flex gap-1">
            <span className="cc-theme-preview-mock__filter font-eyebrow text-[7px]">Filter</span>
            <span className="cc-theme-preview-mock__pill-active font-eyebrow text-[7px]">DevOps</span>
          </div>

          <div className="cc-theme-preview-mock__card mt-2 rounded-lg border p-2">
            <div className="cc-theme-preview-mock__card-media h-10 rounded-md" />
            <p className="mt-1.5 font-display text-[9px] text-vellum">DevFlow</p>
            <p className="text-[7px] text-graphite">CI/CD pipelines</p>
          </div>

          {(isPro || isCyber) && (
            <div className="cc-theme-preview-mock__shimmer mt-2 h-px w-full" aria-hidden />
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 px-0.5">
        <span
          className="size-3.5 shrink-0 rounded-full border border-white/20"
          style={{ backgroundColor: theme.swatch }}
        />
        <span className="text-[12px] font-medium text-lichen">{theme.label}</span>
        {active && (
          <motion.span
            layoutId="theme-active-ring"
            className="ml-auto font-eyebrow text-[9px] uppercase tracking-wider text-reactor-bright"
          >
            Active
          </motion.span>
        )}
      </div>
    </button>
  );
}
