import type { GlobeBarMarker } from '@/components/ui/cobe-globe-bars';
import type { AnalyticsBundle } from '@/lib/dashboard/analytics-data';

export function buildGeoMarkers(
  geo: AnalyticsBundle['geo'],
  topCities: AnalyticsBundle['topCities'],
): GlobeBarMarker[] {
  const maxVisitors = Math.max(...topCities.map((city) => city.visitors), 1);
  const coordinates = new Map(
    geo.map((point) => [point.city.toLocaleLowerCase(), [point.lat, point.lng] as [number, number]]),
  );

  return topCities.flatMap((city, index) => {
    const location = coordinates.get(city.name.toLocaleLowerCase());
    if (!location) return [];
    return [
      {
        id: `visit-city-${index}`,
        location,
        value: Math.max(1, Math.round((city.visitors / maxVisitors) * 100)),
        label: city.name,
      },
    ];
  });
}
