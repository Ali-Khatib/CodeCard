/**
 * Persistent accuracy disclosure for the authenticated analytics dashboard (WS10-T010).
 * Keep copy aligned with implemented filtering — do not claim unsupported precision.
 */
export const ANALYTICS_ACCURACY_DISCLOSURE_HEADLINE = 'Views are approximate.';

export const ANALYTICS_ACCURACY_DISCLOSURE_BODY =
  'Views and engagement metrics are approximate and may exclude owner activity, suspected bots, duplicate events, or events outside the retention window. Totals are directional for understanding audience interest — not billing-grade or audit-grade measurements.';

export const ANALYTICS_ACCURACY_DISCLOSURE_DETAILS =
  'Owner self-views are excluded. Suspected bots may be filtered. Duplicate events may be suppressed. Time spent counts only while the page is visible. Date ranges and the raw-event retention window affect what appears.';
