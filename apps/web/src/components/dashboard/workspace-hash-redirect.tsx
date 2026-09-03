'use client';

import { useEffect } from 'react';

export function WorkspaceHashRedirect({ to }: { to: string }) {
  useEffect(() => {
    const hash = window.location.hash;
    window.location.replace(`${to}${hash}`);
  }, [to]);

  return null;
}
