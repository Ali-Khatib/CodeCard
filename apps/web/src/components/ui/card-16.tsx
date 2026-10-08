'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Phone, PhoneOff, UserPlus, UserX, X } from 'lucide-react';

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
  onLater?: () => void;
  className?: string;
  isOpen?: boolean;
  /** Visual mode — phone call chrome or connection request. */
  mode?: 'call' | 'connection';
  acceptLabel?: string;
  declineLabel?: string;
  laterLabel?: string;
  busy?: boolean;
  error?: string | null;
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
      onLater,
      isOpen = false,
      mode = 'call',
      acceptLabel,
      declineLabel,
      laterLabel,
      busy = false,
      error,
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

    if (typeof document === 'undefined') return null;

    return createPortal(
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="cc-handshake-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={cn('cc-handshake-sheet relative p-6 text-[var(--app-ink)]', className)}
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
                {error ? (
                  <p className="mt-2 text-[13px] text-[var(--app-error)]" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="flex w-full flex-col gap-2 pt-2">
                <Button
                  size="lg"
                  className="h-12 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={onAccept}
                  disabled={busy}
                >
                  <AcceptIcon className="mr-2 h-5 w-5" />
                  {acceptLabel ?? 'Accept'}
                </Button>
                <div className="flex flex-col gap-2">
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-12 w-full"
                    onClick={onDecline}
                    disabled={busy}
                  >
                    <DeclineIcon className="mr-2 h-5 w-5" />
                    {declineLabel ?? 'Decline'}
                  </Button>
                  {onLater ? (
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 w-full"
                      onClick={onLater}
                      disabled={busy}
                    >
                      <Clock className="mr-2 h-5 w-5" />
                      {laterLabel ?? 'Decide later'}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    );
  },
);
IncomingCall.displayName = 'IncomingCall';

export { IncomingCall };
