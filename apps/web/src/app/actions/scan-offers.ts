'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  executeAcceptScanOffer,
  executeDismissScanOffer,
  listPendingScanOffers,
  type ScanOfferCard,
  type ScanOfferMutationState,
} from '@/lib/connections/scan-offers-core';

export type { ScanOfferCard, ScanOfferMutationState };

export async function listPendingScanOffersAction(): Promise<{
  offers: ScanOfferCard[];
  error?: string;
}> {
  const supabase = await createClient();
  return listPendingScanOffers(supabase);
}

export async function acceptScanOfferAction(
  offerId: string,
): Promise<ScanOfferMutationState> {
  const supabase = await createClient();
  const result = await executeAcceptScanOffer(supabase, offerId);
  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/connections');
  }
  return result;
}

export async function dismissScanOfferAction(
  offerId: string,
): Promise<ScanOfferMutationState> {
  const supabase = await createClient();
  const result = await executeDismissScanOffer(supabase, offerId);
  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/connections');
  }
  return result;
}
