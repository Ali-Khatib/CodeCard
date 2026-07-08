'use client';

import { ThemePreviewMock } from '@/components/theme/theme-preview-mock';
import { useCodecardTheme } from '@/components/theme/theme-provider';
import { PICKER_THEMES } from '@/lib/themes/codecard-themes';
import { cn } from '@/lib/utils';

type ThemePickerProps = {
  className?: string;
};

export function ThemePicker({ className }: ThemePickerProps) {
  const { themeId, theme, setTheme } = useCodecardTheme();

  return (
    <div className={cn('cc-theme-picker space-y-3', className)}>
      <div>
        <p className="font-eyebrow text-[10px] uppercase tracking-[0.1em] text-ash">
          Click a theme · changes the whole app
        </p>
        <p className="mt-1 text-[13px] text-graphite">
          Currently using <span className="text-lichen">{theme.label}</span>
          {theme.pro && (
            <span className="cc-theme-picker__pro-tag ml-2 font-eyebrow text-[9px] uppercase">
              Pro
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PICKER_THEMES.map((t) => (
          <ThemePreviewMock
            key={t.id}
            theme={t}
            active={themeId === t.id}
            onClick={() => setTheme(t.id)}
          />
        ))}
      </div>

      <p className="text-center text-[12px] leading-relaxed text-graphite">{theme.description}</p>
    </div>
  );
}
