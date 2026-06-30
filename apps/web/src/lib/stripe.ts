import Stripe from 'stripe';
import { requireServerSecret } from '@/lib/security/env';

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(requireServerSecret('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return stripe;
}
