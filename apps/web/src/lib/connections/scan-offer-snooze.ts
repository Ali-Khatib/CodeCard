const KEY = 'cc-scan-snooze';

function read(): Record<string, number> {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, number>;
  } catch {
    return {};
  }
}

function write(map: Record<string, number>) {
  sessionStorage.setItem(KEY, JSON.stringify(map));
}

/** Hide the incoming call without refusing. The bell still lists it. */
export function snoozeScanOffer(id: string, hours = 24) {
  const map = read();
  map[id] = Date.now() + hours * 60 * 60 * 1000;
  write(map);
}

export function isScanOfferSnoozed(id: string): boolean {
  const until = read()[id];
  return typeof until === 'number' && until > Date.now();
}

export function clearScanOfferSnooze(id: string) {
  const map = read();
  delete map[id];
  write(map);
}
