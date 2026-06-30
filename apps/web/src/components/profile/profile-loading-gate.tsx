'use client';

/** Pass-through wrapper — content renders immediately (no artificial delay). */
export function ProfileLoadingGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
