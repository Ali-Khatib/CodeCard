'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  executeAcceptScanOffer,
  executeDismissScanOffer,
  finalizeAcceptedScanConnections,
  getOutgoingScanStatus,
  listPendingScanOffers,
  type ScanOfferCard,
  type ScanOfferMutationState,
  type ScanOfferStatus,
} from '@/lib/connections/scan-offers-core';

export type { ScanOfferCard, ScanOfferMutationState };

export async function finalizeAcceptedScanConnectionsAction(): Promise<{ created: number }> {
  const supabase = await createClient();
  return finalizeAcceptedScanConnections(supabase);
}

export async function getOutgoingScanStatusAction(
  scannedProfileId: string,
): Promise<{ status: ScanOfferStatus | null; error?: string }> {
  const supabase = await createClient();
  return getOutgoingScanStatus(supabase, scannedProfileId);
}

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
