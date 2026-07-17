import { NextRequest } from 'next/server';
import { processStripeWebhookRequest } from '@/lib/billing/stripe-webhook-core';

export async function POST(request: NextRequest) {
  return processStripeWebhookRequest(request);
}
