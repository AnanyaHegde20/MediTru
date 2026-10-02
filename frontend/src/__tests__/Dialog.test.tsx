import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Dialog } from '../components/ui/Dialog';

describe('Dialog', () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
  });

  it('renders with dialog semantics and an accessible name', () => {
    render(
      <Dialog onClose={() => {}} labelledBy="dialog-title">
        <div>
          <h2 id="dialog-title">Confirm Action</h2>
          <button>Proceed</button>
        </div>
      </Dialog>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Confirm Action');
  });

  it('closes when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <Dialog onClose={onClose}>
        <div>
          <button>Close me</button>
        </div>
      </Dialog>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll while open and restores it on unmount', () => {
    const { unmount } = render(
      <Dialog onClose={() => {}}>
        <div />
      </Dialog>
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('moves focus into the dialog on mount and restores it on unmount', () => {
    const outside = document.createElement('button');
    outside.textContent = 'Outside trigger';
    document.body.appendChild(outside);
    outside.focus();

    const { unmount } = render(
      <Dialog onClose={() => {}} labelledBy="focus-title">
        <div>
          <h2 id="focus-title">Title</h2>
          <button>Inside first</button>
        </div>
      </Dialog>
    );
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Inside first' }));

    unmount();
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it('wraps Tab and Shift+Tab within the dialog', () => {
    render(
      <Dialog onClose={() => {}} labelledBy="trap-title">
        <div>
          <h2 id="trap-title">Title</h2>
          <button>Alpha</button>
          <button>Omega</button>
        </div>
      </Dialog>
    );
    const alpha = screen.getByRole('button', { name: 'Alpha' });
    const omega = screen.getByRole('button', { name: 'Omega' });

    omega.focus();
    fireEvent.keyDown(omega, { key: 'Tab' });
    expect(document.activeElement).toBe(alpha);

    fireEvent.keyDown(alpha, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(omega);
  });
});
