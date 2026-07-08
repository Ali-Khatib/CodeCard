export type TimeRange = 'today' | '7d' | '30d' | '90d' | '1y' | 'lifetime';

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  today: 'Today',
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
  '1y': '1 Year',
  lifetime: 'Lifetime',
};

const RANGE_SCALE: Record<TimeRange, number> = {
  today: 0.035,
  '7d': 0.14,
  '30d': 1,
  '90d': 2.6,
  '1y': 9,
  lifetime: 14,
};

function scale(n: number, range: TimeRange) {
  return Math.max(1, Math.round(n * RANGE_SCALE[range]));
}

function spark(base: number[], range: TimeRange) {
  const s = RANGE_SCALE[range];
  return base.map((v) => Math.max(1, Math.round(v * s)));
}

export type KpiMetric = {
  id: string;
  label: string;
  value: number;
  change: number;
  trendUp: boolean;
  spark: number[];
  detail: string;
};

export type TrafficSource = {
  label: string;
  value: number;
  pct: number;
};

export type ProjectRank = {
  id: string;
  title: string;
  posterUrl?: string;
  views: number;
  clicks: number;
  saves: number;
  ctr: number;
  barPct: number;
};

export type GeoPoint = {
  country: string;
  city: string;
  visitors: number;
  lat: number;
  lng: number;
};

export type ActivityEvent = {
  id: string;
  text: string;
  time: string;
  type: 'view' | 'save' | 'qr' | 'click' | 'open';
};

export type ReferrerCard = {
  id: string;
  label: string;
  traffic: number;
  ctr: number;
  conversions: number;
  trend: number;
  trendUp: boolean;
};

export type AudienceSlice = { label: string; pct: number };

export type ProjectAnalyticsDetail = {
  id: string;
  title: string;
  posterUrl?: string;
  views: number;
  saves: number;
  avgTimeSec: number;
  demoClicks: number;
  githubClicks: number;
  resumeDownloads: number;
  topReferrers: string[];
  funnel: { label: string; pct: number }[];
  countries: string[];
};

export type GuestStats = {
  totalVisitors: number;
  guests: number;
  signedIn: number;
  guestPct: number;
  returningGuests: number;
};

export type AnalyticsBundle = {
  profileReach: number;
  reachChange: number;
  heroMetrics: { label: string; value: number }[];
  kpis: KpiMetric[];
  dailyTraffic: { label: string; value: number }[];
  sources: TrafficSource[];
  projects: ProjectRank[];
  geo: GeoPoint[];
  topCountries: { name: string; pct: number }[];
  topCities: { name: string; visitors: number }[];
  activity: ActivityEvent[];
  projectDetails: ProjectAnalyticsDetail[];
  roles: AudienceSlice[];
  industries: AudienceSlice[];
  devices: AudienceSlice[];
  browsers: AudienceSlice[];
  referrers: ReferrerCard[];
  guestStats: GuestStats;
  insights: { highlight: string; lines: string[] };
};

const DEMO_POSTERS = {
  devflow: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80',
  schemasync: undefined,
  pulse: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
};

export function buildAnalyticsData(
  range: TimeRange,
  opts: { displayName: string; profileViews?: number; projectViews?: number },
): AnalyticsBundle {
  const baseReach = opts.profileViews && opts.profileViews > 0 ? opts.profileViews : 1284;
  const profileReach = scale(baseReach, range);
  const projectOpens = scale(opts.projectViews && opts.projectViews > 0 ? opts.projectViews : 342, range);

  return {
    profileReach,
    reachChange: range === 'today' ? 4 : range === '7d' ? 11 : 18,
    heroMetrics: [
      { label: 'Visitors today', value: scale(86, range) },
      { label: 'Project clicks', value: scale(34, range) },
      { label: 'QR scans', value: scale(19, range) },
      { label: 'Connection saves', value: scale(12, range) },
      { label: 'Conversion rate', value: range === 'today' ? 4.2 : 6.8 },
    ],
    kpis: [
      {
        id: 'profile-views',
        label: 'Profile Views',
        value: profileReach,
        change: 18,
        trendUp: true,
        spark: spark([12, 18, 14, 22, 19, 28, 24, 31, 27], range),
        detail: `${scale(412, range)} unique visitors`,
      },
      {
        id: 'project-opens',
        label: 'Project Opens',
        value: projectOpens,
        change: 12,
        trendUp: true,
        spark: spark([4, 8, 6, 11, 9, 14, 12, 16, 13], range),
        detail: `${scale(89, range)} from GitHub`,
      },
      {
        id: 'saves',
        label: 'Saves',
        value: scale(47, range),
        change: 5,
        trendUp: true,
        spark: spark([2, 3, 2, 5, 4, 6, 5, 7, 6], range),
        detail: `${scale(31, range)} new this period`,
      },
      {
        id: 'qr',
        label: 'QR Scans',
        value: scale(128, range),
        change: 22,
        trendUp: true,
        spark: spark([6, 9, 7, 12, 10, 15, 11, 18, 14], range),
        detail: `${scale(42, range)} at conferences`,
      },
      {
        id: 'link-clicks',
        label: 'Link Clicks',
        value: scale(256, range),
        change: 8,
        trendUp: true,
        spark: spark([10, 14, 12, 18, 15, 20, 17, 22, 19], range),
        detail: 'GitHub leads at 38%',
      },
      {
        id: 'followers',
        label: 'Followers',
        value: scale(1240, range),
        change: 3,
        trendUp: true,
        spark: spark([8, 10, 9, 12, 11, 14, 13, 15, 14], range),
        detail: `+${scale(37, range)} this period`,
      },
      {
        id: 'connections',
        label: 'Connection Requests',
        value: scale(23, range),
        change: -2,
        trendUp: false,
        spark: spark([3, 4, 3, 5, 4, 3, 4, 3, 2], range),
        detail: `${scale(8, range)} pending`,
      },
      {
        id: 'repeat',
        label: 'Repeat Visitors',
        value: scale(34, range),
        change: 9,
        trendUp: true,
        spark: spark([5, 6, 5, 8, 7, 9, 8, 10, 9], range),
        detail: '26% return rate',
      },
    ],
    dailyTraffic: buildDailySeries(range, profileReach),
    sources: [
      { label: 'GitHub', value: scale(420, range), pct: 32 },
      { label: 'LinkedIn', value: scale(310, range), pct: 24 },
      { label: 'QR Code', value: scale(195, range), pct: 15 },
      { label: 'Portfolio', value: scale(168, range), pct: 13 },
      { label: 'Direct', value: scale(130, range), pct: 10 },
      { label: 'Conference NFC', value: scale(61, range), pct: 6 },
    ],
    projects: [
      {
        id: 'devflow',
        title: 'DevFlow',
        posterUrl: DEMO_POSTERS.devflow,
        views: scale(468, range),
        clicks: scale(142, range),
        saves: scale(37, range),
        ctr: 30.3,
        barPct: 100,
      },
      {
        id: 'schemasync',
        title: 'SchemaSync',
        views: scale(312, range),
        clicks: scale(89, range),
        saves: scale(24, range),
        ctr: 28.5,
        barPct: 67,
      },
      {
        id: 'pulse',
        title: 'Pulse',
        posterUrl: DEMO_POSTERS.pulse,
        views: scale(198, range),
        clicks: scale(52, range),
        saves: scale(12, range),
        ctr: 26.3,
        barPct: 42,
      },
    ],
    geo: [
      { country: 'United States', city: 'San Francisco', visitors: scale(420, range), lat: 37.77, lng: -122.42 },
      { country: 'United States', city: 'New York', visitors: scale(186, range), lat: 40.71, lng: -74.01 },
      { country: 'Germany', city: 'Berlin', visitors: scale(124, range), lat: 52.52, lng: 13.4 },
      { country: 'United Kingdom', city: 'London', visitors: scale(98, range), lat: 51.51, lng: -0.13 },
      { country: 'India', city: 'Bangalore', visitors: scale(72, range), lat: 12.97, lng: 77.59 },
    ],
    topCountries: [
      { name: 'United States', pct: 34 },
      { name: 'Germany', pct: 18 },
      { name: 'United Kingdom', pct: 14 },
      { name: 'India', pct: 11 },
      { name: 'Canada', pct: 9 },
    ],
    topCities: [
      { name: 'San Francisco', visitors: scale(186, range) },
      { name: 'Berlin', visitors: scale(124, range) },
      { name: 'London', visitors: scale(98, range) },
      { name: 'New York', visitors: scale(87, range) },
      { name: 'Bangalore', visitors: scale(72, range) },
    ],
    activity: [
      { id: '1', text: 'Someone from Google viewed DevFlow', time: '2m ago', type: 'view' },
      { id: '2', text: 'Saved by recruiter at Stripe', time: '14m ago', type: 'save' },
      { id: '3', text: 'QR scanned in Berlin', time: '38m ago', type: 'qr' },
      { id: '4', text: 'Clicked from LinkedIn', time: '1h ago', type: 'click' },
      { id: '5', text: 'Opened from GitHub', time: '2h ago', type: 'open' },
      { id: '6', text: 'SchemaSync viewed from London', time: '3h ago', type: 'view' },
      { id: '7', text: 'Conference NFC tap — DevDay SF', time: '5h ago', type: 'qr' },
    ],
    projectDetails: [
      {
        id: 'devflow',
        title: 'DevFlow',
        posterUrl: DEMO_POSTERS.devflow,
        views: scale(468, range),
        saves: scale(37, range),
        avgTimeSec: 94,
        demoClicks: scale(86, range),
        githubClicks: scale(124, range),
        resumeDownloads: scale(19, range),
        topReferrers: ['GitHub', 'LinkedIn', 'Direct'],
        funnel: [
          { label: 'Impressions', pct: 100 },
          { label: 'Opens', pct: 68 },
          { label: 'Engaged', pct: 42 },
          { label: 'Demo click', pct: 18 },
          { label: 'Save', pct: 8 },
        ],
        countries: ['US', 'DE', 'UK', 'IN'],
      },
      {
        id: 'schemasync',
        title: 'SchemaSync',
        views: scale(312, range),
        saves: scale(24, range),
        avgTimeSec: 72,
        demoClicks: scale(54, range),
        githubClicks: scale(98, range),
        resumeDownloads: scale(11, range),
        topReferrers: ['GitHub', 'Twitter', 'QR Code'],
        funnel: [
          { label: 'Impressions', pct: 100 },
          { label: 'Opens', pct: 61 },
          { label: 'Engaged', pct: 38 },
          { label: 'Demo click', pct: 14 },
          { label: 'Save', pct: 6 },
        ],
        countries: ['US', 'CA', 'DE'],
      },
      {
        id: 'pulse',
        title: 'Pulse',
        posterUrl: DEMO_POSTERS.pulse,
        views: scale(198, range),
        saves: scale(12, range),
        avgTimeSec: 58,
        demoClicks: scale(31, range),
        githubClicks: scale(45, range),
        resumeDownloads: scale(6, range),
        topReferrers: ['LinkedIn', 'Portfolio', 'Direct'],
        funnel: [
          { label: 'Impressions', pct: 100 },
          { label: 'Opens', pct: 55 },
          { label: 'Engaged', pct: 31 },
          { label: 'Demo click', pct: 11 },
          { label: 'Save', pct: 4 },
        ],
        countries: ['US', 'UK', 'IN'],
      },
    ],
    roles: [
      { label: 'Recruiters', pct: 32 },
      { label: 'Engineers', pct: 28 },
      { label: 'Founders', pct: 18 },
      { label: 'Managers', pct: 14 },
      { label: 'Students', pct: 8 },
    ],
    industries: [
      { label: 'Technology', pct: 44 },
      { label: 'Finance', pct: 18 },
      { label: 'Healthcare', pct: 12 },
      { label: 'Education', pct: 10 },
      { label: 'Other', pct: 16 },
    ],
    devices: [
      { label: 'Desktop', pct: 58 },
      { label: 'Mobile', pct: 36 },
      { label: 'Tablet', pct: 6 },
    ],
    browsers: [
      { label: 'Chrome', pct: 52 },
      { label: 'Safari', pct: 24 },
      { label: 'Firefox', pct: 12 },
      { label: 'Edge', pct: 8 },
      { label: 'Other', pct: 4 },
    ],
    referrers: [
      { id: 'github', label: 'GitHub', traffic: scale(420, range), ctr: 8.4, conversions: scale(38, range), trend: 14, trendUp: true },
      { id: 'linkedin', label: 'LinkedIn', traffic: scale(310, range), ctr: 6.2, conversions: scale(24, range), trend: 9, trendUp: true },
      { id: 'twitter', label: 'Twitter', traffic: scale(98, range), ctr: 4.1, conversions: scale(8, range), trend: -3, trendUp: false },
      { id: 'website', label: 'Personal Website', traffic: scale(168, range), ctr: 7.8, conversions: scale(19, range), trend: 6, trendUp: true },
      { id: 'nfc', label: 'Conference NFC', traffic: scale(61, range), ctr: 12.4, conversions: scale(11, range), trend: 22, trendUp: true },
      { id: 'qr', label: 'QR Code', traffic: scale(195, range), ctr: 9.6, conversions: scale(21, range), trend: 18, trendUp: true },
      { id: 'direct', label: 'Direct', traffic: scale(130, range), ctr: 5.4, conversions: scale(14, range), trend: 2, trendUp: true },
    ],
    guestStats: {
      totalVisitors: scale(412, range),
      guests: scale(318, range),
      signedIn: scale(94, range),
      guestPct: 77,
      returningGuests: scale(48, range),
    },
    insights: {
      highlight: 'DevFlow is your strongest opener — recruiters spend 94s on average, 2.1× your other projects.',
      lines: [
        '77% of visitors browse as guests without signing in. QR and LinkedIn drive most of them.',
        'GitHub sends the highest-intent traffic: 38% click through to a project or repo.',
        'Tuesday 10 AM is your best window — profile views spike 24% vs your weekly average.',
        'Consider adding a demo video to SchemaSync; projects with video get 2.4× more opens.',
      ],
    },
  };
}

function buildDailySeries(range: TimeRange, total: number) {
  const labels =
    range === 'today'
      ? ['12a', '2a', '4a', '6a', '8a', '10a', '12p', '2p', '4p', '6p', '8p', '10p']
      : range === '7d'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8', 'Wk 9', 'Wk 10', 'Wk 11', 'Wk 12', 'Wk 13', 'Wk 14'];

  const seed = [0.6, 0.72, 0.68, 0.85, 0.9, 0.78, 0.95, 0.88, 1, 0.82, 0.76, 0.91, 0.87, 0.93];
  const avg = total / labels.length;
  return labels.map((label, i) => ({
    label,
    value: Math.max(1, Math.round(avg * seed[i % seed.length])),
  }));
}
