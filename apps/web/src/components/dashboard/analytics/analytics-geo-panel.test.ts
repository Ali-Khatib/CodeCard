import { describe, expect, it } from 'vitest';
import { buildGeoMarkers } from './analytics-geo-markers';

describe('buildGeoMarkers', () => {
  it('maps city analytics to globe coordinates and relative bars', () => {
    const markers = buildGeoMarkers(
      [
        { country: 'United States', city: 'San Francisco', visitors: 186, lat: 37.77, lng: -122.42 },
        { country: 'Germany', city: 'Berlin', visitors: 93, lat: 52.52, lng: 13.4 },
      ],
      [
        { name: 'San Francisco', visitors: 186 },
        { name: 'Berlin', visitors: 93 },
      ],
    );

    expect(markers).toEqual([
      {
        id: 'visit-city-0',
        label: 'San Francisco',
        location: [37.77, -122.42],
        value: 186,
        barValue: 100,
      },
      {
        id: 'visit-city-1',
        label: 'Berlin',
        location: [52.52, 13.4],
        value: 93,
        barValue: 50,
      },
    ]);
  });

  it('omits cities without trusted coordinates', () => {
    expect(
      buildGeoMarkers([], [{ name: 'Unknown', visitors: 10 }]),
    ).toEqual([]);
  });
});
