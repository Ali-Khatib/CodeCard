import { NextResponse } from 'next/server';
import { secureJsonRoute } from '@/lib/security/secure-route';
import { createClient } from '@/lib/supabase/server';
import { isSameOriginMutation } from '@/lib/security/same-origin';
import { accountDeletionRequestSchema, ACCOUNT_DELETION_CONFIRMATION } from '@/lib/account/delete-schema';
import { accountDeletionError } from '@/lib/account/delete-errors';
import { verifyAccountDeletionReauthentication } from '@/lib/account/delete-reauth';
import { runAccountDeletionOrchestrator } from '@/lib/account/delete-orchestrator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return accountDeletionError('FORBIDDEN_ORIGIN', 'Forbidden', 403);
  }

  return secureJsonRoute(
    request,
    {
      schema: accountDeletionRequestSchema,
      rateLimitType: 'accountDelete',
      requireAuth: true,
      strictRateLimit: true,
      maxBodyBytes: 4 * 1024,
    },
    async (data, ctx) => {
      if (!ctx.userId) {
        return accountDeletionError('UNAUTHENTICATED', 'Unauthorized', 401);
      }

      if (data.confirmation !== ACCOUNT_DELETION_CONFIRMATION) {
        return accountDeletionError(
          'INVALID_CONFIRMATION',
          'Confirmation must be exactly DELETE',
          422,
        );
      }

      const supabase = await createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || user.id !== ctx.userId) {
        return accountDeletionError('UNAUTHENTICATED', 'Unauthorized', 401);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const reauth = await verifyAccountDeletionReauthentication(
        supabase,
        user,
        data.reauthentication,
        { accessToken: session?.access_token ?? null },
      );

      if (!reauth.ok) {
        return accountDeletionError(
          'REAUTHENTICATION_REQUIRED',
          'Recent reauthentication is required to delete your account.',
          403,
        );
      }

      const { createServiceClient } = await import('@/lib/supabase/server');
      const result = await runAccountDeletionOrchestrator({
        user,
        supabase,
        createServiceClient,
      });

      if (!result.ok) {
        if (result.code === 'ACCOUNT_DELETION_NOT_READY') {
          return accountDeletionError(
            'ACCOUNT_DELETION_NOT_READY',
            'Account deletion is not available yet.',
            503,
          );
        }
        if (result.code === 'ACCOUNT_DELETION_IN_PROGRESS') {
          return accountDeletionError(
            'ACCOUNT_DELETION_IN_PROGRESS',
            'Account deletion is already in progress.',
            409,
          );
        }
        if (result.code === 'SHARED_TENANT_BLOCKED') {
          return accountDeletionError(
            'SHARED_TENANT_BLOCKED',
            'This account shares a workspace that cannot be deleted automatically.',
            409,
          );
        }
        return accountDeletionError(
          'ACCOUNT_DELETION_FAILED',
          'Account deletion could not be completed.',
          500,
        );
      }

      return NextResponse.json(
        { success: true },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, private, no-cache, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff',
          },
        },
      );
    },
  );
}

export async function GET() {
  return accountDeletionError('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
}
