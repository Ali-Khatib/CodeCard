'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '@/lib/utils';

const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }
  return context;
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.theme || item.color);

  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ?? itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join('\n')}
}
`,
          )
          .join('\n'),
      }}
    />
  );
}

export function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-[var(--app-smoke)] [&_.recharts-cartesian-grid_line[stroke="#ccc"]]:stroke-[var(--app-border)]/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-[var(--app-border)] [&_.recharts-dot[stroke="#fff"]]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke="#ccc"]]:stroke-[var(--app-border)] [&_.recharts-radial-bar-background-sector]:fill-[var(--app-bone)] [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-[var(--app-bone)] [&_.recharts-reference-line_[stroke="#ccc"]]:stroke-[var(--app-border)] [&_.recharts-sector[stroke="#fff"]]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none',
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

export function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<'div'> & {
    hideLabel?: boolean;
    indicator?: 'line' | 'dot' | 'dashed';
    nameKey?: string;
    labelKey?: string;
  }) {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null;

    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? 'value'}`;
    const itemConfig = config[key as keyof typeof config];
    const value =
      !labelKey && typeof label === 'string'
        ? config[label as keyof typeof config]?.label ?? label
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn('font-medium', labelClassName)}>{labelFormatter(value, payload)}</div>
      );
    }

    if (!value) return null;
    return <div className={cn('font-medium', labelClassName)}>{value}</div>;
  }, [config, hideLabel, label, labelClassName, labelFormatter, labelKey, payload]);

  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-paper)] px-2.5 py-1.5 text-xs shadow-md',
        className,
      )}
    >
      {!hideLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`;
          const itemConfig = config[key as keyof typeof config];
          const indicatorColor = color ?? item.payload.fill ?? item.color;

          return (
            <div
              key={item.dataKey}
              className={cn(
                'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-[var(--app-smoke)]',
                indicator === 'dot' && 'items-center',
              )}
            >
              {indicator === 'dot' && (
                <div
                  className="shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]"
                  style={
                    {
                      '--color-bg': indicatorColor,
                      '--color-border': indicatorColor,
                    } as React.CSSProperties
                  }
                />
              )}
              <div
                className={cn(
                  'flex flex-1 justify-between leading-none',
                  hideLabel ? 'items-end' : 'items-center',
                )}
              >
                <div className="grid gap-1.5">
                  <span className="text-[var(--app-smoke)]">
                    {itemConfig?.label ?? item.name}
                  </span>
                </div>
                {item.value != null && (
                  <span className="font-mono font-medium tabular-nums text-[var(--app-ink)]">
                    {formatter
                      ? formatter(item.value, item.name ?? '', item, index, item.payload)
                      : item.value.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
