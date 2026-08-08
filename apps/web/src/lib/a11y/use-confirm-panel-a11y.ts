'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type ConfirmPanelA11yOptions = {
  open: boolean;
  /** When true, Escape/close is ignored (e.g. in-flight delete). */
  locked?: boolean;
  /** Prefer focusing the safe action (Cancel) when the panel opens. */
  initialFocus?: 'cancel' | 'first';
  onClose: () => void;
};

/**
 * WS12-T010 — Keyboard/focus behavior for inline confirm panels
 * (alertdialog regions that expand in place, not full modal portals).
 */
export function useConfirmPanelA11y({
  open,
  locked = false,
  initialFocus = 'cancel',
  onClose,
}: ConfirmPanelA11yOptions): {
  panelRef: RefObject<HTMLDivElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  cancelRef: RefObject<HTMLButtonElement | null>;
  openPanel: () => void;
  closePanel: () => void;
} {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const closePanel = useCallback(() => {
    if (locked) return;
    onClose();
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, [locked, onClose]);

  const openPanel = useCallback(() => {
    // Caller sets open=true; focus runs in the effect below.
  }, []);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusTarget =
      initialFocus === 'cancel'
        ? cancelRef.current ??
          panel.querySelector<HTMLElement>('[data-confirm-cancel]') ??
          panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)[
            panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR).length - 1
          ]
        : panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    focusTarget?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (locked) return;
        event.preventDefault();
        closePanel();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closePanel, initialFocus, locked, open]);

  return { panelRef, triggerRef, cancelRef, openPanel, closePanel };
}
