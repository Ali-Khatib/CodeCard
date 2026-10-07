'use client';

import { useState } from 'react';
import { IncomingCall } from '@/components/ui/card-16';
import { Button } from '@/components/ui/button';

/** Local playground for the incoming-call / connection card chrome. */
export default function IncomingCallDemo() {
  const [isReceivingCall, setIsReceivingCall] = useState(false);

  return (
    <div className="flex h-[400px] w-full items-center justify-center rounded-md border border-[var(--app-border)]">
      <Button onClick={() => setIsReceivingCall(true)} disabled={isReceivingCall}>
        Simulate Incoming Call
      </Button>

      <IncomingCall
        isOpen={isReceivingCall}
        callerName="Derry Mustofa"
        callerInfo="Driver"
        statusText="is calling you..."
        avatarUrl="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80"
        onAccept={() => setIsReceivingCall(false)}
        onDecline={() => setIsReceivingCall(false)}
        onClose={() => setIsReceivingCall(false)}
      />
    </div>
  );
}
