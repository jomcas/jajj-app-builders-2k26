import type { ReactNode } from 'react';

/** A labelled form control with its validation message (amber, never red: ADR 0004). */
export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className={`field${error ? ' invalid' : ''}`}>
      <span>{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

export function Notice({ tone, children }: { tone: 'info' | 'ok' | 'caution'; children: ReactNode }) {
  return <div className={`notice ${tone}`}>{children}</div>;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDistance(metres: number): string {
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(2)} km`;
}

/** The message of a thrown error, for showing in the portal. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
