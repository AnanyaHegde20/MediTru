import React, { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useEscapeKey(active: boolean, onEscape: () => void) {
  const handler = useRef(onEscape);
  handler.current = onEscape;
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handler.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);
}

interface DialogProps {
  id?: string;
  onClose: () => void;
  labelledBy?: string;
  overlayClassName?: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  id,
  onClose,
  labelledBy,
  overlayClassName = '',
  children,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  useEscapeKey(true, onClose);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const overlay = overlayRef.current;
    const firstFocusable = overlay?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? overlay)?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const focusables = Array.from(overlay.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusables.length === 0) {
      e.preventDefault();
      overlay.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    const inside = active != null && overlay.contains(active);
    if (e.shiftKey) {
      if (!inside || active === first) {
        e.preventDefault();
        last.focus();
      }
    } else if (!inside || active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={overlayRef}
      id={id}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClassName}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
};
