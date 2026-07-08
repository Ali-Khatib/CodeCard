'use client';

import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const chartConfig = {
  visitors: {
    label: 'Visitors',
    color: '#c094e4',
  },
} satisfies ChartConfig;

export function AnalyticsGeoChart({
  cities,
}: {
  cities: { name: string; visitors: number }[];
}) {
  const data = [...cities]
    .sort((a, b) => b.visitors - a.visitors)
    .map((city) => ({
      city: city.name,
      visitors: city.visitors,
      fill: 'var(--color-visitors)',
    }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
        barCategoryGap={12}
      >
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis
          type="category"
          dataKey="city"
          width={108}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 13, fill: 'var(--app-ink)' }}
        />
        <ChartTooltip cursor={{ fill: 'var(--app-bone)', opacity: 0.6 }} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="visitors" radius={[0, 6, 6, 0]} barSize={22} />
      </BarChart>
    </ChartContainer>
  );
}
