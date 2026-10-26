'use server';

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
  return executeAcceptScanOffer(supabase, offerId);
}

export async function dismissScanOfferAction(
  offerId: string,
): Promise<ScanOfferMutationState> {
  const supabase = await createClient();
  return executeDismissScanOffer(supabase, offerId);
}
