'use client';

import { track } from '@vercel/analytics';
import {
  isVisitorConversionContext,
  type VisitorConversionContext,
} from '@/lib/visitor-conversion/visitor-conversion';

export const VISITOR_CONVERSION_EVENTS = [
  'visitor_prompt_viewed',
  'visitor_prompt_dismissed',
  'visitor_prompt_signup_clicked',
  'visitor_prompt_signin_clicked',
  'visitor_prompt_ios_app_clicked',
  'visitor_prompt_android_app_clicked',
] as const;

export type VisitorConversionEvent = (typeof VISITOR_CONVERSION_EVENTS)[number];

export function trackVisitorConversionEvent(input: {
  event: VisitorConversionEvent;
  context: VisitorConversionContext;
  profileId?: string | null;
}): void {
  if (
    !(VISITOR_CONVERSION_EVENTS as readonly string[]).includes(input.event) ||
    !isVisitorConversionContext(input.context)
  ) {
    return;
  }

  try {
    track(input.event, {
      route_context: input.context,
      demo: input.context === 'live_demo',
      ...(input.context === 'live_demo' || !input.profileId
        ? {}
        : { profile_id: input.profileId }),
    });
  } catch {
    // Conversion analytics must never block public navigation.
  }
}
