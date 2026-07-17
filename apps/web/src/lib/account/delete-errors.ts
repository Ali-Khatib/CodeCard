import { NextResponse } from 'next/server';
import type { AccountDeletionErrorCode } from '@/lib/account/delete-schema';

export function accountDeletionError(
  code: AccountDeletionErrorCode,
  message: string,
  status: number,
) {
  return NextResponse.json(
    { error: message, code },
    {
      status,
      headers: {
        'Cache-Control': 'no-store, private, no-cache, must-revalidate',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
