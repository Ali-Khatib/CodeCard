const iconClass = 'h-[18px] w-[18px] shrink-0';

export function DashIconHome() {
  return (
    <svg className={iconClass} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M3 8.5 10 2l7 6.5V17a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1V8.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DashIconProjects() {
  return (
    <svg className={iconClass} viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="3" y="3" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10.5" y="3" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="3" y="10.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function DashIconAnalytics() {
  return (
    <svg className={iconClass} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M4 16V9M10 16V4M16 16v-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function DashIconResearch() {
  return (
    <svg className={iconClass} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M5 3.5h7.5A2.5 2.5 0 0 1 15 6v10.5H6.5A2.5 2.5 0 0 1 4 14V4.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M7 7h5M7 10h5M7 13h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function DashIconProfile() {
  return (
    <svg className={iconClass} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M4.5 16.5c.8-2.8 2.9-4.5 5.5-4.5s4.7 1.7 5.5 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DashIconConnections() {
  return (
    <svg className={iconClass} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="6" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="14" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="14" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8.2 9.2 11.5 7.2M8.2 10.8l3.3 2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function DashIconCircle() {
  return (
    <svg className={iconClass} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2.5" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="10" cy="4" r="1.2" fill="currentColor" />
      <circle cx="15" cy="12.5" r="1.2" fill="currentColor" />
      <circle cx="5" cy="12.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function DashIconSettings() {
  return (
    <svg className={iconClass} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 2.5v1.8M10 15.7v1.8M3.5 10h1.8M14.7 10h1.8M5.4 5.4l1.3 1.3M13.3 13.3l1.3 1.3M5.4 14.6l1.3-1.3M13.3 6.7l1.3-1.3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DashIconBack() {
  return (
    <svg className={iconClass} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M12 4 6 10l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const DASH_NAV_ICONS = {
  home: DashIconHome,
  projects: DashIconProjects,
  research: DashIconResearch,
  analytics: DashIconAnalytics,
  profile: DashIconProfile,
  circle: DashIconCircle,
  connections: DashIconConnections,
  settings: DashIconSettings,
} as const;
