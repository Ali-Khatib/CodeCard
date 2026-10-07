'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone, PhoneOff, UserPlus, UserX, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface IncomingCallProps {
  callerName: string;
  callerInfo?: string;
  statusText: string;
  avatarUrl?: string;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
  className?: string;
  isOpen?: boolean;
  /** Visual mode — phone call chrome or connection request. */
  mode?: 'call' | 'connection';
  acceptLabel?: string;
  declineLabel?: string;
  busy?: boolean;
}

const IncomingCall = React.forwardRef<HTMLDivElement, IncomingCallProps>(
  (
    {
      className,
      callerName,
      callerInfo,
      statusText,
      avatarUrl,
      onAccept,
      onDecline,
      onClose,
      isOpen = false,
      mode = 'call',
      acceptLabel,
      declineLabel,
      busy = false,
      ...props
    },
    ref,
  ) => {
    const getInitials = (name: string) =>
      name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';

    const AcceptIcon = mode === 'connection' ? UserPlus : Phone;
    const DeclineIcon = mode === 'connection' ? UserX : PhoneOff;

    return (
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'fixed bottom-5 right-5 z-[70] w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-paper)_88%,transparent)] p-6 text-[var(--app-ink)] shadow-2xl backdrop-blur-lg',
              className,
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="incoming-call-name"
            {...props}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-7 w-7 rounded-full"
              onClick={onClose}
              aria-label="Close notification"
              disabled={busy}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="relative rounded-full bg-[var(--app-paper)] p-1.5"
              >
                <span className="pointer-events-none absolute inset-0 rounded-full bg-[var(--app-iris)]/20 blur-md" />
                <Avatar className="relative h-24 w-24 border-2 border-[var(--app-iris)]/25">
                  <AvatarImage src={avatarUrl} alt={callerName} />
                  <AvatarFallback className="bg-[var(--app-bone)] text-3xl text-[var(--app-ink)]">
                    {getInitials(callerName)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              <div>
                <h2
                  id="incoming-call-name"
                  className="text-2xl font-semibold tracking-tight text-[var(--app-ink)]"
                >
                  {callerName}
                  {callerInfo ? (
                    <span className="font-normal text-[var(--app-smoke)]"> ({callerInfo})</span>
                  ) : null}
                </h2>
                <p className="mt-1 text-[var(--app-smoke)]">{statusText}</p>
              </div>

              <div className="grid w-full grid-cols-2 gap-3 pt-2">
                <Button
                  size="lg"
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={onAccept}
                  disabled={busy}
                >
                  <AcceptIcon className="mr-2 h-5 w-5" />
                  {acceptLabel ?? (mode === 'connection' ? 'Accept' : 'Accept')}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-full"
                  onClick={onDecline}
                  disabled={busy}
                >
                  <DeclineIcon className="mr-2 h-5 w-5" />
                  {declineLabel ?? 'Decline'}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    );
  },
);
IncomingCall.displayName = 'IncomingCall';

export { IncomingCall };
